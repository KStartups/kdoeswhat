import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  const api_key = req.query.api_key as string;
  const baseUrl = process.env.SMARTLEAD_API_URL;
  
  try {
    const response = await fetch(
      `${baseUrl}/api/v1/campaigns/${id}/analytics?api_key=${api_key}`
    );
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Smartlead API error: ${response.status}`);
    }
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Smartlead API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch from Smartlead' });
  }
} 