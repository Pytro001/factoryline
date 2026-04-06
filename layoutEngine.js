/**
 * Layout generation — Vercel + local. Uses hosted OpenAI-compatible API, Ollama, or built-in demo.
 */
import { FACTORY_SYSTEM_PROMPT, USER_SUFFIX } from './factoryKnowledge.js';
import { buildDemoLayout } from './demoLayout.js';
import { normalizeProductionInput, formatTaktSnippet, applyThroughputAnalysis } from './throughputEngine.js';

const OLLAMA_URL = (process.env.OLLAMA_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

const DEFAULT_DIMS = {
  loading: [200, 90], storage: [200, 90], conveyor: [240, 55],
  cnc: [160, 90], robot: [160, 90], welding: [160, 90],
  paint: [180, 90], assembly: [180, 90], inspection: [160, 90],
  quality: [160, 90], packaging: [180, 90], exit: [140, 70],
  note: [200, 100],
};

/** Groq / OpenAI / Azure-compatible chat/completions */
export function getHostedLLMConfig() {
  const groq = process.env.GROQ_API_KEY?.trim();
  const openai = process.env.OPENAI_API_KEY?.trim();
  const aiKey = process.env.AI_API_KEY?.trim();
  const baseRaw = process.env.AI_BASE_URL?.trim()?.replace(/\/$/, '');

  if (groq) {
    const base = baseRaw || 'https://api.groq.com/openai/v1';
    return {
      url: `${base}/chat/completions`,
      key: groq,
      model: process.env.AI_MODEL?.trim() || 'llama-3.3-70b-versatile',
      provider: 'groq',
    };
  }
  if (openai) {
    const base = baseRaw || 'https://api.openai.com/v1';
    return {
      url: `${base}/chat/completions`,
      key: openai,
      model: process.env.AI_MODEL?.trim() || 'gpt-4o-mini',
      provider: 'openai',
    };
  }
  if (aiKey && baseRaw) {
    return {
      url: `${baseRaw}/chat/completions`,
      key: aiKey,
      model: process.env.AI_MODEL?.trim() || 'gpt-4o-mini',
      provider: 'custom',
    };
  }
  return null;
}

async function isOllamaReachable() {
  try {
    const r = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(2000) });
    return r.ok;
  } catch {
    return false;
  }
}

async function callHostedChat(hosted, messages, signal) {
  const response = await fetch(hosted.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${hosted.key}`,
    },
    signal,
    body: JSON.stringify({
      model: hosted.model,
      messages,
      stream: false,
      temperature: 0.3,
      top_p: 0.9,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    const e = new Error(`AI API error ${response.status}: ${body.slice(0, 280)}`);
    e.statusCode = 502;
    throw e;
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? '';
  if (!content) {
    const e = new Error('Empty response from AI model');
    e.statusCode = 502;
    throw e;
  }
  return content;
}

async function callOllamaChat(messages, signal) {
  const response = await fetch(`${OLLAMA_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages,
      stream: false,
      temperature: 0.3,
      top_p: 0.9,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    const e = new Error(`Ollama API error ${response.status}: ${body.slice(0, 200)}`);
    e.statusCode = 502;
    throw e;
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? '';
  if (!content) {
    const e = new Error('Empty response from model');
    e.statusCode = 502;
    throw e;
  }
  return content;
}

function normalizeNodes(layout) {
  if (!Array.isArray(layout.nodes)) return;
  layout.nodes.forEach((n, i) => {
    if (!n || typeof n !== 'object') return;
    if (!n.id || typeof n.id !== 'string') n.id = `node_${i + 1}`;
    if (n.row !== undefined && n.row !== null) {
      let row = Number(n.row);
      if (!Number.isFinite(row) || row < 0) row = 0;
      n.row = Math.floor(row);
    }
    if (n.slot !== undefined && n.slot !== null) {
      let slot = Number(n.slot);
      if (!Number.isFinite(slot) || slot < 0) slot = 0;
      n.slot = Math.floor(slot);
    }
    if (n.machineType && typeof n.machineType === 'string') {
      n.machineType = n.machineType.toLowerCase().trim();
    }
    if (n.cycleTimeSec !== undefined && n.cycleTimeSec !== null && n.cycleTimeSec !== '') {
      const ct = Number(n.cycleTimeSec);
      if (Number.isFinite(ct)) n.cycleTimeSec = Math.max(0, Math.round(ct * 10) / 10);
      else delete n.cycleTimeSec;
    }
  });
}

function fixLayout(layout) {
  const ROW_HEIGHT = 160;
  const ROW_START_Y = 80;
  const COL_START_X = 80;
  const GAP_X = 60;

  layout.nodes.forEach((n) => {
    const [dw, dh] = DEFAULT_DIMS[n.machineType] ?? [160, 90];
    n.width  = dw;
    n.height = dh;
  });

  const hasRowSlot =
    layout.nodes.length > 0 &&
    layout.nodes.every((n) => n != null && n.row !== undefined && n.slot !== undefined);

  if (hasRowSlot) {
    const rowMap = {};
    for (const n of layout.nodes) {
      const r = n.row ?? 0;
      if (!rowMap[r]) rowMap[r] = [];
      rowMap[r].push(n);
    }
    const rowKeys = Object.keys(rowMap).map(Number).sort((a, b) => a - b);
    for (let ri = 0; ri < rowKeys.length; ri++) {
      const nodes = rowMap[rowKeys[ri]];
      nodes.sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));
      const y = ROW_START_Y + ri * ROW_HEIGHT;
      let cursor = COL_START_X;
      for (const n of nodes) {
        n.x = cursor;
        n.y = y;
        cursor += n.width + GAP_X;
      }
    }
  } else {
    const ROW_SNAP = 60;
    const rows = [];
    const sorted = [...layout.nodes].sort((a, b) => (a.y ?? 0) - (b.y ?? 0));
    for (const node of sorted) {
      const row = rows.find((r) => Math.abs(r.y - (node.y ?? 0)) <= ROW_SNAP);
      if (row) row.nodes.push(node);
      else rows.push({ y: node.y ?? 0, nodes: [node] });
    }
    rows.forEach((row, rowIdx) => {
      row.nodes.sort((a, b) => (a.x ?? 0) - (b.x ?? 0));
      const y = ROW_START_Y + rowIdx * ROW_HEIGHT;
      let cursor = COL_START_X;
      for (const n of row.nodes) {
        n.y = y;
        n.x = cursor;
        cursor += n.width + GAP_X;
      }
    });
  }

  layout.nodes.forEach((n) => {
    delete n.row;
    delete n.slot;
  });

  const nodeIds = new Set(layout.nodes.map((n) => n.id));
  layout.edges = layout.edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));
  return layout;
}

