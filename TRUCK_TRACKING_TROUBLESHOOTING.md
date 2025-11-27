# 🔧 Truck Tracking Troubleshooting Guide

## Issue: Truck Not Moving on Map

### ✅ Fixes Applied

#### 1. **Added Console Logging**
- GPS position received
- Distance moved calculations
- Road path updates
- Movement decisions

#### 2. **Improved Position Handling**
- Set `lastPosition` after first bin positioning
- Handle case when no `lastPosition` exists
- Better fallback for direct movement

#### 3. **Enhanced GPS Tracking**
- Better error handling
- Fallback status message
- Continuous logging

#### 4. **Fixed Update Logic**
- Truck updates even from first bin
- Handles small movements correctly
- Better road snapping integration

---

## 🔍 How to Debug

### Step 1: Open Browser Console
```
Press F12 → Go to Console tab
```

### Step 2: Login as Driver
```
Username: driver1
Password: driver123
```

### Step 3: Check Console Logs
Look for these messages:
```
✅ "Positioning truck at first bin: [lat, lng]"
✅ "Truck positioned at first bin of route: Route Name"
✅ "GPS tracking started successfully"
✅ "GPS position received: lat, lng"
✅ "Distance moved: X meters"
✅ "Moving truck from [lat1, lng1] to [lat2, lng2]"
```

### Step 4: Check for Errors
Look for red error messages:
```
❌ "Error getting location: ..."
❌ "Error updating location: ..."
❌ "OSRM routing failed: ..."
```

---

## 🎯 Expected Behavior

### On Login:
1. ✅ Truck appears at first bin
2. ✅ Route drawn in blue
3. ✅ Bins marked on map
4. ✅ Console: "Truck positioned at first bin..."
5. ✅ Console: "GPS tracking started successfully"

### After 5-10 Seconds:
1. ✅ Console: "GPS position received: ..."
2. ✅ Truck moves to real GPS location (if different)
3. ✅ Green path starts drawing

### Every 30 Seconds:
1. ✅ Console: "GPS update: ..."
2. ✅ Console: "Distance moved: X meters"
3. ✅ If moved > 10m: Truck animates to new position
4. ✅ If moved < 10m: "Movement too small, ignoring"

---

## 🚨 Common Issues & Solutions

### Issue 1: Truck Appears but Doesn't Move

**Symptoms:**
- Truck visible at first bin
- No movement after waiting
- No GPS updates in console

**Possible Causes:**
- GPS permission denied
- Location services disabled
- Not actually moving

**Solutions:**
1. **Check GPS Permission:**
   ```
   Browser → Settings → Site Settings → Location
   → Allow for localhost
   ```

2. **Enable Location Services:**
   - Windows: Settings → Privacy → Location → On
   - Mobile: Settings → Location → On

3. **Actually Move:**
   - Walk/drive at least 10 meters
   - Wait 30 seconds for update
   - Check console for "Distance moved"

### Issue 2: No Truck Appears at All

**Symptoms:**
- Map loads but no truck
- No console logs about truck
- No errors

**Possible Causes:**
- Not logged in as driver
- No routes assigned
- Route has no coordinates

**Solutions:**
1. **Verify Role:**
   ```javascript
   // In console:
   console.log('User role:', user.role);
   // Should show: "driver"
   ```

2. **Check Routes:**
   ```javascript
   // In console:
   fetch('http://localhost:3000/api/routes', {
     headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
   })
   .then(r => r.json())
   .then(d => console.log('Routes:', d));
   ```

3. **Assign Route:**
   - Login as admin
   - Assign route to driver
   - Logout and login as driver again

### Issue 3: Truck Jumps Around

**Symptoms:**
- Truck teleports
- No smooth animation
- Erratic movement

**Possible Causes:**
- GPS signal weak
- OSRM API failing
- Movement threshold too low

**Solutions:**
1. **Improve GPS Signal:**
   - Move to open area
   - Away from buildings
   - Check device GPS accuracy

2. **Check OSRM:**
   ```javascript
   // In console, look for:
   "OSRM routing failed, using direct path"
   // If you see this, OSRM API might be down
   ```

