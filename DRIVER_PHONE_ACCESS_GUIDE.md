# 📱 Gabay para sa Pag-access ng Driver gamit ang Phone

## ✅ Lahat ng Driver ay Pwedeng Mag-access!

Kahit magkaiba ang phone ng mga driver (Android, iPhone, Samsung, Oppo, etc.), **lahat ay pwedeng mag-access** ng system!

---

## 🌐 Paano Mag-access:

### 1. **Siguraduhing Connected sa Same Wi-Fi**
- Ang computer (server) at lahat ng phone ng drivers ay dapat **nakaconnect sa SAME Wi-Fi network**
- Halimbawa: Lahat ay naka-connect sa "Office WiFi" o "Home WiFi"

### 2. **I-open ang Browser sa Phone**
Kahit anong browser:
- ✅ Chrome
- ✅ Safari (iPhone)
- ✅ Firefox
- ✅ Samsung Internet
- ✅ UC Browser
- ✅ Kahit ano!

### 3. **I-type ang Address**
Sa address bar ng browser, i-type:
```
http://192.168.254.166:3001
```

### 4. **Mag-login**
- **Username:** `driver1`, `driver2`, `driver3`, etc.
- **Password:** `password123`

### 5. **I-allow ang Location**
Kapag hiningi ng browser, i-click ang **"Allow"** para gumana ang GPS tracking

---

## 📋 Available Driver Accounts:

| Username | Password | Truck |
|----------|----------|-------|
| driver1  | password123 | Truck 1 |
| driver2  | password123 | Truck 2 |
| driver3  | password123 | Truck 3 |

---

## 🔧 Troubleshooting:

### "Hindi maka-connect"
1. ✅ Check kung same Wi-Fi ang computer at phone
2. ✅ I-restart ang server sa computer
3. ✅ Subukan i-type ulit ang address

### "Connection error"
1. ✅ Siguraduhing tumatakbo ang server (dapat may nakikita sa console)
2. ✅ Check kung tama ang IP address: `192.168.254.166:3001`
3. ✅ Subukan i-refresh ang page

### "Location not working"
1. ✅ I-allow ang location permission sa browser settings
2. ✅ Check kung naka-on ang GPS/Location sa phone
3. ✅ Subukan i-refresh ang page

---

## 💡 Important Notes:

- **Walang kailangan i-install** - browser lang!
- **Kahit anong phone** - Android, iPhone, lahat pwede!
- **Kahit anong browser** - Chrome, Safari, Firefox, etc.
- **Same Wi-Fi lang** - yan lang ang requirement!

---

## 🚀 Para sa Admin:

Kung kailangan i-restart ang server:
```cmd
node server.js
```

Dapat makita mo sa console:
```
Kolek-Ta server running on port 3001
Access from this computer: http://localhost:3001
Access from other devices: http://192.168.254.166:3001
```

---

## 📞 Quick Reference Card (Print for Drivers):

```
╔════════════════════════════════════╗
║   KOLEK-TA DRIVER ACCESS           ║
╠════════════════════════════════════╣
║                                    ║
║  📱 I-open ang browser sa phone    ║
║                                    ║
║  🌐 I-type:                        ║
║     192.168.254.166:3001           ║
║                                    ║
║  👤 Username: driver1              ║
║  🔑 Password: password123          ║
║                                    ║
║  📍 I-allow ang Location           ║
║                                    ║
╚════════════════════════════════════╝
```

**Tip:** I-bookmark ang page para hindi na kailangan i-type ulit!
