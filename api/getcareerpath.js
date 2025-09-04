// File: /api/getCareerPath.js

export default async function handler(request, response) {
    // We only want to handle POST requests to this function
    if (request.method !== 'POST') {
      return response.status(405).json({ error: 'Method Not Allowed' });
    }
  
    // Get the prompt from the body of the request sent by the website
    const { prompt } = request.body;
    
    // Securely read the secret API key from Vercel's Environment Variables
    const geminiApiKey = process.env.GEMINI_API_KEY;
  
    // Handle case where the API key is not configured on the server
    if (!geminiApiKey) {
      return response.status(500).json({ error: 'API key not configured on the server.' });
    }
  
    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
  
    // Prepare the data payload to send to the real Gemini API
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        response_mime_type: "application/json",
      },
    };
  
    try {
      // Make the actual call to the Gemini API from the secure server
      const geminiResponse = await fetch(geminiApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
  
      const data = await geminiResponse.json();
  
      // If the API call wasn't successful, send back an error
      if (!geminiResponse.ok) {
          console.error('Gemini API Error:', data);
          const errorMessage = data.error?.message || 'An unknown error occurred with the AI service.';
          return response.status(geminiResponse.status).json({ error: errorMessage });
      }
  
      // If successful, send the data back to your website
      return response.status(200).json(data);
    } catch (error) {
      console.error('Serverless Function Error:', error);
      return response.status(500).json({ error: 'An internal server error occurred.' });
    }
  }