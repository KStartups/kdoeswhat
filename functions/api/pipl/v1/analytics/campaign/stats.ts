export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const api_key = url.searchParams.get('api_key');
  const workspace_id = url.searchParams.get('workspace_id');
  const campaign_id = url.searchParams.get('campaign_id');
  const start_date = url.searchParams.get('start_date');
  const end_date = url.searchParams.get('end_date');

  console.log('Pipl stats request params:', { workspace_id, campaign_id, start_date, end_date });

  try {
    const piplUrl = `${env.PIPL_API_URL}/api/v1/analytics/campaign/stats`;
    const requestUrl = `${piplUrl}?api_key=${api_key}&workspace_id=${workspace_id}&campaign_id=${campaign_id}&start_date=${start_date}&end_date=${end_date}`;

    console.log('Fetching stats from:', requestUrl);

    const response = await fetch(requestUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${api_key}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pipl stats error:', {
        status: response.status,
        text: errorText
      });
      throw new Error(`Pipl API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Pipl stats response:', data);

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Pipl stats handler error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch stats from Pipl',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 