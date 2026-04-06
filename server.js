import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;
const OLLAMA_URL = 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// ── System prompt for structured factory layout generation ────────────────────
const SYSTEM_PROMPT = `You are an expert industrial factory floor plan designer creating professional top-down 2D factory layouts.
Your output will be rendered as an engineering drawing — clean, structured, and readable.

CRITICAL: Return ONLY a raw JSON object — no markdown, no code blocks, no explanation, nothing else.

Required JSON format:
{
  "title": "Descriptive Factory Name",
  "nodes": [
    {
      "id": "node_1",
      "machineType": "storage",
      "label": "Raw Material Storage",
      "x": 80,
      "y": 160,
      "width": 220,
      "height": 160,
      "notes": "Steel coils & aluminum sheet stock · Capacity: 40t · FIFO rotation"
    }
  ],
  "edges": [
    {
      "id": "edge_1",
      "source": "node_1",
      "target": "node_2",
      "label": "6m"
    }
  ]
}

Valid machineType values (use ONLY these exact strings):
- storage    → raw material storage / warehouse / input buffer
- loading    → loading dock / truck bay / shipping/receiving
- conveyor   → conveyor belt / transfer line / AGV lane
- cnc        → CNC machine / milling / turning / laser cutting
- robot      → robotic arm / automated cell / pick-and-place
- welding    → welding station / spot welder / MIG/TIG
- paint      → paint booth / powder coating / surface treatment
- assembly   → assembly station / workbench / manual assembly
- inspection → inspection station / CMM / vision system / test bench
- quality    → quality control / end-of-line test / final check
- packaging  → packaging line / labeling / boxing / palletizing
- exit       → shipping dock / finished goods / truck exit

LAYOUT RULES — follow ALL of these exactly:

1. FLOW DIRECTION: Layout flows LEFT → RIGHT as a production sequence:
   - x: 80–350    → Incoming: loading dock, raw material storage
   - x: 350–700   → Primary processing: CNC, welding, forming
   - x: 700–1050  → Sub-assembly, robotic operations, paint
   - x: 1050–1350 → Final assembly, treatment
   - x: 1350–1600 → Quality control, packaging, shipping out

2. VERTICAL ARRANGEMENT — use PARALLEL LINES (y: 80–900):
   - Mandatory: generate at least 2 parallel production lines
   - Line A (main):  y ≈ 80–260
   - Line B (sub):   y ≈ 360–540
   - Line C (optional): y ≈ 640–820
   - Minimum vertical gap between any two nodes on DIFFERENT rows: 200px
   - Conveyors and conveyors only may span rows (diagonal is OK)

3. CONVERGENCE — this is critical:
   - Parallel sub-lines MUST merge into a shared downstream node.
   - Example: nodes on Line A and Line B both output edges to the SAME assembly or final inspection node.
   - A convergence node (e.g. assembly) should have 2 or more incoming edges from different rows.
   - Include at least ONE convergence point in every layout.
   - Model this explicitly: e.g. edge from node_4 (Line A) → node_9, AND edge from node_8 (Line B) → node_9.

4. SPACING: Minimum 200px horizontal gap between node LEFT edges in the SAME row (y-band).
   Machines must NEVER overlap. Check every node pair.

5. NODE COUNT: MINIMUM 12 nodes, MAXIMUM 16 nodes. No exceptions — never fewer than 12.

6. EDGES — strict connectivity:
   - Every node except the very first and very last must have AT LEAST one incoming AND one outgoing edge.
   - Convergence nodes may have 2–3 incoming edges.
   - Branch nodes may have 2 outgoing edges (when a line splits into parallel sub-lines).
   - Add a conveyor edge whenever a material moves more than 8m between stations.

7. LABELS: Specific engineering names only — e.g. "Stator Winding Jig", "Body Frame Welding Cell A", "Final AOI Test Bench".
   NEVER use generic names like "Machine 1", "Station A", or "Process 3".

8. NOTES: EXACTLY 2–3 engineering specs per node, separated by " · " (middle dot + space).
   Examples: "Cycle time: 45s · Output: 120 pcs/hr · 2 operators"
             "Temp: 185°C · Dwell: 22 min · Capacity: 800L"
             "Accuracy: ±0.02mm · CMM probe · Auto reject"
   Always include cycle time OR output rate AND at least one other spec.

9. MEASUREMENTS: Edge labels = realistic distances in meters — e.g. "3.5m", "12m", "0.8m".

Node dimensions — use EXACTLY these values (width × height in pixels):
loading=200×90, storage=200×90, conveyor=240×55, cnc=160×90, robot=160×90,
welding=160×90, paint=180×90, assembly=180×90, inspection=160×90,
quality=160×90, packaging=180×90, exit=140×70

STRICT ROW ALIGNMENT — every node in the same production line must share the SAME y coordinate.
- All Line A nodes: identical y value (e.g. y=100 for all)
- All Line B nodes: identical y value (e.g. y=260 for all)
- All Line C nodes: identical y value (e.g. y=420 for all)
- Never stagger nodes vertically within the same row.
- Only cross-row conveyor or merge edges may connect different y bands.
- x spacing between consecutive nodes in same row: 40–80px gap between right edge of one and left edge of next.`;

