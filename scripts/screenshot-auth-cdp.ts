/**
 * Attach to a real Chrome over CDP and capture authenticated screenshots
 * against the user's already-signed-in session.
 *
 * Why: Clerk's Google-OAuth flow refuses to complete inside a fresh
 * Playwright Chromium build, so any storageState approach blocks at the
 * Google sign-in. Attaching to a Chrome the user already drove past
 * sign-in sidesteps Clerk entirely.
 *
 * Usage:
 *   1. Quit Chrome completely.
 *   2. /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
 *        --remote-debugging-port=9222
 *   3. In that Chrome, open http://localhost:3000 and sign in via Clerk.
 *   4. Leave Chrome open. Then run:
 *        npm run screenshot:auth                 # capture everything
 *        npm run screenshot:auth -- dashboard    # capture one scenario
 *        npm run screenshot:auth -- --list       # list scenario keys
 *
 * Screenshots land in screenshots/auth/.
 */

import { chromium, type BrowserContext, type Page } from 'playwright';
import { mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const CDP_ENDPOINT = process.env.CDP_ENDPOINT ?? 'http://localhost:9222';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const OUT_DIR = resolve(process.cwd(), 'screenshots/auth');
const CSV_FIXTURE = resolve(process.cwd(), 'scripts/fixtures/import-sample.csv');

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

type Viewport = { width: number; height: number };
type Scenario = {
  key: string;
  description: string;
  viewport: Viewport;
  run: (page: Page) => Promise<void>;
};

const STATEMENT_ROUTES = new Set([
  '/dashboard',
  '/transactions',
  '/accounts',
  '/categories',
  '/budgets',
  '/insights',
  '/banks',
]);

async function gotoPath(page: Page, path: string) {
  const url = `${APP_URL}${path}`;
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(800);

  if (new URL(page.url()).pathname !== path) {
    throw new Error(`Expected ${path}, but browser landed on ${page.url()}`);
  }
}

async function settleCharts(page: Page) {
  // Charts mount after data resolves; give Recharts a beat to lay out.
  await page.waitForTimeout(1500);
}

async function verifyStatementSurface(page: Page, scenario: Scenario) {
  const path = new URL(page.url()).pathname;
  if (
    !STATEMENT_ROUTES.has(path) ||
    (!scenario.key.endsWith('-desktop') && !scenario.key.endsWith('-mobile'))
  ) {
    return;
  }

  const sheetCount = await page.getByTestId('statement-sheet').count();
  const mastheadCount = await page.getByTestId('page-masthead').count();
  if (sheetCount !== 1 || mastheadCount !== 1) {
    throw new Error(
      `Expected one statement sheet and masthead on ${path}; found ${sheetCount} sheet(s), ${mastheadCount} masthead(s)`,
    );
  }

  if (scenario.viewport.width >= 1024) {
    const activeNavCount = await page.locator('nav a[aria-current="page"]').count();
    if (activeNavCount !== 1) {
      throw new Error(`Expected one active desktop navigation link on ${path}; found ${activeNavCount}`);
    }
  }

  const viewport = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  if (viewport.scrollWidth > viewport.clientWidth + 1) {
    throw new Error(
      `Horizontal viewport overflow on ${path}: ${viewport.scrollWidth}px content in ${viewport.clientWidth}px viewport`,
    );
  }
}

const scenarios: Scenario[] = [
  {
    key: 'dashboard-desktop',
    description: '/dashboard at 1440x900',
    viewport: DESKTOP,
    run: async (page) => {
      await gotoPath(page, '/dashboard');
      await settleCharts(page);
    },
  },
  {
    key: 'dashboard-mobile',
    description: '/dashboard at 390x844',
    viewport: MOBILE,
    run: async (page) => {
      await gotoPath(page, '/dashboard');
      await settleCharts(page);
    },
  },
  {
    key: 'transactions-desktop',
    description: '/transactions at 1440x900',
    viewport: DESKTOP,
    run: async (page) => {
      await gotoPath(page, '/transactions');
    },
  },
  {
    key: 'transactions-mobile',
    description: '/transactions at 390x844',
    viewport: MOBILE,
    run: async (page) => {
      await gotoPath(page, '/transactions');
    },
  },
  {
    key: 'accounts-desktop',
    description: '/accounts at 1440x900',
    viewport: DESKTOP,
    run: async (page) => {
      await gotoPath(page, '/accounts');
    },
  },
  {
    key: 'accounts-mobile',
    description: '/accounts at 390x844',
    viewport: MOBILE,
    run: async (page) => {
      await gotoPath(page, '/accounts');
    },
  },
  {
    key: 'categories-desktop',
    description: '/categories at 1440x900',
    viewport: DESKTOP,
    run: async (page) => {
      await gotoPath(page, '/categories');
    },
  },
  {
    key: 'categories-mobile',
    description: '/categories at 390x844',
    viewport: MOBILE,
    run: async (page) => {
      await gotoPath(page, '/categories');
    },
  },
  {
    key: 'budgets-desktop',
    description: '/budgets at 1440x900',
    viewport: DESKTOP,
    run: async (page) => {
      await gotoPath(page, '/budgets');
      await settleCharts(page);
    },
  },
  {
    key: 'budgets-mobile',
    description: '/budgets at 390x844',
    viewport: MOBILE,
    run: async (page) => {
      await gotoPath(page, '/budgets');
      await settleCharts(page);
    },
  },
  {
    key: 'insights-desktop',
    description: '/insights at 1440x900',
    viewport: DESKTOP,
    run: async (page) => {
      await gotoPath(page, '/insights');
      await settleCharts(page);
    },
  },
  {
    key: 'insights-mobile',
    description: '/insights at 390x844',
    viewport: MOBILE,
    run: async (page) => {
      await gotoPath(page, '/insights');
      await settleCharts(page);
    },
  },
  {
    key: 'banks-desktop',
    description: '/banks at 1440x900',
    viewport: DESKTOP,
    run: async (page) => {
      await gotoPath(page, '/banks');
    },
  },
  {
    key: 'banks-mobile',
    description: '/banks at 390x844',
    viewport: MOBILE,
    run: async (page) => {
      await gotoPath(page, '/banks');
    },
  },
  {
    key: 'transaction-new-sheet',
    description: 'New-transaction sheet open',
    viewport: DESKTOP,
    run: async (page) => {
      await gotoPath(page, '/transactions');
      await page.getByRole('button', { name: /add transaction/i }).first().click();
      await page.waitForTimeout(700);
    },
  },
  {
    key: 'transaction-edit-sheet',
    description: 'Edit-transaction sheet open (first row)',
    viewport: DESKTOP,
    run: async (page) => {
      await gotoPath(page, '/transactions');
      const firstActions = page.locator('table tbody tr').first().locator('button').last();
      if (await firstActions.count() === 0) {
        throw new Error('No transactions to edit. Seed data first: npm run db:seed -- <user_id>');
      }
      await firstActions.click();
      await page.getByRole('menuitem', { name: /edit/i }).click();
      await page.waitForTimeout(700);
    },
  },
  {
    key: 'csv-import-map',
    description: 'CSV import — map columns step',
    viewport: DESKTOP,
    run: async (page) => {
      await gotoPath(page, '/transactions');
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(CSV_FIXTURE);
      await page.waitForTimeout(1200);
      // Map the three required columns by clicking each header select.
      await mapColumn(page, 0, 'date');
      await mapColumn(page, 1, 'payee');
      await mapColumn(page, 2, 'amount');
      await page.waitForTimeout(500);
    },
  },
  {
    key: 'csv-import-review',
    description: 'CSV import — review step with invalid + duplicate rows',
    viewport: DESKTOP,
    run: async (page) => {
      await gotoPath(page, '/transactions');
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(CSV_FIXTURE);
      await page.waitForTimeout(1200);
      await mapColumn(page, 0, 'date');
      await mapColumn(page, 1, 'payee');
      await mapColumn(page, 2, 'amount');
      await page.getByRole('button', { name: /continue/i }).click();
      await page.waitForTimeout(900);
    },
  },
];

async function mapColumn(page: Page, columnIndex: number, role: 'date' | 'payee' | 'amount') {
  // Radix Select: trigger has role=combobox, options have role=option.
  const triggers = page.getByRole('combobox');
  await triggers.nth(columnIndex).click();
  await page.getByRole('option', { name: new RegExp(`^${role}$`, 'i') }).click();
  await page.waitForTimeout(200);
}

async function ensureSignedIn(context: BrowserContext): Promise<void> {
  const page = await context.newPage();
  await page.setViewportSize(DESKTOP);
  await page.goto(`${APP_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  const url = page.url();
  await page.close();
  if (/\/sign-in/.test(url) || /accounts\.dev/.test(url) || /clerk\.com/.test(url)) {
    throw new Error(
      `The attached Chrome is NOT signed in. URL after /dashboard was ${url}.\n` +
        `Open ${APP_URL}/sign-in in that Chrome window, complete sign-in, then re-run.`,
    );
  }
}

async function capture(scenario: Scenario, context: BrowserContext): Promise<string> {
  const page = await context.newPage();
  try {
    await page.setViewportSize(scenario.viewport);
    await scenario.run(page);
    await verifyStatementSurface(page, scenario);
    const out = resolve(OUT_DIR, `${scenario.key}.png`);
    await page.screenshot({ path: out, fullPage: true });
    return out;
  } finally {
    await page.close();
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--list')) {
    for (const s of scenarios) console.log(`${s.key.padEnd(28)} ${s.description}`);
    return;
  }
  const requested = args.filter((a) => !a.startsWith('--'));
  const selected =
    requested.length === 0
      ? scenarios
      : scenarios.filter((s) => requested.some((r) => s.key === r || s.key.startsWith(`${r}-`) || s.key.includes(r)));

  if (selected.length === 0) {
    console.error(`No scenarios matched: ${requested.join(', ')}`);
    console.error('Run with --list to see available keys.');
    process.exit(1);
  }

  if (!existsSync(CSV_FIXTURE)) {
    console.error(`Missing CSV fixture at ${CSV_FIXTURE}`);
    process.exit(1);
  }
  mkdirSync(OUT_DIR, { recursive: true });

  console.log(`Connecting to Chrome over CDP at ${CDP_ENDPOINT}...`);
  const browser = await chromium.connectOverCDP(CDP_ENDPOINT).catch((err) => {
    console.error(
      `\nCould not attach to Chrome at ${CDP_ENDPOINT}.\n` +
        `Start Chrome with:\n` +
        `  /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222\n` +
        `then sign in to ${APP_URL} in that window and re-run this script.\n\nUnderlying error: ${err.message ?? err}`,
    );
    process.exit(1);
  });

  const contexts = browser.contexts();
  if (contexts.length === 0) {
    console.error('Chrome reported no browser contexts. Open a tab in Chrome and try again.');
    await browser.close();
    process.exit(1);
  }
  const context = contexts[0];

  try {
    await ensureSignedIn(context);
  } catch (err) {
    console.error(`\n${(err as Error).message}\n`);
    await browser.close();
    process.exit(1);
  }

  const results: { key: string; out?: string; error?: string }[] = [];
  for (const s of selected) {
    process.stdout.write(`> ${s.key} ... `);
    try {
      const out = await capture(s, context);
      results.push({ key: s.key, out });
      console.log(`saved ${out}`);
    } catch (err) {
      const message = (err as Error).message ?? String(err);
      results.push({ key: s.key, error: message });
      console.log(`FAILED — ${message}`);
    }
  }

  // For a CDP-attached browser, close() disconnects this Playwright client
  // from Chrome and leaves the user's real browser session intact.
  await browser.close().catch(() => {});

  const failed = results.filter((r) => r.error);
  console.log(`\nDone. ${results.length - failed.length}/${results.length} captured.`);
  if (failed.length > 0) {
    console.log('Failed scenarios:');
    for (const f of failed) console.log(`  - ${f.key}: ${f.error}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
