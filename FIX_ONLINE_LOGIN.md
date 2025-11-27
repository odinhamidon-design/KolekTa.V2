# 🔧 Fix Online Login Issue

## Problem
Cannot login online - MongoDB connection error: `querySrv ENOTFOUND`

## Solution: Use Mock Auth (File-Based Storage)

### Step 1: Update Vercel Environment Variables

1. Go to https://vercel.com/dashboard
2. Click your project
3. Go to **Settings** → **Environment Variables**
4. Find or add these variables:

```
USE_MOCK_AUTH = true
JWT_SECRET = kolekta-super-secret-key-2024-change-this-in-production
NODE_ENV = production
```

5. **DELETE** the `MONGODB_URI` variable (not needed with Mock Auth)
6. Click **Save**

### Step 2: Redeploy

Option A - Using Script:
```bash
deploy-now.bat
```

Option B - Manual:
```bash
vercel --prod
```

Option C - From Vercel Dashboard:
1. Go to **Deployments** tab
2. Click latest deployment
3. Click **Redeploy**

### Step 3: Login

After deployment completes, go to your URL and login:

**Admin:**
- Username: `admin`
- Password: `sharingan`

**Driver:**
- Create from Admin panel (User Management)
- Default password: `driver123`

---

## Why Mock Auth?

Mock Auth uses file-based storage instead of MongoDB:
- ✅ No database setup needed
- ✅ Works instantly on Vercel
- ✅ All features work the same
- ✅ Data persists in `/tmp` folder
- ⚠️ Data resets on new deployment (use MongoDB for production)

---

## If You Want to Use MongoDB Later

### Step 1: Fix MongoDB Connection

1. Go to MongoDB Atlas
2. Check cluster is running (not paused)
3. Network Access → Add IP: `0.0.0.0/0`
4. Get correct connection string

### Step 2: Update Vercel

Set these environment variables:
```
USE_MOCK_AUTH = false
MONGODB_URI = mongodb+srv://odinkamlson_db_user:OvdptFsdXvkSB75zu@cluster0.hua275h.mongodb.net/kolekta?retryWrites=true&w=majority&appName=Cluster0
```

### Step 3: Create Admin in MongoDB

Run locally:
```bash
node scripts/fix-admin-password.js
```

This creates admin account in MongoDB.

---

## Quick Test

After deployment, test these URLs:

1. **Homepage:** `https://your-app.vercel.app`
   - Should show login page

2. **API Test:** `https://your-app.vercel.app/api/users`
   - Should show: `{"error":"No token provided"}`
   - This means API is working!

3. **Login Test:**
   - Username: admin
   - Password: sharingan
   - Should redirect to dashboard

---

## Troubleshooting

### Still can't login?

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Try incognito mode**
3. **Check Vercel logs:**
   - Dashboard → Deployments → Click latest → View Function Logs
4. **Verify environment variables:**
   - Settings → Environment Variables
   - Make sure `USE_MOCK_AUTH = true`

### "Invalid credentials" error?

Default credentials for Mock Auth:
- Admin: `admin` / `sharingan`
- Driver: Create new user from admin panel

### Features not working?

All features work with Mock Auth:
- ✅ User Management
- ✅ Truck Management  
- ✅ Routes Management
- ✅ Live GPS Tracking
- ✅ Notifications
- ✅ Completion History
- ✅ Photo Upload

Only difference: Data resets on new deployment.

---

## Summary

**Current Setup (Mock Auth):**
- No MongoDB needed
- Login: admin / sharingan
- All features work
- Data resets on redeploy

**Future Setup (MongoDB):**
- Permanent data storage
- Requires MongoDB Atlas setup
- Login: admin / admin123
- Data persists forever

For now, Mock Auth is the fastest way to get online! 🚀
