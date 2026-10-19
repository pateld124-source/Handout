import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'off',
    screenshot: 'off',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  projects: [
    // Pure unit tests (no browser, no running app): npm run test:unit
    { name: 'unit', testDir: './tests/unit' },
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } }, dependencies: ['setup'] },
    // Mobile viewport on Chromium (avoids a separate WebKit download)
    { name: 'mobile', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, isMobile: false }, dependencies: ['setup'] },
    // Cross-engine coverage — public routes only (no auth): Firefox (Gecko) + WebKit (Safari engine).
    // Validates overflow-x:clip, backdrop-filter (-webkit-), sticky positioning, focus rings per engine.
    { name: 'firefox', testMatch: /crawl\.spec\.ts/, use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit',  testMatch: /crawl\.spec\.ts/, use: { ...devices['Desktop Safari'] } },
  ],
});
