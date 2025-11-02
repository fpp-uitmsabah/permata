# Social Media Features Documentation

## Overview

The portfolio directory now includes comprehensive social media features inspired by popular platforms like Instagram and Facebook. These features allow visitors to interact with faculty profiles through likes, comments, follows, and sharing.

## Features

### 1. Like & React System
- **Instagram/Facebook-style reactions** to faculty profiles
- Support for multiple reaction types: `like`, `love`, `insightful`, `celebrate`
- Visual feedback with animated buttons
- Real-time like counter updates
- Anonymous user tracking (no login required)

### 2. Comment System
- **Facebook-style commenting** on faculty profiles
- Add, view, and delete comments
- User attribution with display names
- Time-ago formatting (e.g., "2 hours ago")
- Pagination support for large comment lists
- XSS protection for user-generated content

### 3. Follow System
- **Instagram-style following** for faculty members
- Follow/Unfollow with visual state changes
- Follower count display
- Track who's following whom

### 4. Social Sharing
- **Multi-platform sharing** with one click
- Supported platforms:
  - Facebook
  - Twitter
  - LinkedIn
  - WhatsApp
  - Email
- Web Share API integration for mobile devices
- Copy-to-clipboard fallback
- Rich preview cards with Open Graph meta tags

## Technical Architecture

### Backend (Express.js + Prisma)

#### Database Schema

```prisma
model Faculty {
  id           String   @id @default(cuid())
  // ... existing fields ...
  likes        Like[]
  comments     Comment[]
  followers    Follow[] @relation("FollowingFaculty")
}

model Like {
  id           String   @id @default(cuid())
  facultyId    String
  faculty      Faculty  @relation(fields: [facultyId], references: [id])
  userId       String
  userName     String?
  reactionType String   @default("like")
  createdAt    DateTime @default(now())
  @@unique([facultyId, userId])
}

model Comment {
  id          String   @id @default(cuid())
  facultyId   String
  faculty     Faculty  @relation(fields: [facultyId], references: [id])
  userId      String
  userName    String
  userEmail   String?
  content     String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Follow {
  id          String   @id @default(cuid())
  facultyId   String
  faculty     Faculty  @relation("FollowingFaculty", fields: [facultyId], references: [id])
  userId      String
  userName    String
  userEmail   String?
  createdAt   DateTime @default(now())
  @@unique([facultyId, userId])
}
```

#### API Endpoints

##### Like Endpoints
```javascript
POST   /api/social/like              // Like a faculty profile
DELETE /api/social/like              // Unlike a faculty profile
GET    /api/social/likes/:facultyId  // Get all likes for a profile
```

##### Comment Endpoints
```javascript
POST   /api/social/comment              // Add a comment
GET    /api/social/comments/:facultyId  // Get comments (paginated)
DELETE /api/social/comment/:commentId   // Delete a comment
```

##### Follow Endpoints
```javascript
POST   /api/social/follow                // Follow a faculty member
DELETE /api/social/follow                // Unfollow a faculty member
GET    /api/social/followers/:facultyId  // Get followers list
```

##### Stats Endpoint
```javascript
GET    /api/social/stats/:facultyId  // Get all social stats (likes, comments, followers)
```

### Frontend (JavaScript + Tailwind CSS)

#### Core Library: `js/social.js`

##### SocialAPI Object
```javascript
// Like a profile
await SocialAPI.like(facultyId, reactionType);

// Unlike a profile
await SocialAPI.unlike(facultyId);

// Get likes
const likes = await SocialAPI.getLikes(facultyId);

// Add comment
await SocialAPI.addComment(facultyId, content);

// Get comments
const comments = await SocialAPI.getComments(facultyId, limit, offset);

// Delete comment
await SocialAPI.deleteComment(commentId);

// Follow faculty
await SocialAPI.follow(facultyId);

// Unfollow faculty
await SocialAPI.unfollow(facultyId);

// Get stats
const stats = await SocialAPI.getStats(facultyId);
```

##### SocialUI Object
```javascript
// Create social action buttons
const buttons = SocialUI.createSocialButtons(facultyId);

// Create comments section
const commentsSection = SocialUI.createCommentsSection(facultyId);

// Render a single comment
const commentHTML = SocialUI.renderComment(comment, canDelete);
```

## Integration Guide

### Step 1: Include the Library

Add the social features library to your HTML page:

```html
<script src="js/social.js"></script>
```

### Step 2: Add Container Elements

Add containers where social features will be inserted:

```html
<!-- Social buttons container -->
<div id="social-actions-container"></div>

<!-- Comments section container -->
<div id="comments-section-container"></div>
```

### Step 3: Initialize Features

Add initialization script at the end of your page:

```html
<script>
    const FACULTY_ID = 'your-faculty-id'; // Unique identifier
    
    window.addEventListener('DOMContentLoaded', async () => {
        // Create and insert social buttons
        const actionsContainer = document.getElementById('social-actions-container');
        const socialButtons = SocialUI.createSocialButtons(FACULTY_ID);
        actionsContainer.appendChild(socialButtons);
        
        // Create and insert comments section
        const commentsContainer = document.getElementById('comments-section-container');
        const commentsSection = SocialUI.createCommentsSection(FACULTY_ID);
        commentsContainer.appendChild(commentsSection);
        
        // Initialize with current stats
        await initSocialFeatures(FACULTY_ID);
    });
</script>
```

### Step 4: Add Social Meta Tags (Optional but Recommended)

