# 📖 Kolek-Ta System - Complete Usage Guide (Tagalog)

## 🎯 BUONG SISTEMA - Paano Gamitin

---

## PART 1: PANIMULA - Pagsisimula

### **Step 1: I-Start ang Server**

**Sa Computer (Admin):**
```powershell
# 1. Open PowerShell o CMD
# 2. Navigate sa project folder
cd C:\Users\charl_vuj9h6b\OneDrive\Kolek Ta A Web Base Waste Collection Management System

# 3. Start server
node server.js

# 4. Dapat makita:
"Kolek-Ta server running on port 3001"
```

**Ibig sabihin:** Server is ready! ✅

---

## PART 2: ADMIN - Setup at Management

### **Step 1: Login as Admin**

```
1. Open browser (Chrome, Edge, Firefox)
2. Go to: http://localhost:3001
3. Login:
   Username: admin
   Password: admin123
4. Click "Login"
```

**Makikita mo:** Admin Dashboard ✅

---

### **Step 2: Create/Manage Trucks**

**Gumawa ng Truck:**
```
1. Click "🚛 Truck Management"
2. Click "Add New Truck"
3. Fill in:
   - Truck ID: TRUCK-001
   - Plate Number: ABC-1234
   - Model: Isuzu Elf
   - Capacity: 5 tons
   - Fuel Level: 100%
4. Click "Add Truck"
```

**I-Assign sa Driver:**
```
1. Find truck sa list
2. Click "Assign Driver"
3. Select: driver1
4. Click "Save"
```

**Result:** Truck assigned to driver1 ✅

---

### **Step 3: Create/Manage Routes**

**Gumawa ng Route:**
```
1. Click "📍 Routes Management"
2. Click "Create New Route"
3. Fill in:
   - Route ID: route1
   - Name: Downtown Route
   - Description: Main collection area
4. Click on map to add bin locations
5. Click "Save Route"
```

**I-Assign sa Driver:**
```
1. Find route sa list
2. Click "Assign Driver"
3. Select: driver1
4. Click "Save"
```

**Result:** Route assigned to driver1 ✅

---

### **Step 4: View Live Tracking**

**Panoorin ang Trucks:**
```
1. Click "📍 Live Truck Tracking"
2. Map will show all trucks
3. Green marker = GPS active (live)
4. Gray marker = GPS off (offline)
5. Click marker to see details
```

**Makikita mo:**
- Truck location
- Driver name
- Speed (if moving)
- Last update time
- Route assignment

---

## PART 3: DRIVER - Daily Operations

### **Step 1: Login sa Mobile**

**Sa Phone:**
```
1. Open browser (Chrome, Firefox, Safari)
2. Type: http://192.168.254.166:3001/mobile
3. Login:
   Username: driver1
   Password: password123
4. Click "Login"
```

**Makikita mo:** Driver Dashboard ✅

---

### **Step 2: Start GPS Tracking**

**I-Activate ang GPS:**
```
1. Look for green button at bottom:
   "🟢 GPS Tracking Active"
2. Click the button
3. Browser will ask: "Allow location?"
4. Click "Allow" o "Payagan"
5. Button stays green = GPS is active!
```

**Ibig sabihin:**
- ✅ Location is being tracked
- ✅ Admin can see you on map
- ✅ Updates every 5 seconds

---

### **Step 3: View Your Assignment**

**Check Your Truck:**
```
Makikita mo sa screen:
🚛 My Truck: TRUCK-001
   ABC-1234 - Isuzu Elf
   Fuel: 85% | Status: in-use
```

**Check Your Route:**
```
📍 My Routes:
   route1 - Downtown Route
   2 locations | 1.94 km
   [View on Map] button
```

---

### **Step 4: Start Collection**

**Begin Your Route:**
```
1. Click "View on Map" on your route
2. Map shows all bin locations
3. Drive to first bin
4. Collect waste
5. Move to next bin
6. Repeat until all bins done
```

**Habang Nag-ddrive:**
- ✅ GPS automatically tracks you
- ✅ Admin sees your movement
- ✅ Truck marker follows you on map
- ✅ No need to do anything!

---

### **Step 5: Complete Route**

**Kapag Tapos na:**
```
1. After collecting all bins
2. Click "Complete Route" button
3. Confirm completion
4. GPS can be stopped
5. Route marked as completed
```

**Result:**
- ✅ Route completed
- ✅ Admin notified
- ✅ Record saved

---

### **Step 6: Stop GPS Tracking**

**Kapag Tapos na ang Shift:**
```
1. Click green button again
2. Click "Stop"
3. GPS stops tracking
4. Can logout
```

---

## PART 4: DAILY WORKFLOW

### **MORNING (Start of Day):**

**Admin:**
```
1. Login to dashboard
2. Check all trucks
3. Verify route assignments
4. Click "Live Truck Tracking"
5. Monitor drivers
```

**Driver:**
```
1. Login to mobile app
2. Check assigned truck
3. Check assigned route
4. Start GPS tracking
5. Begin collection
```

---

### **DURING THE DAY:**

**Admin:**
```
- Monitor truck locations
- Check progress
- Respond to issues
- Track completion
```

**Driver:**
```
- Drive to bins
- Collect waste
- GPS tracks automatically
- Move to next location
```

