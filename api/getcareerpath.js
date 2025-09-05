// File: /api/getCareerPath.js

export default async function handler(request, response) {
    if (request.method !== 'POST') {
      return response.status(405).json({ error: 'Method Not Allowed' });
    }
  
    const { prompt } = request.body;
    const geminiApiKey = process.env.GEMINI_API_KEY;
  
    if (!geminiApiKey) {
      return response.status(500).json({ error: 'API key not configured on the server.' });
    }
  
    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
  
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        response_mime_type: "application/json",
      },
    };
  
    try {
      const geminiResponse = await fetch(geminiApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
  
      const data = await geminiResponse.json();
  
      if (!geminiResponse.ok) {
          const errorMessage = data.error?.message || 'An unknown error occurred with the AI service.';
          return response.status(geminiResponse.status).json({ error: errorMessage });
      }
  
      // --- NEW LOGIC STARTS HERE ---
      // Extract the raw text from the Gemini response
      const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
      if (!textContent) {
          throw new Error("AI response was empty or in an unexpected format.");
      }
      
      // Clean the markdown fences (```json ... ```)
      const cleanedText = textContent.replace(/^\s*```json\s*/, '').replace(/```\s*$/, '').trim();
  
      try {
          // Parse the cleaned text into a JSON object
          const jsonData = JSON.parse(cleanedText);
          // Send the clean, parsed JSON object back to the website
          return response.status(200).json(jsonData);
      } catch (e) {
          // If parsing fails, it's a server error
          console.error("Failed to parse JSON from AI:", cleanedText);
          return response.status(500).json({ error: "The AI returned data in a format that could not be read." });
      }
      // --- NEW LOGIC ENDS HERE ---
  
    } catch (error) {
      console.error('Serverless Function Error:', error);
      return response.status(500).json({ error: 'An internal server error occurred.' });
    }
  }