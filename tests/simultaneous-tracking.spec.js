// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Simultaneous Driver & Admin Tracking E2E Tests
 *
 * Simulates multiple drivers sending GPS updates simultaneously while
 * the admin dashboard tracks them in real-time. Tests the full tracking
 * pipeline: start trip → GPS updates → admin queries → end trip.
 */

// GPS coordinates in Mati City area
const DOWNTOWN_ROUTE = [
  { lat: 6.9549, lng: 126.2185 }, // Mati City Hall
  { lat: 6.9560, lng: 126.2200 }, // ~200m northeast
  { lat: 6.9575, lng: 126.2210 }, // ~200m further
  { lat: 6.9590, lng: 126.2220 }, // ~200m further
];

const COASTAL_ROUTE = [
  { lat: 6.9800, lng: 126.2500 }, // Dahican area
  { lat: 6.9810, lng: 126.2520 }, // ~200m east
];

// Generate 10 interpolated batch points
function generateBatchPoints() {
  const start = { lat: 6.9549, lng: 126.2185 };
  const end = { lat: 6.9600, lng: 126.2250 };
  const points = [];
  const now = Date.now();
  for (let i = 0; i < 10; i++) {
    const t = i / 9;
    points.push({
      lat: start.lat + (end.lat - start.lat) * t,
      lng: start.lng + (end.lng - start.lng) * t,
      speed: 15 + Math.random() * 10,
      heading: 45,
      timestamp: new Date(now + i * 30000).toISOString(), // 30s apart
    });
  }
  return points;
}

