# Portfolio Authentication System

## Overview

This authentication system allows faculty members to securely edit their portfolio pages using either:
1. **Google Sign-In** - Using their institutional Google account
2. **Staff ID + Secret Code** - Using their employee ID and a secret code

## Features

- ✅ Firebase Authentication integration
- ✅ Google Sign-In support
- ✅ Staff ID/Secret Code authentication
- ✅ Role-based access control (faculty can only edit their own page)
- ✅ Edit mode with visual indicators
- ✅ Save/cancel functionality
- ✅ Backend API for secure authentication
- ✅ Prisma database integration

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Firebase Admin SDK

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`academiq-9c9zg`)
3. Go to Project Settings > Service Accounts
4. Click "Generate New Private Key"
5. Save the JSON file as `firebase-service-account.json` in the project root
6. **Important**: Add `firebase-service-account.json` to `.gitignore`

### 3. Setup Database

```bash
# Generate Prisma client
npm run prisma:generate

# Push schema to database
npm run prisma:push
```

### 4. Configure Faculty Authentication

For each faculty member, you need to set up authentication credentials. Use the admin API endpoint:

```bash
curl -X POST http://localhost:3000/api/admin/setup-auth \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "366566",
    "secretCode": "mysecretcode123",
    "googleEmail": "najihahnadia@uitm.edu.my",
    "canEdit": true
  }'
```

**Field Descriptions:**
- `employeeId`: The faculty member's employee ID (required)
- `secretCode`: Secret code for staff ID login (optional if using Google only)
- `googleEmail`: The Google email authorized to edit (optional if using staff ID only)
- `canEdit`: Whether the faculty member can edit their portfolio (default: true)

### 5. Start the Server

```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

The server will start on `http://localhost:3000`

## Usage

### For Faculty Members

#### Option 1: Sign In with Google

1. Navigate to your portfolio page
2. Click "Sign In" button in the top navigation
3. Select "Google Sign-In" tab
4. Click "Sign in with Google"
5. Authorize with your Google account
6. If your email matches the portfolio, you'll see the "Edit Portfolio" button

#### Option 2: Sign In with Staff ID

1. Navigate to your portfolio page
2. Click "Sign In" button in the top navigation
3. Select "Staff ID" tab
4. Enter your Employee ID (e.g., "366566")
5. Enter your Secret Code
6. Click "Sign In with Staff ID"
7. If credentials are correct, you'll see the "Edit Portfolio" button

### Editing Your Portfolio

1. After signing in, click "Edit Portfolio" button
2. Editable fields will be highlighted with a dashed blue border
3. Click on any highlighted field to edit
4. Make your changes
5. Click "Save Changes" to save or "Cancel" to discard

### Signing Out

Click the "Sign Out" button in the top navigation to log out.

## Security Features

### Authorization Checks

- Users can only edit portfolios associated with their credentials
- Google email must match the portfolio email
- Staff ID must match the portfolio employee ID
- Backend verifies all requests with Firebase tokens

### Data Protection

- Secret codes are hashed in the database (TODO: implement hashing)
- Sensitive fields are not exposed in API responses
- CORS is configured to restrict API access
- Firebase tokens are verified on every request

## API Endpoints

### Authentication

**POST /api/auth/staff-login**
```json
Request:
{
  "employeeId": "366566",
  "secretCode": "mysecretcode123"
}

Response:
{
  "customToken": "firebase-custom-token",
  "facultyId": "faculty-id",
  "name": "Dr. Nornajihah Nadia Hasbullah"
}
```

### Portfolio Management

**GET /api/portfolio/:employeeId**
```json
Response:
{
  "id": "faculty-id",
  "name": "Dr. Nornajihah Nadia Hasbullah",
  "email": "najihahnadia@uitm.edu.my",
  "bio": "Educator and marketing researcher...",
  ...
}
```

**POST /api/portfolio/update**
```json
Request Headers:
Authorization: Bearer <firebase-token>

Request Body:
{
  "employeeId": "366566",
  "changes": {
    "bio": "Updated bio...",
    "phone": "017-7496525",
    "expertise": ["Marketing", "Consumer Behaviour"]
  }
}

Response:
{
  "success": true,
  "message": "Portfolio updated successfully",
  "data": { ... }
}
```

### Admin

**POST /api/admin/setup-auth**
```json
Request:
{
  "employeeId": "366566",
  "secretCode": "newsecret",
  "googleEmail": "email@uitm.edu.my",
  "canEdit": true
}

Response:
{
  "success": true,
  "message": "Authentication setup completed",
  "facultyId": "faculty-id",
  "name": "Dr. Nornajihah Nadia Hasbullah"
}
```

## File Structure

```
permata/
├── js/
│   └── auth.js                    # Client-side authentication module
├── prisma/
│   └── schema.prisma             # Database schema
├── server.js                     # Backend API server
├── portfolio-template-with-auth.html  # Template with auth features
├── package.json                  # Dependencies
└── firebase-service-account.json # Firebase admin credentials (gitignored)
```

## Updating Existing Portfolio Pages

To add authentication to an existing portfolio page:

1. Add Firebase SDKs to the `<head>`:
```html
<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"></script>
```

2. Add portfolio metadata:
```html
<div id="portfolioMetadata" 
     data-employee-id="366566" 
     data-portfolio-email="najihahnadia@uitm.edu.my"
     style="display: none;">
</div>
```

3. Include the auth module:
```html
<script src="js/auth.js"></script>
```

4. Add authentication UI elements (see `portfolio-template-with-auth.html` for complete example)

5. Mark editable fields with `data-editable` and `data-field` attributes:
```html
<p data-editable data-field="bio">Your bio text here...</p>
```

## Environment Variables

Create a `.env` file (already in `.gitignore`):

```env
DATABASE_URL="your-database-url"
PORT=3000
FIREBASE_PROJECT_ID="academiq-9c9zg"
```

## Troubleshooting

### "Invalid credentials" error
- Check that the employee ID and secret code match what's in the database
- Verify that `canEdit` is set to `true` for the faculty member

### "Not authorized to edit" error
- Ensure the Google email matches the portfolio email
- For staff ID login, verify the employee ID matches the portfolio

### Firebase errors
- Check that Firebase is properly initialized
- Verify the Firebase service account key is correct
- Ensure the Firebase project ID matches your configuration

### Database errors
- Run `npm run prisma:generate` to regenerate the Prisma client
- Check your DATABASE_URL is correct
- Verify the database schema is up to date

## Future Enhancements

- [ ] Implement secret code hashing (bcrypt)
- [ ] Add admin dashboard for managing faculty authentication
- [ ] Implement 2FA for added security
- [ ] Add audit logging for all edits
- [ ] Support for uploading profile images
- [ ] Bulk import of faculty authentication credentials
- [ ] Email notifications for successful edits
- [ ] Version history for portfolio changes

## Support

For issues or questions, please contact the system administrator or create an issue in the repository.

## License

This project is proprietary software for UiTM Sabah Faculty Portfolio Directory.
