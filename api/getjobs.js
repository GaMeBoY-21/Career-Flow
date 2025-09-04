// File: /api/getJobs.js

export default async function handler(request, response) {
    // Only allow POST requests
    if (request.method !== 'POST') {
      return response.status(405).json({ error: 'Method Not Allowed' });
    }
  
    // Get the role and country from the request body
    const { role, country } = request.body;
  
    // Securely read the secret JSearch API key
    const jsearchApiKey = process.env.JSEARCH_API_KEY; 
  
    if (!jsearchApiKey) {
      return response.status(500).json({ error: 'JSearch API key not configured on the server.' });
    }
    
    // Construct the query for the JSearch API
    const query = country ? `${role} in ${country}` : role;
    const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&num_pages=1&page=1`;
    
    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': jsearchApiKey, // Add the secret key to the headers
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
      }
    };
  
    try {
      // Make the actual call to the JSearch API
      const jsearchResponse = await fetch(url, options);
      const data = await jsearchResponse.json();
  
      if (!jsearchResponse.ok) {
          return response.status(jsearchResponse.status).json({ error: 'Failed to fetch jobs from the provider.' });
      }
  
      // Send the job data back to your website
      return response.status(200).json(data);
    } catch (error) {
      console.error('JSearch Function Error:', error);
      return response.status(500).json({ error: 'An internal error occurred while fetching jobs.' });
    }
  }