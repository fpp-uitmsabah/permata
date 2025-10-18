# Visual Debugging Guide for AI Integration

## 🔍 How to Identify the Problem

### Step 1: Open Browser Developer Tools

1. Open `index.html` in your browser
2. Press **F12** (or right-click → Inspect)
3. Go to the **Console** tab
4. Click "✨ AI Insights" on any faculty card

### Step 2: Look for These Clues

#### ❌ If You See This Error:
```
AI Insights fetch error: Error: Invalid response format from API
```

**This means**: The frontend received a response, but it doesn't have the `text` field it's looking for.

#### ❌ If You See This in Network Tab:
```json
Response from Apps Script:
{
  "summary": "Expert in Finance...",
  "analysis": "## Detailed Analysis..."
}
```

**This confirms**: Apps Script is returning the OLD format with `summary` and `analysis`.

#### ✅ What You SHOULD See:
```json
Response from Apps Script:
{
  "text": "## Strengths:\n- Expert in Finance...\n\n## Projects:\n..."
}
```

**This means**: Apps Script is returning the CORRECT format.

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER ACTION                             │
│                  Clicks "✨ AI Insights"                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  FRONTEND (index.html)                          │
│                                                                 │
│  getAiInsights(facultyIndex) called                            │
│  Creates prompt with faculty details                            │
│  Sends POST to: WEB_APP_URL                                    │
│                                                                 │
│  Request Body:                                                  │
│  {                                                              │
│    prompt: "Provide analysis for:\nName: Dr. Smith..."         │
│  }                                                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP POST
                             │ Content-Type: application/json
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              GOOGLE APPS SCRIPT (Backend)                       │
│                                                                 │
│  doPost(e) function receives request                            │
│  Parses: body.prompt                                            │
│  Calls Gemini API with enhanced prompt                          │
│                                                                 │
│  Gemini API returns:                                            │
│  "## Strengths:\n- Expert in AI...\n\n## Projects:\n..."      │
│                                                                 │
│  ⚠️  PROBLEM IS HERE! What does Apps Script return?            │
│                                                                 │
│  ❌ OLD (BROKEN):                                               │
│     Splits text into summary/analysis                           │
│     Returns: { summary: "...", analysis: "..." }               │
│                                                                 │
│  ✅ NEW (FIXED):                                                │
│     Returns: { text: "..." }                                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP Response
                             │ Content-Type: application/json
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  FRONTEND (index.html)                          │
│                                                                 │
│  Receives response                                              │
│  Parses JSON                                                    │
│                                                                 │
│  Code checks:                                                   │
│    if (result.error) { ... }          // Check for errors      │
│    else if (result.text) { ... }      // ← LOOKING FOR THIS!  │
│                                                                 │
│  ❌ If Apps Script sent {summary, analysis}:                    │
│     result.text is undefined                                    │
│     Falls through to: throw Error('Invalid response format')    │
│     User sees yellow error card                                 │
│                                                                 │
│  ✅ If Apps Script sent {text}:                                 │
│     result.text exists!                                         │
│     Parses markdown → HTML                                      │
│     Displays beautiful formatted response                       │
└─────────────────────────────────────────────────────────────────┘
```

## 🔬 Step-by-Step Debugging

### Test 1: Check the Network Response

1. Open Developer Tools (F12)
2. Go to **Network** tab
3. Click "✨ AI Insights"
4. Look for a request to `script.google.com`
5. Click on it
6. Go to **Response** tab
7. Look at the JSON structure

**What to check:**
```json
// ❌ BAD (causes error):
{
  "summary": "...",
  "analysis": "..."
}

// ✅ GOOD (works):
{
  "text": "..."
}

// ⚠️ ERROR RESPONSE:
{
  "error": "API Key is not set..."
}
```

### Test 2: Check Console Logs

Look for these log messages:

```javascript
// These are normal:
"Testing Gemini API with prompt: ..."
"Sending request to: https://script.google.com/..."

// ❌ This indicates the problem:
"AI Insights fetch error: Error: Invalid response format from API"

// ✅ This indicates success:
// (no errors, modal shows formatted content)
```

### Test 3: Use the Test Tool

1. Open `test-gemini-api.html`
2. Click "Test Gemini API"
3. Scroll to "Raw Response" section at the bottom

**What you should see:**
```json
{
  "text": "## Strengths:\n\n- **Expert in Finance:** Dr. Smith..."
}
```

**What you might see if broken:**
```json
{
  "summary": "Expert in Finance and FinTech innovations...",
  "analysis": "## Detailed Analysis:\n\n- Strong research background..."
}
```

## 🎨 Visual Response Comparison

### ❌ BROKEN Response Structure:
```
Apps Script Response:
┌──────────────────────────────────────────┐
│ {                                        │
│   "summary": "Short tagline here...",    │ ← Frontend doesn't use
│   "analysis": "## Strengths:\n..."      │ ← Frontend doesn't use
│ }                                        │
└──────────────────────────────────────────┘
                    ↓
    Frontend looks for: result.text
                    ↓
              undefined! ❌
                    ↓
         "Invalid response format"
