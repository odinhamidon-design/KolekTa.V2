# 🔍 DEBUG: Bakit Walang Truck?

## Step-by-Step Debugging

### STEP 1: Check kung sino naka-login

**Sa browser console (Press F12), i-type:**
```javascript
console.log('Current user:', user);
console.log('Username:', user.username);
console.log('Role:', user.role);
```

**Expected output:**
```
Current user: {username: "driver1", role: "driver", ...}
Username: driver1
Role: driver
```

**Kung hindi "driver1":**
- Logout
- Login ulit as driver1 / driver123

---

### STEP 2: Check kung may routes

**Sa console, i-type:**
```javascript
fetch('http://localhost:3001/api/routes', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
})
.then(r => r.json())
.then(routes => {
  console.log('All routes:', routes);
  const myRoutes = routes.filter(r => r.assignedDriver === user.username);
  console.log('My routes:', myRoutes);
  const pendingRoutes = myRoutes.filter(r => r.status === 'pending');
  console.log('Pending routes:', pendingRoutes);
});
```

**Expected output:**
```
All routes: [...]
My routes: [2 routes for driver1]
Pending routes: [2 routes with status: "pending"]
```

**Kung walang pending routes:**
- Kailangan ng admin na mag-assign ng route
- Or i-change ang status ng existing route to "pending"

---

### STEP 3: Check kung may "Start Collection" button

**Tingnan ang left sidebar:**

**Kung may button:**
```
[🚀 Start Collection]  ← Click this!
```

**Kung walang button:**
- Check console for errors
- Check kung "completed" na ang route
- Check kung assigned sa ibang driver

---

### STEP 4: Manually start collection

**Sa console, i-type:**
```javascript
// Check if function exists
console.log('startCollection function:', typeof startCollection);

// Try to start manually
startCollection('2'); // Use route ID
```

**Expected:**
- Confirmation dialog appears
- Click OK
- Truck should appear

---

### STEP 5: Check kung may error

**Sa console, tingnan kung may RED na error messages**

**Common errors:**
```
❌ "route is not defined"
❌ "Cannot read property 'coordinates'"
❌ "positionTruckAtFirstBin is not defined"
```

**Kung may error:**
- Take screenshot
- Copy error message
- Check what's wrong

---

### STEP 6: Force create truck

**Sa console, i-type:**
```javascript
// Manually create truck at Mati City center
const mockPosition = {
  coords: {
    latitude: 6.9549,
    longitude: 126.2185,
    speed: 0,
    heading: 0
  }
};

// Create truck marker
updateTruckMarker(mockPosition);

// Start GPS tracking
startGPSTracking();
```

**Expected:**
- Truck icon appears on map
- GPS tracking starts

---

## 🚨 EMERGENCY FIX

### If nothing works, try this:

**1. Clear everything:**
```javascript
localStorage.clear();
location.reload();
```

**2. Login again:**
- Username: driver1
- Password: driver123

**3. Check routes in console:**
```javascript
fetch('http://localhost:3001/api/routes', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
})
.then(r => r.json())
.then(d => console.log(d));
```

**4. If routes exist, manually start:**
```javascript
// Get first pending route
fetch('http://localhost:3001/api/routes', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
})
.then(r => r.json())
.then(routes => {
  const myRoute = routes.find(r => 
    r.assignedDriver === 'driver1' && 
    r.status === 'pending'
  );
  console.log('Found route:', myRoute);
  if (myRoute) {
    startCollection(myRoute._id);
  } else {
    console.error('No pending routes found for driver1');
  }
});
```

---

## 📸 Send Me This Info

**Please check and send:**

1. **Console output of:**
```javascript
console.log('User:', user);
console.log('Token:', localStorage.getItem('token'));
```

2. **Console output of:**
```javascript
fetch('http://localhost:3001/api/routes', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
})
.then(r => r.json())
.then(d => console.log('Routes:', d));
```

3. **Screenshot of:**
- Left sidebar (My Routes section)
- Browser console (F12)
- Any error messages

---

## 🎯 Most Likely Issues

### Issue 1: Not logged in as driver1
**Solution:** Logout and login as driver1

### Issue 2: No pending routes
**Solution:** Need admin to assign route

### Issue 3: Routes assigned to different driver
**Solution:** Change assignedDriver to "driver1"

### Issue 4: JavaScript error
**Solution:** Check console, fix error

### Issue 5: Old cached code
**Solution:** Hard refresh (Ctrl+Shift+R)

---

Try these steps and let me know what you see in the console!
