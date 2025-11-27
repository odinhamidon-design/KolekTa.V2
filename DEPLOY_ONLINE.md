# 🚀 I-HOST ONLINE ANG KOLEK-TA

## PINAKAMADALING PARAAN: Render.com

### Step 1: Push sa GitHub (5 minutes)

```bash
# Initialize git (kung wala pa)
git init
git add .
git commit -m "Kolek-Ta System"
git branch -M main
```

**Create GitHub repo:**
1. Go to: https://github.com/new
2. Repository name: `kolekta-system`
3. Click "Create repository"
4. Run commands shown:
```bash
git remote add origin https://github.com/YOUR_USERNAME/kolekta-system.git
git push -u origin main
```

---

### Step 2: Deploy sa Render.com (3 minutes)

1. **Sign up**: https://render.com/register
   - Use GitHub account (1-click)

2. **Create Web Service**:
   - Click "New +" → "Web Service"
   - Connect GitHub repository
   - Select `kolekta-system`

3. **Configure**:
   - **Name**: `kolekta`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: Free

4. **Environment Variables** (Click "Advanced"):
   ```
   USE_MOCK_AUTH=true
   JWT_SECRET=kolekta-super-secret-key-2024
   NODE_ENV=production
   ```

5. **Click "Create Web Service"**

**TAPOS NA!** 🎉

Your app will be live at: `https://kolekta.onrender.com`

---

## ALTERNATIVE: Railway.app (Mas mabilis)

1. Go to: https://railway.app
2. Click "Start a New Project"
3. "Deploy from GitHub repo"
4. Select your repo
5. Add environment variables
6. Done!

**URL**: `https://kolekta-production.up.railway.app`

---

## ALTERNATIVE: Vercel (Gamit ang CLI)

Naka-install na ang Vercel CLI. Run:

```bash
vercel login
vercel --prod
```

Follow prompts, tapos deployed na!

---

## 📱 TESTING

1. Open ang URL na binigay
2. Login:
   - Username: `admin`
   - Password: `sharingan`
3. Test sa mobile phone mo!

---

## 💡 TIPS

**Para sa Mobile Access:**
- Share lang ang URL sa drivers
- Bookmark nila sa phone
- Works offline (GPS tracking)

**Para sa Custom Domain:**
- Render.com: Settings → Custom Domain
- Add your domain (e.g., kolekta.com)

**Para sa MongoDB (later):**
- Set `USE_MOCK_AUTH=false`
- Add `MONGODB_URI` sa environment variables
- Redeploy

---

## 🆘 TROUBLESHOOTING

**"Build failed"**
- Check if `package.json` has all dependencies
- Make sure `node_modules` is in `.gitignore`

**"Cannot access"**
- Wait 2-3 minutes for first deploy
- Check if service is "Live" in dashboard

**"Login not working"**
- Clear browser cache
- Check environment variables are set

---

## 💰 COST

**Render.com Free Tier:**
- ✅ FREE forever
- ✅ Auto-deploy on git push
- ✅ SSL certificate included
- ⚠️ Sleeps after 15 min inactivity (wakes up in 30 sec)

**Railway.app:**
- ✅ $5 free credit/month
- ✅ No sleep
- ✅ Faster

**Vercel:**
- ✅ FREE forever
- ✅ Super fast
- ⚠️ Better for static sites (pero pwede pa rin)

---

## 🎯 RECOMMENDED

**For Production**: Render.com or Railway.app
**For Testing**: Vercel (fastest deploy)

Sabihin mo kung saan ka mag-deploy, tutulungan kita! 🚀
