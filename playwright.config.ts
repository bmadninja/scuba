import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  // prod-quality.spec.ts is a PRODUCTION monitor (it asserts against the live
  // deployed site), not a pre-merge gate — it does not belong in `npm test` or
  // the PR gate. Run it separately against production. TODO: fold its still
  // useful checks (copy hygiene, SEO, a11y) into the pre-merge specs.
  testIgnore: ['**/prod-quality.spec.ts'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 3,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    navigationTimeout: 120_000,
  },
  timeout: 120_000,
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