function extractJSON(text) {
  let str = text.trim();
  const fenced = str.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced) str = fenced[1].trim();
  const start = str.indexOf('{');
  const end = str.lastIndexOf('}');
  if (start !== -1 && end > start) str = str.slice(start, end + 1);
  return JSON.parse(str);
}

function finalizeLayout(layout, isDemo) {
  if (!Array.isArray(layout.nodes) || layout.nodes.length === 0) {
    const e = new Error('Model returned invalid layout (no nodes)');
    e.statusCode = 422;
    throw e;
  }
  layout.title = layout.title || 'Factory Floor Plan';
  layout.edges = layout.edges || [];
  if (isDemo) layout.demo = true;

  try {
    normalizeNodes(layout);
    fixLayout(layout);
  } catch (fixErr) {
    const e = new Error(`Could not build layout from model output: ${fixErr.message}`);
    e.statusCode = 422;
    e.hint = 'layout_fix_failed';
    throw e;
  }
  return layout;
}

/**
 * Full generation: hosted LLM → Ollama → built-in lean demo (always works on Vercel).
 */
export async function generateLayoutFromPrompt(prompt, productionRaw = null) {
  if (!prompt || typeof prompt !== 'string') {
    const e = new Error('A prompt string is required.');
    e.statusCode = 400;
    throw e;
  }

  const production = normalizeProductionInput(productionRaw);
  const userContent = production
    ? `Design a lean factory floor plan for:\n\n"${prompt}"\n\n${formatTaktSnippet(production)}\n\n${USER_SUFFIX}`
    : `Design a lean factory floor plan for:\n\n"${prompt}"\n\n${USER_SUFFIX}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);
  const messages = [
    { role: 'system', content: FACTORY_SYSTEM_PROMPT },
    { role: 'user', content: userContent },
  ];

  const finish = (layout, isDemo) => {
    finalizeLayout(layout, isDemo);
    if (production) applyThroughputAnalysis(layout, production);
    return layout;
  };

  try {
    const hosted = getHostedLLMConfig();
    if (hosted) {
      const raw = await callHostedChat(hosted, messages, controller.signal);
      clearTimeout(timeout);
      const layout = extractJSON(raw);
      return finish(layout, false);
    }

    if (await isOllamaReachable()) {
      const raw = await callOllamaChat(messages, controller.signal);
      clearTimeout(timeout);
      const layout = extractJSON(raw);
      return finish(layout, false);
    }

    clearTimeout(timeout);
    const demo = buildDemoLayout(prompt);
    return finish(demo, true);
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      const e = new Error('Generation timed out. Try a simpler prompt.');
      e.statusCode = 504;
      throw e;
    }
    if (err instanceof SyntaxError) {
      const e = new Error('Model returned invalid JSON. Please try again.');
      e.statusCode = 422;
      e.hint = 'json_parse_error';
      throw e;
    }
    throw err;
  }
}

/** Health for landing page */
export async function getAIHealth() {
  const hosted = getHostedLLMConfig();
  if (hosted) {
    return {
      status: 'ok',
      llmReady: true,
      demoMode: false,
      provider: hosted.provider,
      model: hosted.model,
      ollamaRunning: false,
      modelReady: true,
      models: [hosted.model],
    };
  }

  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(3000) });
    const data = await response.json();
    const models = data.models?.map((m) => m.name) ?? [];
    const modelReady = models.some((m) => m.startsWith('llama3.2'));
    return {
      status: 'ok',
      llmReady: modelReady,
      demoMode: !modelReady,
      provider: 'ollama',
      model: OLLAMA_MODEL,
      ollamaRunning: true,
      modelReady,
      models,
    };
  } catch {
    return {
      status: 'ok',
      llmReady: false,
      demoMode: true,
      provider: 'demo',
      model: null,
      ollamaRunning: false,
      modelReady: false,
      models: [],
    };
  }
}
