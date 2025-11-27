# 🔧 Troubleshooting: Walang Truck sa Map

## ❓ POSSIBLE REASONS & SOLUTIONS

---

## REASON 1: Hindi Pa Nag-Click ng "Live Truck Tracking"

### **Problem:**
Admin naka-login pero hindi pa nag-click ng button

### **Solution:**
```
1. Login as admin
2. Look for button: "📍 Live Truck Tracking"
3. CLICK the button
4. Trucks should appear!

LOCATION: Sa sidebar, under "Controls" panel
```

---

## REASON 2: Walang Assigned Truck/Route

### **Problem:**
Driver walang assigned truck o route

### **Check:**
```
1. Admin dashboard
2. Click "Truck Management"
3. Check if trucks are assigned to drivers
4. Click "Routes Management"
5. Check if routes are assigned to drivers

REQUIRED:
✅ Driver must have assigned truck
✅ Driver must have assigned route
✅ Both needed for truck to appear!
```

### **Fix:**
```
1. Go to "Truck Management"
2. Click "Assign Driver" on a truck
3. Select driver (e.g., driver1)
4. Save

5. Go to "Routes Management"
6. Click "Assign Driver" on a route
7. Select same driver
8. Save

NOW: Truck should appear on map!
```

---

## REASON 3: Server Not Running

### **Problem:**
Server is not started

### **Check:**
```
Look at PowerShell/CMD window
Should see:
"Kolek-Ta server running on port 3001"

If NOT running:
```

### **Fix:**
```powershell
# Navigate to project folder
cd C:\path\to\project

# Start server
node server.js

# Should see:
# "Kolek-Ta server running on port 3001"
```

---

## REASON 4: Wrong URL

### **Problem:**
Admin using wrong URL

### **Check:**
```
Current URL should be:
✅ http://localhost:3001/dashboard
OR
✅ http://localhost:3001

NOT:
❌ http://localhost:3001/mobile (driver URL)
❌ http://192.168.254.166:3001 (network URL)
```

---

## REASON 5: Browser Console Errors

### **Problem:**
JavaScript errors preventing trucks from loading

### **Check:**
```
1. Press F12 (open developer tools)
2. Click "Console" tab
3. Look for RED errors

Common errors:
❌ "Failed to fetch"
❌ "Network error"
❌ "Unauthorized"
```

### **Fix Based on Error:**

**If "Failed to fetch":**
- Server not running → Start server

**If "Unauthorized":**
- Login again
- Token expired

**If "Network error":**
- Check internet connection
- Check server is running

---

## REASON 6: Data Issues

### **Problem:**
No trucks or routes in database

### **Check Data Files:**
```powershell
# Check if files exist
dir data\

# Should see:
# - users.json
# - trucks.json (or storage.json)
# - routes.json
```

### **Verify Data:**
```
Open data/users.json
Check if drivers exist:
- driver1
- driver2
- driver3

Open data/routes.json (or check storage)
Check if routes exist

Open trucks data
Check if trucks exist
```

---

## REASON 7: Map Not Initialized

### **Problem:**
Map didn't load properly

### **Check:**
```
1. Look at map area
2. Should see Leaflet map with tiles
3. If blank/gray → Map not loaded

Common causes:
- Internet connection (map tiles need internet)
- Leaflet library not loaded
- JavaScript error
```

### **Fix:**
```
1. Refresh page (Ctrl + F5)
2. Check internet connection
3. Check browser console for errors
```

---

## 🔍 STEP-BY-STEP DEBUGGING

### **Step 1: Verify Server**
```powershell
# Check if server is running
# Look for this in console:
"Kolek-Ta server running on port 3001"

If NOT running:
node server.js
```

### **Step 2: Verify Login**
```
1. Go to: http://localhost:3001
2. Login as admin
   Username: admin
   Password: admin123
3. Should see dashboard
```

