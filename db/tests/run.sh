#!/usr/bin/env bash
# Database security tests. Loads the repo SQL into a throwaway local Postgres 17
# container (Supabase stubs + emulated live drift), applies
# db/security-hardening.sql twice, runs db/tests/security.test.sql, then re-runs
# the idempotent db/*.sql files and runs the tests again.
#
# Usage: db/tests/run.sh [--no-hardening] [--repo DIR] [--logs DIR]
#   --no-hardening  skip db/security-hardening.sql (shows the RED state)
#   --repo DIR      build the database from another checkout's db/ and supabase/
#                   SQL (e.g. the pre-patch files, i.e. the live database); the
#                   hardening, the re-run files and the tests always come from
#                   this checkout
#   --logs DIR      where to write logs (default: a new temp dir)
# Needs podman or docker and the LOCAL image docker.io/library/postgres:17 (never
# pulled). The port is bound to 127.0.0.1 and the container is always removed.
set -euo pipefail

TESTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HERE="$(cd "$TESTS_DIR/../.." && pwd)"
REPO="$HERE"
HARDENING=1
LOG_DIR=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-hardening) HARDENING=0; shift ;;
    --repo) REPO="$(cd "${2:?--repo needs a directory}" && pwd)"; shift 2 ;;
    --logs) LOG_DIR="${2:?--logs needs a directory}"; shift 2 ;;
    -h|--help) sed -n '2,15p' "${BASH_SOURCE[0]}"; exit 0 ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
done

IMAGE=docker.io/library/postgres:17
if command -v podman >/dev/null 2>&1; then ENGINE=podman
elif command -v docker >/dev/null 2>&1; then ENGINE=docker
else echo "podman or docker is required" >&2; exit 2
fi
"$ENGINE" image inspect "$IMAGE" >/dev/null 2>&1 \
  || { echo "local image $IMAGE not found (this script never pulls)" >&2; exit 2; }

LOG_DIR="${LOG_DIR:-$(mktemp -d "${TMPDIR:-/tmp}/handout-dbtest.XXXXXX")}"
mkdir -p "$LOG_DIR"
: > "$LOG_DIR/load.log"
NAME="handout-dbtest-$$-$RANDOM"
PGPASSWORD="$(od -An -N16 -tx1 /dev/urandom | tr -d ' \n')"
export PGPASSWORD

cleanup() { "$ENGINE" rm -f -v "$NAME" >/dev/null 2>&1 || true; }
trap cleanup EXIT
trap 'exit 130' INT TERM

die() { echo "FAIL: $*" >&2; echo "logs: $LOG_DIR" >&2; exit 1; }

POSTGRES_PASSWORD="$PGPASSWORD" "$ENGINE" run -d --pull=never --name "$NAME" -e POSTGRES_PASSWORD \
  -p 127.0.0.1::5432 "$IMAGE" -c fsync=off -c synchronous_commit=off -c full_page_writes=off >/dev/null

ready=0
for _ in $(seq 1 60); do
  if "$ENGINE" exec "$NAME" pg_isready -q -h 127.0.0.1 -U postgres >/dev/null 2>&1; then ready=1; break; fi
  sleep 1
done
if (( ! ready )); then
  "$ENGINE" logs "$NAME" > "$LOG_DIR/container.log" 2>&1 || true
  die "postgres did not become ready"
fi

if command -v psql >/dev/null 2>&1; then
  PORT="$("$ENGINE" port "$NAME" 5432/tcp | head -n1 | awk -F: '{print $NF}')"
  pgf() { local f="$1"; shift; psql -X -h 127.0.0.1 -p "$PORT" -U postgres -d postgres "$@" -f "$f"; }
else
  pgf() { local f="$1"; shift; "$ENGINE" exec -i "$NAME" psql -X -U postgres -d postgres "$@" -f - < "$f"; }
fi

# One transaction per file and stop at the first error, like the Supabase SQL editor.
load() {
  printf '\n== %s\n' "$1" >> "$LOG_DIR/load.log"
  pgf "$1" -q -1 -v ON_ERROR_STOP=1 >> "$LOG_DIR/load.log" 2>&1
}

TOTAL="$(grep -c "^\\\\set case " "$TESTS_DIR/security.test.sql")"
FAILED=0
run_tests() {
  local log="$1" label="$2" passed
  if ! pgf "$TESTS_DIR/security.test.sql" -q -t -A -v ON_ERROR_STOP=1 > "$log" 2>&1; then
    echo "FAIL: $label: test setup failed (see $log)"; FAILED=1; return
  fi
  passed="$(grep -c '^PASS: ' "$log" || true)"
  echo "$label: $passed/$TOTAL passed"
  if (( passed != TOTAL )); then
    FAILED=1
    LC_ALL=C comm -23 \
      <(grep "^\\\\set case " "$TESTS_DIR/security.test.sql" | sed -e "s/^\\\\set case '//" -e "s/'\$//" | LC_ALL=C sort) \
      <(sed -n 's/^PASS: //p' "$log" | LC_ALL=C sort) | sed 's/^/  FAIL: /' | head -n 40
  fi
}

cd "$REPO"
shopt -s nullglob
BASE=(db/schema.sql db/storage-setup.sql db/notifications-triggers.sql db/add-notification-type.sql
      db/public-read-policies.sql db/admin-and-delete-policies.sql db/messages-read-policy.sql)
# live-drift goes first: db/feature-1-points.sql needs the live-only users.referral_count
LATE=(db/feature-*.sql db/beta-mode.sql supabase/migrations/*.sql db/dating-safety.sql
      db/signup-guardrails.sql db/welcome-requests.sql db/upgrade-*.sql)
# not db/schema.sql: it drops and recreates everything
RERUN=("$HERE"/db/storage-setup.sql "$HERE"/db/notifications-triggers.sql "$HERE"/db/add-notification-type.sql
       "$HERE"/db/public-read-policies.sql "$HERE"/db/admin-and-delete-policies.sql
       "$HERE"/db/messages-read-policy.sql "$HERE"/db/feature-*.sql "$HERE"/db/beta-mode.sql
       "$HERE"/db/dating-safety.sql "$HERE"/db/signup-guardrails.sql "$HERE"/db/welcome-requests.sql
       "$HERE"/db/upgrade-*.sql)

echo "repo: $REPO  hardening: $([[ $HARDENING == 1 ]] && echo yes || echo NO)  logs: $LOG_DIR"
load "$TESTS_DIR/supabase-stubs.sql" || die "loading supabase-stubs.sql"
for f in "${BASE[@]}"; do load "$f" || die "loading $f"; done
load "$TESTS_DIR/live-drift.sql" || die "loading live-drift.sql"
for f in "${LATE[@]}"; do load "$f" || die "loading $f"; done

if (( HARDENING )); then
  load "$HERE/db/security-hardening.sql" || die "db/security-hardening.sql (1st run)"
  load "$HERE/db/security-hardening.sql" || die "db/security-hardening.sql (2nd run)"
  echo "PASS: security-hardening.sql applied twice without error"
fi

run_tests "$LOG_DIR/test.log" "tests"

if (( HARDENING )); then
  for f in "${RERUN[@]}"; do load "$f" || die "re-running ${f#"$HERE"/}"; done
  run_tests "$LOG_DIR/test-rerun.log" "tests after re-running db/*.sql"
fi

if (( FAILED )); then echo "RESULT: FAIL (logs: $LOG_DIR)"; exit 1; fi
echo "RESULT: PASS"
