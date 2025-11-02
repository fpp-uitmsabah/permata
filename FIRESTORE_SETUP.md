# Firebase Firestore Setup Guide

## Overview

The social media features (like, comment, follow, share) now use Firebase Firestore for data storage. This eliminates the need for a separate backend server and makes the features work immediately.

## Firebase Project Configuration

The project uses Firebase project: **academiq-9c9zg**

- Project ID: `academiq-9c9zg`
- Firebase Console: https://console.firebase.google.com/project/academiq-9c9zg

## Required Setup Steps

### 1. Enable Firestore Database

1. Go to Firebase Console: https://console.firebase.google.com/project/academiq-9c9zg
2. Navigate to **Firestore Database** in the left sidebar
3. Click **Create database**
4. Choose **Start in production mode** or **Start in test mode** (see security rules below)
5. Select a Cloud Firestore location (e.g., `asia-southeast1` for Singapore)
6. Click **Enable**

### 2. Configure Security Rules

The Firestore database needs proper security rules to allow users to interact with social features.

#### Option A: Development/Testing Rules (Open Access)

**⚠️ CRITICAL WARNING: TESTING ONLY - DO NOT USE IN PRODUCTION! ⚠️**

**These rules allow ANYONE on the internet to read, write, and delete ALL your data!**
**Use ONLY for local development/testing and for a LIMITED TIME (24-48 hours max)**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ⚠️ DANGER: Allow anyone to read and write (TESTING ONLY - EXPIRES SOON!)
    // TODO: Replace with Option B (production rules) within 48 hours
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, 12, 31);  // Set near expiry
    }
  }
}
```

**After testing, IMMEDIATELY switch to Option B (Production Rules) below!**

#### Option B: Production Rules (Recommended)

**Use for production with proper security:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Likes collection
    match /likes/{likeId} {
      // Anyone can read likes
      allow read: if true;
      // Users can only create/update their own likes
      allow create, update: if request.auth != null || request.resource.data.userId != null;
      // Users can only delete their own likes
      allow delete: if request.auth != null || resource.data.userId == request.resource.data.userId;
    }
    
    // Comments collection
    match /comments/{commentId} {
      // Anyone can read comments
      allow read: if true;
      // Users can create comments if they have a userId and userName
      allow create: if request.resource.data.userId != null && request.resource.data.userName != null;
      // Users can only update their own comments
      allow update: if resource.data.userId == request.resource.data.userId;
      // Users can only delete their own comments
      allow delete: if resource.data.userId == request.resource.data.userId;
    }
    
    // Follows collection
    match /follows/{followId} {
      // Anyone can read follows
      allow read: if true;
      // Users can only create/update their own follows
      allow create, update: if request.resource.data.userId != null && request.resource.data.userName != null;
      // Users can only delete their own follows
      allow delete: if resource.data.userId == request.resource.data.userId;
    }
  }
}
```

### How to Set Security Rules

1. Go to Firebase Console > Firestore Database
2. Click on the **Rules** tab
3. Paste the appropriate rules (Option A for testing, Option B for production)
4. Click **Publish**

### 3. Verify Configuration

After enabling Firestore and setting up rules:

1. Open any portfolio page (e.g., `azizkaria.html`)
2. Open browser Developer Tools (F12)
3. Go to the **Console** tab
4. Look for messages:
   - "Firebase initialized successfully"
   - "Initializing social features for..."
   - "Social features initialized successfully!"

5. Test the features:
   - Click the **Like** button - should work
   - Click the **Comment** button - should open comments section
   - Try posting a comment - should work
   - Click the **Follow** button - should work
   - Click the **Share** button - should show share options

## Data Structure

### Likes Collection (`likes`)

```javascript
{
  facultyId: string,      // ID of the faculty member
  userId: string,         // Anonymous or authenticated user ID
  userName: string,       // User's display name
  reactionType: string,   // "like", "love", "insightful", "celebrate"
  createdAt: timestamp    // When the like was created
}
```

Document ID format: `{facultyId}_{userId}`

### Comments Collection (`comments`)

```javascript
{
  facultyId: string,      // ID of the faculty member
  userId: string,         // Anonymous or authenticated user ID
  userName: string,       // User's display name
  userEmail: string,      // User's email (optional)
  content: string,        // Comment text (max 2000 chars)
  createdAt: timestamp,   // When the comment was created
  updatedAt: timestamp    // When the comment was last updated
}
```

### Follows Collection (`follows`)

```javascript
{
  facultyId: string,      // ID of the faculty member being followed
  userId: string,         // Follower's user ID
  userName: string,       // Follower's display name
  userEmail: string,      // Follower's email (optional)
  createdAt: timestamp    // When the follow was created
}
```

Document ID format: `{facultyId}_{userId}`

## Anonymous User System

The social features support anonymous users without requiring authentication:

1. **User ID Generation**: A unique ID is generated and stored in `localStorage` when a user first interacts
2. **User Name**: The first time a user interacts, they are prompted to enter their name
3. **Persistence**: User ID and name are stored in `localStorage` for future visits
4. **Privacy**: No email or personal information is required (optional for comments)

### LocalStorage Keys

- `social_user_id`: Unique identifier for the user
- `social_user_name`: User's display name
- `social_user_email`: User's email (optional)

## Troubleshooting

### Issue: "Firebase is not initialized"

**Solution:**
- Ensure Firebase scripts are loaded before the social features script:
  ```html
  <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
  <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js"></script>
  <script src="js/social-firebase.js"></script>
  ```

### Issue: "Permission denied" when trying to like/comment

**Solution:**
- Check Firestore security rules in Firebase Console
- For testing, use the open access rules (Option A above)
- For production, ensure rules allow creation with userId/userName

### Issue: Likes/Comments not persisting

**Solution:**
1. Check that Firestore is enabled in Firebase Console
2. Check browser console for errors
3. Verify security rules allow write operations
4. Check that the Firebase config is correct

### Issue: "Failed to get document" errors

**Solution:**
1. Verify Firestore database is enabled
2. Check that the Firebase project ID is correct (`academiq-9c9zg`)
3. Ensure network connectivity to Firebase

## Migration from Backend API

The new Firebase implementation replaces the previous backend API (`server.js` + Prisma). Benefits:

✅ **No server required** - Works entirely client-side
✅ **Real-time updates** - Changes reflect immediately
✅ **Scalable** - Firebase handles scaling automatically
✅ **Free tier** - Generous free quota for small to medium usage
✅ **Reliable** - Google's infrastructure ensures high availability

## Cost Considerations

Firebase Firestore has a generous free tier:

- **Stored data**: 1 GiB
- **Document reads**: 50,000 per day
- **Document writes**: 20,000 per day
- **Document deletes**: 20,000 per day

For a faculty portfolio directory with moderate traffic, this should be more than sufficient. Monitor usage in Firebase Console > Usage tab.

## Future Enhancements

Potential improvements:

- [ ] Add Firebase Authentication for verified users
- [ ] Implement real-time listeners for live updates
- [ ] Add moderation features for comments
- [ ] Implement notification system
- [ ] Add analytics tracking
- [ ] Support for threaded replies
- [ ] Rich text formatting in comments
- [ ] Image attachments in comments

## Support

For issues:
1. Check browser console for error messages
2. Verify Firebase setup in console
3. Review security rules
4. Check network requests in Developer Tools

## Resources

- [Firebase Console](https://console.firebase.google.com/)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Pricing](https://firebase.google.com/pricing)
