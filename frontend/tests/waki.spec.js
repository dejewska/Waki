import { test, expect } from '@playwright/test';

test('Strona Waki otwiera się poprawnie', async ({ page }) => {
  await page.goto('https://16.16.100.71.sslip.io/');
  await expect(page.locator('body')).toContainText('Waki');
});
