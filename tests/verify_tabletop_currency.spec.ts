import { test, expect } from '@playwright/test';

test('Verify tabletop currency display', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:3000');

  // 1. Enter the Tavern
  const enterButton = page.getByRole('button', { name: /ENTER THE TAVERN/i });
  await enterButton.click();

  // 2. Click "Challenge to Three-Dragon Ante"
  const challengeButton = page.getByRole('button', { name: /Challenge to Three-Dragon Ante/i });
  await challengeButton.click();

  // 3. Select skill
  const bluffSkill = page.getByText('Bluff', { exact: true });
  await bluffSkill.click();

  // 4. Start game
  const shortGameButton = page.getByRole('button', { name: /Short/i });
  await shortGameButton.click();

  // Wait for game table
  await expect(page.getByText(/Select a card from your hand to Ante/i)).toBeVisible();
  await page.waitForTimeout(1000);

  await page.screenshot({ path: 'verification/currency_tabletop.png' });
});
