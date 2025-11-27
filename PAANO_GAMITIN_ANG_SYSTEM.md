# 📱 Paano Gamitin ang Kolek-Ta System

## Para sa DRIVER - Simple Guide

---

## 🎯 STEP 1: Mag-login

### 1.1 Buksan ang browser
```
Chrome, Firefox, or Edge
```

### 1.2 Pumunta sa website
```
http://localhost:3000/login.html
```

### 1.3 Piliin ang "Driver"
- May dalawang card: Admin at Driver
- **I-click ang "Driver" card**

### 1.4 I-type ang username at password
```
Username: driver1
Password: driver123
```

### 1.5 Click "Login"

---

## 🎯 STEP 2: Tingnan ang Iyong Assignments

### 2.1 Pagkatapos mag-login, makikita mo:
```
┌─────────────────────────────────┐
│ 🚛 My Truck:                    │
│ TRUCK-001                       │
│ ABC-1234 - Isuzu Elf            │
│ Fuel: 80% | Status: active     │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 📍 My Routes:                   │
│                                 │
│ Downtown Collection Route       │
│ ROUTE-001                       │
│ 5 locations | 2.5 km            │
│                                 │
│ [👁️ View on Map]                │
│ [🚀 Start Collection]           │  ← IMPORTANTE!
└─────────────────────────────────┘
```

---

## 🎯 STEP 3: Simulan ang Collection

### 3.1 I-click ang "🚀 Start Collection" button
- Nasa baba ng route card
- Green button with rocket icon

### 3.2 Lalabas ang confirmation message:
```
Start collection for:
Downtown Collection Route (ROUTE-001)

This will:
✓ Position truck at first bin
✓ Start GPS tracking
✓ Begin route navigation

Ready to start?

[Cancel] [OK]
```

### 3.3 I-click ang "OK"

### 3.4 Lalabas ang success message:
```
✓ Collection started!

Route: Downtown Collection Route
Truck positioned at first bin
GPS tracking active

[OK]
```

### 3.5 I-click ang "OK" ulit

---

## 🎯 STEP 4: Tingnan ang Truck sa Map

### 4.1 Makikita mo sa map:
- **🚛 Truck icon** - Nasa first bin location
- **Blue dashed line** - Ang route na susundin
- **Green circle** - First bin (🎯 Start)
- **Blue circles** - Other bins (📍 Stop 1, 2, 3...)

### 4.2 Makikita mo sa sidebar:
```
┌─────────────────────────────────┐
│ Downtown Collection Route       │
│ [🚛 In Progress]  ← Badge       │
│ ROUTE-001                       │
│                                 │
│ [👁️ View] [✓ Complete] [⏹️ Stop] │
└─────────────────────────────────┘
```

---

## 🎯 STEP 5: Magsimulang Mag-collect

### 5.1 Pumunta sa first bin location
- Sundin ang blue line sa map
- Truck icon ay susunod sa iyo
- Updates every 30 seconds

### 5.2 Habang naglalakad/nagmamaneho:
- Truck ay gumagalaw sa map 🚛
- Green line ay lumalaki (path trail)
- Truck ay sumusunod sa kalsada (hindi straight line)

### 5.3 Sa bawat bin:
- Kolektahin ang basura
- Pumunta sa next bin
- Sundin ang route

---

## 🎯 STEP 6: Tapusin ang Route

### 6.1 Pagkatapos ng lahat ng bins, i-click ang "✓ Mark as Complete"

### 6.2 Lalabas ang form:
```
┌─────────────────────────────────┐
│ Mark Route as Complete          │
├─────────────────────────────────┤
│ Route: Downtown Collection      │
│                                 │
│ Upload Proof Photos *           │
│ [Choose Files]                  │
│ 📸 Upload 1-10 photos           │
│                                 │
│ Completion Notes:               │
│ [Text area]                     │
│                                 │
│ [✓ Mark as Complete] [Cancel]  │
└─────────────────────────────────┘
```

