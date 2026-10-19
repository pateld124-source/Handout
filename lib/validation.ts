// Handout — one source of truth for form validation.
// Each validator returns an error string, or '' when valid.

export function validateName(v: string): string {
  const t = v.trim();
  if (!t) return 'Full name is required';
  if (t.length < 2) return 'At least 2 characters';
  if (t.length > 60) return 'Name is too long';
  if (!/^\p{L}[\p{L}\p{M}\s.'’-]*$/u.test(t)) return "Letters, spaces, . - ' only";
  return '';
}
export function validateEmail(v: string): string {
  const t = v.trim();
  if (!t) return 'Email is required';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(t)) return 'Enter a valid email (name@site.com)';
  return '';
}

/**
 * Students must sign up with a .edu university email address.
 * BETA: the .edu requirement is OFF (REQUIRE_EDU_EMAIL=false) — too many students
 * bounced at the wall, so any valid email (Gmail etc.) is accepted. The rule is
 * preserved below; flip the flag to true to re-require .edu with no other changes.
 */
export const REQUIRE_EDU_EMAIL = false;

export function validateEduEmail(v: string): string {
  const generic = validateEmail(v);
  if (generic) return generic;
  if (REQUIRE_EDU_EMAIL && !/\.edu$/i.test(v.trim())) return 'Students must use a .edu university email address';
  return '';
}
export function normalizePhone(v: string): string {
  const d = v.replace(/\D/g, '');
  return (d.length === 11 && d[0] === '1' ? d.slice(1) : d).slice(0, 10);
}
export function formatPhone(v: string): string {
  const d = normalizePhone(v);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0,3)}) ${d.slice(3)}`;
  return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
}
export function validatePhone(v: string): string {
  const d = normalizePhone(v);
  if (!d) return 'Phone number is required';
  if (d.length !== 10) return 'Enter a 10-digit phone number';
  return '';
}
export type PwChecks = { length: boolean; upper: boolean; lower: boolean; number: boolean };
export function passwordChecks(v: string): PwChecks {
  return { length: v.length >= 8, upper: /[A-Z]/.test(v), lower: /[a-z]/.test(v), number: /[0-9]/.test(v) };
}
export function validatePassword(v: string): string {
  if (!v) return 'Password is required';
  const c = passwordChecks(v);
  if (!c.length) return 'At least 8 characters';
  if (!c.upper) return 'Add 1 uppercase letter';
  if (!c.lower) return 'Add 1 lowercase letter';
  if (!c.number) return 'Add 1 number';
  return '';
}
export function validateRequired(v: string, label: string): string {
  return v && v.trim() ? '' : `${label} is required`;
}

// International phone (country code stored separately) + postal code.
export function normalizeIntl(v: string): string { return v.replace(/\D/g, '').slice(0, 14); }
export function validateIntlPhone(v: string): string {
  const d = normalizeIntl(v);
  if (!d) return 'Phone number is required';
  if (d.length < 6) return 'Phone number looks too short';
  if (d.length > 14) return 'Phone number looks too long';
  return '';
}
export function validateZip(v: string): string {
  const t = v.trim();
  if (!t) return 'ZIP / postal code is required';
  if (!/^[A-Za-z0-9 -]{3,10}$/.test(t)) return 'Enter a valid ZIP / postal code';
  return '';
}
export function validateIdNumber(v: string): string {
  const t = v.trim();
  if (!t) return 'ID number is required';
  if (t.length < 4) return 'ID number looks too short';
  if (t.length > 30) return 'ID number looks too long';
  return '';
}

// ── General-purpose field validators ──────────────────────────────────────

/** Free text (titles, locations): letters, numbers, common punctuation. */
export function validateText(
  v: string,
  label: string,
  { min = 2, max = 80, required = true }: { min?: number; max?: number; required?: boolean } = {}
): string {
  const t = v.trim();
  if (!t) return required ? `${label} is required` : '';
  if (t.length < min) return `${label} must be at least ${min} characters`;
  if (t.length > max) return `${label} must be under ${max} characters`;
  if (!/^[A-Za-z0-9][A-Za-z0-9\s.,'&()\/–-]*$/.test(t)) return `${label}: letters and numbers only`;
  return '';
}

/** Longer description / notes — allows more punctuation, still length-bounded. */
export function validateParagraph(
  v: string,
  label: string,
  { min = 0, max = 600, required = false }: { min?: number; max?: number; required?: boolean } = {}
): string {
  const t = v.trim();
  if (!t) return required ? `${label} is required` : '';
  if (min && t.length < min) return `${label} must be at least ${min} characters`;
  if (t.length > max) return `${label} must be under ${max} characters`;
  return '';
}

/** Numbers only. Digits are stripped as the user types via keepDigits(). */
export function keepDigits(v: string, maxLen = 6): string { return v.replace(/\D/g, '').slice(0, maxLen); }

/** Money / price. Optional decimals, bounded. */
export function validatePrice(
  v: string | number,
  label = 'Price',
  { min = 1, max = 100000, required = true }: { min?: number; max?: number; required?: boolean } = {}
): string {
  const s = String(v).trim();
  if (!s) return required ? `${label} is required` : '';
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return `${label}: numbers only (e.g. 120 or 120.00)`;
  const n = Number(s);
  if (Number.isNaN(n)) return `Enter a valid ${label.toLowerCase()}`;
  if (n < min) return `${label} must be at least $${min}`;
  if (n > max) return `${label} must be under $${max.toLocaleString()}`;
  return '';
}

/** Whole-number field within a range (nights, meals, quantity). */
export function validateInt(
  v: string | number,
  label: string,
  { min = 0, max = 999, required = false }: { min?: number; max?: number; required?: boolean } = {}
): string {
  const s = String(v).trim();
  if (!s) return required ? `${label} is required` : '';
  if (!/^\d+$/.test(s)) return `${label}: whole numbers only`;
  const n = Number(s);
  if (n < min) return `${label} must be at least ${min}`;
  if (n > max) return `${label} must be ${max} or fewer`;
  return '';
}
