import { defineConfig, devices } from '@playwright/test';

// The browser targets 127.0.0.1 rather than localhost: CI Chromium fails to
// resolve localhost (net::ERR_NAME_NOT_RESOLVED on updated runner images),
// while the literal loopback address needs no DNS. The server keeps Next's
// default binding (all interfaces) — passing --hostname 127.0.0.1 makes
// Next 15's router worker proxy to localhost and hang before ready.
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000';
const webServerCommand =
  process.env.PLAYWRIGHT_WEB_SERVER_COMMAND ||
  (process.env.CI
    ? 'npm run start -- --port 3000'
    : 'npm run build && npm run start -- --port 3000');

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // One worker in CI keeps the single browser's verbose diagnostics readable.
  workers: process.env.CI ? 1 : undefined,
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  reporter: process.env.CI ? 'dot' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    // Never proxy: all targets are loopback (Chromium honors http_proxy-style
    // env on Linux). The CI-only verbose flags surface host-resolver and
    // network-state decisions in the pw:browser stderr stream while the
    // ERR_NAME_NOT_RESOLVED runner-image regression is being diagnosed.
    launchOptions: {
      args: [
        '--no-proxy-server',
        ...(process.env.CI
          ? [
              // July-2026 ubuntu-24.04 runner images kill Chromium's separate
              // network-service process at launch (navigations die in ~55ms as
              // ERR_NAME_NOT_RESOLVED even for IP literals; --no-sandbox does
              // not govern the network service's own seccomp sandbox). Run the
              // network service unsandboxed and in-process to sidestep it.
              '--disable-features=NetworkServiceSandbox',
              '--enable-features=NetworkServiceInProcess',
              '--enable-logging=stderr',
              '--v=0',
              '--vmodule=*host_resolver*=3,*dns*=3,*network_change*=3,*address_tracker*=3',
            ]
          : []),
      ],
    },
    // Use the full Chromium binary in new-headless mode instead of the
    // chrome-headless-shell build. On ubuntu-24.04 runner images from July
    // 2026 the headless shell fails every navigation with
    // ERR_NAME_NOT_RESOLVED — even for IP literals, with proxy env clean and
    // --no-proxy-server applied — while the full binary's network stack works.
    channel: 'chromium',
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
