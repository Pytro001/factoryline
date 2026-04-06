import { getAIHealth } from '../layoutEngine.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }
  const h = await getAIHealth();
  return res.status(200).json(h);
}
