# 📊 Data Persistence - Bakit Bumabalik ang Data

## Problema

Pag nag-delete ka ng user/truck/route, pagkatapos ng ilang minuto bumabalik siya. Bakit?

## Dahilan

### Local (Localhost)
✅ **Gumagana ng maayos** - Data saved sa files (users.json, trucks.json, routes.json)
- Pag nag-delete ka, natatanggal talaga
- Pag nag-add ka, nandoon pa rin kahit i-restart ang server

### Online (Vercel)
❌ **Hindi permanent** - Data saved sa memory (RAM) lang
- Pag nag-delete ka, natanggal temporarily
- Pero pag nag-restart ang serverless function (every 5-15 minutes), bumabalik ang original data
- Dahil read-only ang filesystem sa Vercel

## Solusyon

### Option 1: Use MongoDB (RECOMMENDED for Production)

**Pros:**
- ✅ Permanent storage
- ✅ Data never resets
- ✅ Works on Vercel
- ✅ Scalable

**Setup:**
1. Update Vercel environment variables:
   ```
   USE_MOCK_AUTH=false
   MONGODB_URI=mongodb+srv://...@cluster0.hua275h.mongodb.net/...
   ```

2. Redeploy:
   ```bash
   vercel --prod
   ```

3. Create admin:
   ```bash
   node scripts/fix-admin-password.js
   ```

**Result:** All changes (add/edit/delete) are permanent!

---

### Option 2: Keep Mock Auth (Current Setup)

**Pros:**
- ✅ No database setup needed
- ✅ Works immediately
- ✅ Good for testing

**Cons:**
- ❌ Data resets every 5-15 minutes on Vercel
- ❌ Not suitable for production

**When to use:** Testing, development, demos

---

## Comparison

| Feature | Mock Auth (Files/Memory) | MongoDB |
|---------|-------------------------|---------|
| **Setup** | Easy | Medium |
| **Cost** | Free | Free (Atlas M0) |
| **Data Persistence (Local)** | ✅ Permanent | ✅ Permanent |
| **Data Persistence (Vercel)** | ❌ Resets | ✅ Permanent |
| **Suitable for Production** | ❌ No | ✅ Yes |
| **Suitable for Testing** | ✅ Yes | ✅ Yes |

---

## How to Switch to MongoDB

### Step 1: Verify MongoDB Connection

Make sure your MongoDB Atlas cluster is:
- ✅ Running (not paused)
- ✅ Network Access: `0.0.0.0/0` (allow all IPs)
- ✅ Connection string is correct: `cluster0.hua275h.mongodb.net`

### Step 2: Update Vercel Environment Variables

Go to Vercel Dashboard → Settings → Environment Variables:

```
USE_MOCK_AUTH = false
MONGODB_URI = mongodb+srv://odinkamlson_db_user:OvdptFsdXvkSB75zu@cluster0.hua275h.mongodb.net/kolekta?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET = kolekta-super-secret-key-2024-change-this-in-production
NODE_ENV = production
```

### Step 3: Redeploy

```bash
vercel --prod
```

### Step 4: Create Admin Account

Run locally (connected to MongoDB):
```bash
node scripts/fix-admin-password.js
```

This creates the admin account in MongoDB.

### Step 5: Test

Login online:
- Username: `admin`
- Password: `admin123`

Now all changes are permanent! 🎉

---

## Current Status

**You are using:** Mock Auth (in-memory storage)

**What this means:**
- ✅ Works great locally
- ⚠️ On Vercel, data resets every 5-15 minutes
- ⚠️ Any add/edit/delete will be lost after serverless function restarts

**Recommendation:**
- For **testing/demo**: Current setup is OK
- For **production**: Switch to MongoDB

---

## Quick Test

To see if data persists:

1. Add a new user/truck/route
2. Wait 10 minutes
3. Refresh the page
4. Check if the data is still there

**With Mock Auth:** Data will be gone
**With MongoDB:** Data will still be there

---

## Summary

- **Local:** Data persists in files ✅
- **Vercel + Mock Auth:** Data resets ❌
- **Vercel + MongoDB:** Data persists ✅

**For permanent storage online, use MongoDB!**
