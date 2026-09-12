import { test, expect } from '@playwright/test';

test('Full Playable-Flow Audit Session', async ({ page }) => {
  // Set standard desktop viewport
  await page.setViewportSize({ width: 1920, height: 1080 });

  console.log('--- Step 1: Entry & Landing Page ---');
  await page.goto('http://localhost:3000');
  await page.screenshot({ path: 'verification/audit_01_landing.png' });

  // Enter the Tavern
  const enterButton = page.getByRole('button', { name: /ENTER THE TAVERN/i });
  await enterButton.click();

  // Challenge to Three-Dragon Ante
  const challengeButton = page.getByRole('button', { name: /Challenge to Three-Dragon Ante/i });
  await challengeButton.click();

  console.log('--- Step 2: Lobby Onboarding & Setup ---');
  await page.screenshot({ path: 'verification/audit_02_lobby.png' });

  // Select 3 Opponents
  const select3Opponents = page.getByRole('button', { name: '3 Opponents', exact: true });
  await select3Opponents.click();

  // Select Skill
  const sleightSkill = page.getByText('Sleight of Hand', { exact: true });
  await sleightSkill.click();

  // Select Short Game (3 Gambits)
  const shortGameButton = page.getByRole('button', { name: /Short/i });
  await shortGameButton.click();

  console.log('--- Step 3: Ante Phase ---');
  await expect(page.getByText(/Select a card from your hand to Ante/i)).toBeVisible();
  await page.screenshot({ path: 'verification/audit_03_ante_prompt.png' });

  // Select first available card in hand to ante
  const cardToAnte = page.locator('.group.cursor-pointer').first();
  await cardToAnte.click();

  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'verification/audit_04_post_ante.png' });

  console.log('--- Step 4: Gambit Turns & AI Sequences ---');
  // Wait for AI turns or player prompt
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'verification/audit_05_turn_flow.png' });

  // Click inspect on an opponent seat
  const opponentSeat = page.locator('div.cursor-pointer').first();
  if (await opponentSeat.isVisible()) {
    await opponentSeat.click({ force: true });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'verification/audit_06_opponent_drawer.png' });

    // Close drawer if visible
    const closeBtn = page.getByRole('button', { name: /Close|x/i }).first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }
  }

  console.log('--- Step 5: Responsive Views ---');
  // Tablet viewport
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'verification/audit_07_tablet_viewport.png' });

  // Mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'verification/audit_08_mobile_viewport.png' });
});