3. **Increase Threshold:**
   ```javascript
   // In app.js, change:
   if (distance > 10) { // 10 meters
   // To:
   if (distance > 20) { // 20 meters
   ```

### Issue 4: Path Not Drawing

**Symptoms:**
- Truck moves
- No green line behind it
- Console shows updates

**Possible Causes:**
- Path layer not created
- Path coordinates not updating
- Map layer issue

**Solutions:**
1. **Check Console:**
   ```
   Look for: "Truck marker created at: ..."
   Should also see path creation
   ```

2. **Restart Tracking:**
   - Click "Stop" on GPS status
   - Refresh page
   - Login again

3. **Clear Cache:**
   - Ctrl+Shift+R (hard refresh)
   - Clear browser cache
   - Reload page

---

## 📊 Debug Checklist

Before reporting issue, verify:

- [ ] Logged in as driver (not admin)
- [ ] Route assigned to driver
- [ ] Route has coordinates
- [ ] GPS permission granted
- [ ] Location services enabled
- [ ] Browser console open
- [ ] No red errors in console
- [ ] Actually moved > 10 meters
- [ ] Waited at least 30 seconds
- [ ] Internet connection working
- [ ] OSRM API accessible

---

## 🧪 Test Scenarios

### Test 1: Desktop (Simulated GPS)
```
1. Login as driver
2. Open DevTools (F12)
3. Go to: ... → More tools → Sensors
4. Override location
5. Change coordinates
6. Watch truck move
```

### Test 2: Mobile (Real GPS)
```
1. Login as driver on phone
2. Walk outside
3. Move at least 50 meters
4. Wait 30 seconds
5. Check if truck follows
```

### Test 3: Route Following
```
1. Login as driver
2. Start at first bin location
3. Walk to second bin
4. Watch truck follow roads
5. Verify path is green
```

---

## 💻 Console Commands

### Check Current State:
```javascript
// Check if tracking enabled
console.log('Tracking enabled:', trackingEnabled);

// Check truck marker
console.log('Truck marker:', truckMarker);

// Check last position
console.log('Last position:', lastPosition);

// Check path coordinates
console.log('Path coords:', truckPathCoords.length);
```

### Force Update:
```javascript
// Manually trigger GPS update
navigator.geolocation.getCurrentPosition(
  pos => console.log('Position:', pos.coords),
  err => console.error('Error:', err)
);
```

### Reset Tracking:
```javascript
// Stop and restart
stopGPSTracking();
setTimeout(() => startGPSTracking(), 1000);
```

---

## 📝 What Was Fixed

### Before (Broken):
- ❌ Truck appeared at first bin but didn't move
- ❌ No GPS updates after initial positioning
- ❌ lastPosition not set correctly
- ❌ No logging for debugging

### After (Fixed):
- ✅ Truck appears at first bin
- ✅ GPS tracking starts immediately
- ✅ lastPosition set after first bin
- ✅ Truck moves with GPS updates
- ✅ Comprehensive console logging
- ✅ Better error handling
- ✅ Fallback for no lastPosition

---

## 🎉 Expected Result

### Complete Flow:
```
1. Driver logs in
   → Truck appears at first bin
   → Route drawn in blue
   → Bins marked

2. GPS starts (5-10 seconds)
   → Console: "GPS position received"
   → Truck moves to real location
   → Green path starts

3. Driver moves (every 30 seconds)
   → Console: "GPS update"
   → Console: "Distance moved: X meters"
   → Truck animates along roads
   → Path extends

4. Driver completes route
   → Full path visible
   → All movements tracked
   → Accurate distance
```

---

## 🔗 Related Guides

- `TRUCK_TRACKING_MAP_GUIDE.md` - Main truck tracking guide
- `ROAD_SNAPPING_GUIDE.md` - Road following feature
- `TRUCK_ROUTE_POSITIONING_GUIDE.md` - First bin positioning
- `GPS_TRACKING_GUIDE.md` - GPS tracking system

---

**Last Updated:** November 23, 2025
**Status:** ✅ Fixed
**Issue:** Truck not moving after first bin positioning
**Solution:** Added logging, fixed lastPosition, improved update logic
