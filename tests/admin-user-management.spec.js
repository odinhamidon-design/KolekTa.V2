// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Admin - User Management', () => {
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

  test('should navigate to user management', async ({ page }) => {
    // Click on User Management in sidebar using button ID
    await page.click('#userManagementBtn');
    await page.waitForTimeout(2000);

    // Should see user management content
    const userTable = await page.locator('table, h1:has-text("User Management")').isVisible().catch(() => false);
    const pageVisible = await page.locator('#pageContainer:not(.hidden)').isVisible().catch(() => false);
    expect(userTable || pageVisible).toBeTruthy();
  });

  test('should open add user modal', async ({ page }) => {
    // Navigate to user management
    await page.click('#userManagementBtn');
    await page.waitForTimeout(2000);

    // Click add driver button
    await page.click('button:has-text("Add Driver")');
    await page.waitForTimeout(1000);

    // Modal should be visible (has 'active' class)
    const modalVisible = await page.locator('#modal.active').isVisible();
    expect(modalVisible).toBeTruthy();

    // Form fields should be present
    const usernameField = await page.locator('#newUsername').isVisible().catch(() => false);
    expect(usernameField).toBeTruthy();
  });

  test('should close modal when cancel is clicked', async ({ page }) => {
    // Navigate to user management
    await page.click('#userManagementBtn');
    await page.waitForTimeout(2000);

    // Click add driver button
    await page.click('button:has-text("Add Driver")');
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

  test('should have modern styled form inputs', async ({ page }) => {
    // Navigate to user management
    await page.click('#userManagementBtn');
    await page.waitForTimeout(2000);

    // Click add driver button
    await page.click('button:has-text("Add Driver")');
    await page.waitForTimeout(1000);

    // Check form has Tailwind classes
    const formInput = page.locator('#modal input[type="text"]').first();
    await expect(formInput).toBeVisible();

    // Check input has modern styling (rounded, border, etc.)
    const inputClasses = await formInput.getAttribute('class');
    const hasModernStyling = inputClasses && (
      inputClasses.includes('rounded') ||
      inputClasses.includes('border') ||
      inputClasses.includes('px-') ||
      inputClasses.includes('py-')
    );
    expect(hasModernStyling).toBeTruthy();
  });

  test('should create a new driver', async ({ page }) => {
    // Navigate to user management
    await page.click('#userManagementBtn');
    await page.waitForTimeout(2000);

    // Click add driver button
    await page.click('button:has-text("Add Driver")');
    await page.waitForTimeout(1000);

    // Fill in the form
    const testUsername = 'testdriver' + Date.now();
    await page.fill('#newUsername', testUsername);
    await page.fill('#newFullName', 'Test Driver');
    await page.fill('#newEmail', testUsername + '@test.com');
    await page.fill('#newPassword', 'password123');
    await page.fill('#newPhone', '09123456789');

    // Submit form
    await page.click('#modal button[type="submit"]');
    await page.waitForTimeout(2000);

    // Should see success toast or modal closes
    const toastVisible = await page.locator('.toast, [class*="toast"]').isVisible().catch(() => false);
    const modalClosed = await page.locator('#modal').evaluate(el => !el.classList.contains('active')).catch(() => true);

    expect(toastVisible || modalClosed).toBeTruthy();
  });
});
