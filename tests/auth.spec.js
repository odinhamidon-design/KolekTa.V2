// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForTimeout(1000);
  });

  test('should display login page with role selection', async ({ page }) => {
    // Should see role selection
    await expect(page.locator('text=Kolek-Ta')).toBeVisible();
    await expect(page.locator('[data-role="admin"]')).toBeVisible();
    await expect(page.locator('[data-role="driver"]')).toBeVisible();
  });

  test('should show admin login form when Admin role is clicked', async ({ page }) => {
    // Click Admin role
    await page.click('[data-role="admin"]');
    await page.waitForTimeout(500);

    // Should see admin login form
    await expect(page.locator('#adminLoginForm')).toBeVisible();
    await expect(page.locator('#adminUsername')).toBeVisible();
    await expect(page.locator('#adminPassword')).toBeVisible();
  });

  test('should show driver login form when Driver role is clicked', async ({ page }) => {
    // Click Driver role
    await page.click('[data-role="driver"]');
    await page.waitForTimeout(500);

    // Should see driver login form
    await expect(page.locator('#driverLoginForm')).toBeVisible();
    await expect(page.locator('#driverUsername')).toBeVisible();
  });

  test('should show error for invalid admin credentials', async ({ page }) => {
    // Click Admin role
    await page.click('[data-role="admin"]');
    await page.waitForTimeout(500);

    // Fill invalid credentials
    await page.fill('#adminUsername', 'invaliduser');
    await page.fill('#adminPassword', 'wrongpassword');
    await page.click('#adminLoginForm button[type="submit"]');

    // Wait for response
    await page.waitForTimeout(2000);

    // Should still be on login page (form still visible)
    const stillOnLogin = await page.locator('#adminLoginForm').isVisible();
    expect(stillOnLogin).toBeTruthy();
  });

  test('should login successfully as admin', async ({ page }) => {
    // Click Admin role
    await page.click('[data-role="admin"]');
    await page.waitForTimeout(500);

    // Fill valid credentials
    await page.fill('#adminUsername', 'admin');
    await page.fill('#adminPassword', 'admin123');
    await page.click('#adminLoginForm button[type="submit"]');

    // Wait for redirect to index.html
    await page.waitForURL('**/index.html**', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Should see sidebar
    await expect(page.locator('#sidebar')).toBeVisible();
  });

  test('should login successfully as driver', async ({ page }) => {
    // Click Driver role
    await page.click('[data-role="driver"]');
    await page.waitForTimeout(500);

    // Fill valid credentials
    await page.fill('#driverUsername', 'driver1');
    await page.fill('#driverPassword', 'driver123');
    await page.click('#driverManualForm button[type="submit"]');

    // Wait for redirect to index.html
    await page.waitForURL('**/index.html**', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // For drivers, sidebar is hidden on desktop - they get full map experience with overlay controls
    // Should see driver web overlay (desktop) or map container
    const driverOverlay = await page.locator('#driverWebOverlay').isVisible().catch(() => false);
    const mapContainer = await page.locator('#mapContainer').isVisible().catch(() => false);
    expect(driverOverlay || mapContainer).toBeTruthy();
  });
});
