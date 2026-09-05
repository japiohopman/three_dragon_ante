import { test, expect } from '@playwright/test';

test('Verify Responsive 6-Player Layout across Viewports', async ({ page }) => {
  const viewports = [
    { width: 1920, height: 1080, name: 'desktop_1080p' },
    { width: 1366, height: 768, name: 'laptop_768p' },
    { width: 1280, height: 800, name: 'laptop_800p' },
    { width: 1024, height: 768, name: 'tablet_768p' },
  ];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
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

    // 3. Select 5 Opponents
    const select5Opponents = page.getByRole('button', { name: '5 Opponents', exact: true });
    await select5Opponents.click();

    // Select skill
    const bluffSkill = page.getByText('Bluff', { exact: true });
    await bluffSkill.click();

    // 4. Start Short Game
    const shortGameButton = page.getByRole('button', { name: /Short/i });
    await shortGameButton.click();

    // Wait for ante selection prompt
    await expect(page.getByText(/Select a card from your hand to Ante/i)).toBeVisible();

    // Take tabletop screenshot
    await page.screenshot({ path: `verification/responsive_${vp.name}_tabletop.png` });

    // Open Inspector Drawer on 3rd opponent
    const thirdSeat = page.locator('div.cursor-pointer').nth(2);
    await thirdSeat.click({ force: true });
    await page.waitForTimeout(500);

    // Take drawer open screenshot
    await page.screenshot({ path: `verification/responsive_${vp.name}_drawer.png` });

    // Close Inspector Drawer using header close button
    const closeBtn = page.getByRole('button', { name: 'Close Inspector', exact: true }).or(page.getByTitle('Close Inspector'));
    if (await closeBtn.first().isVisible()) {
      await closeBtn.first().click();
      await page.waitForTimeout(300);
    }
  }
});
