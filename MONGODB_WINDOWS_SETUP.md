# MongoDB Windows Installation Guide

## Complete Step-by-Step Guide for Windows

---

## Step 1: Download MongoDB Community Edition

### 1.1 Go to MongoDB Download Page
```
https://www.mongodb.com/try/download/community
```

### 1.2 Select Options
- **Version:** 7.0.x (Latest stable)
- **Platform:** Windows
- **Package:** MSI

### 1.3 Click Download
- File size: ~300MB
- File name: `mongodb-windows-x86_64-7.0.x.msi`

---

## Step 2: Install MongoDB

### 2.1 Run the Installer
1. Double-click the downloaded `.msi` file
2. Click "Next" on welcome screen

### 2.2 Accept License Agreement
1. Check "I accept the terms in the License Agreement"
2. Click "Next"

### 2.3 Choose Setup Type
1. Select **"Complete"** (Recommended)
2. Click "Next"

### 2.4 Service Configuration (IMPORTANT!)
1. **Install MongoDB as a Service:** ✅ CHECK THIS!
2. **Service Name:** MongoDB
3. **Data Directory:** `C:\Program Files\MongoDB\Server\7.0\data\`
4. **Log Directory:** `C:\Program Files\MongoDB\Server\7.0\log\`
5. Click "Next"

### 2.5 Install MongoDB Compass (Optional but Recommended)
1. **Install MongoDB Compass:** ✅ CHECK THIS!
   - Compass is a GUI tool to view your database
2. Click "Next"

### 2.6 Install
1. Click "Install"
2. Wait for installation (2-3 minutes)
3. Click "Finish"

---

## Step 3: Verify Installation

### 3.1 Check if MongoDB Service is Running

**Option A: Using Services**
1. Press `Win + R`
2. Type: `services.msc`
3. Press Enter
4. Look for "MongoDB" service
5. Status should be "Running"

**Option B: Using Command Prompt**
```cmd
sc query MongoDB
```

Should show:
```
STATE              : 4  RUNNING
```

### 3.2 Check MongoDB Version

Open Command Prompt (as Administrator):
```cmd
mongod --version
```

Should show:
```
db version v7.0.x
```

### 3.3 Check if MongoDB is Listening

```cmd
netstat -an | findstr "27017"
```

Should show:
```
TCP    0.0.0.0:27017          0.0.0.0:0              LISTENING
```

---

## Step 4: Add MongoDB to PATH (If Not Already)

### 4.1 Open Environment Variables
1. Press `Win + X`
2. Click "System"
3. Click "Advanced system settings"
4. Click "Environment Variables"

### 4.2 Edit PATH Variable
1. Under "System variables", find "Path"
2. Click "Edit"
3. Click "New"
4. Add: `C:\Program Files\MongoDB\Server\7.0\bin`
5. Click "OK" on all windows

### 4.3 Verify PATH
Open NEW Command Prompt:
```cmd
mongo --version
```

Should show version info.

---

## Step 5: Create Database and User

### 5.1 Connect to MongoDB Shell

Open Command Prompt:
```cmd
mongosh
```

You should see:
```
Current Mongosh Log ID: ...
Connecting to: mongodb://127.0.0.1:27017/
Using MongoDB: 7.0.x
```

### 5.2 Create Database
```javascript
use kolekta
```

### 5.3 Create Admin User
```javascript
db.createUser({
  user: "kolekta_admin",
  pwd: "kolekta123",
  roles: [
    { role: "readWrite", db: "kolekta" },
    { role: "dbAdmin", db: "kolekta" }
  ]
})
```

Should show:
```
{ ok: 1 }
```

### 5.4 Exit MongoDB Shell
```javascript
exit
```

---

## Step 6: Update Kolek-Ta Configuration

### 6.1 Update .env File

Open `.env` file and change:

```env
PORT=3001
MONGODB_URI=mongodb://kolekta_admin:kolekta123@localhost:27017/kolekta
NODE_ENV=development
USE_MOCK_AUTH=false
```

**Important Changes:**
- `MONGODB_URI` - Local connection string
- `USE_MOCK_AUTH=false` - Switch to MongoDB mode

### 6.2 Connection String Format

```
mongodb://USERNAME:PASSWORD@HOST:PORT/DATABASE
```

Example:
```
mongodb://kolekta_admin:kolekta123@localhost:27017/kolekta
```

---

## Step 7: Migrate Data from JSON to MongoDB

### 7.1 Run Migration Script

Open Command Prompt in your project folder:
```cmd
node scripts/migrateToMongoDB.js
```

You should see:
```
🚀 Starting migration to MongoDB...
📡 Connecting to MongoDB...
✅ Connected to MongoDB
📂 Reading JSON files...
   Found 4 users
   Found 2 trucks
   Found 2 routes
🗑️  Clearing existing data...
✅ Cleared existing data
👥 Migrating users...
   ✓ Migrated user: admin (admin)
   ✓ Migrated user: driver1 (driver)
   ✓ Migrated user: driver (driver)
   ✓ Migrated user: cj (driver)
✅ Migrated 4/4 users
🚛 Migrating trucks...
   ✓ Migrated truck: TRUCK-001 (ABC-1234)
   ✓ Migrated truck: TRUCK-002 (XYZ-5678)
✅ Migrated 2/2 trucks
📍 Migrating routes...
   ✓ Migrated route: ROUTE-001 (Downtown Collection Route)
   ✓ Migrated route: ROUTE-002 (Coastal Area Collection)
✅ Migrated 2/2 routes
═══════════════════════════════════════
🎉 Migration completed successfully!
═══════════════════════════════════════
```

---

## Step 8: Start Kolek-Ta Server

### 8.1 Start Server
```cmd
npm start
```

You should see:
```
✅ Connected to MongoDB
Kolek-Ta server running on port 3001
```

### 8.2 Test Login
1. Open browser: `http://localhost:3001/login.html`
2. Login as admin: `admin` / `admin123`
3. Check if data is loaded

