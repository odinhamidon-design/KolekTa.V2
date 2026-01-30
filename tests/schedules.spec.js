// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Schedules E2E Tests
 *
 * Tests schedule CRUD operations, upcoming schedules,
 * statistics, and toggle active/inactive.
 */

test.describe('Schedules', () => {
  let adminToken;
  let scheduleId;

  test.beforeAll(async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: { username: 'admin', password: 'admin123', role: 'admin' },
    });
    expect(res.ok()).toBeTruthy();
    adminToken = (await res.json()).token;
  });

  // ─── Create Schedule ──────────────────────────────────────────────

  test.describe('Create Schedule', () => {
    test('admin creates a weekly schedule', async ({ request }) => {
      const res = await request.post('/api/schedules', {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          name: 'Test Weekly Collection',
          routeId: 'ROUTE-001',
          recurrenceType: 'weekly',
          weeklyDays: [1, 3, 5], // Mon, Wed, Fri
          scheduledTime: '07:00',
          notes: 'Test schedule for E2E',
        },
      });

      expect(res.ok() || res.status() === 201).toBeTruthy();
      const data = await res.json();
      const schedule = data.schedule || data;
      expect(schedule.name || schedule.scheduleName).toBeDefined();
      scheduleId = schedule._id || schedule.id;
    });

    test('admin creates a daily schedule', async ({ request }) => {
      const res = await request.post('/api/schedules', {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          name: 'Daily Morning Run',
          routeId: 'ROUTE-001',
          recurrenceType: 'daily',
          scheduledTime: '06:00',
        },
      });

      expect(res.ok() || res.status() === 201).toBeTruthy();
    });
  });

  // ─── List & Read ──────────────────────────────────────────────────

  test.describe('List & Read', () => {
    test('admin lists all schedules', async ({ request }) => {
      const res = await request.get('/api/schedules', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(Array.isArray(data)).toBeTruthy();
      expect(data.length).toBeGreaterThanOrEqual(1);
    });

    test('admin views single schedule', async ({ request }) => {
      if (!scheduleId) return;

      const res = await request.get(`/api/schedules/${scheduleId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data._id || data.id).toBeDefined();
    });

    test('returns upcoming schedules', async ({ request }) => {
      const res = await request.get('/api/schedules/upcoming?days=7', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(Array.isArray(data)).toBeTruthy();
    });

    test('returns schedule statistics', async ({ request }) => {
      const res = await request.get('/api/schedules/stats', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(typeof data.total).toBe('number');
      expect(typeof data.active).toBe('number');
      expect(data.total).toBeGreaterThanOrEqual(1);
    });
  });

  // ─── Update ───────────────────────────────────────────────────────

  test.describe('Update Schedule', () => {
    test('admin updates schedule name and time', async ({ request }) => {
      if (!scheduleId) return;

      const res = await request.put(`/api/schedules/${scheduleId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          name: 'Updated Weekly Collection',
          scheduledTime: '08:00',
          notes: 'Updated via E2E test',
        },
      });

      expect(res.ok()).toBeTruthy();
    });
  });

  // ─── Toggle Active ────────────────────────────────────────────────

  test.describe('Toggle Active', () => {
    test('admin toggles schedule active status', async ({ request }) => {
      if (!scheduleId) return;

      const res = await request.post(`/api/schedules/${scheduleId}/toggle`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.message).toBeDefined();
    });

    test('admin toggles back', async ({ request }) => {
      if (!scheduleId) return;

      const res = await request.post(`/api/schedules/${scheduleId}/toggle`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.ok()).toBeTruthy();
    });
  });

  // ─── Delete ───────────────────────────────────────────────────────

  test.describe('Delete Schedule', () => {
    test('admin deletes schedule', async ({ request }) => {
      if (!scheduleId) return;

      const res = await request.delete(`/api/schedules/${scheduleId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.ok()).toBeTruthy();
    });
  });
});
