import { expect, test } from '@playwright/test';

test('landing page renders and the preview chart toggle is interactive', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /money,\s*in\s*clear\s*view/i })).toBeVisible();
  await expect(page.getByText(/Aurex turns every account, category, and transaction/i)).toBeVisible();
  await expect(page.getByRole('link', { name: /see the dashboard/i }).first()).toHaveAttribute(
    'href',
    '#preview',
  );

  const lineToggle = page.getByRole('button', { name: 'Line' }).first();
  await lineToggle.click({ force: true });
  await expect(lineToggle).toHaveAttribute('aria-pressed', 'true');
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
