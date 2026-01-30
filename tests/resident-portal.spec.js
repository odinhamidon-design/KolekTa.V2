// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Resident Portal E2E Tests
 *
 * Tests public-facing resident endpoints (barangays, schedules, education,
 * announcements, special pickup requests) and admin management of
 * announcements and special pickups.
 */

test.describe('Resident Portal', () => {
  let adminToken;

  test.beforeAll(async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: { username: 'admin', password: 'admin123', role: 'admin' },
    });
    expect(res.ok()).toBeTruthy();
    adminToken = (await res.json()).token;
  });

  // ─── Barangays ────────────────────────────────────────────────────

  test.describe('Barangays', () => {
    test('returns list of barangays', async ({ request }) => {
      const res = await request.get('/api/resident/barangays');
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(Array.isArray(data)).toBeTruthy();
      expect(data.length).toBeGreaterThan(0);
      // Mati City should have known barangays
      expect(data.some((b) => typeof b === 'string')).toBeTruthy();
    });
  });

  // ─── Schedules ────────────────────────────────────────────────────

  test.describe('Schedules by Barangay', () => {
    test('returns schedules for a valid barangay', async ({ request }) => {
      // First get a valid barangay name
      const barangaysRes = await request.get('/api/resident/barangays');
      const barangays = await barangaysRes.json();
      const barangay = barangays[0];

      const res = await request.get(`/api/resident/schedules/${encodeURIComponent(barangay)}`);
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.barangay).toBeDefined();
      expect(data.schedules).toBeDefined();
      expect(Array.isArray(data.schedules)).toBeTruthy();
    });
  });

  // ─── Education ────────────────────────────────────────────────────

  test.describe('Education Content', () => {
    test('returns list of education topics', async ({ request }) => {
      const res = await request.get('/api/resident/education');
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(Array.isArray(data)).toBeTruthy();
      expect(data.length).toBeGreaterThan(0);
      expect(data[0].id).toBeDefined();
      expect(data[0].title).toBeDefined();
    });

    test('returns segregation topic details', async ({ request }) => {
      const res = await request.get('/api/resident/education/segregation');
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.title).toBeDefined();
      expect(data.bins || data.description).toBeDefined();
    });

    test('returns recycling topic details', async ({ request }) => {
      const res = await request.get('/api/resident/education/recycling');
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.title).toBeDefined();
    });

    test('returns composting topic details', async ({ request }) => {
      const res = await request.get('/api/resident/education/composting');
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.title).toBeDefined();
    });
  });

  // ─── Announcements (Public) ───────────────────────────────────────

  test.describe('Announcements (Public)', () => {
    test('returns public announcements', async ({ request }) => {
      const res = await request.get('/api/resident/announcements');
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(Array.isArray(data)).toBeTruthy();
    });

    test('returns announcements filtered by barangay', async ({ request }) => {
      const barangaysRes = await request.get('/api/resident/barangays');
      const barangays = await barangaysRes.json();

      const res = await request.get(`/api/resident/announcements/${encodeURIComponent(barangays[0])}`);
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(Array.isArray(data)).toBeTruthy();
    });
  });

  // ─── Announcements (Admin CRUD) ───────────────────────────────────

  test.describe('Announcements (Admin CRUD)', () => {
    let announcementId;

    test('admin creates announcement', async ({ request }) => {
      const res = await request.post('/api/resident/admin/announcements', {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          title: 'Test Announcement',
          content: 'This is a test announcement for E2E testing.',
          type: 'info',
          targetScope: 'city-wide',
          priority: 'normal',
        },
      });

      expect(res.ok() || res.status() === 201).toBeTruthy();
      const data = await res.json();
      expect(data.announcement || data.title).toBeDefined();
      announcementId = data.announcement?._id || data._id;
    });

    test('admin lists all announcements', async ({ request }) => {
      const res = await request.get('/api/resident/admin/announcements', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(Array.isArray(data)).toBeTruthy();
    });

    test('admin updates announcement', async ({ request }) => {
      if (!announcementId) return;

      const res = await request.put(`/api/resident/admin/announcements/${announcementId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          title: 'Updated Test Announcement',
          priority: 'high',
        },
      });

      expect(res.ok()).toBeTruthy();
    });

    test('admin deletes announcement', async ({ request }) => {
      if (!announcementId) return;

      const res = await request.delete(`/api/resident/admin/announcements/${announcementId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.ok()).toBeTruthy();
    });
  });

  // ─── Special Pickup Requests ──────────────────────────────────────

  test.describe('Special Pickup Requests', () => {
    let referenceNumber;

    test('resident submits special pickup request', async ({ request }) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const preferredDate = tomorrow.toISOString().split('T')[0];

      const barangaysRes = await request.get('/api/resident/barangays');
      const barangays = await barangaysRes.json();

      const res = await request.post('/api/resident/special-pickup', {
        data: {
          pickupType: 'e-waste',
          requesterName: 'Juan Dela Cruz',
          phone: '09171234567',
          email: 'juan@test.com',
          barangay: barangays[0],
          address: '123 Test Street',
          preferredDate,
          preferredTimeSlot: 'morning',
          latitude: 6.9549,
          longitude: 126.2185,
        },
      });

      expect(res.ok() || res.status() === 201).toBeTruthy();
      const data = await res.json();
      expect(data.referenceNumber).toBeDefined();
      referenceNumber = data.referenceNumber;
    });

    test('resident tracks pickup request (not available in mock mode)', async ({ request }) => {
      if (!referenceNumber) return;

      const res = await request.get(`/api/resident/special-pickup/${referenceNumber}`);
      // Mock mode does not support tracking — returns 404
      expect(res.status()).toBe(404);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    test('admin views all special pickups', async ({ request }) => {
      const res = await request.get('/api/resident/admin/special-pickups', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(Array.isArray(data)).toBeTruthy();
    });

    test('admin gets special pickup count', async ({ request }) => {
      const res = await request.get('/api/resident/admin/special-pickups-count', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(typeof data.count).toBe('number');
    });

    test('admin updates special pickup status', async ({ request }) => {
      if (!referenceNumber) return;

      // First find the pickup by listing
      const listRes = await request.get('/api/resident/admin/special-pickups', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const pickups = await listRes.json();
      const pickup = pickups.find((p) => p.referenceNumber === referenceNumber);
      if (!pickup) return;

      const pickupId = pickup._id || pickup.referenceNumber;

      const res = await request.put(`/api/resident/admin/special-pickups/${pickupId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          status: 'scheduled',
          adminNotes: 'Scheduled for next week',
        },
      });

      expect(res.ok()).toBeTruthy();
    });

    test('admin marks special pickup as read', async ({ request }) => {
      if (!referenceNumber) return;

      const listRes = await request.get('/api/resident/admin/special-pickups', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const pickups = await listRes.json();
      const pickup = pickups.find((p) => p.referenceNumber === referenceNumber);
      if (!pickup) return;

      const pickupId = pickup._id || pickup.referenceNumber;

      const res = await request.post(`/api/resident/admin/special-pickups/${pickupId}/mark-read`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.ok()).toBeTruthy();
    });
  });
});