### 6.3 I-upload ang photos:
- Click "Choose Files"
- Piliin ang 1-10 photos ng collected waste
- Max 5MB per photo

### 6.4 I-type ang notes (optional):
```
Example:
"All bins collected successfully. 
No issues encountered."
```

### 6.5 Click "✓ Mark as Complete"

### 6.6 Lalabas ang success message:
```
✓ Route marked as complete!
Admin has been notified.

[OK]
```

---

## 🎯 STEP 7: Logout

### 7.1 I-click ang "Logout" button
- Nasa top right corner
- Katabi ng profile picture/name

### 7.2 Babalik ka sa login page

---

## 🔧 Kung May Problema

### Problem 1: Walang "Start Collection" button

**Solusyon:**
1. Check kung may assigned route ka
2. Tanungin ang admin na mag-assign ng route
3. Refresh ang page (F5)

### Problem 2: Hindi lumalabas ang truck

**Solusyon:**
1. I-click muna ang "Start Collection"
2. Hintayin ang confirmation
3. Click OK
4. Dapat lumabas na ang truck

### Problem 3: Hindi gumagalaw ang truck

**Solusyon:**
1. Check kung naka-on ang GPS/Location sa device
2. Pumunta sa open area (para sa better GPS signal)
3. Hintayin ang 30 seconds para sa update
4. Dapat gumalaw na

### Problem 4: Hindi maka-upload ng photos

**Solusyon:**
1. Check kung JPG, PNG, or GIF ang file
2. Check kung below 5MB per photo
3. Try ulit

---

## 📱 Tips para sa Mobile

### Kung gumagamit ng phone:

1. **Enable GPS/Location:**
   - Settings → Location → On

2. **Allow browser to access location:**
   - Browser → Settings → Site Settings → Location → Allow

3. **Keep screen on:**
   - Para hindi mawala ang tracking

4. **Good signal:**
   - Mas accurate ang GPS sa open areas

---

## 🎯 Quick Reference

### Mga Buttons at Meaning:

| Button | Meaning | Action |
|--------|---------|--------|
| 🚀 Start Collection | Simulan ang collection | Click to start |
| 👁️ View on Map | Tingnan sa map | View route |
| ✓ Mark as Complete | Tapos na | Upload photos |
| ⏹️ Stop | Ihinto | Stop tracking |
| 🔄 Retry | Subukan ulit | Retry action |

### Mga Status:

| Status | Meaning | Color |
|--------|---------|-------|
| Pending | Hindi pa nagsimula | Blue |
| 🚛 In Progress | Ongoing | Orange |
| ✓ Completed | Tapos na | Green |

---

## 📊 Typical Day Flow

```
8:00 AM - Login
8:05 AM - Check assignments
8:10 AM - Start Collection
8:15 AM - Pumunta sa first bin
8:30 AM - Collect from bins 1-3
9:00 AM - Collect from bins 4-5
9:30 AM - Mark as Complete
9:35 AM - Upload photos
9:40 AM - Submit
9:45 AM - Logout
```

---

## 🎉 Congratulations!

Alam mo na kung paano gamitin ang system!

### Remember:
1. ✅ Login as driver
2. ✅ Click "Start Collection"
3. ✅ Follow the route
4. ✅ Truck follows you
5. ✅ Mark as Complete
6. ✅ Upload photos
7. ✅ Logout

---

## 📞 Need Help?

### Kung may tanong:
1. Tanungin ang admin
2. Check ang guides sa folder
3. Tingnan ang browser console (F12) for errors

### Common Files:
- `PAANO_GAMITIN_ANG_SYSTEM.md` - This file
- `START_COLLECTION_GUIDE.md` - Detailed start guide
- `TRUCK_NOT_VISIBLE_FIX.md` - Truck troubleshooting
- `DRIVER_DASHBOARD_GUIDE.md` - Dashboard guide

---

**Last Updated:** November 23, 2025
**Para sa:** Drivers
**Language:** Tagalog/English
**Difficulty:** ⭐ Easy
