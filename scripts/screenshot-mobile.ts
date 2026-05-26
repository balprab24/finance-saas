import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const STORAGE_PATH = resolve(process.cwd(), 'scripts/.auth/storage.json');
const OUT_DIR = resolve(process.cwd(), 'screenshots');

async function main() {
  const args = process.argv.slice(2);
  const urlArg = args[0] || 'http://localhost:3000/';
  const nameArg = args[1] || urlArg.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '_') + '_mobile';

  mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
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
