import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/prod-quality.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 3,
  reporter: [['html', { outputFolder: 'playwright-report-prod' }], ['list']],
  use: {
    baseURL: 'https://scubaseason.fun',
    trace: 'on-first-retry',
    navigationTimeout: 30_000,
  },
  timeout: 60_000,
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
