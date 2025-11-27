# GPS Live Tracking Guide

## Overview
Ang Kolek-Ta ay may **Live GPS Tracking** feature na nagpapakita ng real-time location ng mga trucks sa map!

---

## Features

### ✅ For Drivers:
1. **Auto-start Tracking** - Automatic na mag-start ang GPS pag login
2. **Real-time Updates** - Location update every 30 seconds
3. **Status Indicator** - Green badge sa bottom-right
4. **Start/Stop Control** - Manual control ng tracking
5. **Low Battery Friendly** - Optimized para sa battery life

### ✅ For Admin:
1. **Live Map View** - Makita lahat ng active trucks
2. **Truck Icons** - Animated truck markers sa map
3. **Driver Info** - Click marker to see details
4. **Auto-refresh** - Update every 15 seconds
5. **Speed Tracking** - Makita ang speed ng truck

---

## How It Works

### Driver Side:

#### Auto-start on Login
```
1. Driver logs in
2. After 2 seconds, GPS auto-starts
3. Green badge appears: "📍 GPS Tracking Active"
4. Location sent to server every 30 seconds
```

#### Manual Control
```
Bottom-right corner:
┌─────────────────────────────────┐
│ 📍 GPS Tracking Active          │
│ [Stop]                          │
└─────────────────────────────────┘

Click "Stop" to pause tracking
Click "Start" to resume
```

#### What's Tracked:
- Latitude & Longitude
- Speed (km/h)
- Heading/Direction
- Timestamp
- Current route (if active)

---

### Admin Side:

#### View Live Trucks
```
1. Login as admin
2. Click "📍 Live Truck Tracking" button
3. Map shows all active trucks
4. Truck icons update every 15 seconds
```

#### Truck Marker Info
```
Click any truck marker to see:
┌─────────────────────────────────┐
│ 🚛 driver1                      │
│ Speed: 45 km/h                  │
│ Route: ROUTE-001                │
│ Updated: 30 seconds ago         │
└─────────────────────────────────┘
```

---

## Visual Guide

### Driver Dashboard
```
┌─────────────────────────────────────┐
│ My Assignments                      │
│ [Routes and trucks here]            │
│                                     │
│                                     │
│                                     │
│                    [GPS Status] ←── │
│                    📍 Active        │
│                    [Stop]           │
└─────────────────────────────────────┘
```

### Admin Map View
```
┌─────────────────────────────────────┐
│ Controls                            │
│ [👥 Users] [🚛 Trucks] [📍 Routes] │
│ [📍 Live Truck Tracking] ← New!    │
└─────────────────────────────────────┘

Map:
┌─────────────────────────────────────┐
│                                     │
│     🚛 ← Truck 1 (Moving)          │
│                                     │
│              🚛 ← Truck 2 (Moving) │
│                                     │
│  🚛 ← Truck 3 (Stopped)            │
│                                     │
└─────────────────────────────────────┘
```

---

## API Endpoints

### Update Location (Driver)
```
POST /api/tracking/update
Headers: Authorization: Bearer <token>
Body: {
  "lat": 6.9549,
  "lng": 126.2185,
  "speed": 45,
  "heading": 90,
  "routeId": "ROUTE-001"
}

Response: {
  "message": "Location updated",
  "location": { ... }
}
```

### Get Active Locations (Admin)
```
GET /api/tracking/active
Headers: Authorization: Bearer <token>

Response: [
  {
    "username": "driver1",
    "lat": 6.9549,
    "lng": 126.2185,
    "speed": 45,
    "heading": 90,
    "routeId": "ROUTE-001",
    "timestamp": "2025-11-21T10:30:00Z",
    "lastUpdate": 1732197600000
  }
]
```

### Clear Location (Driver)
```
DELETE /api/tracking/clear
Headers: Authorization: Bearer <token>

Response: {
  "message": "Location cleared"
}
```

---

## GPS Permissions

### Browser Permission
First time, browser will ask:
```
┌─────────────────────────────────────┐
│ Kolek-Ta wants to:                  │
│ Know your location                  │
│                                     │
│ [Block] [Allow]                     │
└─────────────────────────────────────┘
```

**Important:** Click "Allow" para gumana ang tracking!

### If Blocked:
```
1. Click padlock icon sa address bar
2. Find "Location" permission
3. Change to "Allow"
4. Refresh page
```

---

## Troubleshooting

### Problem: "GPS Error - User denied Geolocation"
**Solution:**
1. Check browser permissions
2. Allow location access
3. Click "Retry" button

