
import { test, expect } from '@playwright/test';

test('Verify Multiplayer TDA (Lobby Selector, Seat arrangement, and Inspection)', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });

  // Go to the app
  await page.goto('http://localhost:3000');

  // 1. Enter the Tavern
  const enterButton = page.getByRole('button', { name: /ENTER THE TAVERN/i });
  await enterButton.click();

  // 2. Click "Challenge to Three-Dragon Ante"
  const challengeButton = page.getByRole('button', { name: /Challenge to Three-Dragon Ante/i });
  await challengeButton.click();

  // 3. Select 5 Opponents in Lobby (making it a 6-player system: 1 human + 5 AI)
  const select5Opponents = page.getByRole('button', { name: '5 Opponents', exact: true });
  await select5Opponents.click();

  // Select a skill (Bluff) to enable starting buttons
  const bluffSkill = page.getByText('Bluff', { exact: true });
  await bluffSkill.click();

  // Save Lobby Screenshot
  await page.screenshot({ path: 'verification/six_player_lobby.png' });

  // 4. Start a Short Game (3 Gambits)
  const shortGameButton = page.getByRole('button', { name: /Short/i });
  await shortGameButton.click();

  // 5. In the Game (TableTop)
  // Wait for the game to initialize (ante selection)
  await expect(page.getByText(/Select a card from your hand to Ante/i)).toBeVisible();

  // Take an initial screenshot showing multiple seats
  await page.screenshot({ path: 'verification/six_player_tabletop_init.png' });

  // Click on the third opponent seat to inspect them
  const thirdSeat = page.locator('div.cursor-pointer').nth(2);
  await thirdSeat.click({ force: true });

  await page.waitForTimeout(1000);

  // Take the final tabletop screenshot
  await page.screenshot({ path: 'verification/six_player_tabletop.png' });
});
