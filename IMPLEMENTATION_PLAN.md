# Kolek-Ta Implementation Plan
## Additional Features for Waste Collection Management System

**Target:** Mati City, ~10 drivers/trucks
**Priority Areas:** Route Optimization > Maintenance & Alerts > Analytics
**Platform:** Web-based, MongoDB

---

## Phase 1: Essential Features (Core Capstone Requirements)

### 1.1 Analytics Dashboard
**Purpose:** Visual overview of system performance for admins

**Features:**
- [ ] **Dashboard Home Page** with summary cards:
  - Total routes completed (today/week/month)
  - Active drivers count
  - Fleet status overview (available/in-use/maintenance)
  - Total distance covered
  - Fuel consumption summary

- [ ] **Charts & Graphs:**
  - Routes completed per day (bar chart - last 7 days)
  - Fuel consumption trend (line chart - last 30 days)
  - Driver performance comparison (horizontal bar)
  - Fleet utilization pie chart

- [ ] **Quick Stats Cards:**
  - Average route completion time
  - Most active driver
  - Truck with highest mileage
  - Low fuel alerts count

**Technical Implementation:**
```
Backend:
- GET /api/analytics/dashboard - Aggregated dashboard data
- GET /api/analytics/routes - Route statistics
- GET /api/analytics/fuel - Fuel analytics
- GET /api/analytics/drivers - Driver performance

Frontend:
- New "Dashboard" page as landing for admin
- Chart.js or ApexCharts for visualizations
- Real-time refresh every 60 seconds
```

**Files to Create/Modify:**
- `routes/analytics.js` (new)
- `public/app.js` - Add dashboard rendering
- `public/index.html` - Add dashboard section

---

### 1.2 Maintenance & Alert System
**Purpose:** Proactive fleet maintenance and issue notifications

**Features:**
- [ ] **Maintenance Scheduling:**
  - Set maintenance due dates per truck
  - Track maintenance history
  - Maintenance types: oil change, tire rotation, brake check, general service

- [ ] **Alert System:**
  - Low fuel alert (< 20%)
  - Maintenance overdue alert
  - Truck idle too long alert (no activity > 7 days)
  - Driver not tracking alert (assigned but GPS off)

- [ ] **Alert Dashboard:**
  - List of all active alerts
  - Alert severity levels (critical, warning, info)
  - Dismiss/acknowledge alerts
  - Alert history log

- [ ] **Notification Bell Enhancement:**
  - Show maintenance alerts in header
  - Badge count for unread alerts
  - Click to view alert details

**Technical Implementation:**
```
Backend:
- GET /api/alerts - Get all active alerts
- POST /api/alerts/:id/acknowledge - Acknowledge alert
- GET /api/maintenance/schedule - Get maintenance schedule
- POST /api/maintenance/log - Log maintenance performed
- GET /api/maintenance/history/:truckId - Maintenance history

New Model - MaintenanceLog:
- truckId, type, date, performedBy, cost, notes, nextDueDate

Alert Generation (cron job or on-demand):
- Check fuel levels on each truck
- Check maintenance due dates
- Check last activity timestamps
```

**Files to Create/Modify:**
- `models/MaintenanceLog.js` (new)
- `models/Alert.js` (new)
- `routes/alerts.js` (new)
- `routes/maintenance.js` (new)
- `public/app.js` - Alert UI components

---

### 1.3 Basic Route Optimization
**Purpose:** Suggest optimal route order based on bin locations

**Features:**
- [ ] **Route Optimizer:**
  - Input: List of bin locations for a route
  - Output: Optimized order (nearest neighbor algorithm)
  - Display estimated distance saved
  - One-click apply optimized order

- [ ] **Route Suggestions:**
  - Auto-suggest route based on bin proximity
  - Show route on map with numbered sequence
  - Display total estimated distance and time

- [ ] **Route Comparison:**
  - Compare original vs optimized route
  - Show distance/time difference

**Technical Implementation:**
```
Algorithm: Nearest Neighbor (simple but effective)
1. Start from depot/starting point
2. Find nearest unvisited bin
3. Move to that bin, mark as visited
4. Repeat until all bins visited
5. Return to depot

Backend:
- POST /api/routes/optimize - Optimize bin order
- GET /api/routes/:id/suggestions - Get route suggestions

Frontend:
- "Optimize Route" button in route management
- Visual comparison on map
- Apply optimization with one click
```

