import { test, expect } from '@playwright/test';

test.describe('BugSmasher Game Visual and Interactive Flow', () => {
  test('should load the game, complete preloading, show menu, and start gameplay', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => console.log(`[Browser Console ${msg.type()}]: ${msg.text()}`));
    page.on('pageerror', err => console.error(`[Browser Error]: ${err.message}\n${err.stack}`));

    // 1. Navigate to the game
    await page.goto('/');

    // 2. Wait for the main menu to appear (handles both preloader phase and menu transition)
    const mainMenuTitle = page.locator('h1:has-text("BUGSMASHER")');
    await expect(mainMenuTitle).toBeVisible({ timeout: 15000 });

    // 3. Verify that the start button ("Start Game") is present
    const startButton = page.getByRole('button', { name: 'Start Game' });
    await expect(startButton).toBeVisible();

    // 4. Click the start button to initialize the game loop
    await startButton.click();

    // 5. Verify that the game battlefield is loaded and visible
    const battlefield = page.locator('[aria-label="Game battlefield"]');
    await expect(battlefield).toBeVisible({ timeout: 10000 });

    // 6. Check that the canvas inside the battlefield is rendered
    const canvas = battlefield.locator('canvas');
    await expect(canvas).toBeVisible();
  });
});
