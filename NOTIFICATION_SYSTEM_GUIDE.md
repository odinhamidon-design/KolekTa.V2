# 🔔 Notification System Guide

## Overview

Ang notification system ay para sa **admin users only** para makita ang mga completed routes ng drivers with proof photos.

---

## 📍 Location

Ang notification icon ay naka-display sa **header, right side ng profile button**:

```
┌─────────────────────────────────────────────────┐
│  Kolek-Ta Dashboard                             │
│                                                 │
│              [Profile] [🔔 0] [Logout]         │
│                  ↑        ↑       ↑            │
│               Profile  Notif  Logout           │
└─────────────────────────────────────────────────┘
```

---

## ✨ Features

### 1. ✅ Real-time Notification Badge
- Shows number of pending notifications
- Red badge when may new notifications
- Auto-updates every 30 seconds
- Click to view details

### 2. ✅ Notification Details
- Route name and ID
- Driver name
- Completion date and time
- Completion notes
- Proof photos (clickable to view full size)
- Individual delete button per notification
- Individual acknowledge button per notification

### 3. ✅ Delete Functionality
- **Delete Single:** Delete one notification at a time
- **Delete All:** Delete all pending notifications at once
- Confirmation dialog before deletion
- Cannot be undone

### 4. ✅ Notification History
- View all completed routes (acknowledged and pending)
- Sorted by completion date (newest first)
- Shows status: Pending or Acknowledged
- View all proof photos
- Access via "📜 View History" button

### 5. ✅ Acknowledge System
- **Acknowledge Single:** Mark one notification as read
- **Acknowledge All:** Mark all notifications as read
- Acknowledged notifications move to history
- Badge updates automatically

---

## 🎨 Visual Guide

### Notification Badge States

#### No Notifications
```
┌──────────┐
│ 🔔  0    │  ← Gray, no alert
└──────────┘
```

#### Has Notifications
```
┌──────────┐
│ 🔔  3    │  ← Red badge, pulsing animation
└──────────┘
     ↑
  Click here
```

### Notification Details Modal

```
┌─────────────────────────────────────────────────┐
│  🔔 Route Completion Notifications              │
├─────────────────────────────────────────────────┤
│                                                 │
│  3 routes have been completed by drivers!       │
│                          [📜 View History]      │
│  ─────────────────────────────────────────────  │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ ✓ Downtown Collection Route               │ │
│  │   ROUTE-001                                │ │
│  │                    [✓ Acknowledge] [🗑️]   │ │
│  │                                            │ │
│  │ Completed by: Juan Dela Cruz              │ │
│  │ Completed at: Nov 23, 2025 10:30 AM       │ │
│  │ Notes: All bins collected successfully     │ │
│  │                                            │ │
│  │ Proof Photos:                              │ │
│  │ [📷] [📷] [📷]                             │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  [✓ Acknowledge All]  [🗑️ Delete All]         │
└─────────────────────────────────────────────────┘
```

### Notification History Modal

```
┌─────────────────────────────────────────────────┐
│  📜 Notification History                        │
├─────────────────────────────────────────────────┤
│                                                 │
│  Showing 5 completed routes                     │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 🔔 Downtown Route          [Pending]      │ │
│  │   ROUTE-001                                │ │
│  │   Driver: Juan Dela Cruz                   │ │
│  │   Completed: Nov 23, 2025 10:30 AM        │ │
│  │   Photos: [📷] [📷] [📷]                  │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ ✓ Coastal Route            [Acknowledged] │ │
│  │   ROUTE-002                                │ │
│  │   Driver: Pedro Santos                     │ │
│  │   Completed: Nov 22, 2025 3:15 PM         │ │
│  │   Photos: [📷] [📷]                       │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  [Close]                                        │
└─────────────────────────────────────────────────┘
```

---

## 🚀 How to Use

### Para sa Admin:

#### 1. View Notifications
1. Login as admin
2. Tingnan ang notification badge sa header (right side ng profile)
3. Kung may number (e.g., "🔔 3"), may pending notifications
4. Click ang badge para makita ang details

#### 2. Acknowledge Single Notification
1. Click notification badge
2. Sa notification details, click **"✓ Acknowledge"** sa specific notification
3. Notification will be marked as read
4. Badge count will decrease

#### 3. Delete Single Notification
1. Click notification badge
2. Sa notification details, click **"🗑️ Delete"** sa specific notification
3. Confirm deletion
4. Notification will be removed
5. Badge count will decrease

#### 4. Acknowledge All Notifications
1. Click notification badge
2. Click **"✓ Acknowledge All"** button sa bottom
3. All notifications will be marked as read
4. Badge will show "0"

