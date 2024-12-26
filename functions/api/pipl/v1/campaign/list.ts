export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const api_key = url.searchParams.get('api_key');
  const workspace_id = url.searchParams.get('workspace_id');

  console.log('Pipl list request params:', { workspace_id });

  try {
    const piplUrl = `${env.PIPL_API_URL}/api/v1/campaign/list`;
    const requestUrl = `${piplUrl}?api_key=${api_key}&workspace_id=${workspace_id}`;

    console.log('Fetching campaign list from:', requestUrl);

    const response = await fetch(requestUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${api_key}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pipl list error:', {
        status: response.status,
        text: errorText
      });
      throw new Error(`Pipl API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Pipl campaign list response:', data);

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Pipl list handler error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch campaigns from Pipl',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 