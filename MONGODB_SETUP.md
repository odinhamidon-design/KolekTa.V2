# MongoDB Installation Guide for Windows

## Option 1: Install MongoDB Community Edition (Recommended)

### Step 1: Download MongoDB
1. Go to: https://www.mongodb.com/try/download/community
2. Select:
   - Version: Latest (7.0 or higher)
   - Platform: Windows
   - Package: MSI
3. Click "Download"

### Step 2: Install MongoDB
1. Run the downloaded `.msi` file
2. Choose "Complete" installation
3. **IMPORTANT:** Check "Install MongoDB as a Service"
4. **IMPORTANT:** Check "Install MongoDB Compass" (GUI tool)
5. Click "Next" and "Install"

### Step 3: Verify Installation
Open Command Prompt and run:
```cmd
mongod --version
```

### Step 4: Start MongoDB Service
MongoDB should auto-start as a service. If not:
```cmd
net start MongoDB
```

### Step 5: Create Default Users
```cmd
node scripts/createUsers.js
```

---

## Option 2: Use MongoDB Atlas (Cloud - Free)

If you don't want to install MongoDB locally:

### Step 1: Create Free Account
1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Sign up for free account

### Step 2: Create Cluster
1. Choose "Free Shared" tier
2. Select region closest to you
3. Click "Create Cluster"

### Step 3: Setup Database Access
1. Click "Database Access" in left menu
2. Click "Add New Database User"
3. Username: `kolekta_admin`
4. Password: Generate or create strong password
5. Click "Add User"

### Step 4: Setup Network Access
1. Click "Network Access" in left menu
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for development)
4. Click "Confirm"

### Step 5: Get Connection String
1. Click "Database" in left menu
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your actual password

### Step 6: Update .env File
```env
PORT=3001
MONGODB_URI=mongodb+srv://kolekta_admin:<password>@cluster0.xxxxx.mongodb.net/kolekta?retryWrites=true&w=majority
NODE_ENV=development
```

### Step 7: Create Default Users
```cmd
node scripts/createUsers.js
```

---

## Option 3: Quick Test Without MongoDB

For quick testing without database, I can create a mock authentication system.

---

## Troubleshooting

### Error: "connect ECONNREFUSED"
- MongoDB is not running
- Solution: Start MongoDB service or use MongoDB Atlas

### Error: "MongoServerError: Authentication failed"
- Wrong credentials in connection string
- Solution: Check username/password in .env

### MongoDB Service Won't Start
```cmd
# Check if service exists
sc query MongoDB

# Try manual start
net start MongoDB

# If fails, reinstall MongoDB
```

---

## Which Option Should You Choose?

- **Option 1 (Local)**: Best for development, faster, works offline
- **Option 2 (Cloud)**: No installation needed, works anywhere, free tier available
- **Option 3 (Mock)**: Quick testing only, no real database

**Recommendation:** Use Option 2 (MongoDB Atlas) for easiest setup!
