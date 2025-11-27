# MongoDB Migration Guide

## Overview
Ang Kolek-Ta system ay currently gumagamit ng **JSON file storage** (mock mode). I-guide kita kung paano i-migrate sa **MongoDB** para sa production-ready database.

---

## Current Setup (Mock Mode)

### Ano ang ginagamit ngayon:
- ✅ JSON files sa `data/` folder
- ✅ `data/users.json` - User accounts
- ✅ `data/trucks.json` - Trucks
- ✅ `data/routes.json` - Routes
- ✅ `USE_MOCK_AUTH=true` sa `.env`

### Advantages ng Mock Mode:
- ✅ Walang installation needed
- ✅ Simple at mabilis
- ✅ Good for development/testing

### Disadvantages:
- ❌ Hindi scalable
- ❌ Walang advanced queries
- ❌ Limited concurrent access
- ❌ No data relationships

---

## Why Migrate to MongoDB?

### Benefits:
1. **Scalability** - Handle thousands of records
2. **Performance** - Fast queries and indexing
3. **Relationships** - Link users, trucks, routes
4. **Transactions** - ACID compliance
5. **Security** - Built-in authentication
6. **Backup** - Automatic backups (Atlas)
7. **Production-Ready** - Industry standard

---

## Migration Options

### Option 1: MongoDB Atlas (Cloud) - RECOMMENDED ⭐
**Best for:** Production, easy setup, no installation

**Pros:**
- ✅ Free tier (512MB storage)
- ✅ No installation needed
- ✅ Automatic backups
- ✅ Works anywhere
- ✅ Easy to scale

**Cons:**
- ❌ Requires internet
- ❌ Free tier has limits

### Option 2: Local MongoDB
**Best for:** Development, offline work

**Pros:**
- ✅ Works offline
- ✅ Full control
- ✅ No data limits
- ✅ Faster (local)

**Cons:**
- ❌ Requires installation
- ❌ Manual backups
- ❌ More setup

---

## Step-by-Step Migration (MongoDB Atlas)

### Step 1: Create MongoDB Atlas Account

1. **Go to:** https://www.mongodb.com/cloud/atlas/register
2. **Sign up** with email or Google
3. **Verify** your email
4. **Login** to Atlas

### Step 2: Create Free Cluster

1. Click **"Build a Database"**
2. Choose **"M0 FREE"** tier
3. **Cloud Provider:** AWS (or any)
4. **Region:** Singapore (closest to Philippines)
5. **Cluster Name:** `Kolek-Ta-Cluster`
6. Click **"Create"** (wait 3-5 minutes)

### Step 3: Create Database User

1. Click **"Database Access"** (left menu)
2. Click **"Add New Database User"**
3. **Authentication Method:** Password
4. **Username:** `kolekta_admin`
5. **Password:** Click "Autogenerate Secure Password" (SAVE THIS!)
6. **Database User Privileges:** "Read and write to any database"
7. Click **"Add User"**

### Step 4: Setup Network Access

1. Click **"Network Access"** (left menu)
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - For development only!
   - For production, use specific IP
4. Click **"Confirm"**

### Step 5: Get Connection String

1. Click **"Database"** (left menu)
2. Click **"Connect"** button on your cluster
3. Choose **"Drivers"**
4. **Driver:** Node.js
5. **Version:** 5.5 or later
6. **Copy** the connection string:
   ```
   mongodb+srv://kolekta_admin:<password>@kolek-ta-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
7. **Replace** `<password>` with your actual password

### Step 6: Update .env File

Open `.env` file and update:

```env
PORT=3001
MONGODB_URI=mongodb+srv://kolekta_admin:YOUR_PASSWORD_HERE@kolek-ta-cluster.xxxxx.mongodb.net/kolekta?retryWrites=true&w=majority
NODE_ENV=development
USE_MOCK_AUTH=false
```

**Important:** Change `USE_MOCK_AUTH` from `true` to `false`!

### Step 7: Migrate Existing Data

Run the migration script:

```cmd
node scripts/migrateToMongoDB.js
```

This will:
- ✅ Read data from JSON files
- ✅ Create MongoDB collections
- ✅ Insert all users, trucks, routes
- ✅ Preserve all data

### Step 8: Restart Server

```cmd
npm start
```

You should see:
```
✅ Connected to MongoDB
Kolek-Ta server running on port 3001
```

### Step 9: Test the Connection

1. **Login as admin:** username: `admin`, password: `admin123`
2. **Check if data loaded:** View users, trucks, routes
3. **Create new driver:** Test if saving works
4. **Login as driver:** Test driver dashboard

---

## Migration Script

Create `scripts/migrateToMongoDB.js`:

```javascript
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Import models
const User = require('../models/User');
const Truck = require('../models/Truck');
const Route = require('../models/Route');

