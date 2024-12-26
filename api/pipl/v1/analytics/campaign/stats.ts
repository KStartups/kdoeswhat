import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { api_key, workspace_id, start_date, end_date } = req.query;
  
  try {
    const response = await fetch(
      `https://api.pipl.ai/v1/analytics/campaign/stats?api_key=${api_key}&workspace_id=${workspace_id}&start_date=${start_date}&end_date=${end_date}`
    );
    const data = await response.json();
    
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch from Pipl' });
  }
} 