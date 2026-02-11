const { test, expect } = require('@playwright/test');

test.describe('Dashboard', () => {
  test('Dashboard page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/LAN Monitor|frontend/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('GPU data is visible', async ({ page }) => {
    await page.goto('/');
    // Hard assertion: GPU section must exist and be visible
    const gpuSection = page.locator('[data-testid="gpu-section"], text=/GPU|VRAM|Utilization/i');
    await expect(gpuSection).toBeVisible({ timeout: 5000 });
  });

  test('Services list displays', async ({ page }) => {
    await page.goto('/');
    // Hard assertion: Services section must exist
    const servicesList = page.locator('[data-testid="services-list"], text=/services/i');
    await expect(servicesList).toBeVisible({ timeout: 5000 });
  });

  test('Uptime bars render', async ({ page }) => {
    await page.goto('/');
    // Hard assertion: Uptime visualization must exist
    const uptimeBar = page.locator('[data-testid="uptime-bar"], svg, [class*="uptime"]');
    await expect(uptimeBar.or(page.locator('text=/uptime|service status/i'))).toBeVisible({ timeout: 5000 });
  });

  test('Refresh button works', async ({ page }) => {
    await page.goto('/');
    const refreshButton = page.locator('button:has-text("Refresh"), [data-testid="refresh-btn"]');
    
    // Hard assertion: refresh button must exist
    await expect(refreshButton).toBeVisible({ timeout: 2000 });
    
    // Click and verify API call
    const responsePromise = page.waitForResponse(response => response.url().includes('/api'));
    await refreshButton.click();
    const response = await responsePromise;
    expect(response.status()).toBe(200);
  });

  test('Dashboard is responsive - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    
    // Content should not overflow
    const bodyBox = await page.locator('body').boundingBox();
    expect(bodyBox.width).toBeLessThanOrEqual(375);
  });

  test('Dashboard is responsive - tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Dashboard is responsive - desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test('No console errors on dashboard', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Hard assertion: no console errors
    expect(errors.length).toBe(0);
  });
});