**Files to Create/Modify:**
- `routes/routes.js` - Add optimization endpoint
- `lib/routeOptimizer.js` (new) - Optimization algorithm
- `public/app.js` - Optimization UI

---

### 1.4 Offline Mode for Drivers
**Purpose:** Allow drivers to work in low-connectivity areas

**Features:**
- [ ] **Offline Data Storage:**
  - Cache assigned routes locally (IndexedDB/localStorage)
  - Store route details, bin locations, instructions
  - Queue GPS updates when offline

- [ ] **Offline Indicators:**
  - Show online/offline status in header
  - Visual indicator when data is cached
  - "Last synced" timestamp

- [ ] **Auto-Sync:**
  - Detect when back online
  - Sync queued GPS updates
  - Sync completion data
  - Show sync progress

- [ ] **Offline Capabilities:**
  - View assigned routes
  - View route details and map (cached tiles)
  - Mark route as complete (queued)
  - Take completion photos (stored locally)

**Technical Implementation:**
```
Frontend (Service Worker + IndexedDB):
- Register service worker for offline support
- Cache critical assets (HTML, CSS, JS)
- Store route data in IndexedDB
- Queue API requests when offline
- Background sync when online

Data to Cache:
- User session info
- Assigned routes with full details
- Bin locations for routes
- Map tiles for route areas (limited)

Sync Strategy:
- On app load: Check for pending sync
- On network change: Trigger sync
- Manual sync button available
```

**Files to Create/Modify:**
- `public/sw.js` (new) - Service Worker
- `public/offline.js` (new) - Offline data management
- `public/app.js` - Offline status handling
- `public/manifest.json` (new) - PWA manifest

---

## Phase 2: Enhanced Features (If Time Permits)

### 2.1 Advanced Analytics & Reports

**Features:**
- [ ] **Printable Reports:**
  - Daily collection summary report
  - Weekly driver performance report
  - Monthly fuel consumption report
  - Export to PDF

- [ ] **Date Range Filtering:**
  - Select custom date ranges for all reports
  - Compare periods (this week vs last week)

- [ ] **Driver Leaderboard:**
  - Rank drivers by routes completed
  - Show efficiency metrics
  - Monthly/weekly rankings

**Files to Create/Modify:**
- `routes/reports.js` (new)
- `public/app.js` - Report generation UI
- Use jsPDF for PDF generation

---

### 2.2 Enhanced Route Features

**Features:**
- [ ] **Route Templates:**
  - Save frequently used routes as templates
  - Quick-create routes from templates
  - Clone existing routes

- [ ] **Scheduled Routes:**
  - Assign routes to specific days (Mon/Wed/Fri)
  - Recurring route patterns
  - Calendar view of scheduled routes

- [ ] **Route Notes & Instructions:**
  - Add special instructions per bin
  - Gate codes, access notes
  - Driver can mark issues

**Files to Create/Modify:**
- `models/RouteTemplate.js` (new)
- `routes/templates.js` (new)
- `public/app.js` - Template management UI

---

### 2.3 Driver Performance Tracking

**Features:**
- [ ] **Performance Metrics:**
  - Average route completion time
  - On-time completion rate
  - Distance efficiency (actual vs planned)
  - Fuel efficiency per driver

- [ ] **Driver Profile Enhancement:**
  - Performance history chart
  - Total routes completed
  - Total distance driven
  - Badges/achievements

**Files to Create/Modify:**
- `routes/performance.js` (new)
- `public/app.js` - Driver stats UI

---

### 2.4 Maintenance Enhancements

**Features:**
- [ ] **Maintenance Calendar:**
  - Visual calendar of upcoming maintenance
  - Drag-and-drop rescheduling
  - Color-coded by type

- [ ] **Cost Tracking:**
  - Track maintenance costs per truck
  - Total fleet maintenance cost
  - Cost per kilometer metric

- [ ] **Parts Inventory (Basic):**
  - Track common parts used
  - Low stock alerts

---

## Phase 3: Nice-to-Have (Future Improvements)

### 3.1 Advanced Route Optimization
- [ ] Google Maps Directions API integration
- [ ] Traffic-aware routing
- [ ] Time window constraints (collect bin X before 10 AM)
- [ ] Multi-vehicle route optimization

