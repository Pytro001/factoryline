import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { generateLayoutFromPrompt, getAIHealth, getHostedLLMConfig } from './layoutEngine.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, production } = req.body;
    console.log(`[generate] Prompt: "${String(prompt).slice(0, 80)}..."`);
    const layout = await generateLayoutFromPrompt(prompt, production ?? null);
    console.log(`[generate] OK — ${layout.nodes.length} nodes, ${layout.edges.length} edges`, layout.demo ? '(demo)' : '');
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
  const h = await getAIHealth();
  res.json(h);
});

app.listen(PORT, () => {
  const hosted = getHostedLLMConfig();
  console.log(`\n🏭 Factoryline API → http://localhost:${PORT}`);
  if (hosted) {
    console.log(`   AI: ${hosted.provider} / ${hosted.model}`);
  } else {
    console.log(`   Ollama: ${process.env.OLLAMA_URL || 'http://127.0.0.1:11434'}`);
    console.log(`   Model: ${process.env.OLLAMA_MODEL || 'llama3.2'}`);
    console.log(`   (Or set GROQ_API_KEY / OPENAI_API_KEY for hosted LLM)`);
  }
  console.log('');
});
