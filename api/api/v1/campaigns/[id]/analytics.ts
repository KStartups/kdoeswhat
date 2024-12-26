const handler = async (request: Request) => {
  const { searchParams, pathname } = new URL(request.url);
  const api_key = searchParams.get('api_key');
  const id = pathname.split('/').pop();
  const baseUrl = process.env.SMARTLEAD_API_URL;

  if (!api_key || !id) {
    return new Response(JSON.stringify({ error: 'API key and ID are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const response = await fetch(
      `${baseUrl}/api/v1/campaigns/${id}/analytics?api_key=${api_key}`
    );
    
    if (!response.ok) {
      throw new Error(`Smartlead API error: ${response.status}`);
    }
    
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Smartlead API Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch from Smartlead' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export default handler; 