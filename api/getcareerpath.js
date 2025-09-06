// File: /api/getcareerpath.js

export default async function handler(request, response) {
    if (request.method !== "POST") {
      return response.status(405).json({ error: "Method Not Allowed" });
    }
  
    const { prompt, expectJson = true } = request.body;
    const geminiApiKey = process.env.GEMINI_API_KEY;
  
    if (!geminiApiKey) {
      return response
        .status(500)
        .json({ error: "API key not configured on the server." });
    }
  
    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
  
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        response_mime_type: expectJson ? "application/json" : "text/plain",
      },
    };
  
    try {
      const geminiResponse = await fetch(geminiApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
  
      const data = await geminiResponse.json();
  
      if (!geminiResponse.ok) {
        const errorMessage =
          data.error?.message || "An unknown error occurred with the AI service.";
        return response
          .status(geminiResponse.status)
          .json({ error: errorMessage });
      }
  
      // --- Extract text safely ---
      const textContent =
        data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
  
      if (!textContent) {
        throw new Error("AI response was empty or in an unexpected format.");
      }
  
      // --- CASE 1: JSON expected (roadmap, career path) ---
      if (expectJson) {
        const cleanedText = textContent
          .replace(/^\s*```json\s*/i, "")
          .replace(/```\s*$/i, "")
          .trim();
  
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
  
        if (!jsonMatch) {
          return response
            .status(500)
            .json({ error: "No valid JSON found in AI response." });
        }
  
        try {
          const jsonData = JSON.parse(jsonMatch[0]);
  
          // --- Guarantee required fields ---
          return response.status(200).json({
            role_info: jsonData.role_info || { title: "", description: "" },
            roadmap: jsonData.roadmap || [],
            github_projects: jsonData.github_projects || [],
            top_professionals: jsonData.top_professionals || [],
            helpful_resources: jsonData.helpful_resources || [],
            timeline_analysis: jsonData.timeline_analysis || null, // ✅ Added field
          });
        } catch (e) {
          console.error("JSON parse failed:", cleanedText);
          return response
            .status(500)
            .json({ error: "AI returned invalid JSON format." });
        }
      }
  
      // --- CASE 2: Plain text/HTML expected (projects, interview prep) ---
      return response.status(200).send(textContent);
    } catch (error) {
      console.error("Serverless Function Error:", error);
      return response
        .status(500)
        .json({ error: "An internal server error occurred." });
    }
  }
  