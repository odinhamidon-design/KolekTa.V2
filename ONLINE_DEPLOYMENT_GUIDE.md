# 🚀 Paano I-Deploy Online (Vercel)

## Mabilis na Paraan

### Step 1: I-deploy
```bash
deploy-to-vercel.bat
```
O kaya:
```bash
vercel --prod
```

### Step 2: I-set ang Environment Variables
1. Pumunta sa https://vercel.com/dashboard
2. Click ang project mo
3. Settings → Environment Variables
4. I-add ang mga ito:

```
MONGODB_URI = mongodb+srv://odinkamlson_db_user:OvdptFsdXvkSB75zu@cluster0.hua275h.mongodb.net/kolekta?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET = kolekta-super-secret-key-2024-change-this-in-production
NODE_ENV = production
USE_MOCK_AUTH = false
```

5. Click "Save"
6. I-redeploy (Deployments → latest → Redeploy)

### Step 3: I-setup ang Admin Account
```bash
node scripts/fix-admin-password.js
```

### Step 4: Test!
Buksan ang URL na binigay ng Vercel (e.g., `https://kolekta-mati.vercel.app`)

Login:
- **Admin:** username=`admin`, password=`admin123`
- **Driver:** username=`<driver_name>`, password=`driver123`

---

## Lahat ng Features na Dapat Gumana Online

### ✅ Admin Features
1. **User Management** - Create, edit, delete drivers
2. **Truck Management** - Add trucks, assign to drivers
3. **Routes Management** - Create routes, assign to drivers
4. **Live Truck Tracking** - See all trucks moving on map in real-time
5. **Completion History** - View all completed routes with photos
6. **Notifications** - Get notified when drivers complete routes

### ✅ Driver Features
1. **Login** - Face recognition or password
2. **View Route** - See assigned route on map
3. **GPS Tracking** - Real-time location tracking
4. **Location Name** - Shows "Matiao, Mati" instead of coordinates
5. **Complete Route** - Upload photos as proof
6. **View History** - See completed routes

### ✅ Technical Features
1. **MongoDB Database** - All data saved permanently
2. **Real-time Updates** - GPS updates every 5 seconds
3. **Reverse Geocoding** - Coordinates → Place names
4. **Photo Upload** - Completion proof photos
5. **Responsive Design** - Works on mobile and desktop
6. **Secure Authentication** - JWT tokens, password hashing

---

## Troubleshooting

### Problem: "Cannot connect to MongoDB"
**Solution:**
1. Check MongoDB Atlas cluster is running (not paused)
2. Go to MongoDB Atlas → Network Access
3. Add IP: `0.0.0.0/0` (allow all)
4. Verify MONGODB_URI in Vercel environment variables

### Problem: "Invalid credentials"
**Solution:**
```bash
node scripts/fix-admin-password.js
```

### Problem: GPS not working
**Solution:**
- Vercel automatically provides HTTPS (required for GPS)
- Make sure browser allows location access
- Test on actual phone (not emulator)

### Problem: Features work locally but not online
**Solution:**
1. Check Vercel deployment logs for errors
2. Verify ALL environment variables are set
3. Make sure MongoDB Atlas allows all IPs
4. Redeploy after setting environment variables

---

## Monitoring

### Check if online:
Visit: `https://your-app.vercel.app`

### Check API:
Visit: `https://your-app.vercel.app/api/users`
- Should show: `{"error":"No token provided"}` (this is correct!)

### Check logs:
Vercel Dashboard → Deployments → Click latest → View Function Logs

---

## Important Notes

1. **First deployment** - Matagal (2-3 minutes)
2. **Updates** - Mabilis lang (30 seconds)
3. **Environment variables** - Kailangan i-set manually sa Vercel Dashboard
4. **MongoDB** - Kailangan running ang cluster
5. **Admin password** - Kailangan i-reset after first deploy

---

## Automatic Deployment (Optional)

Connect Vercel to GitHub:
1. Vercel Dashboard → Project Settings → Git
2. Connect to GitHub repository
3. Every `git push` = automatic deployment!

```bash
git add .
git commit -m "Update features"
git push origin main
# Automatic deployment starts!
```

---

## Support

Kung may problema:
1. Check `VERCEL_DEPLOY_CHECKLIST.md` for detailed steps
2. Check Vercel deployment logs
3. Check MongoDB Atlas logs
4. Test locally first with same environment variables

**All features will work exactly the same online as localhost!** 🎉
