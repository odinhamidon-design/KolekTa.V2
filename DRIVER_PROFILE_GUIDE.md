# 👤 Driver Profile Guide

## ✅ Profile Features Available for Drivers

Good news! **Drivers already have full profile functionality!** Here's what they can do:

---

## 🎯 Features

### 1. **View Profile**
- Click the profile button in the header (shows name and profile picture)
- View all profile information:
  - Username
  - Full Name
  - Email
  - Phone Number
  - Role (Driver)
  - Profile Picture

### 2. **Edit Profile**
Drivers can update:
- ✏️ Full Name
- ✉️ Email Address
- 📱 Phone Number (format: 09XXXXXXXXX)
- 🔒 Password (optional - leave blank to keep current)

### 3. **Profile Picture**
- 📷 Upload profile picture (JPG, PNG, GIF)
- 🗑️ Remove profile picture
- 👁️ Preview before upload
- Maximum size: 2MB

---

## 📍 How to Access (Driver)

### Step 1: Login as Driver
```
Username: driver1 (or any driver account)
Password: driver123
```

### Step 2: Click Profile Button
- Located in the **top right** corner of the header
- Shows your name and profile picture/initial
- Click to open profile modal

### Step 3: View or Edit
- **View Profile**: See all your information
- **Edit Profile**: Click "✏️ Edit Profile" button
- **Change Picture**: Click "📷 Change Profile Picture" button

---

## 🖼️ Profile Layout

### Profile View Modal
```
┌─────────────────────────────────────────┐
│           My Profile                     │
├─────────────────────────────────────────┤
│                                          │
│            [Profile Picture]             │
│               or [Initial]               │
│                                          │
│   [📷 Change Profile Picture]            │
│   [🗑️ Remove Picture] (if has picture)  │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ Username: driver1                  │ │
│  │ Full Name: Juan Dela Cruz          │ │
│  │ Email: driver1@example.com         │ │
│  │ Phone Number: 09123456789          │ │
│  │ Role: [driver]                     │ │
│  └────────────────────────────────────┘ │
│                                          │
│   [✏️ Edit Profile]  [Close]            │
└─────────────────────────────────────────┘
```

### Edit Profile Modal
```
┌─────────────────────────────────────────┐
│           Edit Profile                   │
├─────────────────────────────────────────┤
│                                          │
│  Username: driver1 (disabled)            │
│                                          │
│  Full Name: [___________________]        │
│                                          │
│  Email: [___________________]            │
│                                          │
│  Phone Number: [___________________]     │
│  Format: 09XXXXXXXXX (11 digits)         │
│                                          │
│  New Password: [___________________]     │
│  (leave blank to keep current)           │
│                                          │
│  Confirm Password: [___________________] │
│                                          │
│  [💾 Save Changes]  [Cancel]            │
└─────────────────────────────────────────┘
```

---

## 🎨 Visual Indicators

### Profile Button in Header
```
┌─────────────────────────────────────────────────┐
│  Waste Management System                        │
│                                                  │
│                    [👤 Juan Dela Cruz] [Logout] │
└─────────────────────────────────────────────────┘
```

### With Profile Picture
```
[🖼️ Juan Dela Cruz]
```

### Without Profile Picture (Shows Initial)
```
[J Juan Dela Cruz]
```

---

## 📱 Driver-Specific Features

### What Drivers See:
1. ✅ Profile button (top right)
2. ✅ View profile information
3. ✅ Edit profile details
4. ✅ Change profile picture
5. ✅ Change password
6. ✅ Logout button

### What Drivers DON'T See:
- ❌ Notification badge (admin only)
- ❌ User management (admin only)
- ❌ Route assignment (admin only)
- ❌ System settings (admin only)

---

## 🔧 API Endpoints Used

### Get Profile
```
GET /api/profile/me
Authorization: Bearer {token}
```

### Update Profile
```
PUT /api/profile/me
Authorization: Bearer {token}
Content-Type: application/json

{
  "fullName": "Juan Dela Cruz",
  "email": "driver1@example.com",
  "phoneNumber": "09123456789",
  "password": "newpassword" (optional)
}
```

