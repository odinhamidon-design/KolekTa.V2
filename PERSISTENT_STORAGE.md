# Persistent Storage

## Overview
Ang Kolek-Ta system ay gumagamit ng **JSON file-based persistent storage** para sa mock authentication mode. Ibig sabihin, lahat ng data (users, trucks, routes) ay naka-save sa JSON files at hindi mawawala kahit i-restart ang server.

## Storage Files
Ang lahat ng data ay naka-store sa `data/` folder:

- **data/users.json** - Lahat ng users (admin at drivers)
- **data/trucks.json** - Lahat ng trucks
- **data/routes.json** - Lahat ng routes

## Features

### ✅ Permanent Data
- Kapag nag-add ka ng driver, **permanent na ito**
- Kapag nag-add ka ng truck, **permanent na ito**
- Kapag nag-create ka ng route, **permanent na ito**
- Kahit i-restart ang server, **nandyan pa rin ang data**

### ✅ Password Hashing
- Ang mga bagong drivers ay may **hashed passwords** gamit ang bcrypt
- Mas secure kaysa plain text passwords
- Ang existing mock users ay may backward compatibility

### ✅ Auto-Initialize
- Kapag first time run, automatic na mag-create ng default data:
  - Admin account (username: `admin`, password: `admin123`)
  - 2 sample drivers
  - 2 sample trucks
  - 1 sample route

## How It Works

### Adding a Driver
```javascript
// When admin adds a driver:
POST /api/users
{
  "username": "newdriver",
  "email": "newdriver@kolekta.com",
  "password": "password123",
  "fullName": "New Driver Name",
  "phoneNumber": "09123456789"
}

// The system will:
1. Hash the password
2. Save to data/users.json
3. Data persists even after server restart
```

### Updating Data
```javascript
// When updating a driver:
PUT /api/users/:id
{
  "email": "newemail@kolekta.com",
  "phoneNumber": "09987654321"
}

// The system will:
1. Update the data in memory
2. Save to data/users.json
3. Changes are permanent
```

### Deleting Data
```javascript
// When deleting a driver:
DELETE /api/users/:id

// The system will:
1. Remove from memory
2. Update data/users.json
3. Deletion is permanent
```

## Manual Data Management

### Viewing Data
Pwede mong buksan ang JSON files directly:
```bash
# View users
type data\users.json

# View trucks
type data\trucks.json

# View routes
type data\routes.json
```

### Resetting Data
Kung gusto mong i-reset ang data to defaults:
```bash
# Delete the JSON files
del data\users.json
del data\trucks.json
del data\routes.json

# Restart the server
npm start

# The system will recreate the files with default data
```

### Backup Data
Para mag-backup ng data:
```bash
# Create backup folder
mkdir backup

# Copy JSON files
copy data\*.json backup\
```

### Restore Data
Para i-restore ang backup:
```bash
# Copy backup files back
copy backup\*.json data\
```

## Technical Details

### Storage Module
Location: `data/storage.js`

Functions:
- `usersStorage.getAll()` - Get all users
- `usersStorage.add(user)` - Add new user
- `usersStorage.update(username, updates)` - Update user
- `usersStorage.delete(username)` - Delete user
- Similar functions for trucks and routes

### Initialization
Sa `server.js`:
```javascript
if (useMockAuth) {
  initialize(); // Initialize storage on startup
}
```

### Data Format
All data is stored in JSON format with proper indentation for readability.

## Benefits

1. **No Database Required** - Walang kailangan i-install na MongoDB
2. **Easy to Debug** - Pwede mong tingnan ang data directly sa JSON files
3. **Portable** - Pwede mong i-copy ang data folder to another machine
4. **Version Control Friendly** - Pwede mong i-commit ang data sa Git (optional)
5. **Fast** - Mabilis ang read/write operations

## Limitations

1. **Not for Production** - This is for development/testing only
2. **No Transactions** - Walang ACID guarantees
3. **File Locking** - Possible issues with concurrent writes (pero rare sa single-server setup)
4. **Size Limits** - Not suitable for very large datasets

## Migration to MongoDB

Kapag ready ka na gumamit ng MongoDB:
1. Set `USE_MOCK_AUTH=false` sa `.env`
2. Configure MongoDB connection
3. Run migration script (if needed)
4. The system will automatically use MongoDB instead of JSON files

## Support

Para sa questions or issues, check ang main README.md o contact ang development team.
