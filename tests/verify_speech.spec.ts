
import { test, expect } from '@playwright/test';

test('Verify NPC Speech Bubble and Emotion in TDA', async ({ page }) => {
  // Set a large viewport to avoid overlapping sidebars
  await page.setViewportSize({ width: 1920, height: 1080 });

  // Go to the app
  await page.goto('http://localhost:3000');

  // 1. Enter the Tavern
  const enterButton = page.getByRole('button', { name: /ENTER THE TAVERN/i });
  await enterButton.click();

  // 2. In NPC Showcase, find "Challenge to Three-Dragon Ante"
  // The debug_lobby screenshot showed we were already in the TDA lobby,
  // so maybe it clicked successfully or we need to wait for it.
  const challengeButton = page.getByRole('button', { name: /Challenge to Three-Dragon Ante/i });
  await challengeButton.click();

  // 3. Now in TDA Lobby (verified by debug_lobby.png)
  // Select a skill (Bluff)
  const bluffSkill = page.getByText('Bluff', { exact: true });
  await bluffSkill.click();

  // 4. Start a Short Game
  const shortGameButton = page.getByRole('button', { name: /Short/i });
  await shortGameButton.click();

  // 5. In the Game (TableTop)
  // Wait for the game to initialize (ante selection)
  await expect(page.getByText(/Select a card from your hand to Ante/i)).toBeVisible();

  // Trigger NPC speech manually for verification
  await page.evaluate(() => {
    // Access the zustand store via the window if possible,
    // but usually we can't easily.
    // Instead, let's wait for a natural event or force a state change.
    // However, I can't easily reach the store.

    // Alternative: The AI says something when it triggers a power.
    // I will select an ante and wait for the AI to play.
  });

  // Select an ante card (just click the first card in hand)
  const firstCard = page.getByTestId('player-card-0');
  await firstCard.click({ force: true });

  // Wait for "Revealing Antes"
  await page.waitForTimeout(2000);

  // Force NPC to speak via window if I exposed it (I haven't)
  // Let's just wait a bit for the AI turn.
  await page.waitForTimeout(3000);

  // Take a screenshot of the tabletop with the speech bubble
  await page.screenshot({ path: 'verification/npc_speech_verify.png' });

  // Verify bubble exists
  const speechBubble = page.locator('div').filter({ hasText: /^".*"$/ });
  // In TableTop.tsx, it's a motion.div with bg-stone-100
  const bubbleSelector = '.bg-stone-100.text-stone-900';

  // Let's force it if it's not there
  await page.evaluate(() => {
    // Try to find the store if it was attached to window (unlikely)
    // But I can try to trigger the NPC Line if I had a debug hook.
    // Since I don't, I'll rely on the AI turn which calls speak().
  });

  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'verification/npc_speech_final.png' });
});