```

### ✅ WORKING Response Structure:
```
Apps Script Response:
┌──────────────────────────────────────────┐
│ {                                        │
│   "text": "## Strengths:\n..."          │ ← Frontend expects this!
│ }                                        │
└──────────────────────────────────────────┘
                    ↓
    Frontend looks for: result.text
                    ↓
              Found! ✅
                    ↓
     Parse markdown → Beautiful HTML
```

## 🛠️ Quick Fix Verification

After applying the fix, verify these checkpoints:

### Checkpoint 1: Apps Script Code
Look for this line in your Apps Script `doPost` function:

```javascript
// ✅ CORRECT:
responseObject = {
  text: generatedText
};

// ❌ WRONG (old code):
responseObject = {
  summary: summary,
  analysis: analysis
};
```

### Checkpoint 2: Deployment
After saving changes:
- [ ] Click "Deploy" → "Manage deployments"
- [ ] Edit existing deployment
- [ ] Select "New version"
- [ ] Click "Deploy"
- [ ] Note the version number (should increment)

### Checkpoint 3: Browser Cache
Clear your browser cache or:
- [ ] Press Ctrl+Shift+R (hard refresh)
- [ ] Or use Incognito/Private window
- [ ] Or clear cache from browser settings

### Checkpoint 4: Test Response
Using test-gemini-api.html:
- [ ] Response has `"text"` field
- [ ] No `"summary"` or `"analysis"` fields
- [ ] Text contains markdown formatting
- [ ] No JSON parsing errors

### Checkpoint 5: Main App
Using index.html:
- [ ] Click "✨ AI Insights"
- [ ] See loading spinner
- [ ] See formatted response with:
  - [ ] Headers (large bold text)
  - [ ] Sections (Strengths, Projects, etc.)
  - [ ] Bullet points
  - [ ] No "Invalid response format" error

## 📱 Mobile Testing

If testing on mobile:
1. Open index.html on your phone
2. Tap "✨ AI Insights"
3. Modal should:
   - [ ] Open smoothly
   - [ ] Show loading spinner
   - [ ] Display formatted content
   - [ ] Close with X button
   - [ ] Be readable (text not too small)

## 🔄 Common Error Messages Decoded

| Error Message | Cause | Solution |
|--------------|-------|----------|
| "Invalid response format from API" | Apps Script returns wrong format | Update Apps Script to return `{text}` |
| "Network response was not ok" | CORS issue or wrong URL | Check deployment settings |
| "API Key is not set" | Missing Script Property | Add GEMINI_API_KEY in Script Properties |
| "Failed to fetch" | Deployment not public | Set "Who has access" to "Anyone" |
| No error, but empty modal | JavaScript error before fetch | Check browser console |
| Modal won't open | DOM element not found | Check HTML for `id="aiModal"` |

## 🎯 Success Indicators

You'll know it's working when you see:

1. **Loading State**: 
   - Spinning circle
   - "Generating AI insights..." message

2. **Success State**:
   - "AI-Generated Insights" header with icon
   - "Powered by Google Gemini AI" badge
   - Formatted sections with headers
   - Bullet points displaying correctly
   - Professional styling

3. **Network Tab**:
   - Status: 200 OK
   - Response contains `{"text": "..."}`
   - No CORS errors

4. **Console Tab**:
   - No red error messages
   - Clean execution

## 📸 Screenshots Guide

When reporting issues, include screenshots of:

1. **Browser Console** (F12 → Console)
   - Shows any error messages
   - Shows fetch requests/responses

2. **Network Tab** (F12 → Network)
   - Shows request to script.google.com
   - Shows response JSON structure

3. **Modal Display**
   - What you see when clicking "AI Insights"
   - Error card if it appears

4. **Apps Script Logs**
   - In Apps Script editor → Executions
   - Shows backend errors

## 🔧 Advanced Debugging

### Enable Detailed Logging

Add this to Apps Script (temporary, for debugging):

```javascript
function doPost(e) {
  Logger.log('=== REQUEST START ===');
  Logger.log('Request body: ' + e.postData.contents);
  
  // ... your existing code ...
  
  Logger.log('Gemini response: ' + responseText);
  Logger.log('Returning: ' + JSON.stringify(responseObject));
  Logger.log('=== REQUEST END ===');
  
  return ContentService
    .createTextOutput(JSON.stringify(responseObject))
    .setMimeType(ContentService.MimeType.JSON)
    .withHeaders({
      'Access-Control-Allow-Origin': '*'
    });
}
```

Then check **Executions** tab in Apps Script to see detailed logs.

### Test Direct API Call

Use `curl` or Postman to test Apps Script directly:

```bash
curl -X POST \
  "YOUR_WEB_APP_URL" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Test prompt"}'
```

Expected response:
```json
{"text":"## Strengths:\n..."}
```

## ✅ Final Checklist

Before considering it "fixed":

- [ ] Apps Script returns `{text: "..."}` format
- [ ] Test tool shows correct response
- [ ] Main app displays formatted insights
- [ ] No console errors
- [ ] Works on multiple faculty members
- [ ] Error handling works (test with no internet)
- [ ] Modal opens and closes properly
- [ ] Markdown renders correctly (headers, bold, lists)
- [ ] Loading state shows before response
- [ ] Response is readable and well-formatted

---

**Pro Tip**: Keep the test-gemini-api.html page bookmarked for quick testing whenever you make changes!
