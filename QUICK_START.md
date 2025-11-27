# ⚡ QUICK START - Deploy in 10 Minutes!

## 📋 REQUIREMENTS
- ✅ MongoDB Atlas account (already done!)
- ⏳ GitHub account (need to create)
- ⏳ Vercel account (need to create)

---

## 🚀 STEP-BY-STEP

### 1️⃣ Create GitHub Account (2 mins)
```
https://github.com/signup
```
- Enter email
- Create password
- Verify email
- DONE!

### 2️⃣ Create Vercel Account (1 min)
```
https://vercel.com/signup
```
- Click "Continue with GitHub"
- Authorize
- DONE!

### 3️⃣ Push to GitHub (3 mins)

**Option A: Use Script (EASIEST)**
```bash
# Double-click deploy.bat
# Then follow instructions
```

**Option B: Manual**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
```

Then:
1. Go to: https://github.com/new
2. Name: `kolekta`
3. Create repository
4. Run commands shown

### 4️⃣ Deploy to Vercel (2 mins)
1. Go to: https://vercel.com/new
2. Import `kolekta` repository
3. Framework: **Other**
4. Click **Deploy**

### 5️⃣ Add Environment Variables (2 mins)
In Vercel → Settings → Environment Variables:

```
USE_MOCK_AUTH = false

JWT_SECRET = kolekta-super-secret-key-2024

MONGODB_URI = mongodb+srv://odinkamlson_db_user:OvdptFsdXvkSB75zu@cluster0.hna275n.mongodb.net/kolekta?appName=Cluster0

NODE_ENV = production
```

Click Save → Redeploy

### 6️⃣ Create Admin User (1 min)
MongoDB Atlas → Browse Collections → Insert:

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

---

## 🎉 DONE!

Your app: `https://your-project.vercel.app`

Login:
- Username: `admin`
- Password: `admin123`

---

## 💰 COST
**₱0/month - FREE FOREVER!**

- MongoDB Atlas: FREE (512MB)
- Vercel: FREE (unlimited projects)
- GitHub: FREE

---

## 📱 MOBILE ACCESS

Share the Vercel URL to drivers:
```
https://your-project.vercel.app
```

They can:
- Login on phone
- Start GPS tracking
- Complete routes
- Upload photos

---

## 🆘 STUCK?

Sabihin mo lang kung saan, tulungan kita!
