import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { api_key } = req.query;
  
  try {
    const response = await fetch(`https://server.smartlead.ai/api/v1/campaigns?api_key=${api_key}`);
    const data = await response.json();
    
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch from Smartlead' });
  }
} 