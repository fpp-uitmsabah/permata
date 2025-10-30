# Google Sign-In Authentication Guide

## Overview

The faculty directory now includes Google Sign-In authentication that allows faculty members to access editable portfolio content using their @uitm.edu.my email addresses and staff IDs.

## Features

✅ **Google Sign-In Integration**
- Faculty members can sign in with their institutional @uitm.edu.my Google account
- Domain restriction ensures only @uitm.edu.my emails can authenticate
- Automatic matching of Google email to faculty profile

✅ **Staff ID Verification**
- Alternative authentication method using employee ID
- Verifies staff ID against faculty database
- No external dependencies required

✅ **Session Management**
- Authentication state stored in sessionStorage
- Persists across navigation within the same session
- Automatically cleared when signing out

✅ **Security Features**
- Domain restriction to @uitm.edu.my
- Staff ID verification against faculty data
- Email validation
- Input sanitization

## How to Use

### For Faculty Members

#### Option 1: Sign In with Google

1. Navigate to the faculty directory homepage (index.html)
2. Click the **"Sign In"** button in the header
3. Click **"Sign in with Google"** in the authentication modal
4. Sign in with your @uitm.edu.my Google account
5. Your profile will be automatically matched based on your email
6. You'll see a success message confirming your authentication

#### Option 2: Verify with Staff ID

1. Navigate to the faculty directory homepage (index.html)
2. Click the **"Sign In"** button in the header
3. In the "Alternative: Staff ID" section, enter your employee ID (e.g., 346353)
4. Click **"Verify Staff ID"**
5. Your profile will be matched based on your staff ID
6. You'll see a success message confirming your authentication

### Authentication Status

Once authenticated:
- The "Sign In" button changes to **"Sign Out"** (green background)
- Your authentication details are stored in sessionStorage
- You can access editable portfolio content
- When you navigate to your portfolio page, it will recognize you're authenticated

### Signing Out

1. Click the **"Sign Out"** button in the header
2. Your authentication session will be cleared
3. The button will change back to "Sign In"

## Technical Details

### Data Extracted from Faculty Data

The authentication system uses the following data from the `facultyData` array in index.html:

```javascript
{
  "name": "Faculty Name",
  "email": "email@uitm.edu.my",  // Used for Google Sign-In matching
  "employee_id": "346353"         // Used for Staff ID verification
}
```

### Session Storage

When authenticated, the following data is stored in `sessionStorage`:

```javascript
{
  "email": "email@uitm.edu.my",
  "employeeId": "346353",
  "name": "Faculty Name",
  "canEdit": true,
  "authMethod": "google" // or "staffId"
}
```

### Domain Restriction

Google Sign-In is configured to only allow authentication from the `@uitm.edu.my` domain:

```javascript
googleProvider.setCustomParameters({
    'hd': 'uitm.edu.my'
});
```

If a user attempts to sign in with a non-@uitm.edu.my email, they will be automatically signed out and shown an error message.

### Email Matching

The system matches the authenticated user's email to the faculty profile:

1. User signs in with Google using their @uitm.edu.my email
2. System searches `facultyData` for matching email (case-insensitive)
3. If found, stores authentication details in sessionStorage
4. If not found, shows a warning message

### Staff ID Matching

The system verifies the staff ID against the faculty database:

1. User enters their employee ID
2. System searches `facultyData` for matching `employee_id`
3. If found, stores authentication details in sessionStorage
4. If not found, shows an error message

## Example Faculty Data

From the `facultyData` array in index.html:

```javascript
{
    "name": "AHMAD FAUZE ABDUL HAMIT",
    "position": "PENSYARAH",
    "field": "KEWANGAN",
    "phone": "088 - 325151",
    "imageUrl": "https://i.imgur.com/wvOF6kd.jpeg",
    "path": "https://fpp-uitmsabah.github.io/permata/fauze.html",
    "email": "ahmad920@uitm.edu.my",
    "employee_id": "346353"
}
```

## Troubleshooting

### "Please sign in with your @uitm.edu.my email address"

**Problem:** You tried to sign in with a non-institutional email.

**Solution:** Use your official @uitm.edu.my Google account.

### "Your email is not associated with any faculty profile"

**Problem:** Your @uitm.edu.my email is not in the faculty directory.

**Solution:** Contact the system administrator to ensure your email is added to the `facultyData` array in index.html.

### "Staff ID not found in our directory"

**Problem:** The staff ID you entered doesn't match any employee ID in the database.

**Solution:** 
- Double-check you entered the correct staff ID
- Contact the system administrator if the issue persists

### Google Sign-In popup blocked

**Problem:** Your browser blocked the Google Sign-In popup window.

**Solution:** 
- Allow popups from this website in your browser settings
- Try the Staff ID verification method instead

## For Developers

### Adding New Faculty Members

To add a new faculty member with authentication:

1. Add their data to the `facultyData` array in `index.html`
2. Include the `email` and `employee_id` fields:

```javascript
{
    "name": "NEW FACULTY NAME",
    "position": "POSITION",
    "field": "FIELD",
    "phone": "PHONE",
    "imageUrl": "IMAGE_URL",
    "path": "PORTFOLIO_URL",
    "email": "email@uitm.edu.my",     // Required for Google Sign-In
    "employee_id": "EMPLOYEE_ID"       // Required for Staff ID auth
}
```

### Firebase Configuration

Firebase is already configured in the `index.html` file. The configuration uses the existing Firebase project `academiq-9c9zg`.

### Authentication Functions

Key JavaScript functions:

- `signInWithGoogle()` - Handles Google Sign-In
- `verifyStaffId(staffId)` - Verifies staff ID
- `matchUserToFaculty(email)` - Matches email to faculty profile
- `updateAuthUI(user)` - Updates UI based on auth state
- `signOut()` - Signs out the user

### Extending to Portfolio Pages

To enable edit mode on individual portfolio pages:

1. Check sessionStorage for authenticated user:

```javascript
const authUser = JSON.parse(sessionStorage.getItem('authenticatedUser'));
if (authUser && authUser.canEdit) {
    // Enable edit mode
    enableEditMode();
}
```

2. Verify the user is accessing their own portfolio:

```javascript
if (authUser.employeeId === currentPageEmployeeId) {
    // Allow editing
}
```

## Security Considerations

⚠️ **Important Security Notes:**

1. **Client-Side Only**: This is a client-side authentication for access control. For production systems with sensitive data, implement server-side authentication.

2. **API Keys**: Firebase API keys are currently exposed in the client code. This is acceptable for Firebase as it's designed to be used in client applications, but ensure Firebase security rules are properly configured.

3. **Session Storage**: Authentication data is stored in sessionStorage, which is cleared when the browser tab is closed. For persistent sessions, consider using localStorage (but be aware of security implications).

4. **Domain Restriction**: The @uitm.edu.my domain restriction is enforced on the client side. Ensure Firebase authentication settings also restrict the authorized domains.

## Screenshots

### Sign In Button
![Sign In Button](https://github.com/user-attachments/assets/94ca9660-ae04-4474-93cc-6205a4c6dfba)

### Staff ID Verification Success
![Staff ID Verified](https://github.com/user-attachments/assets/cfe0cb7e-e845-4936-9bcf-c4740352e3f0)

## Support

For issues or questions about the authentication system:
1. Check this guide for troubleshooting steps
2. Review the console for error messages (F12 in most browsers)
3. Contact the system administrator

---

**Last Updated:** October 2025  
**Version:** 1.0.0
