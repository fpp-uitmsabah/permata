# API Key Migration Guide

## URGENT: Action Required

The current implementation has **exposed API keys** in the client-side code (index.html). This is a critical security vulnerability that needs immediate attention.

## Immediate Actions

### 1. Revoke Exposed API Keys (CRITICAL - Do This First)

**Firebase API Key:**
- Go to [Firebase Console](https://console.firebase.google.com/)
- Select your project: `academiq-9c9zg`
- Navigate to Project Settings > General
- Delete the exposed API key
- Generate a new API key

**Gemini API Key:**
- Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
- Delete the exposed key: `AIzaSyBdWyxRzeffdUVmajEHkJWLOXKvc6kzR2M`
- Generate a new API key

**SerpAPI Key:**
- Go to [SerpAPI Dashboard](https://serpapi.com/manage-api-key)
- Delete the exposed key: `5a5241bc4ea3fb190a940eaabfa8d43d515cd59e71fc036c790c432f5df0a241`
- Generate a new API key

### 2. Temporary Fix (Before Backend Implementation)

If you need the site to work immediately while you build a backend:

1. Update the API keys in `index.html` with the new keys
2. Implement API key restrictions (see below)
3. Plan for backend migration

## Long-Term Solution: Backend API Implementation

### Why Backend is Necessary

API keys should **NEVER** be in client-side code because:
- Anyone can view the page source and steal your keys
- Keys cannot be rotated without redeploying the frontend
- No rate limiting or abuse prevention
- Billing/quota exhaustion risk
- Security breach liability

### Recommended Architecture

```
┌─────────────┐      HTTPS       ┌──────────────┐      API Keys      ┌────────────────┐
│   Frontend  │ ─────────────────>│    Backend   │ ──────────────────>│  External APIs │
│ (index.html)│      JSON        │   (Node.js)  │   (Secure Store)  │  (Firebase,    │
│             │ <─────────────────│              │ <──────────────────│   Gemini, etc) │
└─────────────┘                  └──────────────┘                    └────────────────┘
```

### Backend Implementation Steps

#### Option 1: Node.js/Express Backend

1. **Create Backend Server:**

```javascript
// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Gemini AI endpoint
app.post('/api/gemini', async (req, res) => {
  const { prompt } = req.body;
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }]
        })
      }
    );
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ORCID endpoint
app.get('/api/orcid/:orcidId/works', async (req, res) => {
  const { orcidId } = req.params;
  
  try {
    const response = await fetch(`https://pub.orcid.org/v3.0/${orcidId}/works`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Scholar endpoint
app.get('/api/scholar/:scholarId', async (req, res) => {
  const { scholarId } = req.params;
  
  try {
    const params = new URLSearchParams({
      engine: 'google_scholar_author',
      author_id: scholarId,
      api_key: process.env.SERPAPI_KEY
    });
    
    const response = await fetch(`https://serpapi.com/search?${params}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

2. **Update package.json:**

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  }
}
```

3. **Update Frontend to Use Backend:**

In `index.html`, replace direct API calls:

```javascript
// OLD (INSECURE):
const response = await fetch(`${GEMINI_API_URL_BASE}?key=${GEMINI_API_KEY}`, {
  method: 'POST',
  body: JSON.stringify(payload)
});

// NEW (SECURE):
const response = await fetch('https://your-backend.com/api/gemini', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: userPrompt })
});
```

#### Option 2: Serverless Functions (Vercel/Netlify)

1. **Create API Functions:**

```javascript
// api/gemini.js (Vercel/Netlify Function)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

2. **Deploy to Vercel/Netlify:**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

3. **Set Environment Variables:**

In Vercel/Netlify dashboard, add:
- `GEMINI_API_KEY`
- `SERPAPI_KEY`
- `FIREBASE_API_KEY` (if needed server-side)

## API Key Restrictions (Temporary Mitigation)

While building the backend, restrict the exposed keys:

### Firebase API Key Restrictions

1. Go to Firebase Console > Project Settings > General
2. Under "Your apps", find your Web API Key
3. Click on it to open Google Cloud Console
4. Add these restrictions:
   - **Application restrictions:** HTTP referrers
   - **Website restrictions:** Add your domain(s)
     - `https://your-domain.com/*`
     - `http://localhost:*` (for development)

### Gemini API Key Restrictions

1. Go to Google Cloud Console
2. Navigate to APIs & Services > Credentials
3. Find your Gemini API key
4. Add restrictions:
   - **Application restrictions:** HTTP referrers
   - **Website restrictions:** Your domain(s)

### SerpAPI Key Restrictions

1. Go to SerpAPI Dashboard
2. Set IP/domain restrictions if available

## Environment Variables Setup

1. **Create `.env` file** (never commit this):

```bash
# Copy from example
cp .env.example .env

# Edit with your keys
nano .env
```

2. **Update `.gitignore`** (already done):

```
.env
node_modules/
```

## Testing After Migration

1. **Test all API calls:**
   - Gemini AI pitch generation
   - ORCID data fetching
   - Scholar data fetching
   - Contact form functionality

2. **Check browser console** for errors

3. **Verify no API keys in Network tab:**
   - Open DevTools > Network
   - Trigger API calls
   - Ensure keys are not visible in requests

## Monitoring and Alerts

1. **Set up quota alerts** in Google Cloud Console
2. **Monitor API usage** regularly
3. **Enable logging** for API calls
4. **Set up billing alerts** to prevent unexpected charges

## Security Checklist

- [ ] Revoked all exposed API keys
- [ ] Generated new API keys
- [ ] Implemented backend API or serverless functions
- [ ] Updated frontend to use backend endpoints
- [ ] Added API key restrictions (HTTP referrers)
- [ ] Set up environment variables properly
- [ ] Tested all functionality
- [ ] Added rate limiting to backend
- [ ] Set up monitoring and alerts
- [ ] Documented API endpoints
- [ ] Added authentication (if needed)
- [ ] Implemented CORS properly
- [ ] Added input validation
- [ ] Set up error logging

## Timeline

- **Immediate (Today):** Revoke exposed keys
- **Week 1:** Implement backend API
- **Week 2:** Test and deploy
- **Week 3:** Monitor and optimize

## Support

If you need help:
1. Check GitHub Issues in this repository
2. Consult the security documentation
3. Review API provider documentation
4. Consider hiring a security consultant

## References

- [Firebase Security Best Practices](https://firebase.google.com/docs/rules/get-started)
- [Google Cloud API Security](https://cloud.google.com/docs/authentication)
- [OWASP API Security](https://owasp.org/www-project-api-security/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

## Additional Notes

- The current implementation uses Firebase 8.x which is older; consider upgrading to Firebase 9.x modular SDK
- Consider implementing authentication for sensitive operations
- Add rate limiting to prevent abuse
- Implement proper error handling and logging
- Consider using a CDN for static assets
- Add monitoring with services like Sentry or LogRocket
