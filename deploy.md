# 🚀 AUTOMATED DEPLOYMENT GUIDE

## ✅ STEP 1: Create Accounts (5 minutes)

### GitHub Account
1. Go to: https://github.com/signup
2. Enter email, create password
3. Verify email
4. **DONE!**

### Vercel Account
1. Go to: https://vercel.com/signup
2. Click **"Continue with GitHub"**
3. Authorize Vercel
4. **DONE!**

---

## ✅ STEP 2: Push to GitHub (AUTOMATIC)

Open terminal (Ctrl + `) and run these commands:

```bash
# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Kolek-Ta Waste Management System"

# Create main branch
git branch -M main
```

**Now create GitHub repository:**
1. Go to: https://github.com/new
2. Repository name: `kolekta`
3. Click **"Create repository"**
4. Copy the commands shown (looks like this):

```bash
git remote add origin https://github.com/YOUR_USERNAME/kolekta.git
git push -u origin main
```

5. Paste and run in terminal

---

## ✅ STEP 3: Deploy to Vercel (AUTOMATIC)

### Option A: Via Vercel Website (EASIEST)
1. Go to: https://vercel.com/new
2. Click **"Import"** on your `kolekta` repository
3. Configure:
   - Framework Preset: **Other**
   - Root Directory: `./`
   - Build Command: (leave empty)
   - Output Directory: `public`
4. Click **"Deploy"**

### Option B: Via Vercel CLI (ADVANCED)
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

---

## ✅ STEP 4: Add Environment Variables

In Vercel dashboard:
1. Go to **Settings** → **Environment Variables**
2. Add these:

```
USE_MOCK_AUTH = false
JWT_SECRET = kolekta-super-secret-key-2024-change-this-in-production
MONGODB_URI = mongodb+srv://odinkamlson_db_user:OvdptFsdXvkSB75zu@cluster0.hna275n.mongodb.net/kolekta?appName=Cluster0
NODE_ENV = production
```

3. Click **"Save"**
4. Go to **Deployments** → **Redeploy**

---

## ✅ STEP 5: Initialize Database

### Create Admin User in MongoDB Atlas:
1. Go to MongoDB Atlas: https://cloud.mongodb.com
2. Click **Database** → **Browse Collections**
3. Click **"Add My Own Data"**
4. Database: `kolekta`
5. Collection: `users`
6. Click **"Insert Document"**
7. Paste this:

```json
{
  "username": "admin",
  "password": "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
  "email": "admin@kolekta.com",
  "role": "admin",
  "fullName": "Admin User",
  "isActive": true
}
```

8. Click **"Insert"**

**Login credentials:**
- Username: `admin`
- Password: `admin123`

---

## 🎉 DONE!

Your app is now live at: `https://your-project.vercel.app`

**Test it:**
1. Open the Vercel URL
2. Login with admin/admin123
3. Create drivers, trucks, routes
4. Test on mobile!

---

## 📝 SUMMARY

✅ MongoDB Atlas: Connected
✅ GitHub: Repository created
✅ Vercel: Deployed
✅ Database: Initialized
✅ Admin user: Created

**Total cost: ₱0/month (FREE forever!)**

---

## 🆘 TROUBLESHOOTING

**"Cannot connect to MongoDB"**
- Check Network Access in MongoDB Atlas
- Make sure 0.0.0.0/0 is allowed

**"Invalid token"**
- Clear browser localStorage
- Login again

**"Module not found"**
- Check package.json has all dependencies
- Redeploy from Vercel

---

## 📞 NEED HELP?

Sabihin mo lang kung saan ka nag-stuck!
