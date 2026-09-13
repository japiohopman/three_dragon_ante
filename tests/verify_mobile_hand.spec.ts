import { test, expect } from '@playwright/test';

test('Verify Mobile Viewport Card Fan Translation & Bounds', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('http://localhost:3000');

  // 1. Enter Tavern if on landing page
  const enterButton = page.getByRole('button', { name: /ENTER THE TAVERN/i });
  if (await enterButton.isVisible()) {
    await enterButton.click();
  }

  // 2. Challenge Three-Dragon Ante
  const challengeButton = page.getByRole('button', { name: /Challenge to Three-Dragon Ante/i });
  if (await challengeButton.isVisible()) {
    await challengeButton.click();
  }

  // 3. Setup match (3 Opponents, Bluff skill, Short game)
  const select3Opponents = page.getByRole('button', { name: '3 Opponents', exact: true });
  await select3Opponents.click();

  const bluffSkill = page.getByText('Bluff', { exact: true });
  await bluffSkill.click();

  const shortGameButton = page.getByRole('button', { name: /Short/i });
  await shortGameButton.click();

  // 4. Wait for ante selection phase
  await expect(page.getByText(/Select a card from your hand to Ante/i)).toBeVisible();

  // Take baseline mobile tabletop screenshot
  await page.screenshot({ path: 'verification/mobile_tabletop_baseline.png' });

  // 5. Focus/Hover on player hand card
  const firstCard = page.locator('[data-testid="player-card-0"]');
  await expect(firstCard).toBeVisible();

  // Trigger focus state to activate fan style preview
  await firstCard.focus();
  await page.waitForTimeout(300);

  // Take mobile card fan hover/focus screenshot
  await page.screenshot({ path: 'verification/mobile_card_fan_hover.png' });
});
