const handler = async (request: Request) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    const api_key = url.searchParams.get('api_key');
    const baseUrl = process.env.INSTANTLY_API_URL || 'https://api.instantly.ai';

    if (!api_key) {
      return new Response(JSON.stringify({ error: 'API key is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const response = await fetch(
      `${baseUrl}/api/v1/analytics/campaign/summary?api_key=${api_key}`
    );
    
    if (!response.ok) {
      throw new Error(`Instantly API error: ${response.status}`);
    }
    
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Instantly API Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch from Instantly' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export { handler as GET }; 