#### 5. Delete All Notifications
1. Click notification badge
2. Click **"🗑️ Delete All"** button sa bottom
3. Confirm deletion
4. All notifications will be removed
5. Badge will show "0"

#### 6. View History
1. Click notification badge
2. Click **"📜 View History"** button
3. Makikita mo ang lahat ng completed routes
4. Pending and Acknowledged notifications
5. Sorted by date (newest first)

---

## 🔄 Auto-Update System

### Real-time Checking
- Checks for new notifications every **30 seconds**
- Automatic badge update
- No need to refresh page

### After Actions
- After acknowledge: Auto-check after 5 seconds
- After delete: Auto-check after 5 seconds
- After delete all: Auto-check after 5 seconds

---

## 📊 Notification Data

### What's Included:
- ✅ Route ID and Name
- ✅ Driver name (completedBy)
- ✅ Completion date and time
- ✅ Completion notes (if any)
- ✅ Proof photos (1-10 photos)
- ✅ Status (pending/acknowledged)

### Photo Features:
- Thumbnail display (100x100px)
- Click to view full size (opens in new tab)
- Multiple photos per notification
- Responsive layout

---

## 🎯 Button Functions

### In Notification Details:

| Button | Function | Confirmation |
|--------|----------|--------------|
| ✓ Acknowledge | Mark single as read | No |
| 🗑️ Delete | Delete single notification | Yes |
| ✓ Acknowledge All | Mark all as read | No |
| 🗑️ Delete All | Delete all notifications | Yes |
| 📜 View History | Open history modal | No |

### In History Modal:

| Button | Function |
|--------|----------|
| Close | Close modal |

---

## 🎨 Color Coding

### Badge Colors:
- **White with Green text:** No notifications
- **White with Red text:** Has notifications
- **Red badge:** Notification count

### Notification Status:
- **Green border:** Pending notification
- **Gray border:** Acknowledged notification

### Buttons:
- **Green:** Acknowledge actions
- **Red:** Delete actions
- **Blue:** History/Info actions

---

## 💾 Data Storage

### Pending Notifications:
- Stored in: `data/routes.json`
- Field: `notificationSent: false`
- Status: `completed`

### History:
- Stored in: Browser localStorage
- Key: `notificationHistory`
- Max items: 50 (auto-cleanup)

---

## 🔐 Security

### Admin Only:
- Only admin users can see notifications
- Driver users don't see notification icon
- Protected by role-based access

### API Endpoints:
- `/api/completions/notifications/pending` - Get pending
- `/api/completions/notifications/:id/read` - Mark as read
- All endpoints require authentication token

---

## 📱 Mobile Responsive

Notification system works on:
- ✅ Desktop
- ✅ Laptop
- ✅ Tablet
- ✅ Mobile

Features:
- Responsive badge size
- Scrollable notification list
- Touch-friendly buttons
- Optimized photo display

---

## 🐛 Troubleshooting

### Badge not showing?
- Check if logged in as admin
- Refresh page
- Check browser console for errors

### Notifications not updating?
- Wait 30 seconds for auto-update
- Click badge to manually refresh
- Check server is running

### Photos not loading?
- Check if photos exist in `public/uploads/completions/`
- Check file permissions
- Try opening photo in new tab

### Delete not working?
- Confirm deletion dialog
- Check network connection
- Check server logs

---

## ✅ Feature Checklist

### Notification Badge:
- [x] Shows in header (right of profile)
- [x] Real-time count display
- [x] Red badge when has notifications
- [x] Auto-updates every 30 seconds
- [x] Click to view details

### Notification Details:
- [x] Route information
- [x] Driver name
- [x] Completion date/time
- [x] Completion notes
- [x] Proof photos (clickable)
- [x] Individual acknowledge button
- [x] Individual delete button
- [x] Acknowledge all button
- [x] Delete all button
- [x] View history button

### History:
- [x] View all completed routes
- [x] Show pending and acknowledged
- [x] Sort by date (newest first)
- [x] Display all photos
- [x] Status indicators
- [x] Scrollable list

### Delete Functionality:
- [x] Delete single notification
- [x] Delete all notifications
- [x] Confirmation dialogs
- [x] Auto-update after delete
- [x] Cannot undo

---

## 🎉 Summary

Ang notification system ay **COMPLETE** with:
- ✅ Real-time badge updates
- ✅ Notification details with photos
- ✅ Individual and bulk actions
- ✅ Delete functionality
- ✅ Notification history
- ✅ Mobile responsive
- ✅ Admin only access
- ✅ Green color scheme

**Position:** Right side ng profile button sa header
**Auto-update:** Every 30 seconds
**History:** Available via "View History" button

**Everything is working and ready to use!** 🚀
