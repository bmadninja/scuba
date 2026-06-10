import { defineConfig } from '@playwright/test';

// Minimal config for the image reachability check. No webServer — tests make
// direct HTTP requests and don't need Next.js running.
export default defineConfig({
  testDir: './tests',
  testMatch: 'image-reachability.spec.ts',
  fullyParallel: true,
  retries: 1,
  reporter: 'line',
  projects: [{ name: 'node', use: {} }],
  timeout: 30_000,
});
