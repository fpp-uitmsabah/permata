# External Dependencies Security Guide

## Current External Dependencies

The index.html file currently loads external resources from CDNs without Subresource Integrity (SRI) verification:

1. **Tailwind CSS** - `https://cdn.tailwindcss.com`
2. **Firebase SDK** - `https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js`

## Security Concerns

### Without SRI:
- **CDN Compromise:** If the CDN is compromised, malicious code could be injected
- **Man-in-the-Middle Attacks:** Attackers could intercept and modify the scripts
- **Supply Chain Attacks:** No verification that the script content hasn't changed

## Recommended Solutions

### Option 1: Self-Host Dependencies (Most Secure)

Self-hosting gives you full control and allows for SRI verification.

#### Steps:

1. **Download Tailwind CSS:**

```bash
# Create assets directory
mkdir -p assets/css assets/js

# Download a specific version of Tailwind CSS
curl -o assets/css/tailwind.min.css https://cdn.jsdelivr.net/npm/tailwindcss@3.4.0/dist/tailwind.min.css
```

2. **Download Firebase SDK:**

```bash
# Download Firebase
curl -o assets/js/firebase-app.js https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js
```

3. **Generate SRI Hashes:**

```bash
# For Tailwind CSS
cat assets/css/tailwind.min.css | openssl dgst -sha384 -binary | openssl base64 -A

# For Firebase
cat assets/js/firebase-app.js | openssl dgst -sha384 -binary | openssl base64 -A
```

4. **Update HTML:**

```html
<link rel="stylesheet" href="assets/css/tailwind.min.css" 
      integrity="sha384-[GENERATED_HASH]" 
      crossorigin="anonymous">

<script src="assets/js/firebase-app.js"
        integrity="sha384-[GENERATED_HASH]"
        crossorigin="anonymous"></script>
```

### Option 2: Use CDN with SRI (Recommended for Firebase)

Use a CDN that provides SRI hashes, like jsdelivr or cdnjs.

#### Firebase with SRI:

```html
<!-- Instead of gstatic.com, use cdnjs which provides SRI -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/firebase/8.10.1/firebase-app.min.js"
        integrity="sha512-3ufCz3Gr2awO3bPdDfZFvEWGLWo44hCfvNJjBwGhxQbWqWYnN/zDQD6dNjJTL/2Y3DXZK1RxxvWJJWCn/NELg=="
        crossorigin="anonymous"
        referrerpolicy="no-referrer"></script>
```

#### Tailwind CSS Alternatives:

**A. Use Tailwind CLI (Best Practice):**

```bash
# Install Tailwind CSS
npm install -D tailwindcss

# Create config
npx tailwindcss init

# Add to your HTML
<link href="/output.css" rel="stylesheet">

# Build
npx tailwindcss -i ./input.css -o ./output.css --watch
```

**B. Use Tailwind Play CDN (Not recommended for production):**

The current `https://cdn.tailwindcss.com` is the "Play CDN" meant for development only.

**C. Use Pre-built Tailwind CSS:**

```html
<!-- Tailwind from jsdelivr with SRI -->
<link rel="stylesheet" 
      href="https://cdn.jsdelivr.net/npm/tailwindcss@3.4.0/dist/tailwind.min.css"
      integrity="sha384-[GENERATED_HASH]"
      crossorigin="anonymous">
```

### Option 3: Build Process (Production Ready)

Implement a proper build process:

1. **Setup package.json:**

```json
{
  "name": "permata-faculty-directory",
  "version": "1.0.0",
  "scripts": {
    "build:css": "tailwindcss -i ./src/input.css -o ./dist/output.css --minify",
    "watch:css": "tailwindcss -i ./src/input.css -o ./dist/output.css --watch",
    "build": "npm run build:css"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.0"
  }
}
```

2. **Create tailwind.config.js:**

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html"],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

