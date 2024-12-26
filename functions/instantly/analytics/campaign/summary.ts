export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const api_key = url.searchParams.get('api_key');
  
  try {
    const response = await fetch(
      `${env.INSTANTLY_API_URL}/api/v1/analytics/campaign/summary?api_key=${api_key}`
    );
    
    if (!response.ok) {
      throw new Error(`Instantly API error: ${response.status}`);
    }
    
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch from Instantly' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 