/**
 * Deterministic lean layout when no LLM is configured (e.g. fresh Vercel deploy).
 * Uses the same row/slot + notes conventions as the AI path.
 */
export function buildDemoLayout(userPrompt) {
  const topic = (userPrompt || 'Production line').replace(/\s+/g, ' ').trim().slice(0, 48) || 'Production line';

  const nodes = [
    { id: 'node_1', machineType: 'loading', label: 'Tier-1 JIT Supplier Dock', row: 0, slot: 0, cycleTimeSec: 0, notes: 'Hourly milk runs · 45min inventory cap · Visual call-off board' },
    { id: 'node_2', machineType: 'storage', label: 'Line-Side Kanban Supermarket', row: 0, slot: 1, cycleTimeSec: 0, notes: '<1h WIP · Two-bin signals · Face-to-face replenishment' },
    { id: 'node_3', machineType: 'conveyor', label: 'Main Line Transfer', row: 0, slot: 2, cycleTimeSec: 0, notes: 'FIFO lanes · 2m spacing · Andon cabling' },
    { id: 'node_4', machineType: 'assembly', label: 'Primary Assembly Cell', row: 0, slot: 3, cycleTimeSec: 48, notes: 'Cycle 48s · Green stop button · Shift metrics screen' },
    { id: 'node_5', machineType: 'robot', label: 'Precision Robotic Assist', row: 0, slot: 4, cycleTimeSec: 42, notes: 'Cycle 42s · SMED-ready · Poka-yoke fixtures' },
    { id: 'node_6', machineType: 'welding', label: 'Sub-Module Weld Station', row: 0, slot: 5, cycleTimeSec: 68, notes: 'Cycle 68s · SPC charting · Rework <0.2%' },
    { id: 'node_7', machineType: 'paint', label: 'Compact Paint Cell', row: 0, slot: 6, cycleTimeSec: 125, notes: 'Cycle 125s · VOC capture · First-pass yield tracked' },

    { id: 'node_8', machineType: 'loading', label: 'Secondary JIT Lane', row: 1, slot: 0, cycleTimeSec: 0, notes: 'Sequenced kits · No warehouse storage · AGV tug path' },
    { id: 'node_9', machineType: 'cnc', label: 'CNC Pre-Machining', row: 1, slot: 1, cycleTimeSec: 88, notes: 'Cycle 88s · Tool life monitor · SPC on last 5 pieces' },
    { id: 'node_10', machineType: 'assembly', label: 'Sub-Assembly Merge Bench', row: 1, slot: 2, cycleTimeSec: 52, notes: 'Cycle 52s · Feeds main line · 2 operators' },
    { id: 'node_11', machineType: 'inspection', label: 'Andon Gate Inspection', row: 1, slot: 3, cycleTimeSec: 28, notes: 'Cycle 28s · Vision + torque · Stop line authority' },
    { id: 'node_12', machineType: 'quality', label: '5-Why Root Cause Cell', row: 1, slot: 4, cycleTimeSec: 0, notes: 'Support cell · Defect museum · Capa tracking board' },

    { id: 'node_13', machineType: 'packaging', label: 'Direct-to-Truck Prep', row: 2, slot: 0, cycleTimeSec: 38, notes: 'Cycle 38s · No finished goods WH · Load levelling screen' },
    { id: 'node_14', machineType: 'exit', label: 'Outbound Staging Lanes', row: 2, slot: 1, cycleTimeSec: 0, notes: '3 dock doors · Yard tractor queue · OTIF dashboard' },
  ];

  const edges = [
    { id: 'e1', source: 'node_1', target: 'node_2', label: '2m' },
    { id: 'e2', source: 'node_2', target: 'node_3', label: '3m' },
    { id: 'e3', source: 'node_3', target: 'node_4', label: '4m' },
    { id: 'e4', source: 'node_4', target: 'node_5', label: '3m' },
    { id: 'e5', source: 'node_5', target: 'node_6', label: '3m' },
    { id: 'e6', source: 'node_6', target: 'node_7', label: '4m' },
    { id: 'e7', source: 'node_8', target: 'node_9', label: '3m' },
    { id: 'e8', source: 'node_9', target: 'node_10', label: '3m' },
    { id: 'e9', source: 'node_10', target: 'node_11', label: '2m' },
    { id: 'e10', source: 'node_11', target: 'node_12', label: '2m' },
    // convergence: sub-line into main assembly (node_4)
    { id: 'e11', source: 'node_12', target: 'node_4', label: '5m' },
    { id: 'e12', source: 'node_10', target: 'node_4', label: '4m' },
    { id: 'e13', source: 'node_7', target: 'node_13', label: '6m' },
    { id: 'e14', source: 'node_13', target: 'node_14', label: '3m' },
  ];

  return {
    title: `${topic} — Lean layout (demo)`,
    nodes,
    edges,
    demo: true,
    demoHint: 'Add GROQ_API_KEY (free) or OPENAI_API_KEY in Vercel for full AI generation.',
  };
}
