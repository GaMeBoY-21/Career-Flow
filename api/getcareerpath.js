// File: /api/getCareerPath.js

export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
  
    const { role, personalizationData, isPersonalized } = req.body;
    const geminiApiKey = process.env.GEMINI_API_KEY;
  
    if (!geminiApiKey) {
      return res.status(500).json({ error: 'API key not configured on the server.' });
    }
  
    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
  
    // 🔹 Construct the prompt here
    let prompt = isPersonalized && personalizationData
      ? `Generate a personalized career guide for ${role}. User details:\n${JSON.stringify(personalizationData)}.\nReturn JSON with fields: role_info, roadmap, top_professionals, github_projects, helpful_resources.`
      : `Generate a career guide for ${role}. Return JSON with fields: role_info, roadmap, top_professionals, github_projects, helpful_resources.`;
  
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { response_mime_type: "application/json" }
    };
  
    try {
      const geminiResponse = await fetch(geminiApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
  
      const data = await geminiResponse.json();
      const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
      if (!textContent) {
        return res.status(500).json({ error: "Empty response from AI" });
      }
  
      // Clean ```json ... ```
      const cleaned = textContent.replace(/^\s*```json\s*/, '').replace(/```\s*$/, '').trim();
  
      let jsonData;
      try {
        jsonData = JSON.parse(cleaned);
      } catch {
        return res.status(500).json({ error: "Invalid JSON from AI" });
      }
  
      // 🔹 Ensure defaults so frontend never breaks
      const safeData = {
        role_info: jsonData.role_info || { title: role, description: "" },
        roadmap: jsonData.roadmap || [],
        top_professionals: jsonData.top_professionals || [],
        github_projects: jsonData.github_projects || [],
        helpful_resources: jsonData.helpful_resources || []
      };
  
      return res.status(200).json(safeData);
  
    } catch (err) {
      console.error("CareerPath API error:", err);
      return res.status(500).json({ error: "Server error occurred." });
    }
  }
  