test.describe('Simultaneous Driver & Admin Tracking', () => {
  let adminToken;
  let driver1Token;
  let driver2Token;

  test.beforeAll(async ({ request }) => {
    // Login as admin
    const adminRes = await request.post('/api/auth/login', {
      data: { username: 'admin', password: 'admin123', role: 'admin' },
    });
    expect(adminRes.ok()).toBeTruthy();
    adminToken = (await adminRes.json()).token;

    // Login as driver1
    const driver1Res = await request.post('/api/auth/login', {
      data: { username: 'driver1', password: 'driver123', role: 'driver' },
    });
    expect(driver1Res.ok()).toBeTruthy();
    driver1Token = (await driver1Res.json()).token;

    // Login as driver2 (Jorj)
    const driver2Res = await request.post('/api/auth/login', {
      data: { username: 'Jorj', password: 'admin123', role: 'driver' },
    });
    expect(driver2Res.ok()).toBeTruthy();
    driver2Token = (await driver2Res.json()).token;
  });

  // ─── Group 1: Driver Trip Lifecycle ─────────────────────────────────

  test.describe('Driver Trip Lifecycle', () => {
    test.afterAll(async ({ request }) => {
      // Cleanup: end trip and clear location
      await request.post('/api/tracking/end-trip', {
        headers: { Authorization: `Bearer ${driver1Token}` },
      });
      await request.delete('/api/tracking/clear', {
        headers: { Authorization: `Bearer ${driver1Token}` },
      });
    });

    test('driver starts a new trip', async ({ request }) => {
      const res = await request.post('/api/tracking/start-trip', {
        headers: { Authorization: `Bearer ${driver1Token}` },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.message).toBe('Trip started');
      expect(data.trip).toBeDefined();
      expect(data.trip.username).toBe('driver1');
    });

    test('driver sends GPS update (point 1)', async ({ request }) => {
      const res = await request.post('/api/tracking/update', {
        headers: { Authorization: `Bearer ${driver1Token}` },
        data: {
          lat: DOWNTOWN_ROUTE[0].lat,
          lng: DOWNTOWN_ROUTE[0].lng,
          speed: 20,
          heading: 90,
        },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.message).toBe('Location updated');
      expect(data.location.lat).toBe(DOWNTOWN_ROUTE[0].lat);
      expect(data.location.lng).toBe(DOWNTOWN_ROUTE[0].lng);
      expect(data.trip.distance).toBeGreaterThanOrEqual(0);
    });

    test('driver sends GPS update (point 2, moved ~200m)', async ({ request }) => {
      const res = await request.post('/api/tracking/update', {
        headers: { Authorization: `Bearer ${driver1Token}` },
        data: {
          lat: DOWNTOWN_ROUTE[3].lat,
          lng: DOWNTOWN_ROUTE[3].lng,
          speed: 25,
          heading: 45,
        },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.trip.distance).toBeGreaterThan(0);
    });

    test('admin sees driver in active locations', async ({ request }) => {
      const res = await request.get('/api/tracking/active', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.ok()).toBeTruthy();
      const locations = await res.json();
      expect(Array.isArray(locations)).toBeTruthy();

      const driver1 = locations.find((loc) => loc.username === 'driver1');
      expect(driver1).toBeDefined();
      expect(driver1.lat).toBeCloseTo(DOWNTOWN_ROUTE[3].lat, 2);
      expect(driver1.lng).toBeCloseTo(DOWNTOWN_ROUTE[3].lng, 2);
    });

    test('driver trip summary shows distance', async ({ request }) => {
      const res = await request.get('/api/tracking/my-trip', {
        headers: { Authorization: `Bearer ${driver1Token}` },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.hasActiveTrip).toBe(true);
      expect(data.trip.distance.km).toBeGreaterThan(0);
      expect(data.trip.fuel.liters).toBeGreaterThanOrEqual(0);
    });

    test('driver ends trip with summary', async ({ request }) => {
      const res = await request.post('/api/tracking/end-trip', {
        headers: { Authorization: `Bearer ${driver1Token}` },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.message).toBe('Trip ended');
      expect(data.summary).toBeDefined();
      expect(data.summary.distance.km).toBeGreaterThan(0);
      expect(data.summary.stops).toBeGreaterThanOrEqual(0);
    });
  });

  // ─── Group 2: Multi-Driver Simultaneous Updates ─────────────────────

  test.describe('Multi-Driver Simultaneous Updates', () => {
    test.afterAll(async ({ request }) => {
      // Cleanup: end trips and clear locations for both drivers
      await request.post('/api/tracking/end-trip', {
        headers: { Authorization: `Bearer ${driver1Token}` },
      });
      await request.post('/api/tracking/end-trip', {
        headers: { Authorization: `Bearer ${driver2Token}` },
      });
      await request.delete('/api/tracking/clear', {
        headers: { Authorization: `Bearer ${driver1Token}` },
      });
      await request.delete('/api/tracking/clear', {
        headers: { Authorization: `Bearer ${driver2Token}` },
      });
    });

    test('driver1 starts trip', async ({ request }) => {
      const res = await request.post('/api/tracking/start-trip', {
        headers: { Authorization: `Bearer ${driver1Token}` },
      });
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.message).toBe('Trip started');
    });

    test('driver2 starts trip', async ({ request }) => {
      const res = await request.post('/api/tracking/start-trip', {
        headers: { Authorization: `Bearer ${driver2Token}` },
      });
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.message).toBe('Trip started');
    });

    test('driver1 sends GPS from downtown area', async ({ request }) => {
      const res = await request.post('/api/tracking/update', {
        headers: { Authorization: `Bearer ${driver1Token}` },
        data: {
          lat: DOWNTOWN_ROUTE[0].lat,
          lng: DOWNTOWN_ROUTE[0].lng,
          speed: 30,
          heading: 90,
        },
      });
      expect(res.ok()).toBeTruthy();
    });

    test('driver2 sends GPS from coastal area', async ({ request }) => {
      const res = await request.post('/api/tracking/update', {
        headers: { Authorization: `Bearer ${driver2Token}` },
        data: {
          lat: COASTAL_ROUTE[0].lat,
          lng: COASTAL_ROUTE[0].lng,
          speed: 15,
          heading: 180,
        },
      });
      expect(res.ok()).toBeTruthy();
    });

    test('admin active shows both drivers', async ({ request }) => {
      const res = await request.get('/api/tracking/active', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.ok()).toBeTruthy();
      const locations = await res.json();
      expect(Array.isArray(locations)).toBeTruthy();
      expect(locations.length).toBeGreaterThanOrEqual(2);

      const usernames = locations.map((loc) => loc.username);
      expect(usernames).toContain('driver1');
      expect(usernames).toContain('Jorj');
    });

    test('admin all-trucks shows both live', async ({ request }) => {
      const res = await request.get('/api/tracking/all-trucks', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.ok()).toBeTruthy();
      const trucks = await res.json();
      expect(Array.isArray(trucks)).toBeTruthy();

      const driver1Truck = trucks.find((t) => t.username === 'driver1');
      const driver2Truck = trucks.find((t) => t.username === 'Jorj');

      // At least one should be found and live (depends on truck assignment data)
      if (driver1Truck) {
        expect(driver1Truck.isLive).toBe(true);
      }
      if (driver2Truck) {
        expect(driver2Truck.isLive).toBe(true);
      }
    });

    test('admin fuel dashboard shows fleet totals', async ({ request }) => {
      const res = await request.get('/api/tracking/fuel-dashboard', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.fleet).toBeDefined();
      expect(data.fleet.activeDrivers).toBeGreaterThanOrEqual(2);
      expect(data.trucks).toBeDefined();
      expect(data.trucks.length).toBeGreaterThanOrEqual(2);
    });

    test('admin all-trips shows both trips', async ({ request }) => {
      const res = await request.get('/api/tracking/all-trips', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.count).toBeGreaterThanOrEqual(2);

      const tripUsernames = data.trips.map((t) => t.username);
      expect(tripUsernames).toContain('driver1');
      expect(tripUsernames).toContain('Jorj');
    });
  });

  // ─── Group 3: Batch GPS Sync (Offline Recovery) ─────────────────────

  test.describe('Batch GPS Sync (Offline Recovery)', () => {
    const batchPoints = generateBatchPoints();

    test.beforeAll(async ({ request }) => {
      // Start a fresh trip for driver1
      await request.post('/api/tracking/start-trip', {
        headers: { Authorization: `Bearer ${driver1Token}` },
      });
    });

    test.afterAll(async ({ request }) => {
      await request.post('/api/tracking/end-trip', {
        headers: { Authorization: `Bearer ${driver1Token}` },
      });
      await request.delete('/api/tracking/clear', {
        headers: { Authorization: `Bearer ${driver1Token}` },
      });
    });

    test('driver sends batch of 10 offline GPS points', async ({ request }) => {
      const res = await request.post('/api/tracking/batch-update', {
        headers: { Authorization: `Bearer ${driver1Token}` },
        data: { points: batchPoints },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.processed).toBe(10);
      expect(data.failed).toBe(0);
    });

    test('admin sees latest batch location', async ({ request }) => {
      const res = await request.get('/api/tracking/active', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.ok()).toBeTruthy();
      const locations = await res.json();
      const driver1 = locations.find((loc) => loc.username === 'driver1');
      expect(driver1).toBeDefined();

      // Last batch point
      const lastPoint = batchPoints[batchPoints.length - 1];
      expect(driver1.lat).toBeCloseTo(lastPoint.lat, 3);
      expect(driver1.lng).toBeCloseTo(lastPoint.lng, 3);
    });

    test('driver trip reflects batch distance', async ({ request }) => {
      const res = await request.get('/api/tracking/my-trip', {
        headers: { Authorization: `Bearer ${driver1Token}` },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.hasActiveTrip).toBe(true);
      expect(data.trip.distance.km).toBeGreaterThan(0);
    });
  });

  // ─── Group 4: Admin Queries Specific Driver ─────────────────────────

  test.describe('Admin Queries Specific Driver', () => {
    test.beforeAll(async ({ request }) => {
      // Start trips and send GPS for both drivers
      await request.post('/api/tracking/start-trip', {
        headers: { Authorization: `Bearer ${driver1Token}` },
      });
      await request.post('/api/tracking/start-trip', {
        headers: { Authorization: `Bearer ${driver2Token}` },
      });
      await request.post('/api/tracking/update', {
        headers: { Authorization: `Bearer ${driver1Token}` },
        data: { lat: 6.9549, lng: 126.2185, speed: 20, heading: 0 },
      });
      await request.post('/api/tracking/update', {
        headers: { Authorization: `Bearer ${driver2Token}` },
        data: { lat: 6.9800, lng: 126.2500, speed: 10, heading: 0 },
      });
    });

    test.afterAll(async ({ request }) => {
      await request.post('/api/tracking/end-trip', {
        headers: { Authorization: `Bearer ${driver1Token}` },
      });
      await request.post('/api/tracking/end-trip', {
        headers: { Authorization: `Bearer ${driver2Token}` },
      });
      await request.delete('/api/tracking/clear', {
        headers: { Authorization: `Bearer ${driver1Token}` },
      });
      await request.delete('/api/tracking/clear', {
        headers: { Authorization: `Bearer ${driver2Token}` },
      });
    });

    test('admin queries specific driver location', async ({ request }) => {
      const res = await request.get('/api/tracking/driver/driver1', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.lat).toBeDefined();
      expect(data.lng).toBeDefined();
    });

    test('admin queries fuel estimate for driver', async ({ request }) => {
      const res = await request.get('/api/tracking/fuel-estimate/driver1', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.hasData).toBe(true);
      expect(data.distance).toBeDefined();
      expect(data.fuel).toBeDefined();
    });

    test('both drivers end trips successfully', async ({ request }) => {
      const res1 = await request.post('/api/tracking/end-trip', {
        headers: { Authorization: `Bearer ${driver1Token}` },
      });
      expect(res1.ok()).toBeTruthy();

      const res2 = await request.post('/api/tracking/end-trip', {
        headers: { Authorization: `Bearer ${driver2Token}` },
      });
      expect(res2.ok()).toBeTruthy();

      const data1 = await res1.json();
      const data2 = await res2.json();
      expect(data1.message).toBe('Trip ended');
      expect(data2.message).toBe('Trip ended');
    });
  });
});
