# 🚀 Quick Fix Reference Card

## The Problem in One Sentence
**Apps Script returns `{summary, analysis}` but frontend expects `{text}`**

## The Fix in 3 Steps

### 1️⃣ Open Google Apps Script
Go to: https://script.google.com/  
Open your deployed web app project

### 2️⃣ Find and Replace This Code

**❌ FIND THIS** (around line 95-100):
```javascript
responseObject = {
  summary: summary,
  analysis: analysis
};
```

**✅ REPLACE WITH**:
```javascript
responseObject = {
  text: generatedText
};
```

### 3️⃣ Deploy New Version
1. File → Save
2. Deploy → Manage deployments
3. Edit → New version → Deploy
4. Done!

---

## 🧪 Quick Test

Open `test-gemini-api.html` → Click "Test Gemini API"

**✅ Success looks like:**
```json
{
  "text": "## Strengths:\n- Expert in..."
}
```

**❌ Still broken looks like:**
```json
{
  "summary": "...",
  "analysis": "..."
}
```

---

## 🆘 Still Not Working?

### Check #1: Deployment Settings
- Execute as: **Me**
- Who has access: **Anyone**

### Check #2: API Key
Project Settings → Script Properties → `GEMINI_API_KEY`

### Check #3: Browser Cache
- Press Ctrl+Shift+R (hard refresh)
- Or use Incognito window

### Check #4: Wait 2-3 Minutes
Google needs time to propagate the new deployment

---

## 📞 Need More Help?

Read these files in order:
1. **HOW_TO_FIX_AI_INTEGRATION.md** - Detailed step-by-step
2. **VISUAL_DEBUGGING_GUIDE.md** - Screenshots and debugging
3. **ANALYSIS_AI_INTEGRATION_ISSUES.md** - Technical deep-dive

---

## ⚡ Super Quick Copy-Paste

**Complete working doPost function** - See `FIXED_GOOGLE_APPS_SCRIPT.gs`

Just copy the entire file and paste it into your Apps Script!

---

## 🎯 Success Checklist

After the fix, you should see:
- [ ] Test tool shows `{"text": "..."}`
- [ ] Main app displays formatted AI insights
- [ ] Headers and bullet points render correctly
- [ ] No "Invalid response format" error
- [ ] Modal opens with loading spinner
- [ ] Response appears in 5-10 seconds

---

## 📊 Before vs After

### Before (Broken):
```
Apps Script          Frontend
{summary, analysis}  Looking for: result.text
        ↓            ↓
        ❌ MISMATCH ❌
        ↓
  "Invalid response format"
```

### After (Fixed):
```
Apps Script          Frontend
{text}               Looking for: result.text
        ↓            ↓
        ✅ MATCH ✅
        ↓
  Beautiful formatted insights!
```

---

**Print this page and keep it handy!** 📄

**Estimated fix time**: 5 minutes  
**Difficulty**: ⭐ Easy  
**Files to change**: 1 (Google Apps Script only)  
**Lines to change**: 3-4 lines
