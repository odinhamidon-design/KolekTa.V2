// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Fuel Management E2E Tests
 *
 * Tests fuel estimation, refueling, consumption logging,
 * per-truck logs/stats, and fleet-wide statistics.
 */

test.describe('Fuel Management', () => {
  let adminToken;
  let driverToken;
  let testTruckId;

  test.beforeAll(async ({ request }) => {
    // Login as admin
    const adminRes = await request.post('/api/auth/login', {
      data: { username: 'admin', password: 'admin123', role: 'admin' },
    });
    expect(adminRes.ok()).toBeTruthy();
    adminToken = (await adminRes.json()).token;

    // Login as driver
    const driverRes = await request.post('/api/auth/login', {
      data: { username: 'driver1', password: 'driver123', role: 'driver' },
    });
    expect(driverRes.ok()).toBeTruthy();
    driverToken = (await driverRes.json()).token;

    // Get a truck ID from the system
    const trucksRes = await request.get('/api/trucks', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (trucksRes.ok()) {
      const trucks = await trucksRes.json();
      if (trucks.length > 0) {
        testTruckId = trucks[0].truckId || trucks[0]._id;
      }
    }
  });

  // ─── Fuel Estimation ──────────────────────────────────────────────

  test.describe('Fuel Estimation', () => {
    test('estimates fuel for given distance and speed', async ({ request }) => {
      const res = await request.post('/api/fuel/estimate', {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          distance: 25,
          averageSpeed: 30,
          stopCount: 10,
          idleTimeMinutes: 15,
          loadPercentage: 60,
        },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.estimation).toBeDefined();
      expect(data.estimation.totalLiters).toBeGreaterThan(0);
      expect(data.estimation.distanceConsumption).toBeGreaterThan(0);
      expect(data.estimation.factors).toBeDefined();
    });

    test('driver can also estimate fuel', async ({ request }) => {
      const res = await request.post('/api/fuel/estimate', {
        headers: { Authorization: `Bearer ${driverToken}` },
        data: {
          distance: 10,
          averageSpeed: 25,
        },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    test('estimates with truck-specific data', async ({ request }) => {
      if (!testTruckId) return;

      const res = await request.post('/api/fuel/estimate', {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          truckId: testTruckId,
          distance: 15,
          averageSpeed: 40,
          stopCount: 5,
        },
      });

      expect(res.ok()).toBeTruthy();
    });
  });

  // ─── Refueling ────────────────────────────────────────────────────

  test.describe('Refueling', () => {
    test('admin logs a refuel', async ({ request }) => {
      if (!testTruckId) return;

      const res = await request.post('/api/fuel/refuel', {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          truckId: testTruckId,
          litersAdded: 40,
          pricePerLiter: 65.5,
          gasStation: 'Petron Mati',
          notes: 'E2E test refuel',
        },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.fuelLog).toBeDefined();
      expect(data.fuelLog.litersAdded).toBe(40);
    });

    test('rejects refuel with missing truck ID', async ({ request }) => {
      const res = await request.post('/api/fuel/refuel', {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          litersAdded: 40,
          // missing truckId
        },
      });

      expect(res.ok()).toBeFalsy();
    });

    test('rejects refuel with zero liters', async ({ request }) => {
      if (!testTruckId) return;

      const res = await request.post('/api/fuel/refuel', {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          truckId: testTruckId,
          litersAdded: 0,
        },
      });

      expect(res.ok()).toBeFalsy();
    });
  });

  // ─── Consumption Logging ──────────────────────────────────────────

  test.describe('Consumption Logging', () => {
    test('logs fuel consumption for a trip', async ({ request }) => {
      if (!testTruckId) return;

      const res = await request.post('/api/fuel/consumption', {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          truckId: testTruckId,
          distance: 12.5,
          routeId: 'ROUTE-001',
          routeName: 'Test Route',
          averageSpeed: 28,
          stopCount: 8,
          idleTimeMinutes: 10,
          notes: 'E2E test consumption',
        },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });

  // ─── Fuel Logs ────────────────────────────────────────────────────

  test.describe('Fuel Logs', () => {
    test('gets fuel logs for a specific truck', async ({ request }) => {
      if (!testTruckId) return;

      const res = await request.get(`/api/fuel/logs/${testTruckId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(Array.isArray(data)).toBeTruthy();
    });

    test('gets all fuel logs across fleet', async ({ request }) => {
      const res = await request.get('/api/fuel/all-logs', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      // Could be array or object with logs property
      expect(data).toBeDefined();
    });
  });

  // ─── Fuel Stats ───────────────────────────────────────────────────

  test.describe('Fuel Stats', () => {
    test('gets fuel stats for specific truck', async ({ request }) => {
      if (!testTruckId) return;

      const res = await request.get(`/api/fuel/stats/${testTruckId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.truck).toBeDefined();
      expect(data.truck.truckId).toBe(testTruckId);
    });

    test('gets fleet-wide fuel stats', async ({ request }) => {
      const res = await request.get('/api/fuel/all-stats', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.trucks || data.fleet).toBeDefined();
    });
  });
});
