import { expect, test } from '@playwright/test';

test('narrative demo links onboarding, monitoring, and governance', async ({ page }) => {
  await page.goto('/kyc-fabric/executive');

  await expect(
    page.getByRole('heading', { name: 'Executive Command Center' }),
  ).toBeVisible();

  await page.keyboard.press('Space');
  await page.keyboard.press('2');
  await expect(
    page.getByRole('heading', { name: 'AI Agent Operations Center' }),
  ).toBeVisible();

  await page.keyboard.press('3');
  await expect(page.getByRole('heading', { name: 'KYC Case Explorer' })).toBeVisible();

  await page.getByRole('button', { name: 'Open governance' }).click();
  await expect(
    page.getByRole('heading', { name: 'AI Governance & Explainability Console' }),
  ).toBeVisible();

  await page.keyboard.press('Shift+L');
});