---

### **END OF DAY:**

**Admin:**
```
- Verify all routes completed
- Check notifications
- Review performance
- Generate reports (if available)
```

**Driver:**
```
- Complete final route
- Stop GPS tracking
- Logout
- End shift
```

---

## PART 5: COMMON TASKS

### **Task 1: Add New Driver**

```
1. Admin → User Management
2. Click "Add User"
3. Fill in:
   - Username: driver4
   - Password: password123
   - Role: driver
   - Full Name: Juan Dela Cruz
   - Email: juan@example.com
4. Click "Add User"
5. Assign truck to driver4
6. Assign route to driver4
```

---

### **Task 2: Change Route Assignment**

```
1. Admin → Routes Management
2. Find route
3. Click "Reassign"
4. Select different driver
5. Click "Save"
```

---

### **Task 3: View Route History**

```
1. Admin → Routes Management
2. Click on route
3. View "Completion History"
4. See:
   - Date completed
   - Driver name
   - Time taken
   - Distance covered
```

---

### **Task 4: Update Truck Info**

```
1. Admin → Truck Management
2. Click "Edit" on truck
3. Update:
   - Fuel level
   - Status
   - Maintenance notes
4. Click "Save"
```

---

### **Task 5: Check Notifications**

```
1. Look for bell icon 🔔
2. Number shows unread notifications
3. Click to view
4. See:
   - Route completions
   - System alerts
   - Driver updates
```

---

## PART 6: TROUBLESHOOTING

### **Problem: Can't Login**

**Solution:**
```
1. Check username/password
2. Default accounts:
   - admin / admin123
   - driver1 / password123
3. Check if server is running
4. Try different browser
```

---

### **Problem: GPS Not Working**

**Solution:**
```
1. Check if location is ON in phone settings
2. Click "Allow" when browser asks
3. Go outside (GPS works better outdoors)
4. Check internet connection
5. Try Firefox instead of Chrome
```

---

### **Problem: No Trucks on Map**

**Solution:**
```
1. Click "Live Truck Tracking" button
2. Check if trucks are assigned to drivers
3. Check if routes are assigned to drivers
4. Refresh page
5. Check browser console for errors
```

---

### **Problem: Slow Updates**

**Solution:**
```
1. Check internet speed
2. Reduce number of open tabs
3. Clear browser cache
4. Restart browser
5. Check server performance
```

---

## PART 7: TIPS & BEST PRACTICES

### **For Admin:**

✅ **DO:**
- Monitor trucks regularly
- Respond to notifications quickly
- Keep assignments updated
- Review performance weekly
- Backup data regularly

❌ **DON'T:**
- Leave unassigned trucks
- Ignore notifications
- Forget to check completion
- Overload single driver

---

### **For Drivers:**

✅ **DO:**
- Start GPS before driving
- Keep phone charged
- Follow assigned route
- Complete all bins
- Stop GPS after shift

❌ **DON'T:**
- Forget to start GPS
- Let phone battery die
- Skip bins
- Forget to complete route
- Leave GPS on after shift

---

## PART 8: KEYBOARD SHORTCUTS

### **Admin Dashboard:**

```
Ctrl + R = Refresh page
F5 = Reload
F12 = Open developer tools
Esc = Close modal
```

---

## PART 9: QUICK REFERENCE

### **URLs:**

```
Admin (Computer):
http://localhost:3001

Driver (Phone):
http://192.168.254.166:3001/mobile
```

### **Default Accounts:**

```
ADMIN:
Username: admin
Password: admin123

DRIVERS:
Username: driver1, driver2, driver3
Password: password123
```

### **Important Buttons:**

```
Admin:
- 🚛 Truck Management
- 📍 Routes Management
- 👥 User Management
- 📍 Live Truck Tracking

Driver:
- 🟢 GPS Tracking Active
- 📍 View on Map
- ✅ Complete Route
```

---

## PART 10: SUMMARY

### **Admin Workflow:**
```
1. Start server
2. Login
3. Manage trucks/routes
4. Assign to drivers
5. Monitor live tracking
6. Check completions
```

### **Driver Workflow:**
```
1. Login mobile
2. Start GPS
3. Check assignment
4. Drive to bins
5. Collect waste
6. Complete route
7. Stop GPS
```

---

## ✅ CHECKLIST

### **Before Starting:**
- [ ] Server is running
- [ ] Trucks are created
- [ ] Routes are created
- [ ] Drivers are assigned trucks
- [ ] Drivers are assigned routes
- [ ] Internet connection working

### **Daily Operations:**
- [ ] Admin logged in
- [ ] Live tracking active
- [ ] Drivers logged in mobile
- [ ] GPS tracking started
- [ ] Collections in progress
- [ ] Monitoring active

### **End of Day:**
- [ ] All routes completed
- [ ] GPS tracking stopped
- [ ] Notifications checked
- [ ] Data saved
- [ ] Ready for next day

---

## 🎉 YOU'RE READY!

**Ang system ay:**
- ✅ Easy to use
- ✅ Real-time tracking
- ✅ Mobile-friendly
- ✅ Professional
- ✅ Complete

**Just follow this guide and you're good to go!** 🚀

**Need help? Refer back to this guide anytime!** 📖
