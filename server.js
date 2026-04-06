import express from 'express';
import cors from 'cors';
import { generateLayoutFromPrompt, getOllamaHealth } from './layoutEngine.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.post('/api/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    console.log(`[generate] Prompt: "${String(prompt).slice(0, 80)}..."`);
    const layout = await generateLayoutFromPrompt(prompt);
    console.log(`[generate] OK — ${layout.nodes.length} nodes, ${layout.edges.length} edges`);
    res.json(layout);
  } catch (err) {
    const code = err.statusCode || 500;
    console.error('[generate] Error:', err.message);
    const payload = { error: err.message || 'Generation failed' };
    if (err.fix) payload.fix = err.fix;
    if (err.hint) payload.hint = err.hint;
    res.status(code).json(payload);
  }
});

app.get('/api/health', async (_req, res) => {
  const h = await getOllamaHealth();
  res.json(h);
});

app.listen(PORT, () => {
  console.log(`\n🏭 Factoryline API → http://localhost:${PORT}`);
  console.log(`   Ollama: ${process.env.OLLAMA_URL || 'http://127.0.0.1:11434'}`);
  console.log(`   Model: ${process.env.OLLAMA_MODEL || 'llama3.2'}\n`);
});
