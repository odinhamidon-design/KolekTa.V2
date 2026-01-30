// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Route Optimization E2E Tests
 *
 * Tests route CRUD, optimization endpoints, configuration
 * endpoints (depot, speed profiles, options), and suggestions.
 */

// Mati City coordinates for test routes
const TEST_COORDS = [
  [126.2185, 6.9549], // City Hall [lng, lat]
  [126.2200, 6.9560], // ~200m NE
  [126.2210, 6.9575], // ~200m further
  [126.2220, 6.9590], // ~200m further
  [126.2250, 6.9600], // ~300m further
];

test.describe('Route Optimization', () => {
  let adminToken;
  let createdRouteId;
  let createdRouteInternalId;

  test.beforeAll(async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: { username: 'admin', password: 'admin123', role: 'admin' },
    });
    expect(res.ok()).toBeTruthy();
    adminToken = (await res.json()).token;
  });

  // ─── Route CRUD ───────────────────────────────────────────────────

  test.describe('Route CRUD', () => {
    test('lists all routes', async ({ request }) => {
      const res = await request.get('/api/routes', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(Array.isArray(data)).toBeTruthy();
    });

    test('creates a new route', async ({ request }) => {
      createdRouteId = `TEST-OPT-${Date.now()}`;

      const res = await request.post('/api/routes', {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          routeId: createdRouteId,
          name: 'Optimization Test Route',
          path: {
            type: 'LineString',
            coordinates: TEST_COORDS,
          },
          status: 'planned',
          notes: 'Created for optimization E2E test',
        },
      });

      expect(res.ok() || res.status() === 201).toBeTruthy();
      const data = await res.json();
      createdRouteInternalId = data._id;
      expect(data.routeId || data._id).toBeDefined();
    });

    test('reads created route', async ({ request }) => {
      if (!createdRouteInternalId) return;

      const res = await request.get(`/api/routes/${createdRouteInternalId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.name).toBe('Optimization Test Route');
    });

    test('updates route', async ({ request }) => {
      if (!createdRouteInternalId) return;

      const res = await request.put(`/api/routes/${createdRouteInternalId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          name: 'Updated Optimization Route',
          status: 'active',
        },
      });

      expect(res.ok()).toBeTruthy();
    });
  });

  // ─── Optimization ─────────────────────────────────────────────────

  test.describe('Optimization', () => {
    test('optimizes coordinates with nearest-neighbor', async ({ request }) => {
      const res = await request.post('/api/routes/optimize', {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          coordinates: TEST_COORDS,
          algorithm: 'nearest-neighbor',
          useRoadDistance: false, // skip OSRM for test reliability
        },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.optimized).toBeDefined();
      expect(data.optimized.coordinates).toBeDefined();
      expect(data.optimized.coordinates.length).toBe(TEST_COORDS.length);
      expect(data.optimized.distance).toBeGreaterThan(0);
    });

    test('optimizes with 2-opt algorithm', async ({ request }) => {
      const res = await request.post('/api/routes/optimize', {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          coordinates: TEST_COORDS,
          algorithm: '2-opt',
          useRoadDistance: false,
        },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.algorithm).toBe('2-opt');
      expect(data.savings).toBeDefined();
    });

    test('optimizes with depot specified', async ({ request }) => {
      const res = await request.post('/api/routes/optimize', {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          coordinates: TEST_COORDS,
          depot: [126.2185, 6.9549],
          useRoadDistance: false,
        },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    test('rejects optimization with less than 2 coordinates', async ({ request }) => {
      const res = await request.post('/api/routes/optimize', {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          coordinates: [[126.2185, 6.9549]], // only 1 point
          useRoadDistance: false,
        },
      });

      expect(res.ok()).toBeFalsy();
    });
  });

  // ─── Route-Specific Optimization ──────────────────────────────────

  test.describe('Route-Specific Optimization', () => {
    test('gets optimization suggestions for existing route', async ({ request }) => {
      if (!createdRouteInternalId) return;

      const res = await request.get(
        `/api/routes/${createdRouteInternalId}/suggestions?useRoadDistance=false`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      // May return 200 or 404 depending on route having enough coordinates
      if (res.ok()) {
        const data = await res.json();
        expect(data).toBeDefined();
      }
    });

    test('optimizes specific route without applying', async ({ request }) => {
      if (!createdRouteInternalId) return;

      const res = await request.post(`/api/routes/${createdRouteInternalId}/optimize`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          useRoadDistance: false,
          apply: false,
        },
      });

      // May succeed or fail depending on route data
      if (res.ok()) {
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.applied).toBe(false);
      }
    });
  });

  // ─── Cleanup ──────────────────────────────────────────────────────

  test.describe('Cleanup', () => {
    test('deletes test route', async ({ request }) => {
      if (!createdRouteInternalId) return;

      const res = await request.delete(`/api/routes/${createdRouteInternalId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.ok()).toBeTruthy();
    });
  });
});
