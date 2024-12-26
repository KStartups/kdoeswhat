import type { VercelRequest, VercelResponse } from '@vercel/node';

const handler = async (req: VercelRequest, res: VercelResponse) => {
  const { api_key, workspace_id, start_date, end_date } = req.query;
  const baseUrl = process.env.PIPL_API_URL;
  
  try {
    const response = await fetch(
      `${baseUrl}/v1/analytics/campaign/stats?api_key=${api_key}&workspace_id=${workspace_id}&start_date=${start_date}&end_date=${end_date}`
    );
    
    if (!response.ok) {
      throw new Error(`Pipl API error: ${response.status}`);
    }
    
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Pipl API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch from Pipl' });
  }
};

export default handler; 