// ── Post-process: fix overlapping nodes ──────────────────────────────────────
// Groups nodes into rows by proximity, then redistributes x positions so
// no two nodes in the same row overlap. Also snaps each row to a clean y.
function fixLayout(layout) {
  const GAP = 50;          // min gap between nodes in the same row
  const ROW_SNAP = 20;     // y values within this range = same row
  const ROW_HEIGHT = 200;  // vertical distance between rows

  // Assign canonical dimensions if missing
  const DEFAULT_DIMS = {
    loading: [200, 90], storage: [200, 90], conveyor: [240, 55],
    cnc: [160, 90], robot: [160, 90], welding: [160, 90],
    paint: [180, 90], assembly: [180, 90], inspection: [160, 90],
    quality: [160, 90], packaging: [180, 90], exit: [140, 70],
  };

  layout.nodes.forEach((n) => {
    const [dw, dh] = DEFAULT_DIMS[n.machineType] ?? [160, 90];
    if (!n.width  || n.width  < 10) n.width  = dw;
    if (!n.height || n.height < 10) n.height = dh;
  });

  // Group nodes into rows based on y proximity
  const rows = [];
  const sorted = [...layout.nodes].sort((a, b) => a.y - b.y);

  for (const node of sorted) {
    const row = rows.find((r) => Math.abs(r.y - node.y) <= ROW_SNAP);
    if (row) {
      row.nodes.push(node);
    } else {
      rows.push({ y: node.y, nodes: [node] });
    }
  }

  // Snap rows to clean y positions and redistribute x
  rows.forEach((row, rowIdx) => {
    const canonicalY = rowIdx * ROW_HEIGHT + 80;

    // Sort nodes in this row by their original x
    row.nodes.sort((a, b) => a.x - b.x);

    let cursor = 80; // start x
    for (const node of row.nodes) {
      node.y = canonicalY;
      node.x = cursor;
      cursor += node.width + GAP;
    }
  });

  return layout;
}

// ── JSON extraction — handles model quirks ────────────────────────────────────
function extractJSON(text) {
  let str = text.trim();

  // Strip markdown code fences
  const fenced = str.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced) str = fenced[1].trim();

  // Find the outermost JSON object
  const start = str.indexOf('{');
  const end = str.lastIndexOf('}');
  if (start !== -1 && end > start) {
    str = str.slice(start, end + 1);
  }

  return JSON.parse(str);
}

// ── POST /api/generate ────────────────────────────────────────────────────────
app.post('/api/generate', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'A prompt string is required.' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000); // 2 min max

  try {
    console.log(`[generate] Prompt: "${prompt.slice(0, 80)}..."`);

    const response = await fetch(`${OLLAMA_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Design a complete, professional factory floor plan for:\n\n"${prompt}"\n\nRequirements checklist before you output:\n- At least 12 nodes total\n- At least 2 parallel production lines (different y bands, 200px+ apart)\n- At least 1 convergence point where lines merge (multiple edges into same node)\n- Every node has 2-3 spec notes separated by \" · \"\n- Return ONLY valid JSON, nothing else.`,
          },
        ],
        stream: false,
        temperature: 0.2,
        top_p: 0.9,
      }),
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Ollama API error ${response.status}: ${body.slice(0, 200)}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '';

    if (!content) {
      throw new Error('Empty response from model');
    }

    const layout = extractJSON(content);

    // Validate required fields
    if (!Array.isArray(layout.nodes) || layout.nodes.length === 0) {
      throw new Error('Model returned invalid layout (no nodes)');
    }

    layout.title = layout.title || 'Factory Floor Plan';
    layout.edges = layout.edges || [];

    // Fix overlapping / stacked nodes deterministically
    fixLayout(layout);

    console.log(`[generate] OK — ${layout.nodes.length} nodes, ${layout.edges.length} edges`);
    res.json(layout);

  } catch (err) {
    clearTimeout(timeout);
    console.error('[generate] Error:', err.message);

    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'Generation timed out. Try a simpler prompt or check Ollama is running.' });
    }

    if (err.message?.includes('ECONNREFUSED') || err.message?.includes('fetch failed')) {
      return res.status(503).json({
        error: 'Ollama is not running.',
        fix: 'Run: ollama serve',
        hint: 'ollama_offline',
      });
    }

    if (err instanceof SyntaxError) {
      return res.status(422).json({
        error: 'Model returned invalid JSON. Please try again.',
        hint: 'json_parse_error',
      });
    }

    res.status(500).json({ error: err.message || 'Generation failed' });
  }
});

// ── GET /api/health ───────────────────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(3000) });
    const data = await response.json();
    const models = data.models?.map((m) => m.name) ?? [];
    const modelReady = models.some((m) => m.startsWith('llama3.2'));
    res.json({ status: 'ok', ollamaRunning: true, modelReady, models });
  } catch {
    res.json({ status: 'ok', ollamaRunning: false, modelReady: false, models: [] });
  }
});

app.listen(PORT, () => {
  console.log(`\n🏭 Factoryline API → http://localhost:${PORT}`);
  console.log(`   Ollama model: ${OLLAMA_MODEL}\n`);
});
