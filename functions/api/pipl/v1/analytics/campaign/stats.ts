export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const api_key = url.searchParams.get('api_key');
  const workspace_id = url.searchParams.get('workspace_id');
  const start_date = url.searchParams.get('start_date');
  const end_date = url.searchParams.get('end_date');

  try {
    const piplUrl = `${env.PIPL_API_URL}/api/v1/analytics/campaign/stats`;
    const requestUrl = `${piplUrl}?api_key=${api_key}&workspace_id=${workspace_id}&start_date=${start_date}&end_date=${end_date}`;

    console.log('Fetching from Pipl:', requestUrl);

    const response = await fetch(requestUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Pipl API error: ${response.status}`);
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Pipl handler error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch from Pipl' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 