---

## Step 9: Using MongoDB Compass (GUI)

### 9.1 Open MongoDB Compass
1. Search "MongoDB Compass" in Start Menu
2. Click to open

### 9.2 Connect to Database
1. **Connection String:**
   ```
   mongodb://kolekta_admin:kolekta123@localhost:27017/kolekta
   ```
2. Click "Connect"

### 9.3 View Your Data
1. Click "kolekta" database
2. You'll see collections:
   - `users` - All user accounts
   - `trucks` - All trucks
   - `routes` - All routes
3. Click any collection to view data

---

## Troubleshooting

### Problem 1: MongoDB Service Won't Start

**Solution A: Start Manually**
```cmd
net start MongoDB
```

**Solution B: Check if Port 27017 is in Use**
```cmd
netstat -ano | findstr "27017"
```

If port is used by another process:
```cmd
taskkill /PID <process_id> /F
net start MongoDB
```

**Solution C: Reinstall MongoDB**
1. Uninstall MongoDB
2. Delete folders:
   - `C:\Program Files\MongoDB`
   - `C:\ProgramData\MongoDB`
3. Reinstall

### Problem 2: "MongoServerError: Authentication failed"

**Solution:**
Check username/password in connection string:
```
mongodb://kolekta_admin:kolekta123@localhost:27017/kolekta
```

Recreate user:
```cmd
mongosh
use kolekta
db.dropUser("kolekta_admin")
db.createUser({
  user: "kolekta_admin",
  pwd: "kolekta123",
  roles: [{ role: "readWrite", db: "kolekta" }]
})
```

### Problem 3: "connect ECONNREFUSED 127.0.0.1:27017"

**Solution:**
MongoDB service is not running.

```cmd
net start MongoDB
```

### Problem 4: Migration Script Fails

**Solution:**
1. Check if MongoDB is running
2. Check connection string in .env
3. Make sure JSON files exist in data/ folder
4. Run with more details:
   ```cmd
   node scripts/migrateToMongoDB.js
   ```

### Problem 5: "mongod is not recognized"

**Solution:**
Add MongoDB to PATH (see Step 4)

Or use full path:
```cmd
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --version
```

---

## MongoDB Commands Reference

### Start/Stop Service
```cmd
# Start
net start MongoDB

# Stop
net stop MongoDB

# Restart
net stop MongoDB && net start MongoDB
```

### Connect to MongoDB Shell
```cmd
mongosh
```

### Common MongoDB Shell Commands
```javascript
// Show databases
show dbs

// Use database
use kolekta

// Show collections
show collections

// Count documents
db.users.countDocuments()

// Find all users
db.users.find()

// Find one user
db.users.findOne({ username: "admin" })

// Delete all data
db.users.deleteMany({})
db.trucks.deleteMany({})
db.routes.deleteMany({})

// Exit
exit
```

---

## Backup and Restore

### Backup Database
```cmd
mongodump --db kolekta --out C:\backup\kolekta
```

### Restore Database
```cmd
mongorestore --db kolekta C:\backup\kolekta\kolekta
```

---

## Performance Tips

### 1. Create Indexes
```javascript
// In MongoDB Shell
use kolekta

// Index on username
db.users.createIndex({ username: 1 })

// Index on truckId
db.trucks.createIndex({ truckId: 1 })

// Index on routeId
db.routes.createIndex({ routeId: 1 })
```

### 2. Monitor Performance
```javascript
// Check database stats
db.stats()

// Check collection stats
db.users.stats()
```

---

## Security Best Practices

### 1. Change Default Password
```javascript
use kolekta
db.changeUserPassword("kolekta_admin", "NewStrongPassword123!")
```

Update .env:
```env
MONGODB_URI=mongodb://kolekta_admin:NewStrongPassword123!@localhost:27017/kolekta
```

### 2. Enable Authentication (Production)
Edit `C:\Program Files\MongoDB\Server\7.0\bin\mongod.cfg`:
```yaml
security:
  authorization: enabled
```

Restart MongoDB service.

### 3. Firewall Rules
Block external access to port 27017 (only allow localhost).

---

## Comparison: Local vs Atlas

| Feature | Local MongoDB | MongoDB Atlas |
|---------|--------------|---------------|
| Setup | Medium | Easy |
| Cost | Free | Free tier available |
| Internet | Not required | Required |
| Backup | Manual | Automatic |
| Scaling | Manual | Automatic |
| Maintenance | You manage | Managed |
| Performance | Fast (local) | Depends on internet |

**Recommendation:**
- **Development:** Local MongoDB
- **Production:** MongoDB Atlas

---

## Next Steps

1. ✅ MongoDB installed and running
2. ✅ Database created
3. ✅ Data migrated
4. ✅ Server connected

**Now you can:**
- Use MongoDB Compass to view data
- Create backups regularly
- Monitor performance
- Scale as needed

---

## Quick Reference Card

### Connection String
```
mongodb://kolekta_admin:kolekta123@localhost:27017/kolekta
```

### Start MongoDB
```cmd
net start MongoDB
```

### Connect to Shell
```cmd
mongosh
```

### View Data in Compass
```
mongodb://kolekta_admin:kolekta123@localhost:27017/kolekta
```

### Backup
```cmd
mongodump --db kolekta --out C:\backup
```

---

## Support

Para sa questions:
- MongoDB Docs: https://docs.mongodb.com/
- MongoDB Community: https://community.mongodb.com/
- Check MONGODB_MIGRATION_GUIDE.md
- Contact development team
