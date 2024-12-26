#!/bin/bash

# Remove old api folder if it exists
rm -rf api

# Create directory structure
mkdir -p api/campaigns/[id]/analytics
mkdir -p api/pipl/analytics/campaign/stats
mkdir -p api/instantly/analytics/campaign/summary

# Create Smartlead routes
cat > api/campaigns/route.ts << 'EOL'
const handler = async (request: Request) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    const api_key = url.searchParams.get('api_key');
    const baseUrl = process.env.SMARTLEAD_API_URL || 'https://server.smartlead.ai';

    if (!api_key) {
      return new Response(JSON.stringify({ error: 'API key is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
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

export { handler as GET };
EOL

cat > api/campaigns/[id]/analytics/route.ts << 'EOL'
const handler = async (request: Request) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    const api_key = url.searchParams.get('api_key');
    const id = url.pathname.split('/').slice(-2)[0];
    const baseUrl = process.env.SMARTLEAD_API_URL || 'https://server.smartlead.ai';

    if (!api_key || !id) {
      return new Response(JSON.stringify({ error: 'API key and ID are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
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

export { handler as GET };
EOL

# Create Pipl route
cat > api/pipl/analytics/campaign/stats/route.ts << 'EOL'
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
EOL

# Create Instantly route
cat > api/instantly/analytics/campaign/summary/route.ts << 'EOL'
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
EOL

# Make the script executable
chmod +x setup-api.sh 