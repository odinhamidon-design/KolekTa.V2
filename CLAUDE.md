# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kolek-Ta is a waste collection management system with GPS tracking and route optimization for Mati City. It's a full-stack Node.js/Express application with MongoDB storage (or JSON file fallback) and offline-capable PWA features.

## Commands

```bash
# Development
npm run dev          # Start with auto-reload (nodemon) on port 3000
npm start            # Start production server

# Testing
npm test             # Run unit tests (Jest)
npm run test:unit    # Unit tests only
npm run test:e2e     # End-to-end tests (Playwright, port 3004)
npm run test:api     # API endpoint tests
npm run test:a11y    # Accessibility tests
npm run test:mobile  # Mobile responsive tests
npm run test:visual  # Visual regression tests
npm run test:visual:update  # Update visual snapshots
npm run test:all     # All unit + E2E tests
npm run test:coverage # Generate coverage report

# Single test execution
npx playwright test tests/auth.spec.js
npx jest tests/unit/auth.test.js

# Utility scripts
node scripts/create-admin.js        # Create admin user
node scripts/seed-mock-data.js      # Populate test data
node scripts/migrate-to-mongodb.js  # Migrate JSON to MongoDB
node scripts/reset-admin-password.js # Reset admin password
node scripts/assign-trucks-routes.js # Link trucks to routes/drivers
```

## Architecture

### Dual-Mode Data Storage

The app runs in two modes controlled by `USE_MOCK_AUTH` env var:
- **Mock mode** (`USE_MOCK_AUTH=true`): Uses JSON files in `data/` folder
- **MongoDB mode** (`USE_MOCK_AUTH=false`): Uses MongoDB Atlas

Each mode has parallel route files mounted conditionally in `server.js`:
- `routes/auth.js` vs `routes/auth-mock.js`
- `routes/users-mongo.js` vs `routes/users.js`
- `routes/tracking-mongo.js` vs `routes/tracking.js`

**Vercel deployment**: In mock mode on Vercel (read-only filesystem), `data/storage.js` automatically switches to in-memory storage.

### Key Directories

- `lib/` - Core services:
  - `routeOptimizer.js` - Nearest neighbor + 2-opt optimization with OSRM
  - `osrmService.js` - Real road distance API wrapper with 5-min cache
  - `speedProfiles.js` - Traffic-aware speed estimation by time of day
- `models/` - MongoDB Mongoose schemas (16 models)
- `routes/` - Express API endpoints (24 files with `-mongo` variants)
- `middleware/auth.js` - JWT validation and role-based authorization
- `data/storage.js` - JSON/in-memory storage layer for mock mode
- `public/` - Frontend (vanilla HTML/CSS/JS with Leaflet.js)
  - `app.js` - Main frontend application (monolithic, handles all dashboard logic)
  - `sw.js` - Service Worker for offline caching
  - `js/offline-db.js` - IndexedDB abstraction for offline data
  - `js/sync-manager.js` - Queued action sync on reconnect
- `scripts/` - Admin utilities and data migration
- `tests/` - Jest unit tests (`tests/unit/`) and Playwright E2E tests

### Authentication Flow

1. Login via `/api/auth/login` with `{username, password, role}`
2. Backend returns JWT token (24hr expiry)
3. Frontend stores token in localStorage
4. Requests include `Authorization: Bearer <token>` header
5. `middleware/auth.js` validates token and populates `req.user`
6. Role-based access: `authorizeRole('admin')` or `authorizeRole('driver')`

### GPS Tracking System

- Drivers send location to `POST /api/tracking/update` with `{lat, lng, speed, heading, routeId}`
- Batch sync for offline points: `POST /api/tracking/batch-update`
- Live locations stored in `liveLocationsStorage` (per-driver)
- Trip metrics accumulated in `tripDataStorage` (distance, fuel, stops)
- Admin dashboard polls for live truck positions on Leaflet map

### Offline Capabilities (PWA)

- Service Worker caches static assets and CDN libraries
- IndexedDB stores: routes, trucks, gps_queue, completions_queue
- SyncManager replays queued actions when back online
- Manifest enables "Add to Home Screen"

### Route Optimization

`lib/routeOptimizer.js` provides:
- OSRM integration for real road distances
- Nearest neighbor + 2-opt algorithms
- Vehicle capacity constraints
- Traffic-aware speed estimation
- 5-minute result caching

API: `POST /api/routes/optimize`

### Fuel Consumption Calculation

Located in `routes/completions.js` - estimates fuel based on:
- Distance traveled
- Average speed (lower = higher consumption)
- Number of stops (each adds 0.05L overhead)
- Load factor (assumed 1.15 for moderate load)

## Environment Variables

```
PORT=3000                    # Server port
USE_MOCK_AUTH=true          # true=JSON storage, false=MongoDB
JWT_SECRET=<secret>         # JWT signing key (generate with crypto.randomBytes)
MONGODB_URI=<connection>    # MongoDB Atlas connection string
NODE_ENV=development        # development or production
ALLOWED_ORIGINS=...         # CORS whitelist (comma-separated)
```

## API Endpoints

Main endpoints (all prefixed with `/api`):
- `/auth` - Login, face login, password reset
- `/users` - User CRUD (admin only)
- `/trucks` - Vehicle management (admin only)
- `/routes` - Route CRUD and optimization
- `/bins` - Waste bin management with geospatial queries
- `/tracking` - GPS location updates and batch sync
- `/tracking/batch-update` - Sync offline GPS points
- `/completions` - Route completion with photo proof
- `/driver/stops/complete` - Mark individual stops done
- `/driver/stops/skip` - Skip stops with reason/photo
- `/schedules` - Route scheduling
- `/complaints` - Public complaint handling
- `/fuel` - Fuel consumption logging
- `/reports` - Analytics and statistics
- `/resident` - Resident portal endpoints

## Testing

- **Jest** for unit tests in `tests/unit/*.test.js`
- **Playwright** for E2E tests in `tests/*.spec.js`
- E2E tests auto-start server with `USE_MOCK_AUTH=true` on port 3004

Test credentials (after seeding with `seed-mock-data.js`):
- Check `data/users.json` for available test accounts
- Driver login requires: `{username, password, role: "driver"}`

## Security

- Helmet CSP configured for CDN resources (Leaflet, Tailwind, fonts)
- Rate limiting: 500 req/15min general, 10/15min for auth endpoints
- JWT tokens with 24hr expiry
- bcryptjs password hashing (10 rounds)
- Service Worker headers: `Cache-Control: no-cache, no-store`
