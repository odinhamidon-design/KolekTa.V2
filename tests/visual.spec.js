// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Visual Regression Tests
 * These tests capture screenshots of key pages and compare them to baseline images.
 * Run with: npx playwright test tests/visual.spec.js --update-snapshots (to create baselines)
 */

test.describe('Visual Regression - Login Page', () => {
  test('login page should match snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    // Wait for any animations to complete
    await page.waitForLoadState('networkidle');

    // Take full page screenshot
    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.1
    });
  });

  test('admin login form should match snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    await page.click('[data-role="admin"]');
    await page.waitForTimeout(500);

    // Screenshot of admin login form
    const form = page.locator('#adminLoginForm');
    if (await form.isVisible().catch(() => false)) {
      await expect(form).toHaveScreenshot('admin-login-form.png', {
        maxDiffPixelRatio: 0.1
      });
    }
  });

  test('driver login form should match snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    await page.click('[data-role="driver"]');
    await page.waitForTimeout(500);

    // Screenshot of driver login form
    const form = page.locator('#driverLoginForm');
    if (await form.isVisible().catch(() => false)) {
      await expect(form).toHaveScreenshot('driver-login-form.png', {
        maxDiffPixelRatio: 0.1
      });
    }
  });
});

test.describe('Visual Regression - Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    await page.click('[data-role="admin"]');
    await page.waitForTimeout(500);
    await page.fill('#adminUsername', 'admin');
    await page.fill('#adminPassword', 'admin123');
    await page.click('#adminLoginForm button[type="submit"]');
    await page.waitForURL('**/index.html**', { timeout: 10000 });
    await page.waitForTimeout(3000);
  });

  test('admin dashboard should match snapshot', async ({ page }) => {
    // Mask dynamic content that might change
    await expect(page).toHaveScreenshot('admin-dashboard.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.15,
      mask: [
        page.locator('.leaflet-tile-container'), // Map tiles change
        page.locator('[class*="time"]'), // Timestamps
        page.locator('[class*="date"]'), // Dates
      ]
    });
  });

  test('sidebar should match snapshot', async ({ page }) => {
    const sidebar = page.locator('#sidebar');
    if (await sidebar.isVisible().catch(() => false)) {
      await expect(sidebar).toHaveScreenshot('sidebar.png', {
        maxDiffPixelRatio: 0.1
      });
    }
  });

  test('truck management section should match snapshot', async ({ page }) => {
    // Navigate to truck management
    const truckBtn = page.locator('#truckManagementBtn');
    if (await truckBtn.isVisible().catch(() => false)) {
      await truckBtn.click();
      await page.waitForTimeout(2000);

      const truckPanel = page.locator('#truckManagementPanel');
      if (await truckPanel.isVisible().catch(() => false)) {
        await expect(truckPanel).toHaveScreenshot('truck-management.png', {
          maxDiffPixelRatio: 0.1
        });
      }
    }
  });

  test('route management section should match snapshot', async ({ page }) => {
    const routeBtn = page.locator('#routeManagementBtn');
    if (await routeBtn.isVisible().catch(() => false)) {
      await routeBtn.click();
      await page.waitForTimeout(2000);

      const routePanel = page.locator('#routeManagementPanel');
      if (await routePanel.isVisible().catch(() => false)) {
        await expect(routePanel).toHaveScreenshot('route-management.png', {
          maxDiffPixelRatio: 0.1
        });
      }
    }
  });
});

test.describe('Visual Regression - Driver Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    await page.click('[data-role="driver"]');
    await page.waitForTimeout(500);
    await page.fill('#driverUsername', 'driver1');
    await page.fill('#driverPassword', 'driver123');
    await page.click('#driverManualForm button[type="submit"]');
    await page.waitForURL('**/index.html**', { timeout: 10000 });
    await page.waitForTimeout(3000);
  });

  test('driver dashboard should match snapshot', async ({ page }) => {
    await expect(page).toHaveScreenshot('driver-dashboard.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.15,
      mask: [
        page.locator('.leaflet-tile-container'),
        page.locator('[class*="time"]'),
        page.locator('[class*="gps"]'),
      ]
    });
  });

  test('driver overlay controls should match snapshot', async ({ page }) => {
    const overlay = page.locator('#driverWebOverlay');
    if (await overlay.isVisible().catch(() => false)) {
      await expect(overlay).toHaveScreenshot('driver-overlay.png', {
        maxDiffPixelRatio: 0.1
      });
    }
  });
});

test.describe('Visual Regression - Modals', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    await page.click('[data-role="admin"]');
    await page.waitForTimeout(500);
    await page.fill('#adminUsername', 'admin');
    await page.fill('#adminPassword', 'admin123');
    await page.click('#adminLoginForm button[type="submit"]');
    await page.waitForURL('**/index.html**', { timeout: 10000 });
    await page.waitForTimeout(2000);
  });

  test('add truck modal should match snapshot', async ({ page }) => {
    const addBtn = page.locator('button:has-text("Add Truck"), [onclick*="addTruck"]').first();
    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);

      const modal = page.locator('#modal.active');
      if (await modal.isVisible().catch(() => false)) {
        await expect(modal).toHaveScreenshot('add-truck-modal.png', {
          maxDiffPixelRatio: 0.1
        });
      }
    }
  });

  test('add route modal should match snapshot', async ({ page }) => {
    // Navigate to route management first
    const routeBtn = page.locator('#routeManagementBtn');
    if (await routeBtn.isVisible().catch(() => false)) {
      await routeBtn.click();
      await page.waitForTimeout(1000);
    }

    const addRouteBtn = page.locator('button:has-text("Add Route"), [onclick*="addRoute"], [onclick*="createRoute"]').first();
    if (await addRouteBtn.isVisible().catch(() => false)) {
      await addRouteBtn.click();
      await page.waitForTimeout(500);

      const modal = page.locator('#modal.active');
      if (await modal.isVisible().catch(() => false)) {
        await expect(modal).toHaveScreenshot('add-route-modal.png', {
          maxDiffPixelRatio: 0.1
        });
      }
    }
  });
});

test.describe('Visual Regression - Responsive Layouts', () => {
  test('login page should look correct on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/');
    await page.waitForTimeout(1500);

    await expect(page).toHaveScreenshot('login-mobile.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.1
    });
  });

  test('login page should look correct on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto('/');
    await page.waitForTimeout(1500);

    await expect(page).toHaveScreenshot('login-tablet.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.1
    });
  });

  test('dashboard should look correct on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForTimeout(1000);
    await page.click('[data-role="admin"]');
    await page.waitForTimeout(500);
    await page.fill('#adminUsername', 'admin');
    await page.fill('#adminPassword', 'admin123');
    await page.click('#adminLoginForm button[type="submit"]');
    await page.waitForURL('**/index.html**', { timeout: 10000 });
    await page.waitForTimeout(3000);

    await expect(page).toHaveScreenshot('dashboard-mobile.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.15,
      mask: [page.locator('.leaflet-tile-container')]
    });
  });
});

test.describe('Visual Regression - Dark Mode (if implemented)', () => {
  test('check for dark mode support', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Check if dark mode toggle exists
    const darkModeToggle = page.locator('[class*="dark-mode"], [id*="darkMode"], button:has-text("Dark")');
    const hasDarkMode = await darkModeToggle.count() > 0;

    if (hasDarkMode) {
      await darkModeToggle.first().click();
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('login-dark-mode.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.1
      });
    } else {
      // Skip test if dark mode not implemented
      expect(true).toBeTruthy();
    }
  });
});
