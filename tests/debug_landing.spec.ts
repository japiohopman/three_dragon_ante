
import { test, expect } from '@playwright/test';

test('Capture Landing Page', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'verification/landing_page.png' });
});