### Problem: "GPS Error - Position unavailable"
**Solution:**
1. Check if GPS is enabled on device
2. Go outside (better GPS signal)
3. Wait a few seconds
4. Try again

### Problem: "GPS Error - Timeout"
**Solution:**
1. Check internet connection
2. Refresh page
3. Try again

### Problem: Truck not showing on admin map
**Solution:**
1. Check if driver has GPS enabled
2. Wait 30 seconds for first update
3. Click "📍 Live Truck Tracking" again
4. Check if driver is logged in

### Problem: Location not updating
**Solution:**
1. Check if tracking is active (green badge)
2. Check internet connection
3. Stop and start tracking again
4. Refresh page

---

## Technical Details

### Update Frequency:
- **Driver sends:** Every 30 seconds
- **Admin refreshes:** Every 15 seconds
- **Stale timeout:** 5 minutes

### Accuracy:
- **High accuracy mode:** Enabled
- **Typical accuracy:** 5-20 meters
- **Best accuracy:** GPS + WiFi + Cell towers

### Battery Impact:
- **Low:** Updates only every 30 seconds
- **Optimized:** Uses cached position when possible
- **Auto-stop:** Stops when page closes

### Data Storage:
- **In-memory:** Stored in server RAM
- **Not persistent:** Cleared on server restart
- **Production:** Use Redis for persistence

---

## Privacy & Security

### What's Tracked:
- ✅ Location (only when logged in)
- ✅ Speed and heading
- ✅ Timestamp

### What's NOT Tracked:
- ❌ Location when logged out
- ❌ Personal browsing
- ❌ Other apps

### Who Can See:
- **Driver:** Own location only
- **Admin:** All active drivers
- **Others:** Cannot see

### Data Retention:
- **Active:** While driver is logged in
- **Stale:** Removed after 5 minutes
- **Logout:** Immediately cleared

---

## Best Practices

### For Drivers:
1. ✅ Keep GPS enabled during work hours
2. ✅ Allow location permissions
3. ✅ Check green badge is showing
4. ✅ Stop tracking after work
5. ✅ Report GPS issues immediately

### For Admin:
1. ✅ Monitor truck locations regularly
2. ✅ Check for stale locations
3. ✅ Verify driver routes
4. ✅ Use for route optimization
5. ✅ Respect driver privacy

---

## Future Enhancements

### Planned Features:
1. **Route Playback** - View historical routes
2. **Geofencing** - Alerts when truck enters/exits area
3. **ETA Calculation** - Estimated arrival time
4. **Speed Alerts** - Notify if speeding
5. **Offline Support** - Queue updates when offline
6. **Battery Optimization** - Adaptive update frequency

---

## Testing Checklist

### As Driver:
- [ ] Login and see GPS auto-start
- [ ] Green badge appears
- [ ] Stop tracking manually
- [ ] Start tracking manually
- [ ] Check location updates on server
- [ ] Logout and verify tracking stops

### As Admin:
- [ ] Click "Live Truck Tracking"
- [ ] See active truck markers
- [ ] Click marker to see info
- [ ] Verify updates every 15 seconds
- [ ] Check speed and route info
- [ ] Verify stale locations removed

### Error Cases:
- [ ] Block location permission → See error
- [ ] Disable GPS → See error
- [ ] Slow internet → Updates delayed
- [ ] Driver logs out → Marker disappears

---

## Performance Metrics

### Network Usage:
- **Per update:** ~200 bytes
- **Per hour:** ~24 KB (driver)
- **Daily:** ~576 KB per driver

### Server Load:
- **Per driver:** Minimal
- **10 drivers:** ~2.4 KB/hour
- **100 drivers:** ~24 KB/hour

### Battery Impact:
- **GPS on:** ~5-10% per hour
- **Optimized:** ~3-5% per hour
- **Comparable to:** Google Maps navigation

---

## Support

Para sa questions:
- Check DRIVER_DASHBOARD_GUIDE.md
- Check SYSTEM_ENHANCEMENTS.md
- Contact development team

---

## Quick Reference

### Driver:
```
Auto-start: ✅ Yes (2 seconds after login)
Update frequency: Every 30 seconds
Manual control: Bottom-right badge
Stop on logout: ✅ Yes
```

### Admin:
```
View button: "📍 Live Truck Tracking"
Update frequency: Every 15 seconds
Marker icon: 🚛 (animated)
Info popup: Click marker
```

### Permissions:
```
Required: Location access
Browser: Chrome, Firefox, Safari, Edge
Mobile: Android, iOS
```
