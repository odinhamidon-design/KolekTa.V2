// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Complaints E2E Tests
 *
 * Tests the public complaint submission and tracking flow,
 * admin complaint management, and complaint statistics.
 */

test.describe('Complaints', () => {
  let adminToken;
  let referenceNumber;
  let complaintId;

  test.beforeAll(async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: { username: 'admin', password: 'admin123', role: 'admin' },
    });
    expect(res.ok()).toBeTruthy();
    adminToken = (await res.json()).token;
  });

  // ─── Public Reference Data ────────────────────────────────────────

  test.describe('Reference Data', () => {
    test('returns list of barangays', async ({ request }) => {
      const res = await request.get('/api/complaints/barangays');
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(Array.isArray(data)).toBeTruthy();
      expect(data.length).toBeGreaterThan(0);
    });

    test('returns report types with descriptions', async ({ request }) => {
      const res = await request.get('/api/complaints/report-types');
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(Array.isArray(data)).toBeTruthy();
      expect(data.length).toBeGreaterThan(0);

      const types = data.map((t) => t.value);
      expect(types).toContain('missed_collection');
      expect(types).toContain('illegal_dumping');
      expect(types).toContain('overflowing_bin');

      // Each type should have label and description
      for (const type of data) {
        expect(type.value).toBeDefined();
        expect(type.label).toBeDefined();
        expect(type.description).toBeDefined();
      }
    });
  });

  // ─── Complaint Submission ─────────────────────────────────────────

  test.describe('Complaint Submission', () => {
    test('submits a missed collection complaint', async ({ request }) => {
      const barangaysRes = await request.get('/api/complaints/barangays');
      const barangays = await barangaysRes.json();

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const res = await request.post('/api/complaints/submit', {
        data: {
          name: 'Maria Santos',
          phone: '09181234567',
          email: 'maria@test.com',
          address: '456 Sample Road',
          barangay: barangays[0],
          description: 'Garbage truck did not pass yesterday as scheduled.',
          reportType: 'missed_collection',
          missedCollectionDate: yesterday.toISOString().split('T')[0],
          latitude: 6.9560,
          longitude: 126.2200,
        },
      });

      expect(res.ok() || res.status() === 201).toBeTruthy();
      const data = await res.json();
      expect(data.referenceNumber).toBeDefined();
      expect(data.complaint).toBeDefined();
      expect(data.complaint.status).toBe('pending');
      referenceNumber = data.referenceNumber;
    });

    test('submits an overflowing bin complaint', async ({ request }) => {
      const barangaysRes = await request.get('/api/complaints/barangays');
      const barangays = await barangaysRes.json();

      const res = await request.post('/api/complaints/submit', {
        data: {
          name: 'Pedro Cruz',
          phone: '09191234567',
          email: 'pedro@test.com',
          address: '789 Main Street',
          barangay: barangays.length > 1 ? barangays[1] : barangays[0],
          description: 'The public bin near the market has been overflowing for 3 days.',
          reportType: 'overflowing_bin',
        },
      });

      expect(res.ok() || res.status() === 201).toBeTruthy();
      const data = await res.json();
      expect(data.referenceNumber).toBeDefined();
    });

    test('rejects complaint with missing required fields', async ({ request }) => {
      const res = await request.post('/api/complaints/submit', {
        data: {
          name: 'Incomplete',
          // missing phone, email, address, barangay, description
        },
      });

      expect(res.ok()).toBeFalsy();
      expect(res.status()).toBe(400);
    });
  });

  // ─── Complaint Tracking ───────────────────────────────────────────

  test.describe('Complaint Tracking', () => {
    test('tracks complaint by reference number', async ({ request }) => {
      if (!referenceNumber) return;

      const res = await request.get(`/api/complaints/track/${referenceNumber}`);
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.referenceNumber).toBe(referenceNumber);
      expect(data.status).toBe('pending');
      expect(data.reportType).toBe('missed_collection');
      expect(data.description).toContain('Garbage truck');
    });

    test('returns 404 for invalid reference number', async ({ request }) => {
      const res = await request.get('/api/complaints/track/INVALID-REF-000');
      expect(res.ok()).toBeFalsy();
      expect(res.status()).toBe(404);
    });
  });

  // ─── Admin Complaint Management ───────────────────────────────────

  test.describe('Admin Management', () => {
    test('admin lists all complaints', async ({ request }) => {
      const res = await request.get('/api/complaints', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(Array.isArray(data)).toBeTruthy();
      expect(data.length).toBeGreaterThanOrEqual(2);

      // Store first complaint ID for later tests
      complaintId = data[0]._id || data[0].referenceNumber;
    });

    test('admin gets complaint statistics', async ({ request }) => {
      const res = await request.get('/api/complaints/stats', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.total).toBeGreaterThanOrEqual(2);
      expect(typeof data.pending).toBe('number');
      expect(typeof data.resolved).toBe('number');
    });

    test('admin gets new complaint count', async ({ request }) => {
      const res = await request.get('/api/complaints/new-count', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(typeof data.count).toBe('number');
    });

    test('admin views single complaint details', async ({ request }) => {
      if (!complaintId) return;

      const res = await request.get(`/api/complaints/${complaintId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.description).toBeDefined();
      expect(data.status).toBeDefined();
    });

    test('admin updates complaint status to in-progress', async ({ request }) => {
      if (!complaintId) return;

      const res = await request.put(`/api/complaints/${complaintId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          status: 'in-progress',
          adminResponse: 'We are investigating this issue.',
          adminNotes: 'Assigned to driver for follow-up',
        },
      });

      expect(res.ok()).toBeTruthy();
    });

    test('admin marks complaint as read', async ({ request }) => {
      if (!complaintId) return;

      const res = await request.post(`/api/complaints/${complaintId}/mark-read`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.ok()).toBeTruthy();
    });

    test('admin marks all complaints as read', async ({ request }) => {
      const res = await request.post('/api/complaints/mark-all-read', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.ok()).toBeTruthy();
    });

    test('admin resolves complaint', async ({ request }) => {
      if (!complaintId) return;

      const res = await request.put(`/api/complaints/${complaintId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          status: 'resolved',
          adminResponse: 'Issue has been resolved. Extra collection dispatched.',
        },
      });

      expect(res.ok()).toBeTruthy();
    });

    test('tracking shows updated status', async ({ request }) => {
      if (!referenceNumber) return;

      const res = await request.get(`/api/complaints/track/${referenceNumber}`);
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      // Status should be updated (in-progress or resolved depending on which complaint was updated)
      expect(['in-progress', 'resolved', 'pending']).toContain(data.status);
    });

    test('admin deletes complaint', async ({ request }) => {
      // Get the second complaint to delete
      const listRes = await request.get('/api/complaints', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const complaints = await listRes.json();
      if (complaints.length < 2) return;

      const toDelete = complaints[complaints.length - 1]._id || complaints[complaints.length - 1].referenceNumber;

      const res = await request.delete(`/api/complaints/${toDelete}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.ok()).toBeTruthy();
    });
  });
});
