# ✅ Vercel Deployment Checklist

## Pre-Deployment Steps

### 1. Environment Variables (IMPORTANT!)
Sa Vercel Dashboard, i-set ang mga environment variables:

```
MONGODB_URI=mongodb+srv://odinkamlson_db_user:OvdptFsdXvkSB75zu@cluster0.hua275h.mongodb.net/kolekta?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=kolekta-super-secret-key-2024-change-this-in-production
NODE_ENV=production
USE_MOCK_AUTH=false
```

**Paano i-set:**
1. Go to Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. Add each variable above
4. Click "Save"

### 2. MongoDB Atlas Setup
Ensure MongoDB Atlas is configured:
- ✅ Cluster is running (not paused)
- ✅ Network Access: Add `0.0.0.0/0` (allow all IPs)
- ✅ Database User: `odinkamlson_db_user` with correct password
- ✅ Database name: `kolekta`

### 3. Create Admin User
After deployment, run this script locally to create admin in MongoDB:

```bash
node scripts/create-admin.js
```

Or use this script to fix password:
```bash
node scripts/fix-admin-password.js
```

## Deployment Commands

### Option 1: Using Vercel CLI (Fastest)
```bash
vercel --prod
```

### Option 2: Git Push (Automatic)
```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

Vercel will auto-deploy from GitHub.

## Post-Deployment Verification

### 1. Check Deployment Logs
- Go to Vercel Dashboard → Deployments
- Click on latest deployment
- Check "Build Logs" for errors

### 2. Test All Functions
Visit your deployed URL and test:

#### Admin Functions:
- ✅ Login (admin / admin123)
- ✅ User Management (create/edit/delete drivers)
- ✅ Truck Management (add/assign trucks)
- ✅ Routes Management (create/assign routes)
- ✅ Live Truck Tracking (see all trucks on map)
- ✅ Completion History (view completed routes)
- ✅ Notifications (see new completions)

#### Driver Functions:
- ✅ Login (driver username / driver123)
- ✅ View assigned route
- ✅ Start GPS tracking
- ✅ Complete route with photos
- ✅ View location name on map

### 3. Test GPS Tracking
- Login as driver on mobile phone
- Allow location access
- Start tracking
- Check if admin sees live location
- Verify location name appears (not just coordinates)

### 4. Test Notifications
- Have driver complete a route
- Check if admin gets notification
- Click "View" to see details
- Click "✓" to acknowledge
- Check "Completion History" panel

## Common Issues & Solutions

### Issue: "Cannot connect to MongoDB"
**Solution:**
1. Check MongoDB Atlas cluster is running
2. Verify MONGODB_URI in Vercel environment variables
3. Check Network Access allows all IPs (0.0.0.0/0)

### Issue: "Invalid credentials" on login
**Solution:**
1. Run `node scripts/fix-admin-password.js` locally
2. Or create new admin with `node scripts/create-admin.js`

### Issue: GPS not working
**Solution:**
1. Ensure HTTPS (Vercel provides this automatically)
2. Check browser allows location access
3. Test on actual mobile device (not emulator)

### Issue: Functions work locally but not online
**Solution:**
1. Check Vercel deployment logs for errors
2. Verify all environment variables are set
3. Check API routes are correct (use relative URLs: `/api/...`)

### Issue: "Route not found" errors
**Solution:**
- Vercel.json is configured to route all requests to server.js
- Check if file exists and is committed to git

## Environment-Specific Code

The app automatically detects environment:
- **Local**: Uses `http://localhost:3001`
- **Production**: Uses relative URLs (`/api/...`)

This is handled in `public/app.js`:
```javascript
const API_URL = '/api';  // Works for both local and production
```

## Monitoring

### Check if app is running:
```bash
curl https://your-app.vercel.app/api/users
```

Should return 401 (unauthorized) if working correctly.

### Check MongoDB connection:
Look at deployment logs for:
```
✅ Connected to MongoDB
```

## Rollback (if needed)

If deployment has issues:
1. Go to Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

## Support

If issues persist:
1. Check Vercel deployment logs
2. Check MongoDB Atlas logs
3. Test locally first with same environment variables
4. Check browser console (F12) for errors

---

## Quick Deploy Command

```bash
# Make sure all changes are committed
git add .
git commit -m "Update features"

# Deploy to Vercel
vercel --prod

# Or just push to GitHub (if connected)
git push origin main
```

**Your app will be live at:** `https://your-project-name.vercel.app`

🎉 All features should work exactly the same as localhost!
