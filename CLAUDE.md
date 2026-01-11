# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kolek-Ta is a waste collection management system with GPS tracking and route optimization. It's a full-stack Node.js/Express application with MongoDB storage (or JSON file fallback).

## Commands

```bash
# Development
npm run dev          # Start with auto-reload (nodemon)
npm start            # Start production server

# Testing
npm test             # Run unit tests (Jest)
npm run test:unit    # Unit tests only
npm run test:e2e     # End-to-end tests (Playwright)
npm run test:api     # API endpoint tests
npm run test:a11y    # Accessibility tests
npm run test:mobile  # Mobile responsive tests
npm run test:visual  # Visual regression tests
npm run test:all     # All unit + E2E tests
npm run test:coverage # Generate coverage report

# Utility scripts
node scripts/create-admin.js        # Create admin user
node scripts/seed-mock-data.js      # Populate test data
node scripts/migrate-to-mongodb.js  # Migrate JSON to MongoDB
```

## Architecture

### Dual-Mode Data Storage
The app runs in two modes controlled by `USE_MOCK_AUTH` env var:
- **Mock mode** (`USE_MOCK_AUTH=true`): Uses JSON files in `data/` folder (users.json, routes.json, etc.)
- **MongoDB mode** (`USE_MOCK_AUTH=false`): Uses MongoDB Atlas

Each mode has parallel route files:
- `routes/auth.js` vs `routes/auth-mock.js`
- `routes/users-mongo.js` vs `routes/users.js`
- `routes/tracking-mongo.js` vs `routes/tracking.js`

The mode is determined in `server.js` which conditionally mounts the appropriate route handlers.

### Key Directories
- `lib/` - Core services: route optimization (`routeOptimizer.js`), OSRM integration (`osrmService.js`), speed profiles
- `models/` - MongoDB schemas (User, Truck, Route, Bin, Collection, Schedule, Complaint, FuelLog, LiveLocation)
- `routes/` - Express API endpoints (21 files, with `-mongo` variants for MongoDB mode)
- `middleware/auth.js` - JWT token validation
- `data/storage.js` - JSON file-based storage layer for mock mode
- `public/` - Frontend (vanilla HTML/CSS/JS with Leaflet.js for maps)
- `scripts/` - Admin utilities and data migration

### Authentication Flow
1. Login via `/api/auth/login` returns JWT token
2. Frontend stores token in localStorage
3. Subsequent requests include `Authorization: Bearer <token>`
4. `middleware/auth.js` validates token and adds `req.user`
5. Roles: `admin` (full access) and `driver` (limited to assigned routes)

### Route Optimization System
`lib/routeOptimizer.js` provides:
- OSRM integration for real road distances (via `osrmService.js`)
- Nearest neighbor + 2-opt optimization algorithms
- Vehicle capacity constraints
- Traffic-aware speed estimation (see `speedProfiles.js`)
- 5-minute result caching

API: `POST /api/routes/optimize` with coordinates, depot, capacity settings.

### GPS Tracking
- Drivers send GPS coordinates to `/api/tracking`
- Stored in LiveLocation model (MongoDB) or JSON (mock mode)
- Admin dashboard polls for live truck positions
- Displayed on Leaflet map with OpenStreetMap tiles

## Environment Variables

```
PORT=3000                    # Server port
USE_MOCK_AUTH=true          # true=JSON storage, false=MongoDB
JWT_SECRET=<secret>         # JWT signing key
MONGODB_URI=<connection>    # MongoDB Atlas connection string
NODE_ENV=development        # development or production
```

## API Structure

Main endpoints:
- `/api/auth` - Login, register, password reset
- `/api/users` - User CRUD (admin only)
- `/api/trucks` - Vehicle management
- `/api/routes` - Route CRUD and optimization
- `/api/bins` - Waste bin management with geospatial queries
- `/api/tracking` - GPS location updates and queries
- `/api/schedules` - Route scheduling
- `/api/complaints` - Public complaint handling
- `/api/fuel` - Fuel consumption logging
- `/api/reports` - Analytics and statistics

## Testing

- **Jest** for unit tests (`tests/unit/`)
- **Playwright** for E2E, accessibility, mobile, visual regression tests
- Test files in `tests/*.spec.js`
- Coverage targets: `lib/`, `routes/`, `middleware/`