### Upload Profile Picture
```
POST /api/profile/picture
Authorization: Bearer {token}
Content-Type: multipart/form-data

profilePicture: [file]
```

### Remove Profile Picture
```
DELETE /api/profile/picture
Authorization: Bearer {token}
```

---

## 🧪 Testing Driver Profile

### Test Steps:
1. **Login as driver**
   ```
   Username: driver1
   Password: driver123
   ```

2. **Click profile button** (top right, shows name)

3. **View profile** - Should see all information

4. **Edit profile**:
   - Click "✏️ Edit Profile"
   - Update Full Name: "Test Driver Updated"
   - Update Phone: "09987654321"
   - Click "💾 Save Changes"

5. **Change profile picture**:
   - Click "📷 Change Profile Picture"
   - Select an image file
   - Preview should appear
   - Click "📤 Upload Picture"

6. **Verify changes**:
   - Profile picture should appear in header
   - Name should be updated
   - Reload page to confirm persistence

---

## 🚨 Common Issues

### Issue 1: "Profile button not visible"
**Solution:**
- Make sure you're logged in
- Check if header is loaded
- Hard refresh: Ctrl+Shift+R

### Issue 2: "Cannot update profile"
**Solution:**
- Check if all required fields are filled
- Email must be valid format
- Phone must be 11 digits (09XXXXXXXXX)
- Password must be at least 6 characters

### Issue 3: "Profile picture not uploading"
**Solution:**
- File must be JPG, PNG, or GIF
- File size must be under 2MB
- Check browser console for errors

### Issue 4: "Changes not saving"
**Solution:**
- Check network connection
- Verify token is valid (not expired)
- Check server is running
- Look for errors in browser console

---

## 📊 Profile Data Structure

```javascript
{
  "username": "driver1",
  "fullName": "Juan Dela Cruz",
  "email": "driver1@example.com",
  "phoneNumber": "09123456789",
  "role": "driver",
  "profilePicture": "/uploads/profile-pictures/driver1-1234567890.jpg"
}
```

---

## 🎯 Best Practices

### For Drivers:
1. ✅ Keep profile information up to date
2. ✅ Use a professional profile picture
3. ✅ Ensure phone number is correct (for emergencies)
4. ✅ Use a strong password
5. ✅ Update password regularly

### For Admins:
1. ✅ Encourage drivers to complete their profiles
2. ✅ Verify driver contact information
3. ✅ Monitor profile picture appropriateness
4. ✅ Help drivers with profile issues

---

## 📝 Profile Validation Rules

### Full Name:
- Required field
- Any characters allowed
- Recommended: First and Last name

### Email:
- Required field
- Must be valid email format
- Example: driver@example.com

### Phone Number:
- Optional field
- Must be exactly 11 digits
- Must start with 09
- Format: 09XXXXXXXXX
- Example: 09123456789

### Password:
- Optional when editing (leave blank to keep current)
- Minimum 6 characters when changing
- Must match confirmation

### Profile Picture:
- Optional
- Accepted formats: JPG, JPEG, PNG, GIF
- Maximum size: 2MB
- Recommended: Square image (e.g., 500x500px)

---

## 🔍 Debugging

### Check if profile is loaded:
```javascript
// Run in browser console
fetch('http://localhost:3000/api/profile/me', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(r => r.json())
.then(d => console.log('Profile:', d));
```

### Check if functions exist:
```javascript
// Run in browser console
console.log('showProfile:', typeof showProfile);
console.log('showEditProfile:', typeof showEditProfile);
console.log('showChangeProfilePicture:', typeof showChangeProfilePicture);
```

### Check current user:
```javascript
// Run in browser console
console.log('Current user:', user);
console.log('Role:', user.role);
```

---

## ✅ Summary

**Drivers already have full profile functionality!** They can:
- ✅ View their profile
- ✅ Edit their information
- ✅ Upload/change profile picture
- ✅ Change their password
- ✅ See their profile picture in the header

**No additional implementation needed** - the feature is already complete and working for all users including drivers!

---

**Last Updated:** November 23, 2025
**Status:** ✅ Fully Implemented
