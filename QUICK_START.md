# Quick Start Guide - Portfolio Authentication

This guide will help you get the authentication system up and running quickly.

## Prerequisites

- Node.js installed (v14 or higher)
- Access to the database
- Firebase project (already exists: `academiq-9c9zg`)

## Step-by-Step Setup

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your database URL:

```env
DATABASE_URL="your-database-url-here"
PORT=3000
```

### Step 3: Setup Database Schema

```bash
# Generate Prisma client
npm run prisma:generate

# Push schema to database
npm run prisma:push
```

### Step 4: Download Firebase Service Account Key (Optional but Recommended)

**This is required for Staff ID authentication to work.**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `academiq-9c9zg`
3. Click the gear icon ⚙️ → Project Settings
4. Go to "Service Accounts" tab
5. Click "Generate New Private Key"
6. Save the downloaded JSON file as `firebase-service-account.json` in the project root

**Important**: The `firebase-service-account.json` file is already in `.gitignore` and will not be committed to Git.

### Step 5: Test Database Setup

```bash
npm run test:auth
```

This will verify:
- ✅ Database connection works
- ✅ Schema is correct
- ℹ️ How many faculty members have authentication configured
- 📋 Next steps to take

### Step 6: Start the API Server

```bash
# Development mode (auto-reload)
npm run dev

# OR Production mode
npm start
```

The server will start on `http://localhost:3000`

You should see:
```
✅ Firebase Admin initialized successfully
Portfolio API server running on port 3000
```

### Step 7: Configure Faculty Authentication

Open the admin interface in your browser:

```
http://localhost:3000/admin-auth-setup.html
```

**Note**: Since the admin interface is currently not password-protected, you should:
1. Only access it on localhost
2. Not expose it in production without adding authentication
3. Consider using it only during initial setup

For each faculty member, fill in:
- **Employee ID**: e.g., `366566` (required)
- **Google Email**: e.g., `najihahnadia@uitm.edu.my` (optional)
- **Secret Code**: A secure password for Staff ID login (optional)
- **Can Edit**: Checkbox to enable/disable editing

Click "Setup Authentication" to save.

### Step 8: Test Authentication

1. Open the template portfolio page:
   ```
   http://localhost:3000/portfolio-template-with-auth.html
   ```

2. Click "Sign In" button

3. Try one of the authentication methods:

   **Option A: Google Sign-In**
   - Click "Sign in with Google"
   - Use the Google email you configured
   - If successful, you'll see "Edit Portfolio" button

   **Option B: Staff ID Login**
   - Switch to "Staff ID" tab
   - Enter Employee ID
   - Enter Secret Code
   - Click "Sign In with Staff ID"
   - If successful, you'll see "Edit Portfolio" button

### Step 9: Test Edit Functionality

1. Click "Edit Portfolio" button
2. Click on any field with a blue dashed border
3. Edit the content
4. Click "Save Changes" to save or "Cancel" to discard

## Troubleshooting

### "Database connection failed"
- Check your `DATABASE_URL` in `.env`
- Ensure the database is running and accessible
- Run `npm run test:db` to diagnose

### "Firebase Admin not configured"
- Download the service account key (see Step 4)
- Make sure it's saved as `firebase-service-account.json`
- Restart the server

### "Invalid credentials"
- Verify the employee ID and secret code are correct
- Check that `canEdit` is set to `true` for that faculty member
- Use the admin interface to verify the configuration

### "Not authorized to edit"
- For Google Sign-In: Ensure the Google email matches exactly
- For Staff ID: Ensure the employee ID matches the portfolio
- Check that the faculty member has `canEdit: true`

### Server won't start
- Check that port 3000 is not already in use
- Set a different port: `PORT=3001 npm start`
- Check for any error messages in the console

## Production Deployment

### Security Checklist

Before deploying to production:

- [ ] Add authentication to admin interface
- [ ] Use HTTPS for all connections
- [ ] Hash secret codes (implement bcrypt)
- [ ] Set up proper CORS restrictions
- [ ] Use environment variables for all secrets
- [ ] Enable Firebase App Check
- [ ] Set up rate limiting
- [ ] Add logging and monitoring
- [ ] Regular security audits

### Environment Variables for Production

```env
NODE_ENV=production
DATABASE_URL="your-production-database-url"
PORT=3000
ALLOWED_ORIGINS="https://yourdomain.com"
```

### Recommended Hosting

- **Frontend**: GitHub Pages, Netlify, Vercel
- **Backend API**: Heroku, Railway, Render, or any Node.js hosting
- **Database**: Your existing PostgreSQL database

## Usage for Faculty Members

Once deployed, faculty members can:

1. Navigate to their portfolio page
2. Click "Sign In"
3. Choose authentication method:
   - **Google Sign-In**: Use institutional Google account
   - **Staff ID**: Use employee ID + secret code provided by admin
4. Click "Edit Portfolio" once authenticated
5. Make changes to their information
6. Click "Save Changes" to update

## Next Steps

1. ✅ Complete initial setup (Steps 1-6)
2. ✅ Configure authentication for all faculty members (Step 7)
3. ✅ Test authentication (Step 8-9)
4. 📝 Update existing portfolio HTML pages to include authentication
5. 🎨 Customize the UI to match your design
6. 🔒 Add security enhancements for production
7. 🚀 Deploy to production

## Getting Help

- Check `AUTHENTICATION_SETUP.md` for detailed documentation
- Review `server.js` for API endpoints
- Look at `portfolio-template-with-auth.html` for implementation examples
- Check console logs for error messages

## Quick Commands Reference

```bash
# Install dependencies
npm install

# Setup database
npm run prisma:generate
npm run prisma:push

# Test database
npm run test:auth

# Start server (development)
npm run dev

# Start server (production)
npm start

# View database
npm run prisma:studio
```

## File Locations

- API Server: `server.js`
- Auth Module: `js/auth.js`
- Admin Interface: `admin-auth-setup.html`
- Template: `portfolio-template-with-auth.html`
- Database Schema: `prisma/schema.prisma`
- Documentation: `AUTHENTICATION_SETUP.md`

---

**Status**: ✅ Ready for testing  
**Last Updated**: 2025-10-30  
**Version**: 1.0.0
