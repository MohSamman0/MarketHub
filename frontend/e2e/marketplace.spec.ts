import { test, expect } from '@playwright/test';

test('Arabic is preserved across reloads and fits a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('mh-product-card')).toHaveCount(12);
  await page.getByRole('button', { name: 'العربية', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBeTruthy();
  await expect(page.getByRole('heading', { name: 'أشياء جميلة. ليوم أجمل.' })).toBeVisible();
});

test('customer checks out and a paid order survives reload', async ({ page }) => {
  await page.goto('/');
  await page
    .locator('mh-product-card')
    .filter({ hasText: 'Linea desk lamp' })
    .getByRole('button', { name: 'Add to bag' })
    .click();
  await page.getByRole('link', { name: 'Shopping bag', exact: true }).click();
  await page.getByRole('link', { name: 'Continue to checkout', exact: true }).click();
  await page.getByRole('button', { name: 'Customer', exact: true }).click();
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/checkout$/);
  await page.getByRole('button', { name: 'Place order & continue', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await page.getByLabel('Phone number', { exact: true }).fill('+966500000000');
  await page.getByLabel('Street address', { exact: true }).fill('Test Street Building 24');
  await page.getByRole('button', { name: 'Place order & continue', exact: true }).click();
  await page.getByRole('button', { name: 'Simulate successful payment', exact: true }).click();
  await expect(page.getByText('A good choice, confirmed.', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('A good choice, confirmed.', { exact: true })).toBeVisible();
});

test('seller dashboard, product editor and Arabic work on mobile', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Vendor', exact: true }).click();
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Hello, Noura.', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Products', exact: true }).click();
  await page.getByRole('button', { name: 'Edit Linea desk lamp', exact: true }).click();
  await expect(page.getByLabel('Product name · Arabic', { exact: true })).not.toHaveValue('');
  await page.getByRole('button', { name: 'Save product', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Product saved successfully');
  await page.getByRole('button', { name: 'العربية', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBeTruthy();
});

test('admin has seller controls and customers cannot route into them', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/login/);
  await page.getByRole('button', { name: 'Admin', exact: true }).click();
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Seller management', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Recent activity', exact: true })).toBeVisible();
});