async function migrate() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Read JSON files
    const usersData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/users.json'), 'utf8'));
    const trucksData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/trucks.json'), 'utf8'));
    const routesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/routes.json'), 'utf8'));
    
    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Truck.deleteMany({});
    await Route.deleteMany({});
    
    // Migrate Users
    console.log('Migrating users...');
    for (const user of usersData) {
      // Hash password if not already hashed
      if (!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
      await User.create(user);
    }
    console.log(`✅ Migrated ${usersData.length} users`);
    
    // Migrate Trucks
    console.log('Migrating trucks...');
    await Truck.insertMany(trucksData);
    console.log(`✅ Migrated ${trucksData.length} trucks`);
    
    // Migrate Routes
    console.log('Migrating routes...');
    await Route.insertMany(routesData);
    console.log(`✅ Migrated ${routesData.length} routes`);
    
    console.log('\\n🎉 Migration completed successfully!');
    console.log('You can now start the server with: npm start');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
```

---

## Rollback to Mock Mode

If you want to go back to JSON files:

1. **Update .env:**
   ```env
   USE_MOCK_AUTH=true
   ```

2. **Restart server:**
   ```cmd
   npm start
   ```

Your JSON files are still there, so data is preserved!

---

## Comparison: Mock vs MongoDB

| Feature | Mock (JSON) | MongoDB |
|---------|-------------|---------|
| Setup | ✅ Easy | ⚠️ Medium |
| Speed | ✅ Fast | ✅ Fast |
| Scalability | ❌ Limited | ✅ Excellent |
| Queries | ❌ Basic | ✅ Advanced |
| Relationships | ❌ No | ✅ Yes |
| Concurrent Access | ❌ Limited | ✅ Excellent |
| Backup | ⚠️ Manual | ✅ Automatic |
| Production Ready | ❌ No | ✅ Yes |

---

## Troubleshooting

### Error: "MongoServerError: bad auth"
**Solution:**
- Check username/password in connection string
- Make sure you replaced `<password>` with actual password
- Password should NOT have special characters like `<`, `>`, `@`

### Error: "connect ETIMEDOUT"
**Solution:**
- Check internet connection
- Verify IP whitelist in Network Access
- Try "Allow Access from Anywhere"

### Error: "MongooseError: Operation buffering timed out"
**Solution:**
- MongoDB cluster is still starting (wait 5 minutes)
- Check connection string format
- Verify cluster is running in Atlas

### Data not showing after migration
**Solution:**
- Check if migration script completed successfully
- Verify `USE_MOCK_AUTH=false` in .env
- Restart server
- Check MongoDB Atlas > Browse Collections

---

## Best Practices

### Development:
- ✅ Use MongoDB Atlas free tier
- ✅ Keep `USE_MOCK_AUTH=true` for quick testing
- ✅ Backup JSON files before migration

### Production:
- ✅ Use MongoDB Atlas paid tier (for backups)
- ✅ Set `USE_MOCK_AUTH=false`
- ✅ Use specific IP whitelist
- ✅ Enable authentication
- ✅ Regular backups
- ✅ Monitor performance

---

## Next Steps After Migration

1. **Test all features:**
   - [ ] Login (admin & driver)
   - [ ] User management
   - [ ] Truck management
   - [ ] Route management
   - [ ] Driver dashboard
   - [ ] Route completion
   - [ ] Forgot password

2. **Setup monitoring:**
   - MongoDB Atlas has built-in monitoring
   - Check performance metrics
   - Set up alerts

3. **Backup strategy:**
   - Atlas free tier: Manual backups
   - Atlas paid tier: Automatic backups
   - Export data regularly

---

## Support

Para sa questions:
- Check MONGODB_SETUP.md
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com/
- Contact development team

---

## Quick Reference

### Connection String Format:
```
mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/DATABASE?options
```

### Example:
```
mongodb+srv://kolekta_admin:MyP@ssw0rd@kolek-ta-cluster.abc123.mongodb.net/kolekta?retryWrites=true&w=majority
```

### Important Files:
- `.env` - Database configuration
- `server.js` - Connection logic
- `models/` - Database schemas
- `data/*.json` - Backup data
