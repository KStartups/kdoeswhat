const handler = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const api_key = searchParams.get('api_key');
  const baseUrl = process.env.SMARTLEAD_API_URL;

  if (!api_key) {
    return new Response(JSON.stringify({ error: 'API key is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const response = await fetch(
      `${baseUrl}/api/v1/campaigns?api_key=${api_key}`
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