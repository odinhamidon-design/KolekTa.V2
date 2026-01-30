// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Profile, Notifications, Inspections & Reports E2E Tests
 *
 * Tests user profile management, driver notifications,
 * vehicle inspections, and admin analytics reports.
 */

test.describe('Profile, Notifications, Inspections & Reports', () => {
  let adminToken;
  let driverToken;

  test.beforeAll(async ({ request }) => {
    const adminRes = await request.post('/api/auth/login', {
      data: { username: 'admin', password: 'admin123', role: 'admin' },
    });
    expect(adminRes.ok()).toBeTruthy();
    adminToken = (await adminRes.json()).token;

    const driverRes = await request.post('/api/auth/login', {
      data: { username: 'driver1', password: 'driver123', role: 'driver' },
    });
    expect(driverRes.ok()).toBeTruthy();
    driverToken = (await driverRes.json()).token;
  });

  // ─── Profile ──────────────────────────────────────────────────────

  test.describe('Profile Management', () => {
    test('gets current user profile (admin)', async ({ request }) => {
      const res = await request.get('/api/profile/me', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.username).toBe('admin');
      expect(data.role).toBe('admin');
    });

    test('gets current user profile (driver)', async ({ request }) => {
      const res = await request.get('/api/profile/me', {
        headers: { Authorization: `Bearer ${driverToken}` },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.username).toBe('driver1');
      expect(data.role).toBe('driver');
    });

    test('updates profile fields', async ({ request }) => {
      const res = await request.put('/api/profile/me', {
        headers: { Authorization: `Bearer ${driverToken}` },
        data: {
          fullName: 'Driver One Updated',
          phoneNumber: '09171111111',
        },
      });

      expect(res.ok()).toBeTruthy();
    });

    test('rejects unauthenticated profile access', async ({ request }) => {
      const res = await request.get('/api/profile/me');
      expect(res.ok()).toBeFalsy();
    });
  });

  // ─── Driver Notifications ─────────────────────────────────────────

  test.describe('Driver Notifications', () => {
    let notificationId;

    test('admin sends notification to driver', async ({ request }) => {
      const res = await request.post('/api/driver/notifications/send', {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          targetDriver: 'driver1',
          type: 'route-assigned',
          title: 'New Route Assigned',
          message: 'You have been assigned to Downtown Collection Route.',
          priority: 'high',
        },
      });

      expect(res.ok() || res.status() === 201).toBeTruthy();
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.notification).toBeDefined();
      notificationId = data.notification._id;
    });

    test('driver gets notifications', async ({ request }) => {
      const res = await request.get('/api/driver/notifications', {
        headers: { Authorization: `Bearer ${driverToken}` },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(Array.isArray(data)).toBeTruthy();
    });

    test('driver gets unread notification count', async ({ request }) => {
      const res = await request.get('/api/driver/notifications/count', {
        headers: { Authorization: `Bearer ${driverToken}` },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(typeof data.count).toBe('number');
      expect(data.count).toBeGreaterThanOrEqual(1);
    });

    test('driver marks notification as read', async ({ request }) => {
      if (!notificationId) return;

      const res = await request.put(`/api/driver/notifications/${notificationId}/read`, {
        headers: { Authorization: `Bearer ${driverToken}` },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    test('driver marks all as read', async ({ request }) => {
      const res = await request.put('/api/driver/notifications/read-all', {
        headers: { Authorization: `Bearer ${driverToken}` },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    test('non-admin cannot send notifications', async ({ request }) => {
      const res = await request.post('/api/driver/notifications/send', {
        headers: { Authorization: `Bearer ${driverToken}` },
        data: {
          targetDriver: 'driver1',
          type: 'info',
          title: 'Test',
          message: 'Should fail',
        },
      });

      expect(res.status()).toBe(403);
    });
  });

  // ─── Vehicle Inspections ──────────────────────────────────────────

  test.describe('Vehicle Inspections', () => {
    test('driver submits passing pre-trip inspection', async ({ request }) => {
      // Get a truck for inspection
      const trucksRes = await request.get('/api/trucks', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const trucks = await trucksRes.json();
      const truckId = trucks.length > 0 ? trucks[0].truckId : 'TRK-TEST';

      const res = await request.post('/api/driver/inspections', {
        headers: { Authorization: `Bearer ${driverToken}` },
        data: {
          truckId,
          inspectionType: 'pre-trip',
          items: [
            { item: 'Brakes', status: 'pass' },
            { item: 'Tires', status: 'pass' },
            { item: 'Lights', status: 'pass' },
            { item: 'Horn', status: 'pass' },
            { item: 'Mirrors', status: 'pass' },
          ],
          odometerReading: 12500,
          fuelLevel: 75,
          notes: 'All systems good',
        },
      });

      expect(res.status()).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.inspection.overallStatus).toBe('passed');
    });

    test('driver submits inspection with failures', async ({ request }) => {
      const trucksRes = await request.get('/api/trucks', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const trucks = await trucksRes.json();
      const truckId = trucks.length > 0 ? trucks[0].truckId : 'TRK-TEST';

      const res = await request.post('/api/driver/inspections', {
        headers: { Authorization: `Bearer ${driverToken}` },
        data: {
          truckId,
          inspectionType: 'post-trip',
          items: [
            { item: 'Brakes', status: 'pass' },
            { item: 'Tires', status: 'fail' },
            { item: 'Lights', status: 'fail' },
            { item: 'Horn', status: 'pass' },
          ],
          notes: 'Tire pressure low, left headlight out',
        },
      });

      expect(res.status()).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.inspection.overallStatus).toBe('needs-attention');
      expect(data.inspection.failedItems.length).toBe(2);
    });

    test('driver views own inspections', async ({ request }) => {
      const res = await request.get('/api/driver/inspections', {
        headers: { Authorization: `Bearer ${driverToken}` },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(Array.isArray(data)).toBeTruthy();
      expect(data.length).toBeGreaterThanOrEqual(2);
    });

    test('admin views all inspections', async ({ request }) => {
      const res = await request.get('/api/driver/inspections/all', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(Array.isArray(data)).toBeTruthy();
    });

    test('rejects inspection without required fields', async ({ request }) => {
      const res = await request.post('/api/driver/inspections', {
        headers: { Authorization: `Bearer ${driverToken}` },
        data: {
          // missing truckId and items
        },
      });

      expect(res.status()).toBe(400);
    });
  });

  // ─── Driver Performance ───────────────────────────────────────────

  test.describe('Driver Performance', () => {
    test('driver views today performance', async ({ request }) => {
      const res = await request.get('/api/driver/performance?period=today', {
        headers: { Authorization: `Bearer ${driverToken}` },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.period).toBe('today');
      expect(data.stops).toBeDefined();
      expect(data.inspections).toBeDefined();
      expect(data.efficiency).toBeDefined();
    });

    test('driver views weekly performance', async ({ request }) => {
      const res = await request.get('/api/driver/performance?period=week', {
        headers: { Authorization: `Bearer ${driverToken}` },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.period).toBe('week');
    });

    test('admin views performance leaderboard', async ({ request }) => {
      const res = await request.get('/api/driver/performance/leaderboard', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(Array.isArray(data)).toBeTruthy();
    });

    test('non-admin cannot access leaderboard', async ({ request }) => {
      const res = await request.get('/api/driver/performance/leaderboard', {
        headers: { Authorization: `Bearer ${driverToken}` },
      });

      expect(res.status()).toBe(403);
    });
  });

  // ─── Admin Reports ────────────────────────────────────────────────

  test.describe('Admin Reports', () => {
    test('gets collection summary report', async ({ request }) => {
      const res = await request.get('/api/reports/collection-summary', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.period).toBeDefined();
      expect(data.summary).toBeDefined();
      expect(typeof data.summary.totalRoutes).toBe('number');
      expect(typeof data.summary.completionRate).toBe('number');
    });

    test('gets driver performance report', async ({ request }) => {
      const res = await request.get('/api/reports/driver-performance', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.period).toBeDefined();
      expect(data.drivers).toBeDefined();
      expect(Array.isArray(data.drivers)).toBeTruthy();
      expect(data.summary).toBeDefined();
    });

    test('gets complaint analytics report', async ({ request }) => {
      const res = await request.get('/api/reports/complaint-analytics', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.period).toBeDefined();
      expect(data.summary).toBeDefined();
      expect(typeof data.summary.total).toBe('number');
    });

    test('gets collection summary with date range', async ({ request }) => {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const res = await request.get(
        `/api/reports/collection-summary?startDate=${startDate}&endDate=${endDate}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      expect(res.ok()).toBeTruthy();
    });

    test('non-admin cannot access reports', async ({ request }) => {
      const res = await request.get('/api/reports/collection-summary', {
        headers: { Authorization: `Bearer ${driverToken}` },
      });

      expect(res.ok()).toBeFalsy();
    });
  });
});
