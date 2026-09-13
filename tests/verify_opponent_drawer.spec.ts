import { test, expect } from '@playwright/test';

test('Verify Opponent Inspector Drawer Docking, Auto-Open Switch, and Table Status Readability', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });

  // 1. Landing & Navigation
  await page.goto('http://localhost:3000');
  await page.getByRole('button', { name: /ENTER THE TAVERN/i }).click();
  await page.getByRole('button', { name: /Challenge to Three-Dragon Ante/i }).click();

  // 2. Lobby Setup
  await page.getByRole('button', { name: '3 Opponents', exact: true }).click();
  await page.getByText('Sleight of Hand', { exact: true }).click();
  await page.getByRole('button', { name: /Short/i }).click();

  // 3. Tabletop Initialization
  await expect(page.getByText(/Select a card from your hand to Ante/i)).toBeVisible();

  // 4. Open Opponent Inspector Drawer via Inspect button
  const inspectBtn = page.getByRole('button', { name: /Inspect/i }).first();
  await inspectBtn.click();
  await page.waitForTimeout(500);

  // Verify Drawer Dialog is visible
  const drawerDialog = page.getByRole('dialog', { name: /Inspecting Opponent/i });
  await expect(drawerDialog).toBeVisible();

  // 5. Toggle Auto-Open Setting
  const autoOpenToggle = page.getByRole('switch', { name: /Toggle auto-open on AI turns/i });
  await expect(autoOpenToggle).toBeVisible();
  await autoOpenToggle.click();
  await expect(autoOpenToggle).toContainText('Enabled');

  // 6. Dock / Collapse Drawer
  const dockBtn = page.getByRole('button', { name: /Dock Inspector Drawer/i });
  await expect(dockBtn).toBeVisible();
  await dockBtn.click();
  await page.waitForTimeout(500);

  // Verify Docked Region is visible
  const dockedRegion = page.getByRole('region', { name: /Docked Opponent Inspector/i });
  await expect(dockedRegion).toBeVisible();

  // Verify Right Aside Table Status controls remain readable and clickable
  const showLogBtn = page.getByRole('button', { name: /Show|Hide/i }).first();
  await expect(showLogBtn).toBeVisible();
  await showLogBtn.click();

  const discardShortcut = page.getByText(/Burned Cards/i);
  await expect(discardShortcut).toBeVisible();

  // Take Screenshot of Docked Drawer State
  await page.screenshot({ path: 'verification/opponent_drawer_docked.png' });

  // 7. Expand Drawer Back Out
  const expandBtn = page.getByRole('button', { name: /Expand Inspector Drawer/i });
  await expect(expandBtn).toBeVisible();
  await expandBtn.click();
  await page.waitForTimeout(500);
  await expect(drawerDialog).toBeVisible();

  // Take Screenshot of Expanded Drawer State
  await page.screenshot({ path: 'verification/opponent_drawer_expanded.png' });
});