### 3.2 Citizen Portal (Separate App)
- [ ] Public-facing website for residents
- [ ] View collection schedule by area
- [ ] Report missed collections
- [ ] Request special pickups

### 3.3 Bin Management
- [ ] QR codes on bins for scanning
- [ ] Bin condition tracking
- [ ] Fill level estimation (based on collection patterns)
- [ ] Smart bin integration (IoT sensors)

### 3.4 Communication System
- [ ] In-app messaging (admin to drivers)
- [ ] Broadcast announcements
- [ ] Emergency alerts

### 3.5 Mobile App (Native)
- [ ] React Native or Flutter app
- [ ] Better offline support
- [ ] Push notifications
- [ ] Camera integration for photos

### 3.6 Integration APIs
- [ ] Export data to city systems
- [ ] Weather API (adjust routes for rain)
- [ ] Fuel price API for cost estimation

---

## Implementation Order (Recommended)

### Week 1-2: Analytics Dashboard
1. Create analytics API endpoints
2. Build dashboard UI with charts
3. Add real-time stats cards
4. Test and refine

### Week 3-4: Maintenance & Alerts
1. Create maintenance models
2. Build alert generation system
3. Create alert dashboard UI
4. Integrate with notification bell

### Week 5-6: Route Optimization
1. Implement nearest neighbor algorithm
2. Create optimization API
3. Build comparison UI
4. Test with real route data

### Week 7-8: Offline Mode
1. Set up Service Worker
2. Implement IndexedDB caching
3. Build sync queue system
4. Test offline scenarios

### Week 9+: Phase 2 Features
- Based on remaining time
- Prioritize based on feedback

---

## Technical Notes

### Database Indexes to Add
```javascript
// For analytics performance
db.routes.createIndex({ "completedAt": 1 })
db.routes.createIndex({ "assignedDriver": 1, "status": 1 })
db.fuelLogs.createIndex({ "truckId": 1, "createdAt": -1 })

// For alerts
db.trucks.createIndex({ "fuelLevel": 1 })
db.trucks.createIndex({ "nextMaintenance": 1 })
```

### Environment Variables to Add
```
# Optional for enhanced features
GOOGLE_MAPS_API_KEY=xxx  # For advanced routing
WEATHER_API_KEY=xxx      # For weather integration
```

### NPM Packages to Install
```bash
# For analytics charts
npm install chart.js

# For PDF reports
npm install jspdf jspdf-autotable

# For date handling
npm install date-fns

# For offline support (already using localStorage, add if needed)
npm install idb  # IndexedDB wrapper
```

---

## Success Metrics

### Phase 1 Complete When:
- [ ] Admin can view dashboard with key metrics
- [ ] Alerts appear for low fuel and overdue maintenance
- [ ] Routes can be optimized with one click
- [ ] Drivers can work offline and sync when online

### Phase 2 Complete When:
- [ ] PDF reports can be generated
- [ ] Routes can be scheduled recurring
- [ ] Driver performance is tracked and displayed

---

## File Structure After Implementation

```
kolekta/
├── models/
│   ├── ... (existing)
│   ├── MaintenanceLog.js   # NEW
│   └── Alert.js            # NEW
├── routes/
│   ├── ... (existing)
│   ├── analytics.js        # NEW
│   ├── alerts.js           # NEW
│   ├── maintenance.js      # NEW
│   └── reports.js          # NEW (Phase 2)
├── lib/
│   ├── mongodb.js
│   └── routeOptimizer.js   # NEW
├── public/
│   ├── ... (existing)
│   ├── sw.js               # NEW - Service Worker
│   ├── offline.js          # NEW - Offline handling
│   └── manifest.json       # NEW - PWA manifest
└── server.js
```

---

## Questions to Resolve Before Starting

1. **Starting Point for Routes:** Where do trucks start? A central depot? If yes, what's the location?

2. **Maintenance Types:** What specific maintenance types should be tracked?
   - Oil change
   - Tire rotation
   - Brake inspection
   - General service
   - Other?

3. **Alert Thresholds:**
   - Low fuel: 20%? 15%?
   - Maintenance overdue: How many days grace period?
   - Idle truck: 7 days? 14 days?

4. **Offline Duration:** How long might drivers be offline? (affects cache size)

---

*Plan created: December 2024*
*Version: 1.0*
