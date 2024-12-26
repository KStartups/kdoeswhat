const handler = async (request: Request) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    const api_key = url.searchParams.get('api_key');
    const workspace_id = url.searchParams.get('workspace_id');
    const start_date = url.searchParams.get('start_date');
    const end_date = url.searchParams.get('end_date');
    const baseUrl = process.env.PIPL_API_URL || 'https://api.pipl.ai';

    if (!api_key || !workspace_id || !start_date || !end_date) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const response = await fetch(
      `${baseUrl}/v1/analytics/campaign/stats?api_key=${api_key}&workspace_id=${workspace_id}&start_date=${start_date}&end_date=${end_date}`
    );
    
    if (!response.ok) {
      throw new Error(`Pipl API error: ${response.status}`);
    }
    
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Pipl API Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch from Pipl' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export { handler as GET }; 