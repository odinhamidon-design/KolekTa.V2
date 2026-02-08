# Resilience Patterns Design

**Date**: 2026-02-08
**Status**: Approved
**Scope**: API retry logic, OSRM circuit breaker, MongoDB persistent reconnection, batch GPS timeout

---

## 1. API Retry Utility

**File**: `public/js/fetch-retry.js` (new), imported by `app.js` and `login.js`

Shared `fetchWithRetry()` wrapper for frontend API calls:

- Silent retries: up to 3 attempts with exponential backoff (1s, 2s, 4s)
- Retries on network errors and 5xx server responses
- Does NOT retry 4xx client errors (no point retrying bad requests)
- Does NOT retry non-idempotent POST mutations (create user, create truck) to avoid duplicates
- DOES retry: login, GPS tracking updates, all GET requests (dashboard data, routes, trucks, schedules)
- After all retries fail, throws original error for existing handlers
- No UI indication during retries (silent)

**Applied to**: login fetch calls, GPS tracking updates, dashboard data fetches, list endpoints.
**Not applied to**: form submissions that create/modify resources.

---

## 2. OSRM Circuit Breaker with Haversine Fallback

**Files**: `lib/osrmService.js` (modify), `lib/routeOptimizer.js` (modify)

Circuit breaker pattern with three states:

- **Closed** (normal): Requests go to OSRM as usual
- **Open** (failure): After 3 consecutive failures within 60s, circuit opens. All requests use Haversine fallback immediately instead of calling OSRM.
- **Half-open** (probing): Every 30s, one probe request sent to OSRM. Success closes circuit; failure keeps it open.

Haversine fallback:

- Uses existing `haversineDistance()` from `routeOptimizer.js`
- Multiplies by 1.4 road factor for realistic distance estimates
- Route optimization still works but with less accurate distances
- Response includes `fallback: true` flag for optional frontend indicator

---

## 3. MongoDB Persistent Reconnection

**Files**: `lib/mongodb.js` (rewrite), `server.js` (add health endpoint)

Replace 3-retry-and-stop with persistent reconnection:

- Exponential backoff: 2s, 4s, 8s, 16s, capped at 30s
- Never stops retrying. Server stays alive during disconnection.
- Mongoose event listeners (`disconnected`, `error`) trigger automatic reconnection
- During disconnected state: route handlers return `503 Service Unavailable` with `Retry-After: 5` header
- When connection restores, requests work immediately (no restart)

Health monitoring:

- `GET /api/health` returns `{status: "ok", db: "connected|connecting|disconnected"}`
- Reconnection attempts logged at `warn` level
- Successful reconnection logged at `info` level

---

## 4. Batch GPS Processing Timeout & Throttling

**Files**: `routes/tracking.js` (modify), `routes/tracking-mongo.js` (modify)

Protect batch GPS endpoint from blocking:

- 10-second hard timeout on batch processing
- If exceeded: return `206 Partial Content` with count of processed points
- Chunk processing: split batch into groups of 50, process each chunk with `Promise.all()` (~20x faster than sequential)
- Payload validation: reject if > 1MB or > 1000 points (existing MAX_BATCH_SIZE)
- Graceful partial failure: failed points logged but don't block remaining chunks
- Response: `{processed: N, failed: M, errors: [...]}`

---

## Implementation Order

1. **API retry utility** (lowest risk, immediate UX improvement)
2. **MongoDB persistent reconnection** (critical for production stability)
3. **OSRM circuit breaker** (prevents cascading failure from external dependency)
4. **Batch GPS timeout** (performance protection for heavy usage)

## Testing Strategy

- Unit tests for retry logic (mock fetch failures)
- Unit tests for circuit breaker state transitions
- E2E tests for MongoDB reconnection (mock disconnect/reconnect)
- Load test for batch GPS with 1000-point payload
