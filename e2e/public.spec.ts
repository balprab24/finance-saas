import { expect, test } from '@playwright/test';

test('landing page renders the statement workflow', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: /every dollar,\s*accounted\s*for/i }),
  ).toBeVisible();
  await expect(
    page.getByText(/Aurex pulls every account, category, and transaction/i),
  ).toBeVisible();
  await expect(page.getByTestId('hero-primary-cta')).toBeVisible();
  await expect(
    page.getByTestId('landing-hero').getByRole('link', { name: /see how it works/i }),
  ).toHaveAttribute('href', '#how-it-works');

  await expect(page.getByRole('region', { name: /sample statement/i })).toBeVisible();
  await expect(page.getByText(/Net this period/i)).toBeVisible();
  await expect(page.getByLabel(/Reconciliation equation:/i)).toBeVisible();
  await expect(page.getByLabel(/Reconciled to the cent/i)).toBeVisible();
  await expect(
    page.getByRole('heading', { name: /Bring it in\. Sort it\. Read it\./i }),
  ).toBeVisible();
  await expect(page.getByText(/Optional Plaid bank sync/i)).toBeVisible();

  const desktopWidth = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(desktopWidth.scroll).toBeLessThanOrEqual(desktopWidth.client);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole('heading', { name: /every dollar,\s*accounted\s*for/i }),
  ).toBeVisible();
  await expect(page.getByRole('region', { name: /sample statement/i })).toBeVisible();

  const mobileWidth = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(mobileWidth.scroll).toBeLessThanOrEqual(mobileWidth.client);
});

test('legal pages are publicly reachable without sign in', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page).not.toHaveURL(/\/sign-in/);
  await expect(page.getByRole('heading', { level: 1, name: /^Privacy$/ })).toBeVisible();

  await page.goto('/terms');
  await expect(page.getByRole('heading', { level: 1, name: /^Terms$/ })).toBeVisible();

  await page.goto('/support');
  await expect(page.getByRole('heading', { level: 1, name: /^Support$/ })).toBeVisible();
});

test('protected dashboard redirects anonymous visitors to sign in', async ({ page }) => {
  await page.goto('/dashboard');

  await expect(page).toHaveURL(/\/sign-in/);
});

test('Plaid webhook rejects unsigned requests without a live Plaid dependency', async ({
  request,
}) => {
  const response = await request.post('/api/plaid/webhook', {
    data: { webhook_type: 'TRANSACTIONS' },
  });

  expect(response.status()).toBe(401);
  await expect(response.json()).resolves.toEqual({ error: 'Missing Plaid verification token' });
});
