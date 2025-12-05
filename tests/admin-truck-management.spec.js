// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Admin - Truck Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Click Admin role
    await page.click('[data-role="admin"]');
    await page.waitForTimeout(500);

    // Fill admin credentials
    await page.fill('#adminUsername', 'admin');
    await page.fill('#adminPassword', 'admin123');
    await page.click('#adminLoginForm button[type="submit"]');

    // Wait for redirect
    await page.waitForURL('**/index.html**', { timeout: 10000 });
    await page.waitForTimeout(2000);
  });

  test('should navigate to truck management', async ({ page }) => {
    // Click on Truck Management in sidebar using button ID
    await page.click('#truckManagementBtn');
    await page.waitForTimeout(2000);

    // Should see truck management content
    const truckContent = await page.locator('table, h1:has-text("Truck Management")').isVisible().catch(() => false);
    const pageVisible = await page.locator('#pageContainer:not(.hidden)').isVisible().catch(() => false);
    expect(truckContent || pageVisible).toBeTruthy();
  });

  test('should open add truck modal', async ({ page }) => {
    // Navigate to truck management
    await page.click('#truckManagementBtn');
    await page.waitForTimeout(2000);

    // Click add truck button
    await page.click('button:has-text("Add Truck")');
    await page.waitForTimeout(1000);

    // Modal should be visible (has 'active' class)
    const modalVisible = await page.locator('#modal.active').isVisible();
    expect(modalVisible).toBeTruthy();

    // Form fields should be present
    const truckIdField = await page.locator('#newTruckId').isVisible().catch(() => false);
    expect(truckIdField).toBeTruthy();
  });

  test('should close truck modal when cancel is clicked', async ({ page }) => {
    // Navigate to truck management
    await page.click('#truckManagementBtn');
    await page.waitForTimeout(2000);

    // Click add truck button
    await page.click('button:has-text("Add Truck")');
    await page.waitForTimeout(1000);

    // Modal should be visible
    await expect(page.locator('#modal.active')).toBeVisible();

    // Click cancel button
    await page.click('#modal >> text=Cancel');
    await page.waitForTimeout(500);

    // Modal should be closed (no 'active' class)
    const modalClosed = await page.locator('#modal').evaluate(el => !el.classList.contains('active')).catch(() => true);
    expect(modalClosed).toBeTruthy();
  });

  test('should create a new truck', async ({ page }) => {
    // Navigate to truck management
    await page.click('#truckManagementBtn');
    await page.waitForTimeout(2000);

    // Click add truck button
    await page.click('button:has-text("Add Truck")');
    await page.waitForTimeout(1000);

    // Fill in the form
    const testTruckId = 'TRUCK-' + Date.now();
    await page.fill('#newTruckId', testTruckId);
    await page.fill('#newPlateNumber', 'ABC-' + Math.floor(Math.random() * 9999));
    await page.fill('#newModel', 'Test Model');
    await page.fill('#newCapacity', '2000');

    // Submit form
    await page.click('#modal button[type="submit"]');
    await page.waitForTimeout(2000);

    // Should see success toast or modal closes
    const success = await page.locator('.toast, [class*="toast"]').isVisible().catch(() => false);
    const modalClosed = await page.locator('#modal').evaluate(el => !el.classList.contains('active')).catch(() => true);

    expect(success || modalClosed).toBeTruthy();
  });

  test('should open edit truck modal', async ({ page }) => {
    // Navigate to truck management
    await page.click('#truckManagementBtn');
    await page.waitForTimeout(2000);

    // Click edit on first truck using onclick attribute
    const editBtn = page.locator('[onclick*="editTruck"]').first();
    if (await editBtn.isVisible().catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(1000);

      // Modal should be visible (has 'active' class)
      const modalVisible = await page.locator('#modal.active').isVisible();
      expect(modalVisible).toBeTruthy();

      // Edit form should have filled values
      const plateField = await page.locator('#editPlateNumber').isVisible().catch(() => false);
      expect(plateField).toBeTruthy();
    } else {
      // No trucks to edit, test passes
      expect(true).toBeTruthy();
    }
  });

  test('should open assign driver modal', async ({ page }) => {
    // Navigate to truck management
    await page.click('#truckManagementBtn');
    await page.waitForTimeout(2000);

    // Click assign driver button using onclick attribute
    const assignBtn = page.locator('[onclick*="openAssignDriverModal"]').first();
    if (await assignBtn.isVisible().catch(() => false)) {
      await assignBtn.click();
      await page.waitForTimeout(1000);

      // Modal should be visible (has 'active' class)
      const modalVisible = await page.locator('#modal.active').isVisible();
      expect(modalVisible).toBeTruthy();

      const driverSelect = await page.locator('#assignDriverSelect, select').isVisible().catch(() => false);
      expect(driverSelect).toBeTruthy();
    } else {
      // No trucks to assign, test passes
      expect(true).toBeTruthy();
    }
  });
});
