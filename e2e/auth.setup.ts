import { test as setup } from '@playwright/test';
import fs from 'fs';

// Test-account credentials come from the environment (see .env.example); never commit them.
const ROLES = ['student', 'vendor', 'admin'] as const;

if (!fs.existsSync('.auth')) fs.mkdirSync('.auth');

for (const role of ROLES) {
  setup(`authenticate ${role}`, async ({ page }) => {
    const prefix = `E2E_${role.toUpperCase()}`;
    const email = process.env[`${prefix}_EMAIL`];
    const pw = process.env[`${prefix}_PASSWORD`];
    if (!email || !pw) throw new Error(`Set ${prefix}_EMAIL and ${prefix}_PASSWORD to run the e2e suite (see .env.example).`);

    setup.setTimeout(60_000);
    await page.goto('/auth/login', { waitUntil: 'load' });
    await page.waitForTimeout(1200); // hydrate
    await page.locator('input[type="email"]').first().fill(email);
    await page.locator('input[type="password"]').first().fill(pw);
    await page.getByRole('button', { name: 'Sign in →' }).first().click();
    // Wait until the Supabase auth cookie is written (login succeeded)
    await page.waitForFunction(() => document.cookie.includes('auth-token'), null, { timeout: 20_000 });
    await page.waitForTimeout(800);
    await page.context().storageState({ path: `.auth/${role}.json` });
    console.log(`  ✓ ${role} session saved`);
  });
}
