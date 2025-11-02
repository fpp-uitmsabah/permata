# Quick Start - Enable Social Features

## What Was Fixed

The social interaction buttons (like, comment, follow, share) on portfolio pages were not functional because they required a backend server that wasn't running. This has been fixed by implementing a **Firebase Firestore** solution that works entirely client-side - no server needed!

## What You Need to Do (5 minutes)

### Step 1: Enable Firestore Database

1. Go to [Firebase Console](https://console.firebase.google.com/project/academiq-9c9zg)
2. Click on **Firestore Database** in the left menu
3. Click **Create database** button
4. Select **Start in test mode** (for quick testing)
5. Choose a location (recommend: `asia-southeast1` for Singapore/Malaysia)
6. Click **Enable**

### Step 2: Set Up Security Rules (Important!)

After Firestore is created:

1. Click on the **Rules** tab
2. Replace the default rules with this (for testing):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. Click **Publish**

⚠️ **Note**: These rules allow anyone to read/write. For production, use the secure rules in `FIRESTORE_SETUP.md`.

### Step 3: Test the Features

1. Open your portfolio page (e.g., `https://fpp-uitmsabah.github.io/permata/azizkaria.html`)
2. Click the blue **Like** button - it should now work!
3. Click the green **Comment** button - it should show the comments section
4. Try posting a comment - it should work!
5. Click the purple **Follow** button - it should work!
6. Click the pink **Share** button - it should show sharing options!

## That's It!

The social features should now be fully functional on:
- ✅ Dr. Aziz Karia's page (`azizkaria.html`)
- ✅ Social Demo page (`social-demo.html`)

## Applying to Other Pages

To add social features to other portfolio pages:

1. Open the portfolio HTML file
2. Add these scripts in the `<head>` section (before `</head>`):

```html
<!-- Firebase SDKs -->
<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js"></script>
```

3. Add this before the closing `</body>` tag:

```html
<!-- Firebase Configuration -->
<script>
    const firebaseConfig = {
        apiKey: "AIzaSyBw3CzBbdO49NpxkOqAmVI596nuB9wmt8w",
        authDomain: "academiq-9c9zg.firebaseapp.com",
        projectId: "academiq-9c9zg",
        storageBucket: "academiq-9c9zg.firebasestorage.app",
        messagingSenderId: "779034912138",
        appId: "1:779034912138:web:b2bdd60d01622bf9261473"
    };
    
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
</script>

<!-- Social Features Library -->
<script src="js/social-firebase.js"></script>

<script>
    const FACULTY_ID = 'unique-faculty-id'; // Change this!
    
    window.addEventListener('DOMContentLoaded', async () => {
        // Create container for social buttons
        const container = document.querySelector('.some-container'); // Change selector
        if (container) {
            container.appendChild(SocialUI.createSocialButtons(FACULTY_ID));
            container.appendChild(SocialUI.createCommentsSection(FACULTY_ID));
            await initSocialFeatures(FACULTY_ID);
        }
    });
</script>
```

## Features Included

### 1. Like System
- Instagram-style like button
- Shows like count
- Persistent likes (saved to Firestore)
- Works without login

### 2. Comment System
- Facebook-style comments
- Add, view, and delete your own comments
- Character counter (max 2000 chars)
- Shows "time ago" (e.g., "2 hours ago")

### 3. Follow System
- Instagram-style follow button
- Shows follower count
- Toggle follow/unfollow

### 4. Share System
- Share to Facebook, Twitter, LinkedIn, WhatsApp
- Copy link to clipboard
- Native share on mobile devices

## Troubleshooting

### "Failed to like" or "Failed to comment"

**Solution**: Make sure you completed Step 1 and Step 2 above (enable Firestore and set rules).

### Buttons don't appear

**Solution**: Check browser console (F12) for errors. Make sure Firebase scripts are loaded before `social-firebase.js`.

### "Permission denied" errors

**Solution**: Check that Firestore security rules allow read/write (Step 2 above).

## Need More Help?

- 📖 See `FIRESTORE_SETUP.md` for detailed documentation
- 📖 See `SOCIAL_FEATURES_DOCUMENTATION.md` for full feature list
- 🌐 Visit [Firebase Console](https://console.firebase.google.com/project/academiq-9c9zg)

## What Changed

| Feature | Before | After |
|---------|--------|-------|
| Like Button | ❌ Not working | ✅ Works with Firebase |
| Comment Button | ❌ Not working | ✅ Works with Firebase |
| Follow Button | ❌ Not working | ✅ Works with Firebase |
| Share Button | ❌ Not working | ✅ Works perfectly |
| Backend Server | ⚠️ Required but not running | ✅ Not needed! |
| User Login | ⚠️ Complex setup | ✅ Optional (anonymous works) |

## Demo

Try it now: Open `social-demo.html` after enabling Firestore!
