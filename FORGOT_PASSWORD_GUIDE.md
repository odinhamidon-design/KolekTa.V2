# Forgot Password Guide

## Overview
Ang Kolek-Ta system ay may **Forgot Password** feature gamit ang **Security Questions** para sa password recovery. Walang email needed!

---

## Features

### ✅ Security Question-Based Reset
- 3-step verification process
- No email required
- Secure and simple
- Works for both Admin and Driver

### ✅ Step-by-Step Process
1. Enter username
2. Answer security question
3. Set new password

---

## How to Use

### Step 1: Click "Forgot Password?"
```
1. Go to login page
2. Select role (Admin or Driver)
3. Click "Forgot Password?" link below login button
```

### Step 2: Enter Username
```
1. Modal opens: "🔐 Reset Password"
2. Enter your username
3. Click "Next"
```

### Step 3: Answer Security Question
```
1. Your security question appears
2. Enter your answer (case-insensitive)
3. Click "Verify"
```

### Step 4: Set New Password
```
1. Enter new password (min 6 characters)
2. Confirm password
3. Click "Reset Password"
4. Success! Login with new password
```

---

## Default Security Questions & Answers

### Admin Account:
```
Username: admin
Security Question: What is your favorite color?
Answer: blue
```

### Driver Accounts:

**driver1:**
```
Username: driver1
Security Question: What is your mother's maiden name?
Answer: santos
```

**driver:**
```
Username: driver
Security Question: What is your pet's name?
Answer: brownie
```

**cj:**
```
Username: cj
Security Question: What city were you born in?
Answer: mati
```

---

## Visual Guide

### Login Page with Forgot Password Link
```
┌─────────────────────────────────────┐
│         Admin Login                 │
│                                     │
│  Username: [____________]           │
│  Password: [____________]           │
│                                     │
│  [        Login        ]            │
│                                     │
│  Forgot Password? ← Click here      │
└─────────────────────────────────────┘
```

### Step 1: Enter Username
```
🔐 Reset Password                    [×]
─────────────────────────────────────────

Enter your username to verify your identity

Username: [____________]

[        Next        ]
```

### Step 2: Answer Security Question
```
🔐 Reset Password                    [×]
─────────────────────────────────────────

Answer the security question to verify 
your identity

Security Question:
What is your favorite color?

Your Answer: [____________]

[      Verify      ]  [  Back  ]
```

### Step 3: Set New Password
```
🔐 Reset Password                    [×]
─────────────────────────────────────────

✓ Identity verified! Set your new password

New Password: [____________]
Confirm Password: [____________]

[    Reset Password    ]
```

### Success Message
```
✓ Password reset successfully! 
  You can now login with your new password.

(Auto-closes in 2 seconds)
```

---

## API Endpoints

### Get Security Question
```
POST /api/auth/forgot-password/question
Body: {
  "username": "admin",
  "role": "admin"
}

Response: {
  "username": "admin",
  "securityQuestion": "What is your favorite color?"
}
```

### Verify Security Answer
```
POST /api/auth/forgot-password/verify
Body: {
  "username": "admin",
  "role": "admin",
  "answer": "blue"
}

Response: {
  "message": "Answer verified",
  "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Reset Password
```
POST /api/auth/forgot-password/reset
Body: {
  "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "newPassword": "newpass123"
}

Response: {
  "message": "Password reset successfully"
}
```

---

## Security Features

### 1. **Reset Token**
- JWT token with 15-minute expiration
- Single-use token
- Purpose-specific (password-reset only)

### 2. **Case-Insensitive Answers**
- "Blue" = "blue" = "BLUE"
- More user-friendly

### 3. **Password Hashing**
- New passwords are hashed with bcrypt
- Secure storage

### 4. **Validation**
- Minimum 6 characters
- Password confirmation required
- Username verification

---

## Testing Checklist

### As Admin:
- [ ] Click "Forgot Password?" on admin login
- [ ] Enter username: `admin`
- [ ] Answer question: `blue`
- [ ] Set new password
- [ ] Login with new password
- [ ] Verify old password doesn't work

### As Driver:
- [ ] Click "Forgot Password?" on driver login
- [ ] Enter username: `driver1`
- [ ] Answer question: `santos`
- [ ] Set new password
- [ ] Login with new password

### Error Cases:
- [ ] Wrong username → "User not found"
- [ ] Wrong answer → "Incorrect answer"
- [ ] Passwords don't match → Error message
- [ ] Password too short → Error message
- [ ] Expired token → "Reset token expired"

---

## Adding Security Questions for New Users

When creating a new driver, admin should set:

```javascript
{
  "username": "newdriver",
  "password": "password123",
  "securityQuestion": "What is your favorite food?",
  "securityAnswer": "adobo"
}
```

### Common Security Questions:
1. What is your mother's maiden name?
2. What city were you born in?
3. What is your pet's name?
4. What is your favorite color?
5. What is your favorite food?
6. What was your first car?
7. What is your childhood nickname?
8. What street did you grow up on?

---

## Troubleshooting

### Problem: "User not found"
**Solution:**
- Check spelling of username
- Verify you selected correct role
- Username is case-sensitive

### Problem: "Incorrect answer"
**Solution:**
- Check your answer
- Answers are case-insensitive
- Contact admin if you forgot

### Problem: "Reset token expired"
**Solution:**
- Start over from Step 1
- Complete process within 15 minutes

### Problem: "No security question set"
**Solution:**
- Contact admin to add security question
- Admin needs to update user data

---

## For Administrators

### Setting Security Questions:

1. **Via User Management:**
   - Edit user profile
   - Add security question and answer
   - Save changes

2. **Via Database:**
   - Edit `data/users.json`
   - Add fields:
     ```json
     "securityQuestion": "Your question?",
     "securityAnswer": "answer"
     ```

### Best Practices:
- Use questions with memorable answers
- Avoid questions with changing answers
- Store answers in lowercase
- Don't use easily guessable questions

---

## Benefits

### 1. **No Email Required**
- Works offline
- No email server needed
- Instant password reset

### 2. **User-Friendly**
- Simple 3-step process
- Clear instructions
- Visual feedback

### 3. **Secure**
- Token-based verification
- Time-limited reset tokens
- Password hashing

### 4. **Self-Service**
- Users can reset own password
- No admin intervention needed
- Available 24/7

---

## Future Enhancements

Possible improvements:
1. **Multiple Security Questions** - Answer 2 out of 3
2. **SMS Verification** - Send code via text
3. **Email Option** - Alternative to security questions
4. **Password History** - Prevent reusing old passwords
5. **Account Lockout** - After multiple failed attempts
6. **Audit Log** - Track password reset attempts

---

## Support

Para sa questions:
- Check LOGIN_FEATURES.md
- Check DRIVER_DASHBOARD_GUIDE.md
- Contact development team

---

## Quick Reference

### Test Accounts:

| Username | Role | Security Answer |
|----------|------|----------------|
| admin | Admin | blue |
| driver1 | Driver | santos |
| driver | Driver | brownie |
| cj | Driver | mati |

### Process Flow:
```
Login Page
    ↓
Click "Forgot Password?"
    ↓
Enter Username → Verify
    ↓
Answer Security Question → Verify
    ↓
Set New Password → Confirm
    ↓
Success! → Login
```
