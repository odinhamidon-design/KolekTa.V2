// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Comprehensive button functionality test.
 *
 * Purpose: Identify why inline onclick handlers (e.g., onclick="showAddUserForm()")
 * are not responding. Existing tests already work around this by calling
 * page.evaluate(() => window.showAddUserForm()), confirming the functions exist
 * but something prevents the inline handlers from firing.
 *
 * This test:
 * 1. Captures ALL console errors during page load and interaction
 * 2. Listens for CSP violation events (securitypolicyviolation)
 * 3. Tests clicking actual DOM buttons (not via page.evaluate)
 * 4. Verifies window-level handler functions are defined
 * 5. Reports what blocks the inline onclick handlers
 */

test.describe('Button Functionality & Inline Handler Diagnostics', () => {
  /** @type {Array<{type: string, text: string}>} */
  let consoleMessages;
  /** @type {Array<{violatedDirective: string, blockedURI: string, originalPolicy: string}>} */
  let cspViolations;

  test.beforeEach(async ({ page }) => {
    consoleMessages = [];
    cspViolations = [];

    // Capture all console messages
    page.on('console', (msg) => {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
    });

    // Capture page errors (uncaught exceptions)
    page.on('pageerror', (err) => {
      consoleMessages.push({ type: 'pageerror', text: err.message });
    });

    // Login as admin
    await page.goto('/login');
    await page.waitForTimeout(1000);

    await page.click('[data-role="admin"]');
    await page.waitForTimeout(500);

    await page.fill('#adminUsername', 'admin');
    await page.fill('#adminPassword', 'admin123');
    await page.click('#adminLoginForm button[type="submit"]');

    await page.waitForURL('**/index.html**', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Inject CSP violation listener AFTER page load
    await page.evaluate(() => {
      window.__cspViolations = [];
      document.addEventListener('securitypolicyviolation', (e) => {
        window.__cspViolations.push({
          violatedDirective: e.violatedDirective,
          blockedURI: e.blockedURI,
          originalPolicy: e.originalPolicy,
          sourceFile: e.sourceFile,
          lineNumber: e.lineNumber,
          disposition: e.disposition,
        });
      });
    });
  });

  test.afterEach(async ({ page }) => {
    // Collect CSP violations from the page
    cspViolations = await page.evaluate(() => window.__cspViolations || []);

    // Log diagnostics
    const errors = consoleMessages.filter(
      (m) => m.type === 'error' || m.type === 'pageerror'
    );
    if (errors.length > 0) {
      console.log('\n=== Console Errors ===');
      errors.forEach((e) => console.log(`  [${e.type}] ${e.text}`));
    }
    if (cspViolations.length > 0) {
      console.log('\n=== CSP Violations ===');
      cspViolations.forEach((v) =>
        console.log(
          `  Directive: ${v.violatedDirective}, Blocked: ${v.blockedURI}, Source: ${v.sourceFile}:${v.lineNumber}`
        )
      );
    }
  });

  // -------------------------------------------------------
  // 1. Verify window-level functions exist after page load
  // -------------------------------------------------------
  test('handler functions should be defined on window after page load', async ({ page }) => {
    const functions = [
      'showAddUserForm',
      'editUser',
      'deleteUser',
      'showAddTruckForm',
      'editTruck',
      'deleteTruck',
      'showAddRouteForm',
      'showModal',
      'closeModal',
      'logout',
      'showProfile',
      'showLiveTruckPanel',
    ];

    const results = await page.evaluate((fnNames) => {
      return fnNames.map((name) => ({
        name,
        type: typeof window[name],
        exists: typeof window[name] === 'function',
      }));
    }, functions);

    console.log('\n=== Window Function Check ===');
    results.forEach((r) =>
      console.log(`  ${r.name}: ${r.exists ? 'OK' : 'MISSING'} (typeof: ${r.type})`)
    );

    // All functions should be defined
    for (const r of results) {
      expect(r.exists, `window.${r.name} should be a function`).toBe(true);
    }
  });

  // -------------------------------------------------------
  // 2. CSP violation detection test
  // -------------------------------------------------------
  test('should detect whether CSP blocks inline onclick handlers', async ({ page }) => {
    // Navigate to user management first so the Add Driver button exists
    await page.click('#userManagementBtn');
    await page.waitForTimeout(2000);

    // Re-inject CSP listener (page content may have changed)
    await page.evaluate(() => {
      window.__cspViolations = [];
      document.addEventListener('securitypolicyviolation', (e) => {
        window.__cspViolations.push({
          violatedDirective: e.violatedDirective,
          blockedURI: e.blockedURI,
          originalPolicy: e.originalPolicy,
          sourceFile: e.sourceFile,
          lineNumber: e.lineNumber,
        });
      });
    });

    // Click the Add Driver button (has onclick="showAddUserForm()")
    const addDriverBtn = page.locator('button:has-text("Add Driver")').first();
    const btnExists = await addDriverBtn.isVisible().catch(() => false);

    if (btnExists) {
      // Get the onclick attribute value
      const onclickAttr = await addDriverBtn.getAttribute('onclick');
      console.log(`\n  Add Driver button onclick attr: "${onclickAttr}"`);

      await addDriverBtn.click();
      await page.waitForTimeout(1000);

      // Check if modal opened
      const modalOpened = await page.locator('#modal.active').isVisible().catch(() => false);
      console.log(`  Modal opened after click: ${modalOpened}`);

      // Check for CSP violations
      const violations = await page.evaluate(() => window.__cspViolations || []);
      console.log(`  CSP violations after click: ${violations.length}`);
      violations.forEach((v) =>
        console.log(
          `    Directive: ${v.violatedDirective}, Blocked: ${v.blockedURI}`
        )
      );

      if (!modalOpened && violations.length > 0) {
        console.log('\n  >>> ROOT CAUSE: CSP is blocking inline onclick handlers <<<');
      } else if (!modalOpened && violations.length === 0) {
        console.log('\n  >>> Inline handler did NOT fire, but NO CSP violation detected.');
        console.log('  >>> Possible causes: JS error during handler, timing issue, or event not reaching handler.');
      } else {
        console.log('\n  >>> Inline onclick handler is working correctly <<<');
      }
    } else {
      console.log('\n  Add Driver button not found in User Management page');
    }
  });

  // -------------------------------------------------------
  // 3. Dashboard Quick Action buttons (inline onclick)
  // -------------------------------------------------------
  test('dashboard Quick Action buttons should respond to clicks', async ({ page }) => {
    // We should be on the dashboard after login
    // The dashboard has Quick Actions with onclick handlers

    // Wait for dashboard content to render
    await page.waitForTimeout(1000);

    // Check if dashboard quick action buttons are present
    const quickActionButtons = [
      { text: 'Add Route', handler: 'showAddRouteForm' },
      { text: 'Add Truck', handler: 'showAddTruckForm' },
      { text: 'Add Driver', handler: 'showAddUserForm' },
      { text: 'Live Tracking', handler: 'showLiveTruckPanel' },
    ];

    for (const btn of quickActionButtons) {
      const locator = page.locator(`button:has-text("${btn.text}")`).first();
      const visible = await locator.isVisible().catch(() => false);
      console.log(`  Quick Action "${btn.text}": visible=${visible}`);

      if (visible) {
        const onclick = await locator.getAttribute('onclick');
        console.log(`    onclick="${onclick}"`);

        // Clear any existing modal
        await page.evaluate(() => {
          const modal = document.getElementById('modal');
          if (modal) modal.classList.remove('active');
        });
        await page.waitForTimeout(200);

        // Click the button
        await locator.click();
        await page.waitForTimeout(1000);

        // Check if something happened (modal opened, or page changed)
        const modalOpened = await page.locator('#modal.active').isVisible().catch(() => false);
        const pageChanged = await page.locator('#pageContainer:not(.hidden)').isVisible().catch(() => false);
        console.log(`    Result: modal=${modalOpened}, pageChanged=${pageChanged}`);

        // For Add Route/Truck/Driver, we expect a modal to open
        if (btn.handler !== 'showLiveTruckPanel') {
          if (!modalOpened) {
            console.log(`    >>> FAIL: "${btn.text}" click did not open modal`);
          }
        }

        // Close modal if opened so it doesn't interfere with next test
        if (modalOpened) {
          await page.evaluate(() => closeModal());
          await page.waitForTimeout(300);
        }
      }
    }
  });

  // -------------------------------------------------------
  // 4. User Management page: Add Driver button via DOM click
  // -------------------------------------------------------
  test('User Management "Add Driver" button should open modal via DOM click', async ({ page }) => {
    await page.click('#userManagementBtn');
    await page.waitForTimeout(2000);

    // Find the Add Driver button in the page content
    const addBtn = page.locator('#pageContent button:has-text("Add Driver")').first();
    const exists = await addBtn.isVisible().catch(() => false);
    expect(exists, 'Add Driver button should be visible in User Management').toBeTruthy();

    if (exists) {
      const onclick = await addBtn.getAttribute('onclick');
      console.log(`  User Mgmt Add Driver onclick: "${onclick}"`);

      await addBtn.click();
      await page.waitForTimeout(1000);

      const modalOpened = await page.locator('#modal.active').isVisible().catch(() => false);
      console.log(`  Modal opened: ${modalOpened}`);

      // This is the key assertion — does the inline onclick work?
      expect(modalOpened, 'Modal should open when Add Driver button is clicked').toBeTruthy();
    }
  });

  // -------------------------------------------------------
  // 5. Truck Management page: Add Truck button via DOM click
  // -------------------------------------------------------
  test('Truck Management "Add Truck" button should open modal via DOM click', async ({ page }) => {
    await page.click('#truckManagementBtn');
    await page.waitForTimeout(2000);

    const addBtn = page.locator('#pageContent button:has-text("Add Truck")').first();
    const exists = await addBtn.isVisible().catch(() => false);
    expect(exists, 'Add Truck button should be visible in Truck Management').toBeTruthy();

    if (exists) {
      const onclick = await addBtn.getAttribute('onclick');
      console.log(`  Truck Mgmt Add Truck onclick: "${onclick}"`);

      await addBtn.click();
      await page.waitForTimeout(1000);

      const modalOpened = await page.locator('#modal.active').isVisible().catch(() => false);
      console.log(`  Modal opened: ${modalOpened}`);

      expect(modalOpened, 'Modal should open when Add Truck button is clicked').toBeTruthy();
    }
  });

  // -------------------------------------------------------
  // 6. Route Management page: Add Route button via DOM click
  // -------------------------------------------------------
  test('Route Management "Add Route" button should open modal via DOM click', async ({ page }) => {
    await page.click('#routesManagementBtn');
    await page.waitForTimeout(2000);

    const addBtn = page.locator('#pageContent button:has-text("Add Route")').first();
    const exists = await addBtn.isVisible().catch(() => false);
    expect(exists, 'Add Route button should be visible in Route Management').toBeTruthy();

    if (exists) {
      const onclick = await addBtn.getAttribute('onclick');
      console.log(`  Route Mgmt Add Route onclick: "${onclick}"`);

      await addBtn.click();
      await page.waitForTimeout(1000);

      const modalOpened = await page.locator('#modal.active').isVisible().catch(() => false);
      console.log(`  Modal opened: ${modalOpened}`);

      expect(modalOpened, 'Modal should open when Add Route button is clicked').toBeTruthy();
    }
  });

  // -------------------------------------------------------
  // 7. Modal close button (X) via DOM click
  // -------------------------------------------------------
  test('modal X close button should close the modal via DOM click', async ({ page }) => {
    // Open a modal first via evaluate (known working method)
    await page.click('#userManagementBtn');
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.showAddUserForm());
    await page.waitForTimeout(1000);

    const modalOpen = await page.locator('#modal.active').isVisible();
    expect(modalOpen, 'Modal should be open').toBeTruthy();

    // Now click the X close button via DOM (has onclick="closeModal()")
    const closeBtn = page.locator('#modal button:has(i[data-lucide="x"])').first();
    const closeExists = await closeBtn.isVisible().catch(() => false);
    console.log(`  Close button visible: ${closeExists}`);

    if (closeExists) {
      const onclick = await closeBtn.getAttribute('onclick');
      console.log(`  Close button onclick: "${onclick}"`);

      await closeBtn.click();
      await page.waitForTimeout(500);

      const modalClosed = await page
        .locator('#modal')
        .evaluate((el) => !el.classList.contains('active'))
        .catch(() => true);
      console.log(`  Modal closed: ${modalClosed}`);

      expect(modalClosed, 'Modal should close when X button is clicked').toBeTruthy();
    }
  });

  // -------------------------------------------------------
  // 8. Header profile button (inline onclick in index.html)
  // -------------------------------------------------------
  test('header profile button should respond to click', async ({ page }) => {
    // The profile button is in index.html with onclick="showProfile()"
    const profileBtn = page.locator('button:has(#headerProfilePic)').first();
    const exists = await profileBtn.isVisible().catch(() => false);
    console.log(`  Profile button visible: ${exists}`);

    if (exists) {
      const onclick = await profileBtn.getAttribute('onclick');
      console.log(`  Profile button onclick: "${onclick}"`);

      await profileBtn.click();
      await page.waitForTimeout(1000);

      // Profile should open a modal
      const modalOpened = await page.locator('#modal.active').isVisible().catch(() => false);
      console.log(`  Modal opened: ${modalOpened}`);

      expect(modalOpened, 'Profile modal should open when profile button is clicked').toBeTruthy();
    }
  });

  // -------------------------------------------------------
  // 9. Edit/Delete buttons in User Management table rows
  // -------------------------------------------------------
  test('edit and delete buttons in user table should respond to clicks', async ({ page }) => {
    await page.click('#userManagementBtn');
    await page.waitForTimeout(2000);

    // Look for edit buttons in the table (they have onclick="editUser('...')")
    const editBtns = page.locator('#pageContent button[title="Edit"]');
    const editCount = await editBtns.count();
    console.log(`  Edit buttons found: ${editCount}`);

    if (editCount > 0) {
      const firstEdit = editBtns.first();
      const onclick = await firstEdit.getAttribute('onclick');
      console.log(`  First edit onclick: "${onclick}"`);

      await firstEdit.click();
      await page.waitForTimeout(1000);

      const modalOpened = await page.locator('#modal.active').isVisible().catch(() => false);
      console.log(`  Edit modal opened: ${modalOpened}`);

      expect(modalOpened, 'Edit modal should open when edit button is clicked').toBeTruthy();

      // Close modal
      if (modalOpened) {
        await page.evaluate(() => closeModal());
        await page.waitForTimeout(300);
      }
    }

    // Look for delete buttons
    const deleteBtns = page.locator('#pageContent button[title="Delete"]');
    const deleteCount = await deleteBtns.count();
    console.log(`  Delete buttons found: ${deleteCount}`);

    if (deleteCount > 0) {
      const firstDelete = deleteBtns.first();
      const onclick = await firstDelete.getAttribute('onclick');
      console.log(`  First delete onclick: "${onclick}"`);

      // We won't actually click delete to avoid state changes,
      // but we verify the button exists and has an onclick handler
      expect(onclick, 'Delete button should have onclick handler').toBeTruthy();
    }
  });

  // -------------------------------------------------------
  // 10. Page-load console errors that could prevent function definitions
  // -------------------------------------------------------
  test('should have no critical console errors during page load', async ({ page }) => {
    const errors = consoleMessages.filter(
      (m) => m.type === 'error' || m.type === 'pageerror'
    );

    console.log(`\n=== All Console Errors (${errors.length}) ===`);
    errors.forEach((e) => console.log(`  [${e.type}] ${e.text}`));

    // Check for script loading failures
    const scriptErrors = errors.filter(
      (e) =>
        e.text.includes('Failed to load') ||
        e.text.includes('404') ||
        e.text.includes('net::ERR') ||
        e.text.includes('SyntaxError')
    );

    console.log(`  Script/loading errors: ${scriptErrors.length}`);
    scriptErrors.forEach((e) => console.log(`    ${e.text}`));

    // Script loading errors are critical — they could prevent function definitions
    expect(
      scriptErrors.length,
      'Should have no script loading errors'
    ).toBe(0);
  });

  // -------------------------------------------------------
  // 11. Verify the CSP header actually sent by the server
  // -------------------------------------------------------
  test('should report the actual CSP header from server', async ({ page }) => {
    const response = await page.goto('/index.html');
    const cspHeader =
      response?.headers()['content-security-policy'] ||
      response?.headers()['content-security-policy-report-only'] ||
      'NOT SET';

    console.log(`\n=== CSP Header ===`);
    console.log(`  ${cspHeader}`);

    // Parse script-src directive
    const scriptSrcMatch = cspHeader.match(/script-src\s+([^;]+)/);
    if (scriptSrcMatch) {
      const scriptSrc = scriptSrcMatch[1];
      console.log(`\n  script-src: ${scriptSrc}`);
      console.log(`  Has 'unsafe-inline': ${scriptSrc.includes("'unsafe-inline'")}`);
      console.log(`  Has 'unsafe-eval': ${scriptSrc.includes("'unsafe-eval'")}`);
      console.log(`  Has nonce: ${scriptSrc.includes('nonce-')}`);
      console.log(`  Has 'strict-dynamic': ${scriptSrc.includes("'strict-dynamic'")}`);

      // If nonce or strict-dynamic is present, 'unsafe-inline' is IGNORED
      if (scriptSrc.includes('nonce-') || scriptSrc.includes("'strict-dynamic'")) {
        console.log(
          '\n  >>> WARNING: nonce or strict-dynamic present — unsafe-inline is IGNORED by browsers!'
        );
        console.log(
          '  >>> This would explain why inline onclick handlers do not work.'
        );
      }
    }
  });

  // -------------------------------------------------------
  // 12. Direct comparison: DOM click vs page.evaluate
  // -------------------------------------------------------
  test('compare: DOM click vs page.evaluate for the same button', async ({ page }) => {
    await page.click('#userManagementBtn');
    await page.waitForTimeout(2000);

    // Re-inject CSP listener
    await page.evaluate(() => {
      window.__cspViolations = [];
      document.addEventListener('securitypolicyviolation', (e) => {
        window.__cspViolations.push({
          violatedDirective: e.violatedDirective,
          blockedURI: e.blockedURI,
        });
      });
    });

    // === Method A: DOM click on button with onclick attribute ===
    console.log('\n  --- Method A: DOM click ---');
    const addBtn = page.locator('#pageContent button:has-text("Add Driver")').first();
    const exists = await addBtn.isVisible().catch(() => false);

    let domClickWorked = false;
    if (exists) {
      await addBtn.click();
      await page.waitForTimeout(1000);
      domClickWorked = await page.locator('#modal.active').isVisible().catch(() => false);
      console.log(`  DOM click opened modal: ${domClickWorked}`);

      const violations = await page.evaluate(() => window.__cspViolations || []);
      console.log(`  CSP violations: ${violations.length}`);
      violations.forEach((v) =>
        console.log(`    ${v.violatedDirective}: ${v.blockedURI}`)
      );

      // Close modal if opened
      if (domClickWorked) {
        await page.evaluate(() => closeModal());
        await page.waitForTimeout(300);
      }
    }

    // === Method B: page.evaluate (known working) ===
    console.log('\n  --- Method B: page.evaluate ---');
    await page.evaluate(() => window.showAddUserForm());
    await page.waitForTimeout(1000);
    const evaluateWorked = await page.locator('#modal.active').isVisible().catch(() => false);
    console.log(`  page.evaluate opened modal: ${evaluateWorked}`);

    // Close modal
    if (evaluateWorked) {
      await page.evaluate(() => closeModal());
      await page.waitForTimeout(300);
    }

    // === Summary ===
    console.log('\n  === Comparison Summary ===');
    console.log(`  DOM click works:      ${domClickWorked}`);
    console.log(`  page.evaluate works:  ${evaluateWorked}`);

    if (!domClickWorked && evaluateWorked) {
      console.log('  >>> CONFIRMED: Inline onclick handlers are broken.');
      console.log('  >>> Functions exist (evaluate works), but onclick attribute does not fire.');
      console.log('  >>> Most likely cause: CSP blocks inline event handlers.');
    }

    // We expect page.evaluate to always work
    expect(evaluateWorked, 'page.evaluate should work').toBeTruthy();
  });
});
