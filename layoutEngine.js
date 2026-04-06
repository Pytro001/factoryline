/**
 * Shared layout generation — used by Express (server.js) and Vercel (api/*).
 */
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

const SYSTEM_PROMPT = `You are an expert lean manufacturing engineer designing top-down 2D factory floor plans.
You think in terms of material flow, takt time, and waste elimination.

LEAN MANUFACTURING KNOWLEDGE — apply these principles to every layout you design:
- No part warehouses. First-tier suppliers deliver materials hourly, directly to the line.
- Minimal floor space. Workers must be close enough for face-to-face communication. No room for excess inventory.
- Each line worker keeps less than one hour of inventory at their station.
- Every worker has the authority to stop the line (andon) when a defect is found.
- Defective parts are marked and sent to a small quality control area where a team applies root-cause analysis to eliminate the problem at its source.
- Rework areas are tiny because defects are eliminated at root cause, not patched downstream.
- Finished products move directly from end-of-line to outbound trucks. No finished goods warehouse.
- Every line has real-time visual management: screens showing daily target, units produced, personnel status, equipment health, and where help is needed.
- If an emerging innovation exists that competitors ignore due to cost or complexity, it should be fast-tracked through a dedicated development cell with top resource priority.

Use this knowledge to inform station names, notes, and flow logic — but do NOT list these as bullet points in the output. They should be reflected naturally in the factory design.

CRITICAL: Return ONLY a raw JSON object — no markdown, no code blocks, no explanation, nothing else.

Required JSON format:
{
  "title": "Descriptive Factory Name",
  "nodes": [
    {
      "id": "node_1",
      "machineType": "loading",
      "label": "Inbound Supplier Dock",
      "row": 0,
      "slot": 0,
      "notes": "JIT hourly delivery · 4 dock bays · Kanban pull signal"
    }
  ],
  "edges": [
    {
      "id": "edge_1",
      "source": "node_1",
      "target": "node_2",
      "label": "3m"
    }
  ]
}

IMPORTANT: Do NOT include x, y, width, or height — only "row" and "slot". The rendering engine handles positioning.

ROW AND SLOT SYSTEM:
- "row" = which horizontal production line (0, 1, 2, or 3). Row 0 is the top line, row 1 below it, etc.
- "slot" = left-to-right position within that row (0 = leftmost, 1 = next, 2 = next, etc.)
- Use at least 2 rows and at most 4 rows.
- Each row should have 3–6 nodes.
- Slots must be sequential within each row starting from 0.

Valid machineType values (use ONLY these exact strings):
- loading    → supplier dock / inbound receiving / JIT delivery point
- storage    → line-side buffer / kanban supermarket (small, < 1 hour inventory)
- conveyor   → conveyor belt / transfer line / AGV lane
- cnc        → CNC machine / milling / turning / laser cutting
- robot      → robotic arm / automated cell / pick-and-place
- welding    → welding station / spot welder / MIG/TIG
- paint      → paint booth / powder coating / surface treatment
- assembly   → assembly station / manual workbench / sub-assembly cell
- inspection → in-line inspection / vision system / CMM / andon check
- quality    → quality control cell / root-cause analysis station / 5-why team
- packaging  → packaging / labeling / boxing / direct-to-truck prep
- exit       → outbound truck dock / shipping lane

DESIGN RULES:

1. FLOW: Left-to-right material flow. Slot 0 = raw material entry, highest slot = exit.
   - Row 0: Main production line (longest, most stations).
   - Row 1: Sub-assembly or parallel processing that MERGES into main line.
   - Row 2+: Additional sub-lines or support (quality cell, rework, dev cell).

2. CONVERGENCE: Sub-assembly rows MUST feed into the main line. Model this with edges from row 1/2 nodes pointing to a node in row 0 (or to a shared assembly/merge node).
   - At least 1 convergence point where 2+ edges meet at a single node.

3. NODE COUNT: 12–16 nodes total. Never fewer than 12.

4. EDGES — strict connectivity:
   - Within a row: every consecutive pair of nodes is connected (slot 0 → slot 1 → slot 2 → ...).
   - Cross-row: sub-line final node connects to a merge point on the main line.
   - Every node (except the very first and very last in the entire layout) has at least 1 incoming AND 1 outgoing edge.

5. LABELS: Specific, descriptive engineering names.
   Good: "Body Frame Spot Welding Cell", "Andon Inspection Gate", "Kanban Buffer Rack"
   Bad: "Machine 1", "Station A", "Process 3"

6. NOTES: 2–3 lean manufacturing specs per node, separated by " · ".
   Include things like: takt time, cycle time, output rate, operator count, inventory level, andon capability, kanban signals.
   Examples:
   "Takt: 60s · 2 operators · Andon-enabled"
   "Cycle: 45s · Output: 80/hr · Line-side kanban"
   "5-why team · Defect rate < 0.1% · Visual mgmt board"

7. EDGE LABELS: Realistic distances in meters: "2m", "4.5m", "8m". Keep distances short (lean = compact).

8. FACTORY LOGIC:
   - Start with inbound (loading) → line-side buffer (storage, small) → processing stations
   - End with inspection → packaging → outbound truck dock (exit)
   - Quality/rework cell should be a short side-branch, not on the main line
   - Everything compact: distances should be 1–8m between stations, rarely more than 12m`;

