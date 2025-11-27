# Driver Dashboard Guide

## Paano Gamitin ang Driver Dashboard

### 1. Login as Driver
```
Username: driver1
Password: driver123
```

### 2. Makikita mo sa Dashboard:

#### 🚛 My Truck Section
- Truck ID
- Plate Number at Model
- Fuel Level
- Status

#### 📍 My Routes Section
- Route Name
- Route ID
- Number of locations
- Total distance
- Status (Planned, Active, Completed)
- Action buttons:
  - **👁️ View on Map** - Tingnan ang route sa map
  - **📝 Update Status** - I-update ang status ng route

### 3. Sample Routes for driver1

May 2 routes na naka-assign sa driver1:

1. **ROUTE-001: Downtown Collection Route**
   - Status: Planned
   - 3 locations
   - 2.50 km

2. **ROUTE-002: Coastal Area Collection**
   - Status: Active
   - 4 locations
   - 3.20 km

### 4. Update Route Status

Kapag nag-click ka ng "📝 Update Status":
1. Lalabas ang modal
2. Piliin ang new status:
   - **Active** - Ongoing collection
   - **Completed** - Tapos na
3. Pwede mag-add ng notes
4. Click "Update Status"

### 5. View Route on Map

Kapag nag-click ka ng "👁️ View on Map":
- Makikita mo ang route sa map
- May line na nag-connect sa lahat ng locations
- May markers sa bawat location

---

## Admin: Paano Mag-Assign ng Route sa Driver

### 1. Login as Admin
```
Username: admin
Password: admin123
```

### 2. Go to Routes Management
- Click "Routes" sa navigation

### 3. Assign Route to Driver
1. Click "👤 Assign" button sa route
2. Select driver from dropdown
3. Choose status (Active, Planned, Completed)
4. Click "Assign Route"

### 4. Create New Route
1. Click "➕ Add New Route"
2. Fill in:
   - Route ID (e.g., ROUTE-003)
   - Route Name
3. Click "🗺️ Add Location (Open Map)"
4. Click on map to add locations (minimum 2)
5. Add notes (optional)
6. Click "Save Route"

### 5. After Creating Route
- Assign the route to a driver
- Driver will see it in their dashboard

---

## Features

### ✅ Real-time Updates
- Driver dashboard auto-refreshes every 30 seconds
- Makikita agad ang bagong assignments

### ✅ Persistent Data
- Lahat ng assignments ay naka-save sa `data/routes.json`
- Hindi mawawala kahit i-restart ang server

### ✅ Status Tracking
- **Planned** - Hindi pa nagsisimula
- **Active** - Ongoing collection
- **Completed** - Tapos na

### ✅ Map Integration
- View routes on interactive map
- See all locations and route path
- Zoom and pan to explore

---

## Troubleshooting

### Problem: "No assignments yet"
**Solution:**
1. Login as admin
2. Go to Routes Management
3. Assign a route to the driver

### Problem: "Error loading assignments"
**Solution:**
1. Check if server is running
2. Check browser console for errors
3. Make sure you're logged in
4. Try refreshing the page

### Problem: Routes not showing on map
**Solution:**
1. Make sure route has coordinates
2. Check if route has at least 2 locations
3. Try clicking "View on Map" again

---

## Testing Checklist

### As Admin:
- [ ] Create new route
- [ ] Assign route to driver
- [ ] View route on map
- [ ] Update route status
- [ ] Delete route

### As Driver:
- [ ] View assigned trucks
- [ ] View assigned routes
- [ ] View route on map
- [ ] Update route status
- [ ] See route details (distance, locations)

---

## Sample Data

### Current Routes in System:

**ROUTE-001: Downtown Collection Route**
- Assigned to: driver1
- Status: Planned
- Locations: 3
- Distance: 2.50 km

**ROUTE-002: Coastal Area Collection**
- Assigned to: driver1
- Status: Active
- Locations: 4
- Distance: 3.20 km

### Current Trucks:

**TRUCK-001: ABC-1234**
- Model: Isuzu Elf
- Status: Available
- Fuel: 85%

**TRUCK-002: XYZ-5678**
- Model: Mitsubishi Canter
- Assigned to: driver1
- Status: In-use
- Fuel: 60%

---

## Next Steps

1. **Test the driver dashboard** - Login as driver1 and check assignments
2. **Test route assignment** - Login as admin and assign routes
3. **Test status updates** - Update route status from driver dashboard
4. **Add more routes** - Create additional routes for testing
5. **Add more drivers** - Create more driver accounts and assign routes

---

## Support

Para sa questions or issues:
- Check ang main README.md
- Check ang PERSISTENT_STORAGE.md
- Contact development team
