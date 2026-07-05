import { defineConfig, devices } from '@playwright/test';

// 127.0.0.1 rather than localhost: CI Chromium intermittently fails to
// resolve localhost (net::ERR_NAME_NOT_RESOLVED on updated runner images),
// while the literal loopback address needs no DNS at all.
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000';
const webServerCommand =
  process.env.PLAYWRIGHT_WEB_SERVER_COMMAND ||
  (process.env.CI
    ? 'npm run start -- --hostname 127.0.0.1 --port 3000'
    : 'npm run build && npm run start -- --hostname 127.0.0.1 --port 3000');

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  reporter: process.env.CI ? 'dot' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: webServerCommand,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