3. **Create src/input.css:**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Your custom styles here */
```

4. **Build and use:**

```bash
npm run build
```

```html
<!-- In your HTML -->
<link href="dist/output.css" rel="stylesheet">
```

## Implementation Steps

### Quick Fix (15 minutes):

1. Replace Tailwind Play CDN with jsdelivr CDN
2. Add Firebase from cdnjs with SRI
3. Update HTML references

### Recommended Fix (2 hours):

1. Set up Tailwind CLI
2. Self-host Firebase SDK
3. Generate and add SRI hashes
4. Test all functionality
5. Update .gitignore to exclude node_modules

### Production Fix (1 day):

1. Implement full build process
2. Set up CI/CD for automated builds
3. Add minification and optimization
4. Implement asset versioning
5. Set up CDN for your assets

## Updated HTML Head Section

```html
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Faculty Directory & Portfolio Gateway</title>

    <!-- Security Headers -->
    <meta http-equiv="X-Frame-Options" content="SAMEORIGIN">
    <meta http-equiv="X-Content-Type-Options" content="nosniff">
    <meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin">
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://generativelanguage.googleapis.com https://serpapi.com; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; font-src 'self' data:; connect-src 'self' https://pub.orcid.org https://serpapi.com https://generativelanguage.googleapis.com https://firebasestorage.googleapis.com; media-src 'self' https://sirpoji.my; frame-ancestors 'self';">

    <!-- Meta tags... -->

    <!-- Tailwind CSS - Self-hosted with SRI -->
    <link href="assets/css/tailwind.min.css" rel="stylesheet" 
          integrity="sha384-YOUR_GENERATED_HASH_HERE" 
          crossorigin="anonymous">

    <!-- Inline critical styles -->
    <style>
        /* Your existing styles */
    </style>
</head>

<!-- Before closing body tag -->
<!-- Firebase SDK with SRI -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/firebase/8.10.1/firebase-app.min.js"
        integrity="sha512-3ufCz3Gr2awO3bPdDfZFvEWGLWo44hCfvNJjBwGhxQbWqWYnN/zDQD6dNjJTL/2Y3DXZK1RxxvWJJWCn/NELg=="
        crossorigin="anonymous"
        referrerpolicy="no-referrer"></script>
```

## Verification

After implementing SRI:

1. **Check browser console** for no integrity errors
2. **Test functionality** to ensure scripts load correctly
3. **Use browser DevTools** to verify SRI attributes
4. **Run security scanner** to verify improvements

## Additional Security Measures

### 1. Content Security Policy Update

Update CSP to only allow specific CDNs:

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' https: data:;
  connect-src 'self' https://your-backend-api.com;
  font-src 'self' data:;
">
```

### 2. Resource Hints

Add resource hints for better performance:

```html
<link rel="preconnect" href="https://cdnjs.cloudflare.com">
<link rel="dns-prefetch" href="https://cdnjs.cloudflare.com">
```

### 3. Subresource Integrity Generator

You can use online tools:
- https://www.srihash.org/
- https://report-uri.com/home/sri_hash

Or generate manually:

```bash
curl -s https://example.com/script.js | openssl dgst -sha384 -binary | openssl base64 -A
```

## Maintenance

- **Regular Updates:** Check for security updates monthly
- **SRI Hash Updates:** Regenerate hashes when updating dependencies
- **Dependency Audit:** Run `npm audit` regularly
- **Version Pinning:** Always use specific versions, never "latest"

## Testing Checklist

After implementing SRI:

- [ ] All styles load correctly
- [ ] All scripts execute without errors
- [ ] No console warnings about integrity
- [ ] Functionality works as expected
- [ ] Performance hasn't degraded
- [ ] CSP doesn't block required resources
- [ ] External links work properly

## References

- [Subresource Integrity (SRI) - MDN](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity)
- [Tailwind CSS Installation](https://tailwindcss.com/docs/installation)
- [Firebase CDN Setup](https://firebase.google.com/docs/web/setup)
- [CSP Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

## Current Status

✅ Security headers added
✅ Input sanitization implemented
✅ CSP partially implemented
⚠️ **SRI not yet implemented** (requires dependency update)
⚠️ **Using Tailwind Play CDN** (not recommended for production)

## Next Steps

1. Decide on dependency strategy (self-host vs. CDN)
2. Implement chosen solution
3. Generate and add SRI hashes
4. Update CSP accordingly
5. Test thoroughly
6. Document final implementation
