# Gemini API Integration Documentation

## Overview
This project integrates Google's Gemini AI to provide intelligent insights about faculty members. The AI generates professional analyses highlighting strengths, project innovations, and collaboration recommendations.

## Architecture

### Flow
1. **User Interaction**: User clicks "✨ AI Insights" button on a faculty card
2. **Request**: JavaScript sends faculty details to Google Apps Script endpoint
3. **Processing**: Apps Script forwards the request to Gemini API
4. **Response**: AI-generated insights are displayed in a modal

### Components

#### 1. Frontend (index.html)
- **AI Insights Button**: Triggers the AI analysis
- **Modal Display**: Shows loading state, success, or error messages
- **Error Handling**: Gracefully handles network and API errors

#### 2. Google Apps Script (Backend)
- **Endpoint**: `https://script.google.com/macros/s/AKfycbwwzPHM2sCWQ_vDbmtjflhe2ObDawlP7X-6p0uNemEyBl-fpjPU-30E6e8L7KKjpVI/exec`
- **Function**: Receives faculty data, calls Gemini API, returns formatted response

## API Request Format

### Request
```javascript
{
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    prompt: `Provide a professional analysis of the following faculty member...
    
    **Faculty Details:**
    - **Name:** ${faculty.name}
    - **Position:** ${faculty.position}
    - **Field:** ${faculty.field}
    
    **Please structure your response in markdown format with the following sections:**
    - **Strengths:**
    - **Potential Project Innovations:**
    - **Collaboration Recommendations:**`
  })
}
```

### Response Format

#### Success Response
```javascript
{
  text: "## Strengths:\n- Expertise in...\n\n## Potential Project Innovations:\n- Project idea...",
  // or legacy format:
  summary: "Brief summary...",
  analysis: "Detailed analysis..."
}
```

#### Error Response
```javascript
{
  error: "Error message describing what went wrong"
}
```

## Features

### 1. Loading States
- Animated spinner with informative text
- "Generating AI insights..." message
- "This may take a few moments" subtext

### 2. Enhanced Markdown Parsing
The response supports:
- **Headers**: `##` and `###` converted to styled H2 and H3
- **Bold Text**: `**text**` converted to `<strong>`
- **Bullet Points**: `-` or `*` converted to list items
- **Paragraphs**: Double newlines create paragraph breaks

### 3. Error Handling

#### Network Errors
- Yellow warning card with retry suggestion
- Expandable technical details
- User-friendly error messages

#### API Errors
- Red error card with specific error message
- Clear visual indicators
- Helpful context for troubleshooting

### 4. Visual Presentation
- Gradient header with AI icon
- "Powered by Google Gemini AI" badge
- Responsive design with proper spacing
- Smooth animations and transitions

## Google Apps Script Setup

To set up the backend Google Apps Script:

1. **Create a new Google Apps Script project**
2. **Add the Gemini API library** or use REST API
3. **Configure the API key** in Script Properties
4. **Deploy as Web App**:
   - Execute as: Me
   - Who has access: Anyone (or specific domain)

### Example Apps Script Code

```javascript
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const prompt = data.prompt;
    
    // Call Gemini API
    const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
    
    const payload = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    };
    
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const json = JSON.parse(response.getContentText());
    
    if (json.candidates && json.candidates[0]?.content?.parts[0]?.text) {
      return ContentService
        .createTextOutput(JSON.stringify({
          text: json.candidates[0].content.parts[0].text
        }))
        .setMimeType(ContentService.MimeType.JSON);
    } else {
      throw new Error('Invalid response from Gemini API');
    }
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        error: error.message || 'An error occurred'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

## Configuration

### API Key Storage
Store the Gemini API key in Google Apps Script Properties:
1. Open Apps Script project
2. Go to Project Settings (gear icon)
3. Add Script Property:
   - Key: `GEMINI_API_KEY`
   - Value: Your Gemini API key

### Security Considerations
- API key is stored server-side (not exposed in frontend)
- CORS headers properly configured in Apps Script
- Rate limiting should be implemented
- Input validation on both client and server

## Testing

### Manual Testing
1. Open the faculty directory
2. Click "✨ AI Insights" on any faculty card
3. Verify loading state appears
4. Confirm insights display correctly
5. Test error scenarios (network offline, invalid data)

### Error Scenarios to Test
1. **Network offline**: Should show yellow warning
2. **Invalid API response**: Should handle gracefully
3. **Timeout**: Should display appropriate message
4. **Invalid faculty data**: Should validate input

## Troubleshooting

### Issue: Modal doesn't open
- Check if `aiModal` element exists in DOM
- Verify `openAiModal()` function is defined
- Check for JavaScript errors in console

### Issue: "Failed to load insights"
- Verify Apps Script deployment URL is correct
- Check Apps Script execution permissions
- Confirm API key is valid and has quota

### Issue: Markdown not rendering
- Check if markdown parsing functions are working
- Verify HTML is being properly injected
- Look for XSS protection blocking HTML

### Issue: Duplicate function definitions
- Ensure only one `getAiInsights()` function exists
- Check for only one set of `openAiModal()`/`closeAiModal()`
- Remove commented-out duplicate code

## Best Practices

1. **Rate Limiting**: Implement client-side throttling to prevent API abuse
2. **Caching**: Consider caching AI responses for frequently viewed profiles
3. **Loading States**: Always show clear feedback during async operations
4. **Error Messages**: Provide actionable, user-friendly error messages
5. **Accessibility**: Ensure modal is keyboard accessible and screen-reader friendly

## Future Enhancements

1. **Caching Layer**: Store AI responses to reduce API calls
2. **Customizable Prompts**: Allow users to request specific types of insights
3. **Multi-language Support**: Generate insights in different languages
4. **Export Feature**: Allow users to download insights as PDF/text
5. **Feedback Mechanism**: Let users rate AI-generated insights
6. **Advanced Analytics**: Track which insights are most useful

## API Costs & Quotas

- Monitor Gemini API usage in Google Cloud Console
- Set up billing alerts to avoid unexpected charges
- Consider implementing usage limits per user/session
- Review quota limits: https://ai.google.dev/pricing

## Version History

### v1.2.0 (Current)
- Enhanced error handling with visual feedback
- Improved markdown parsing
- Added loading states with animations
- Fixed duplicate function definitions
- Added comprehensive documentation

### v1.1.0
- Basic Gemini API integration
- Simple modal display
- Basic error handling

### v1.0.0
- Initial implementation with Google Apps Script proxy
