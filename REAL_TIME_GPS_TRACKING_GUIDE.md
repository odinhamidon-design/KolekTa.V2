# 🛰️ Real-Time GPS Tracking - Complete Guide

## ✅ GOOD NEWS: Already Implemented!

Ang system mo ay **MAY GPS TRACKING NA**! Kapag gumagalaw ang driver sa tunay na truck, gumagalaw din ang truck sa map!

---

## 📱 Paano Gumana:

### 1. **Driver Opens Mobile App**
```
http://192.168.254.166:3001/mobile
```

### 2. **Driver Clicks "Start GPS Tracking"**
- Green button sa bottom ng screen
- Browser will ask: "Allow location access?"
- Driver clicks **"Allow"**

### 3. **GPS Starts Tracking**
- Phone's GPS gets current location
- Every **5 seconds**, sends location to server:
  - Latitude (e.g., 7.0644)
  - Longitude (e.g., 125.6078)
  - Speed
  - Direction

### 4. **Server Updates Location**
- Receives GPS data from driver's phone
- Stores in memory (liveLocations)
- Timestamp: When was it updated

### 5. **Admin Sees Real-Time Movement**
- Admin dashboard refreshes every 5 seconds
- Gets latest location from server
- Updates truck marker on map
- Truck moves smoothly to new position

---

## 🎯 How It Works (Technical):

### Driver Side (Phone):
```javascript
// 1. Get GPS permission
navigator.geolocation.getCurrentPosition()

// 2. Every 5 seconds, get location
setInterval(() => {
  navigator.geolocation.getCurrentPosition(position => {
    // 3. Send to server
    fetch('/api/tracking/update', {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      speed: position.coords.speed,
      heading: position.coords.heading
    })
  })
}, 5000) // Every 5 seconds
```

### Server Side:
```javascript
// Receives GPS update
POST /api/tracking/update
{
  lat: 7.0644,
  lng: 125.6078,
  speed: 45,
  heading: 180
}

// Stores in memory
liveLocations.set(username, {
  lat, lng, speed, heading,
  timestamp: now
})
```

### Admin Side (Computer):
```javascript
// Every 5 seconds, get all driver locations
setInterval(() => {
  fetch('/api/tracking/active')
    .then(locations => {
      // Update truck markers on map
      locations.forEach(loc => {
        updateTruckMarker(loc.username, loc.lat, loc.lng)
      })
    })
}, 5000)
```

---

## 🚗 Real-Life Example:

### Scenario: Driver is Driving

**Time: 9:00 AM**
- Driver location: 7.0644, 125.6078 (Davao City Hall)
- Truck marker on admin map: Davao City Hall ✓

**Time: 9:01 AM**
- Driver drives to Matina
- New location: 7.0700, 125.6100
- Phone sends update to server
- Admin map refreshes
- Truck marker moves to Matina ✓

**Time: 9:02 AM**
- Driver stops at red light
- Location: 7.0700, 125.6100 (same)
- Speed: 0 km/h
- Truck marker stays in place ✓

**Time: 9:03 AM**
- Driver continues driving
- New location: 7.0750, 125.6150
- Truck marker moves again ✓

---

## 📊 Update Frequency:

| Action | Frequency | What Happens |
|--------|-----------|--------------|
| GPS Check | Every 5 seconds | Phone gets current location |
| Send to Server | Every 5 seconds | Updates server with new position |
| Admin Refresh | Every 5 seconds | Admin map gets latest positions |
| Map Update | Immediate | Truck marker moves smoothly |

---

## 🎯 Features:

### ✅ Real-Time Tracking:
- Updates every 5 seconds
- Smooth marker movement
- Shows current speed
- Shows direction/heading

### ✅ Automatic:
- No manual input needed
- GPS does everything
- Works in background
- Continues while driving

### ✅ Accurate:
- Uses phone's GPS
- Latitude/Longitude precision
- Speed from GPS
- Direction from GPS

### ✅ Live Updates:
- Admin sees movement immediately
- Multiple drivers tracked simultaneously
- Stale locations removed (5 min timeout)

---

## 📱 Para sa Driver:

### Step 1: Open Mobile App
```
http://192.168.254.166:3001/mobile
```

### Step 2: Login
- Username: driver1
- Password: password123

### Step 3: Click "Start GPS Tracking"
- Green button at bottom
- Allow location access

### Step 4: Start Driving!
- GPS automatically tracks
- Updates every 5 seconds
- No need to do anything else

### Step 5: When Done
- Click "Stop GPS Tracking"
- GPS stops updating

---

## 💻 Para sa Admin:

### Step 1: Open Dashboard
```
http://localhost:3001/dashboard
```

### Step 2: Click "Live Truck Tracking"
- Opens map view
- Shows all active trucks

### Step 3: Watch Real-Time
- Truck markers update automatically
- See driver names
- See current speed
- See last update time

---

## 🔧 Settings:

### Update Interval (app.js):
```javascript
// Current: 5 seconds
const TRACKING_INTERVAL = 5000;

// To change:
// 3 seconds = 3000
// 10 seconds = 10000
```

### Location Timeout (tracking.js):
```javascript
// Current: 5 minutes
const TIMEOUT = 5 * 60 * 1000;

// Stale locations removed after 5 min
```

---

## 🎯 What You'll See:

### On Driver's Phone:
- "GPS Tracking Active" (green button)
- Current location on map
- Route being followed

### On Admin's Computer:
- All trucks on map
- Moving in real-time
- Driver names
- Last update time
- Speed (if available)

---

## 🚀 How to Test:

### Test 1: Walking Test
1. Driver opens mobile app
2. Clicks "Start GPS Tracking"
3. Walks around with phone
4. Admin watches truck marker move on map

### Test 2: Driving Test
1. Driver starts GPS tracking
2. Drives truck on route
3. Admin sees truck following route
4. Truck stops when driver stops

### Test 3: Multiple Drivers
1. Driver1 starts tracking
2. Driver2 starts tracking
3. Admin sees both trucks moving
4. Each updates independently

---

## ⚠️ Important Notes:

### GPS Accuracy:
- **Outdoors:** Very accurate (5-10 meters)
- **Indoors:** Less accurate (may drift)
- **Tunnels:** May lose signal temporarily
- **Buildings:** May affect accuracy

### Battery Usage:
- GPS uses battery power
- Continuous tracking drains battery
- Recommend: Car charger for driver's phone

### Internet Connection:
- Requires internet to send updates
- Mobile data or WiFi
- No update if no connection
- Resumes when connection restored

### Privacy:
- Only tracks when "GPS Tracking Active"
- Driver can stop anytime
- Location not stored permanently
- Only in memory (cleared on restart)

---

## 🎉 Summary:

**YES, IT WORKS!**

Kapag:
- ✅ Driver nag-drive ng truck → Truck sa map gumagalaw
- ✅ Driver huminto → Truck sa map humihinto
- ✅ Driver kumanan → Truck sa map kumakanan
- ✅ Driver bumilis → Speed updates
- ✅ Real-time → Every 5 seconds

**Already implemented and working! Just need to:**
1. Driver: Open `/mobile` and click "Start GPS Tracking"
2. Admin: Open dashboard and click "Live Truck Tracking"
3. Watch the magic happen! 🎉

---

## 📞 Quick Reference:

**Driver URL:** `http://192.168.254.166:3001/mobile`  
**Admin URL:** `http://localhost:3001/dashboard`  
**Update Frequency:** Every 5 seconds  
**GPS Permission:** Required (browser will ask)  
**Internet:** Required for updates  

**IT'S READY TO USE! 🚀**