### **Step 3: Check Assignments**
```
1. Click "Truck Management"
2. Verify trucks exist
3. Verify drivers are assigned

4. Click "Routes Management"
5. Verify routes exist
6. Verify drivers are assigned
```

### **Step 4: Click Live Tracking**
```
1. Look for "📍 Live Truck Tracking" button
2. Click it
3. Wait 2-3 seconds
4. Trucks should appear!
```

### **Step 5: Check Browser Console**
```
1. Press F12
2. Click "Console" tab
3. Look for errors (red text)
4. Look for success messages:
   "Fetching all trucks..."
   "Received X trucks"
```

### **Step 6: Check Network Tab**
```
1. Press F12
2. Click "Network" tab
3. Click "Live Truck Tracking" button
4. Look for request: /api/tracking/all-trucks
5. Check response:
   - Status should be 200
   - Response should have truck data
```

---

## 🧪 QUICK TEST

### **Test if System is Working:**

```javascript
// Open browser console (F12)
// Paste this code:

fetch('/api/tracking/all-trucks', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(data => {
  console.log('Trucks:', data);
  if (data.length === 0) {
    console.log('❌ No trucks assigned!');
  } else {
    console.log('✅ Found', data.length, 'trucks');
  }
});
```

**Expected Output:**
```
✅ Found 3 trucks
Trucks: [{username: "driver1", ...}, ...]
```

**If "No trucks assigned":**
- Need to assign trucks and routes to drivers!

---

## 📋 CHECKLIST

### **Before Trucks Can Appear:**

- [ ] Server is running (port 3001)
- [ ] Admin is logged in
- [ ] Trucks exist in system
- [ ] Routes exist in system
- [ ] Drivers are assigned to trucks
- [ ] Drivers are assigned to routes
- [ ] "Live Truck Tracking" button clicked
- [ ] No JavaScript errors in console
- [ ] Map is loaded (can see tiles)
- [ ] Internet connection working

---

## 🎯 MOST COMMON ISSUE

### **#1 Problem: Not Assigned!**

**90% of the time, trucks don't appear because:**
- Driver has NO assigned truck
- Driver has NO assigned route
- Need BOTH for truck to show!

**Quick Fix:**
```
1. Admin → Truck Management
2. Assign truck to driver1
3. Admin → Routes Management
4. Assign route to driver1
5. Click "Live Truck Tracking"
6. Truck appears! ✅
```

---

## 🔧 MANUAL FIX

### **If Still No Trucks:**

**Check data/storage.js or data files:**

```javascript
// Verify trucks exist
const trucks = [
  {
    truckId: 'TRUCK-001',
    plateNumber: 'ABC-1234',
    model: 'Isuzu Elf',
    driverId: 'driver1'  // ← Must be assigned!
  }
];

// Verify routes exist
const routes = [
  {
    routeId: 'route1',
    name: 'Downtown Route',
    driverId: 'driver1'  // ← Must be assigned!
  }
];
```

**Both driverId must match!**

---

## 📞 STILL NOT WORKING?

### **Get Detailed Debug Info:**

```javascript
// Run this in browser console:

console.log('=== DEBUG INFO ===');
console.log('Token:', localStorage.getItem('token'));
console.log('User:', localStorage.getItem('user'));

fetch('/api/tracking/all-trucks', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => {
  console.log('Status:', r.status);
  return r.json();
})
.then(data => {
  console.log('Response:', data);
  console.log('Truck count:', data.length);
  data.forEach(truck => {
    console.log('Truck:', truck.truckId, 'Driver:', truck.username);
  });
})
.catch(err => {
  console.error('Error:', err);
});
```

**Send me the console output and I can help debug!**

---

## ✅ SOLUTION SUMMARY

**Most likely you need to:**

1. **Assign trucks to drivers**
2. **Assign routes to drivers**
3. **Click "Live Truck Tracking" button**

**That's it! Trucks should appear!** 🚛

---

**Try these steps and let me know what you see!** 🔧