For better social sharing, add Open Graph meta tags:

```html
<head>
    <!-- Social Media Meta Tags -->
    <meta property="og:title" content="Faculty Name - Title">
    <meta property="og:description" content="Brief description of the faculty member">
    <meta property="og:image" content="https://example.com/profile-image.jpg">
    <meta property="og:type" content="profile">
    <meta property="og:url" content="https://example.com/faculty-profile.html">
    
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Faculty Name - Title">
    <meta name="twitter:description" content="Brief description">
    <meta name="twitter:image" content="https://example.com/profile-image.jpg">
</head>
```

## Examples

### Example 1: Basic Integration (see azizkaria.html)

```html
<!DOCTYPE html>
<html>
<head>
    <title>Faculty Profile</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
    <div class="container">
        <!-- Profile content here -->
        
        <!-- Social Features -->
        <div id="social-actions-container"></div>
        <div id="comments-section-container"></div>
    </div>
    
    <script src="js/social.js"></script>
    <script>
        const FACULTY_ID = 'azizkaria';
        window.addEventListener('DOMContentLoaded', async () => {
            const actionsContainer = document.getElementById('social-actions-container');
            actionsContainer.appendChild(SocialUI.createSocialButtons(FACULTY_ID));
            
            const commentsContainer = document.getElementById('comments-section-container');
            commentsContainer.appendChild(SocialUI.createCommentsSection(FACULTY_ID));
            
            await initSocialFeatures(FACULTY_ID);
        });
    </script>
</body>
</html>
```

### Example 2: Demo Page (see social-demo.html)

The `social-demo.html` file provides a comprehensive demonstration of all social features.

## User Experience

### Anonymous Users

Users can interact without logging in:
1. First time visitor enters their name (stored in localStorage)
2. System generates unique user ID (stored in localStorage)
3. User can like, comment, follow, and share
4. User's name appears on their comments
5. User can delete only their own comments

### Returning Users

- User ID and name persist across sessions via localStorage
- Previous interactions (likes, follows) are remembered
- No need to re-enter information

## API Configuration

The API base URL is automatically detected:

```javascript
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : '/api';
```

For production, ensure your backend API is accessible at `/api`.

## Security Features

1. **XSS Protection**: All user-generated content is escaped before rendering
2. **Input Validation**: Server-side validation for all inputs
3. **CORS**: Configurable CORS settings
4. **Rate Limiting**: Can be added to prevent abuse
5. **Comment Moderation**: Faculty can delete inappropriate comments (future feature)

## Performance Considerations

1. **Pagination**: Comments are paginated (default: 50 per page)
2. **Lazy Loading**: Comments only load when section is opened
3. **Optimistic UI**: Immediate visual feedback before server confirmation
4. **Caching**: Consider implementing caching for frequently accessed data

## Customization

### Styling

All components use Tailwind CSS classes. Customize by:

1. Modifying classes in `SocialUI.createSocialButtons()`
2. Adding custom CSS in your page
3. Overriding default styles

Example:
```css
.social-btn {
    /* Your custom styles */
}
```

### Reaction Types

Add more reaction types by updating:

1. Frontend: Modify `SocialAPI.like()` calls
2. Backend: Reactions are stored as strings, no backend changes needed

### Comment Limits

Modify pagination limits:

```javascript
const comments = await SocialAPI.getComments(facultyId, 100, 0); // 100 comments
```

## Troubleshooting

### Common Issues

1. **Buttons don't appear**
   - Check if `js/social.js` is loaded
   - Check browser console for errors
   - Verify container elements exist

2. **API errors**
   - Ensure backend server is running
   - Check API_BASE_URL configuration
   - Verify database connection

3. **User name not saving**
   - Check localStorage is enabled
   - Clear localStorage and try again

### Debugging

Enable console logging:
```javascript
console.log('Social features initialized');
```

Check network requests in browser DevTools.

## Future Enhancements

Potential additions:
- [ ] Real-time updates with WebSockets
- [ ] Rich text comments with markdown support
- [ ] Image attachments in comments
- [ ] Notification system for new comments/followers
- [ ] Admin moderation panel
- [ ] Comment threading (replies)
- [ ] Emoji reactions
- [ ] User profiles
- [ ] Activity feed

## Server Setup

### Prerequisites

1. Node.js installed
2. PostgreSQL database
3. Prisma configured

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Push database schema
npm run prisma:push

# Start server
npm start
```

### Environment Variables

Create `.env` file:
```
DATABASE_URL="your-postgresql-connection-string"
PORT=3000
```

## Testing

### Manual Testing Checklist

- [ ] Like a profile
- [ ] Unlike a profile
- [ ] Add a comment
- [ ] View comments
- [ ] Delete own comment
- [ ] Follow a faculty member
- [ ] Unfollow a faculty member
- [ ] Share on Facebook
- [ ] Share on Twitter
- [ ] Share on LinkedIn
- [ ] Share on WhatsApp
- [ ] Copy link to clipboard
- [ ] Test on mobile device
- [ ] Test with multiple users

### Automated Testing

Consider adding:
- Unit tests for API endpoints
- Integration tests for database operations
- E2E tests for user workflows

## Support

For issues or questions:
1. Check this documentation
2. Review example implementations
3. Check browser console for errors
4. Review server logs

## License

This social media integration is part of the portfolio directory project.

---

**Version**: 1.0.0  
**Last Updated**: November 2025  
**Author**: Portfolio Development Team
