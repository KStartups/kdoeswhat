export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const api_key = url.searchParams.get('api_key');
  const workspace_id = url.searchParams.get('workspace_id');
  const start_date = url.searchParams.get('start_date');
  const end_date = url.searchParams.get('end_date');

  if (!api_key || !workspace_id || !start_date || !end_date) {
    return new Response(
      JSON.stringify({ 
        error: 'Missing required parameters',
        params: { api_key: !!api_key, workspace_id: !!workspace_id, start_date: !!start_date, end_date: !!end_date }
      }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const piplUrl = new URL('/v1/analytics/campaign/stats', env.PIPL_API_URL);
    piplUrl.searchParams.set('api_key', api_key);
    piplUrl.searchParams.set('workspace_id', workspace_id);
    piplUrl.searchParams.set('start_date', start_date);
    piplUrl.searchParams.set('end_date', end_date);

    console.log('Fetching from Pipl:', piplUrl.toString());

    const response = await fetch(piplUrl.toString(), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pipl API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Pipl API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Pipl handler error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch from Pipl',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 