# 👤 Gabay sa Profile Management (Admin at Driver)

## Paano Gamitin ang Profile Feature

### Para sa Admin at Driver

Ang profile system ay available para sa **admin** at **driver** accounts. Pwede mong:
- Tingnan ang iyong profile information
- I-edit ang personal details
- Mag-upload ng profile picture
- Palitan ang password

---

## 🔍 Paano Tingnan ang Profile

1. **I-click ang profile button** sa upper right corner ng dashboard
   - Makikita mo ang iyong pangalan at profile picture (o initial kung walang picture)
   
2. **Lalabas ang Profile Modal** na may:
   - Profile picture o initial
   - Username
   - Full Name
   - Email
   - Phone Number (para sa drivers)
   - Role (admin o driver)

---

## ✏️ Paano I-edit ang Profile

1. **I-click ang "✏️ Edit Profile" button** sa profile modal

2. **Pwede mong i-update ang:**
   - Full Name
   - Email
   - Phone Number (para sa drivers)
   - Password (optional - leave blank kung ayaw mong palitan)

3. **I-click ang "💾 Save Changes"** para i-save ang changes

4. **Automatic reload** ng page para makita ang updated information

---

## 📷 Paano Mag-upload ng Profile Picture

### Step 1: Buksan ang Upload Form
1. I-click ang profile button sa upper right
2. I-click ang **"📷 Change Profile Picture"** button

### Step 2: Pumili ng Picture
1. I-click ang file input para pumili ng picture
2. **Accepted formats:** JPG, PNG, GIF
3. **Maximum size:** 2MB
4. **Makikita mo ang preview** ng picture bago i-upload

### Step 3: Upload
1. I-click ang **"📤 Upload Picture"** button
2. Maghintay ng confirmation message
3. **Automatic update** ng profile picture sa header at profile modal

---

## 🗑️ Paano Tanggalin ang Profile Picture

1. Buksan ang profile modal
2. I-click ang **"🗑️ Remove Picture"** button (lalabas lang ito kung may picture ka)
3. Confirm ang deletion
4. Babalik sa default initial display

---

## 🔐 Paano Palitan ang Password

1. I-click ang "✏️ Edit Profile"
2. I-type ang **new password** sa "New Password" field
3. I-type ulit ang password sa "Confirm New Password" field
4. I-click ang "💾 Save Changes"
5. **Importante:** Kung ayaw mong palitan ang password, leave blank lang ang password fields

---

## 📝 Default Admin Account

Ang default admin account ay may profile na:
- **Username:** admin
- **Full Name:** System Administrator
- **Email:** admin@kolekta.com
- **Role:** admin

Pwede mong i-edit ang lahat ng information at mag-upload ng profile picture.

---

## 🎨 Profile Features

### Profile Picture Display
- **May picture:** Lalabas ang actual picture mo (circular)
- **Walang picture:** Lalabas ang first letter ng name mo (green circle)

### Header Display
- Makikita ang profile picture o initial sa upper right corner
- I-click para buksan ang full profile

### Auto-Update
- Lahat ng changes ay automatic na nag-uupdate sa:
  - Header profile button
  - Profile modal
  - Local storage (para sa session)

---

## ⚠️ Important Notes

1. **Profile pictures** ay naka-save sa `public/uploads/profiles/` folder
2. **Maximum file size:** 2MB per picture
3. **Accepted formats:** JPG, PNG, GIF only
4. **Old pictures** ay automatic na natatanggal pag nag-upload ng bago
5. **Password changes** ay nag-require ng confirmation
6. **Admin profile** ay protected - hindi pwedeng i-delete ang admin account

---

## 🚀 Quick Access

### Para sa Admin:
1. Login as admin (username: admin, password: admin123)
2. I-click ang profile button sa upper right
3. I-edit ang profile at mag-upload ng picture

### Para sa Driver:
1. Login as driver
2. I-click ang profile button sa upper right
3. I-edit ang profile at mag-upload ng picture

---

## 🔧 Troubleshooting

### Hindi nag-uupload ang picture?
- Check kung less than 2MB ang file size
- Check kung JPG, PNG, o GIF ang format
- Try ulit o refresh ang page

### Hindi nag-uupdate ang profile?
- Check kung naka-fill up lahat ng required fields (*)
- Check kung tama ang email format
- Check kung 11 digits ang phone number (09XXXXXXXXX)

### Hindi nag-match ang passwords?
- Make sure pareho ang "New Password" at "Confirm New Password"
- Minimum 6 characters ang password

---

## 📱 Mobile Responsive

Ang profile system ay mobile-friendly:
- Responsive modals
- Touch-friendly buttons
- Optimized image display
- Easy navigation

---

## ✅ Summary

Ang profile management system ay kumpleto na para sa admin at driver:
- ✅ View profile information
- ✅ Edit personal details
- ✅ Upload profile picture (max 2MB)
- ✅ Remove profile picture
- ✅ Change password
- ✅ Auto-update sa header
- ✅ Green color scheme
- ✅ Mobile responsive

**Lahat ng users (admin at driver) ay may access sa profile features!** 🎉