const DEFAULT_DIMS = {
  loading: [200, 90], storage: [200, 90], conveyor: [240, 55],
  cnc: [160, 90], robot: [160, 90], welding: [160, 90],
  paint: [180, 90], assembly: [180, 90], inspection: [160, 90],
  quality: [160, 90], packaging: [180, 90], exit: [140, 70],
};

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

const USER_SUFFIX = `Before outputting, verify:
- 12–16 nodes using row/slot positioning (no x/y)
- At least 2 rows, main line on row 0
- Sub-lines merge into main line (convergence edges)
- Every node has 2–3 lean specs in notes
- Distances between stations are compact (1–8m)
- Return ONLY valid JSON.`;

/**
 * Full generation pipeline. Throws Error with .statusCode optional for HTTP mapping.
 */
export async function generateLayoutFromPrompt(prompt) {
  if (!prompt || typeof prompt !== 'string') {
    const e = new Error('A prompt string is required.');
    e.statusCode = 400;
    throw e;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

  try {
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
            content: `Design a lean factory floor plan for:\n\n"${prompt}"\n\n${USER_SUFFIX}`,
          },
        ],
        stream: false,
        temperature: 0.3,
        top_p: 0.9,
      }),
    });

    clearTimeout(timeout);

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

    const layout = extractJSON(content);
    if (!Array.isArray(layout.nodes) || layout.nodes.length === 0) {
      const e = new Error('Model returned invalid layout (no nodes)');
      e.statusCode = 422;
      throw e;
    }

    layout.title = layout.title || 'Factory Floor Plan';
    layout.edges = layout.edges || [];

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
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      const e = new Error('Generation timed out. Try a simpler prompt or check Ollama is running.');
      e.statusCode = 504;
      throw e;
    }
    if (err.message?.includes('ECONNREFUSED') || err.message?.includes('fetch failed')) {
      const e = new Error(
        'Cannot reach Ollama. Set OLLAMA_URL to your Ollama host, or run ollama serve locally.',
      );
      e.statusCode = 503;
      e.fix = 'Run: ollama serve';
      e.hint = 'ollama_offline';
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

export async function getOllamaHealth() {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(3000) });
    const data = await response.json();
    const models = data.models?.map((m) => m.name) ?? [];
    const modelReady = models.some((m) => m.startsWith('llama3.2'));
    return { status: 'ok', ollamaRunning: true, modelReady, models };
  } catch {
    return { status: 'ok', ollamaRunning: false, modelReady: false, models: [] };
  }
}
