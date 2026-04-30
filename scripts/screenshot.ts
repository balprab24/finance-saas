import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const STORAGE_PATH = resolve(process.cwd(), 'scripts/.auth/storage.json');
const OUT_DIR = resolve(process.cwd(), 'screenshots');

async function main() {
  const args = process.argv.slice(2);
  const urlArg = args[0] || 'http://localhost:3000/sign-in';
  const nameArg = args[1] || urlArg.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '_');
  const mode = args.includes('--login') ? 'login' : 'shot';

  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(resolve(process.cwd(), 'scripts/.auth'), { recursive: true });

  if (mode === 'login') {
    console.log('Opening a headed browser. Sign in via Clerk, then close the window.');
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(urlArg);
    console.log('Waiting for window to close...');
    await page.waitForEvent('close', { timeout: 0 });
    await context.storageState({ path: STORAGE_PATH });
    console.log(`Saved auth state to ${STORAGE_PATH}`);
    await browser.close();
    return;
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    storageState: existsSync(STORAGE_PATH) ? STORAGE_PATH : undefined,
  });
  const page = await context.newPage();
  await page.goto(urlArg, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  const out = resolve(OUT_DIR, `${nameArg}.png`);
  await page.screenshot({ path: out, fullPage: true });
  console.log(`Saved ${out}`);
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
