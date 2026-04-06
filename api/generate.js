import { generateLayoutFromPrompt } from '../layoutEngine.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body;
    const prompt = body?.prompt;
    const layout = await generateLayoutFromPrompt(prompt);
    return res.status(200).json(layout);
  } catch (err) {
    const code = err.statusCode || 500;
    const payload = { error: err.message || 'Generation failed' };
    if (err.fix) payload.fix = err.fix;
    if (err.hint) payload.hint = err.hint;
    return res.status(code).json(payload);
  }
}
