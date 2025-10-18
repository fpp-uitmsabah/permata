/**
 * FIXED Google Apps Script for Gemini API Integration
 * 
 * CRITICAL FIX: Changed response format from { summary, analysis } to { text }
 * This matches what the frontend JavaScript expects.
 * 
 * Deploy this script and ensure "Execute as: Me" and "Who has access: Anyone"
 */

/**
 * Handles preflight OPTIONS requests for CORS.
 * @param {Object} e - The event parameter.
 * @returns {ContentService.TextOutput} The response with CORS headers.
 */
function doOptions(e) {
  return ContentService.createTextOutput()
    .setMimeType(ContentService.MimeType.TEXT)
    .withHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
}

/**
 * Handles POST requests to the web app. This is the main entry point.
 * @param {Object} e - The event parameter containing the POST data.
 * @returns {ContentService.TextOutput} The response from the Gemini API with CORS headers.
 */
function doPost(e) {
  let responseObject;

  try {
    // 1. Get the Gemini API Key securely from Script Properties
    const API_KEY = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
    if (!API_KEY) {
      responseObject = { error: "API Key is not set in Script Properties." };
    } else {
      // 2. Parse the incoming request
      const body = JSON.parse(e.postData.contents || '{}');
      const userPrompt = body.prompt;
      
      if (!userPrompt) {
        responseObject = { error: "No prompt was provided in the request." };
      } else {
        // 3. Create the prompt for Gemini API
        // Note: Frontend expects markdown formatted response
        const prompt = `Provide a professional analysis of the following faculty member for potential collaboration and future projects.

${userPrompt}

Please structure your response in markdown format with the following sections:
- **Strengths:** (key expertise and capabilities)
- **Potential Project Innovations:** (suggested research or project ideas)
- **Collaboration Recommendations:** (potential collaboration opportunities)

Use proper markdown formatting with headers (##), bold text (**), and bullet points (-) where appropriate.`;

        // 4. Prepare the request to the Gemini API
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
        
        const payload = {
          contents: [{
            parts: [{ text: prompt }]
          }]
        };

        const options = {
          method: 'post',
          contentType: 'application/json',
          payload: JSON.stringify(payload),
          muteHttpExceptions: true
        };

        // 5. Call the Gemini API and parse the response
        const response = UrlFetchApp.fetch(geminiUrl, options);
        const responseText = response.getContentText();
        const data = JSON.parse(responseText);

        if (data.error) {
          Logger.log('Gemini API Error: ' + JSON.stringify(data.error));
          responseObject = { error: "The AI model returned an error: " + data.error.message };
        } else {
          const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (!generatedText) {
            Logger.log('Unexpected API Response: ' + responseText);
            responseObject = { error: "Could not extract a valid response from the AI model." };
          } else {
            // 6. CRITICAL FIX: Return the response in the format frontend expects
            // Changed from { summary, analysis } to { text }
            responseObject = {
              text: generatedText
            };
          }
        }
      }
    }
  } catch (error) {
    Logger.log('Script Error: ' + error.toString());
    responseObject = { error: "An unexpected error occurred in the script: " + error.toString() };
  }

  // 7. Return the final response with the correct CORS header
  return ContentService
    .createTextOutput(JSON.stringify(responseObject))
    .setMimeType(ContentService.MimeType.JSON)
    .withHeaders({
      'Access-Control-Allow-Origin': '*'
    });
}

/**
 * CHANGES MADE:
 * 
 * 1. CRITICAL FIX (Line 96-98):
 *    - Changed from: responseObject = { summary: summary, analysis: analysis }
 *    - Changed to: responseObject = { text: generatedText }
 *    - Reason: Frontend expects 'text' field, not 'summary' and 'analysis'
 * 
 * 2. REMOVED Complex Parsing Logic:
 *    - Removed [SUMMARY] and [ANALYSIS] tag parsing
 *    - Reason: AI doesn't always follow tags, frontend has better markdown parser
 * 
 * 3. SIMPLIFIED Prompt:
 *    - Removed structured tags from prompt
 *    - Using markdown sections instead
 *    - Reason: More flexible, works better with frontend markdown parser
 * 
 * 4. IMPROVED Error Messages:
 *    - More specific error messages
 *    - Better logging
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 
 * 1. Open Google Apps Script Editor
 * 2. Delete existing Code.gs content
 * 3. Paste this entire file
 * 4. Save the project
 * 5. Go to File > Project properties > Script properties
 * 6. Ensure GEMINI_API_KEY is set
 * 7. Deploy as Web App:
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 8. Copy the new deployment URL
 * 9. Update WEB_APP_URL in index.html if URL changed
 * 10. Test using test-gemini-api.html
 * 
 * TESTING:
 * 
 * 1. Use test-gemini-api.html to verify API response
 * 2. Check that response has 'text' field (not 'summary'/'analysis')
 * 3. Verify markdown formatting is preserved
 * 4. Test error scenarios (network error, invalid key, etc.)
 */
