// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Completion & Acknowledgment Pipeline E2E Tests
 *
 * Tests the full driver completion flow:
 *   1. Driver completes individual stops (with GPS verification)
 *   2. Driver skips a stop with justification
 *   3. Route progress reflects completed/skipped stops
 *   4. Driver completes the full route with trip stats
 *   5. Admin sees pending completion notification
 *   6. Admin acknowledges completion
 *   7. Notification no longer appears as pending
 */

// Mati City coordinates for stop locations
const STOPS = [
  { lat: 6.9549, lng: 126.2185 }, // Stop 0 - City Hall
  { lat: 6.9560, lng: 126.2200 }, // Stop 1 - ~200m NE
  { lat: 6.9575, lng: 126.2210 }, // Stop 2 - ~200m further
  { lat: 6.9590, lng: 126.2220 }, // Stop 3 - ~200m further
];

test.describe('Completion & Acknowledgment Pipeline', () => {
  let adminToken;
  let driverToken;
  let testRouteId;
  let testRouteInternalId;

  test.beforeAll(async ({ request }) => {
    // Login as admin
    const adminRes = await request.post('/api/auth/login', {
      data: { username: 'admin', password: 'admin123', role: 'admin' },
    });
    expect(adminRes.ok()).toBeTruthy();
    adminToken = (await adminRes.json()).token;

    // Login as driver (Jorj has assigned routes)
    const driverRes = await request.post('/api/auth/login', {
      data: { username: 'Jorj', password: 'admin123', role: 'driver' },
    });
    expect(driverRes.ok()).toBeTruthy();
    driverToken = (await driverRes.json()).token;

    // Find a route assigned to Jorj to use for completion tests
    const routesRes = await request.get('/api/routes', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(routesRes.ok()).toBeTruthy();
    const routes = await routesRes.json();
    const jorjRoute = routes.find(
      (r) => r.assignedDriver === 'Jorj' && r.status !== 'completed'
    );

    if (jorjRoute) {
      testRouteId = jorjRoute.routeId || jorjRoute._id;
      testRouteInternalId = jorjRoute._id;
    } else {
      // Create a test route and assign to Jorj
      const createRes = await request.post('/api/routes', {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          routeId: `TEST-ROUTE-${Date.now()}`,
          name: 'Test Completion Route',
          path: {
            type: 'LineString',
            coordinates: STOPS.map((s) => [s.lng, s.lat]),
          },
          status: 'active',
        },
      });
      expect(createRes.ok() || createRes.status() === 201).toBeTruthy();
      const created = await createRes.json();
      testRouteInternalId = created._id;
      testRouteId = created.routeId || created._id;

      // Assign to Jorj
      const assignRes = await request.put(`/api/routes/${testRouteInternalId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: { assignedDriver: 'Jorj', status: 'active' },
      });
      expect(assignRes.ok()).toBeTruthy();
    }
  });

  // ─── Group 1: Individual Stop Completion ──────────────────────────

  test.describe('Individual Stop Completion', () => {
    test('driver completes stop 0 with GPS verification', async ({ request }) => {
      const res = await request.post('/api/driver/stops/complete', {
        headers: { Authorization: `Bearer ${driverToken}` },
        data: {
          routeId: testRouteId,
          stopIndex: 0,
          stopName: 'Stop 1 - City Hall',
          location: {
            type: 'Point',
            coordinates: [STOPS[0].lng, STOPS[0].lat],
          },
          gpsLocation: {
            type: 'Point',
            coordinates: [STOPS[0].lng + 0.0001, STOPS[0].lat + 0.0001], // slight offset
          },
          binsCollected: 3,
          wasteType: 'mixed',
        },
      });

      expect(res.status()).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.completion).toBeDefined();
      expect(data.completion.status).toBe('completed');
      expect(data.completion.driverUsername).toBe('Jorj');
      expect(data.completion.binsCollected).toBe(3);
      expect(data.completion.distanceFromStop).toBeDefined();
      // Distance from stop should be small (~15m for the slight offset)
      expect(data.completion.distanceFromStop).toBeLessThan(50);
    });

    test('driver completes stop 1', async ({ request }) => {
      const res = await request.post('/api/driver/stops/complete', {
        headers: { Authorization: `Bearer ${driverToken}` },
        data: {
          routeId: testRouteId,
          stopIndex: 1,
          stopName: 'Stop 2 - Market Area',
          location: {
            type: 'Point',
            coordinates: [STOPS[1].lng, STOPS[1].lat],
          },
          gpsLocation: {
            type: 'Point',
            coordinates: [STOPS[1].lng, STOPS[1].lat],
          },
          binsCollected: 5,
          wasteType: 'biodegradable',
        },
      });

      expect(res.status()).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.completion.stopIndex).toBe(1);
      expect(data.completion.wasteType).toBe('biodegradable');
    });

    test('driver completes stop 2 with notes', async ({ request }) => {
      const res = await request.post('/api/driver/stops/complete', {
        headers: { Authorization: `Bearer ${driverToken}` },
        data: {
          routeId: testRouteId,
          stopIndex: 2,
          stopName: 'Stop 3 - Residential',
          location: {
            type: 'Point',
            coordinates: [STOPS[2].lng, STOPS[2].lat],
          },
          gpsLocation: {
            type: 'Point',
            coordinates: [STOPS[2].lng, STOPS[2].lat],
          },
          binsCollected: 2,
          wasteType: 'recyclable',
          notes: 'Extra bins left at curb',
        },
      });

      expect(res.status()).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });

  // ─── Group 2: Skip Stop with Justification ──────────────────────

  test.describe('Skip Stop with Justification', () => {
    test('driver skips stop 3 with valid reason (no-waste)', async ({ request }) => {
      const res = await request.post('/api/driver/stops/skip', {
        headers: { Authorization: `Bearer ${driverToken}` },
        data: {
          routeId: testRouteId,
          stopIndex: 3,
          stopName: 'Stop 4 - End of Route',
          location: {
            type: 'Point',
            coordinates: [STOPS[3].lng, STOPS[3].lat],
          },
          gpsLocation: {
            type: 'Point',
            coordinates: [STOPS[3].lng, STOPS[3].lat],
          },
          skipReason: 'no-waste',
          skipNotes: 'No bins put out by residents today',
        },
      });

      expect(res.status()).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.skip).toBeDefined();
      expect(data.skip.status).toBe('skipped');
      expect(data.skip.skipReason).toBe('no-waste');
      expect(data.skip.driverUsername).toBe('Jorj');
    });

    test('skip without reason is rejected', async ({ request }) => {
      const res = await request.post('/api/driver/stops/skip', {
        headers: { Authorization: `Bearer ${driverToken}` },
        data: {
          routeId: testRouteId,
          stopIndex: 3,
          location: {
            type: 'Point',
            coordinates: [STOPS[3].lng, STOPS[3].lat],
          },
          // missing skipReason
        },
      });

      expect(res.ok()).toBeFalsy();
      expect(res.status()).toBe(400);
    });

    test('skip with invalid reason is rejected', async ({ request }) => {
      const res = await request.post('/api/driver/stops/skip', {
        headers: { Authorization: `Bearer ${driverToken}` },
        data: {
          routeId: testRouteId,
          stopIndex: 3,
          skipReason: 'invalid-reason',
          location: {
            type: 'Point',
            coordinates: [STOPS[3].lng, STOPS[3].lat],
          },
        },
      });

      expect(res.ok()).toBeFalsy();
      expect(res.status()).toBe(400);
    });

    test('skip with photo-required reason but no photo is rejected', async ({ request }) => {
      const res = await request.post('/api/driver/stops/skip', {
        headers: { Authorization: `Bearer ${driverToken}` },
        data: {
          routeId: testRouteId,
          stopIndex: 3,
          stopName: 'Stop 4',
          location: {
            type: 'Point',
            coordinates: [STOPS[3].lng, STOPS[3].lat],
          },
          skipReason: 'road-blocked', // requires photo
          skipNotes: 'Road under construction',
          // no skipPhoto provided
        },
      });

      expect(res.ok()).toBeFalsy();
      expect(res.status()).toBe(400);
    });
  });

  // ─── Group 3: Route Progress Tracking ───────────────────────────

  test.describe('Route Progress', () => {
    test('route progress shows completed and skipped stops', async ({ request }) => {
      const res = await request.get(`/api/driver/stops/progress/${testRouteId}`, {
        headers: { Authorization: `Bearer ${driverToken}` },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.routeId).toBe(testRouteId);
      expect(data.completed).toBe(3); // stops 0, 1, 2
      expect(data.skipped).toBe(1);   // stop 3
      expect(data.stops).toBeDefined();
      expect(Array.isArray(data.stops)).toBeTruthy();
      expect(data.stops.length).toBe(4);

      // Verify individual stop statuses
      const completedStops = data.stops.filter((s) => s.status === 'completed');
      const skippedStops = data.stops.filter((s) => s.status === 'skipped');
      expect(completedStops.length).toBe(3);
      expect(skippedStops.length).toBe(1);
    });
  });

  // ─── Group 4: Full Route Completion ─────────────────────────────

  test.describe('Full Route Completion', () => {
    test('driver completes full route with trip stats', async ({ request }) => {
      const res = await request.post(
        `/api/completions/${testRouteId}/complete`,
        {
          headers: { Authorization: `Bearer ${driverToken}` },
          data: {
            notes: 'Completed all accessible stops. One stop had no waste.',
            distanceTraveled: 4.5,
            fuelConsumed: 0,       // let server calculate
            stopsCompleted: 3,
            averageSpeed: 25,
          },
        }
      );

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.message).toBe('Route marked as completed successfully!');
      expect(data.route).toBeDefined();
      expect(data.route.status).toBe('completed');
      expect(data.route.completedBy).toBe('Jorj');
      expect(data.route.completionNotes).toContain('Completed all accessible stops');
      expect(data.route.tripStats).toBeDefined();
      expect(data.route.tripStats.distanceTraveled).toBe(4.5);
      expect(data.route.tripStats.stopsCompleted).toBe(3);
    });

    test('completion details are retrievable', async ({ request }) => {
      const res = await request.get(
        `/api/completions/${testRouteId}/completion`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.completedAt).toBeDefined();
      expect(data.completedBy).toBe('Jorj');
      expect(data.completionNotes).toContain('Completed all accessible stops');
      expect(data.tripStats).toBeDefined();
      expect(data.tripStats.distanceTraveled).toBe(4.5);
    });
  });

  // ─── Group 5: Admin Acknowledgment ──────────────────────────────

  test.describe('Admin Acknowledgment', () => {
    test('admin sees pending completion notification', async ({ request }) => {
      const res = await request.get('/api/completions/notifications/pending', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.ok()).toBeTruthy();
      const notifications = await res.json();
      expect(Array.isArray(notifications)).toBeTruthy();

      // Our completed route should appear as pending notification
      const ourNotification = notifications.find(
        (n) => (n.routeId === testRouteId || n._id === testRouteInternalId) &&
               n.completedBy === 'Jorj'
      );
      expect(ourNotification).toBeDefined();
      expect(ourNotification.status).toBe('completed');
      expect(ourNotification.notificationSent).toBeFalsy();
    });

    test('non-admin cannot access pending notifications', async ({ request }) => {
      const res = await request.get('/api/completions/notifications/pending', {
        headers: { Authorization: `Bearer ${driverToken}` },
      });

      expect(res.ok()).toBeFalsy();
      expect(res.status()).toBe(403);
    });

    test('admin acknowledges completion notification', async ({ request }) => {
      const res = await request.post(
        `/api/completions/notifications/${testRouteId}/read`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.message).toBe('Notification marked as read');
    });

    test('acknowledged notification no longer appears as pending', async ({ request }) => {
      const res = await request.get('/api/completions/notifications/pending', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.ok()).toBeTruthy();
      const notifications = await res.json();

      // Our route should no longer be in pending list
      const ourNotification = notifications.find(
        (n) => (n.routeId === testRouteId || n._id === testRouteInternalId) &&
               n.completedBy === 'Jorj'
      );
      expect(ourNotification).toBeUndefined();
    });
  });

  // ─── Group 6: Driver Performance Stats ──────────────────────────

  test.describe('Driver Performance Stats', () => {
    test('driver can view own performance stats', async ({ request }) => {
      const res = await request.get('/api/driver/performance?period=today', {
        headers: { Authorization: `Bearer ${driverToken}` },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.period).toBe('today');
      expect(data.stops).toBeDefined();
      expect(data.stops.completed).toBeGreaterThanOrEqual(3);
      expect(data.stops.skipped).toBeGreaterThanOrEqual(1);
      expect(data.stops.totalBins).toBeGreaterThanOrEqual(10); // 3+5+2
      expect(data.efficiency).toBeDefined();
      expect(data.efficiency.completionRate).toBeGreaterThan(0);
      expect(data.efficiency.completionRate).toBeLessThanOrEqual(100);
    });
  });

  // ─── Group 7: Validation & Edge Cases ───────────────────────────

  test.describe('Validation & Edge Cases', () => {
    test('stop completion without required fields is rejected', async ({ request }) => {
      const res = await request.post('/api/driver/stops/complete', {
        headers: { Authorization: `Bearer ${driverToken}` },
        data: {
          // missing routeId, stopIndex, location
        },
      });

      expect(res.ok()).toBeFalsy();
      expect(res.status()).toBe(400);
    });

    test('completing non-existent route returns error', async ({ request }) => {
      const res = await request.post(
        '/api/completions/NONEXISTENT-ROUTE/complete',
        {
          headers: { Authorization: `Bearer ${driverToken}` },
          data: {
            notes: 'test',
            distanceTraveled: 1,
            stopsCompleted: 1,
            averageSpeed: 20,
          },
        }
      );

      expect(res.ok()).toBeFalsy();
      // Should be 404 (not found) or 403 (not assigned)
      expect([403, 404]).toContain(res.status());
    });

    test('re-completing same stop upserts (no duplicate)', async ({ request }) => {
      const res = await request.post('/api/driver/stops/complete', {
        headers: { Authorization: `Bearer ${driverToken}` },
        data: {
          routeId: testRouteId,
          stopIndex: 0,
          stopName: 'Stop 1 - City Hall (re-completed)',
          location: {
            type: 'Point',
            coordinates: [STOPS[0].lng, STOPS[0].lat],
          },
          binsCollected: 4, // updated count
          wasteType: 'mixed',
        },
      });

      expect(res.status()).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      // Should still only have 4 total stop records (upsert, not duplicate)
      const progressRes = await request.get(
        `/api/driver/stops/progress/${testRouteId}`,
        { headers: { Authorization: `Bearer ${driverToken}` } }
      );
      const progress = await progressRes.json();
      expect(progress.stops.length).toBe(4);
    });
  });
});
