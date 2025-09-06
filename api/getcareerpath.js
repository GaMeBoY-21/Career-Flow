// File: /api/getcareerpath.js

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
  
      // Extract Gemini response text
      const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (!textContent) {
        return response.status(500).json({ error: "AI response was empty or invalid." });
      }
  
      // Remove markdown fences if present
      let cleanedText = textContent.replace(/^\s*```json\s*/, "").replace(/```\s*$/, "").trim();
  
      // Extract only the JSON object inside
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return response.status(500).json({ error: "No valid JSON found in AI response." });
      }
  
      try {
        const jsonData = JSON.parse(jsonMatch[0]);
        return response.status(200).json(jsonData);
      } catch (e) {
        console.error("JSON parse failed:", cleanedText);
        return response.status(500).json({ error: "AI returned invalid JSON." });
      }
  
    } catch (error) {
      console.error('Serverless Function Error:', error);
      return response.status(500).json({ error: 'An internal server error occurred.' });
    }
  }
  