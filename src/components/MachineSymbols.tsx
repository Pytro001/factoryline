/**
 * Top-down CAD-style machine symbols for each machine type.
 * Pure SVG, black strokes on transparent background.
 * Each symbol renders at the given width × height.
 */

interface SymbolProps {
  width: number
  height: number
}

const S = '1.4' // standard stroke width
const S2 = '0.8' // thin stroke
const FILL = 'none'
const C = '#111111' // stroke color

// ── Conveyor Belt ─────────────────────────────────────────────────────────────
// Top-down view: long belt with evenly spaced rollers and an end arrow
function ConveyorSymbol({ width: w, height: h }: SymbolProps) {
  const pad = 6
  const top = pad
  const bot = h - pad
  const left = pad
  const right = w - pad
  const mid = h / 2
  const rollerCount = Math.max(3, Math.floor((right - left) / 22))
  const rollerSpacing = (right - left) / (rollerCount + 1)

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {/* Belt outline */}
      <rect x={left} y={top} width={right - left} height={bot - top} fill="#F9FAFB" stroke={C} strokeWidth={S} />
      {/* Rollers */}
      {Array.from({ length: rollerCount }).map((_, i) => {
        const x = left + rollerSpacing * (i + 1)
        return <line key={i} x1={x} y1={top} x2={x} y2={bot} stroke={C} strokeWidth={S2} />
      })}
      {/* Direction arrow */}
      <line x1={left + 8} y1={mid} x2={right - 8} y2={mid} stroke={C} strokeWidth={S} markerEnd="url(#arrow)" />
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={C} />
        </marker>
      </defs>
    </svg>
  )
}

// ── CNC Machine ───────────────────────────────────────────────────────────────
// Top-down: outer machine body, inner work table, spindle circle, cross-hairs
function CNCSymbol({ width: w, height: h }: SymbolProps) {
  const pad = 6
  const cx = w / 2
  const cy = h / 2
  const r = Math.min(w, h) * 0.2
  const innerPad = 18

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {/* Machine body */}
      <rect x={pad} y={pad} width={w - pad * 2} height={h - pad * 2} fill="#F9FAFB" stroke={C} strokeWidth={S} />
      {/* Work envelope */}
      <rect x={innerPad} y={innerPad} width={w - innerPad * 2} height={h - innerPad * 2} fill={FILL} stroke={C} strokeWidth={S2} strokeDasharray="4 2" />
      {/* Spindle */}
      <circle cx={cx} cy={cy} r={r} fill="white" stroke={C} strokeWidth={S} />
      {/* Cross-hairs */}
      <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke={C} strokeWidth={S2} />
      <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke={C} strokeWidth={S2} />
      {/* Center dot */}
      <circle cx={cx} cy={cy} r={2} fill={C} />
    </svg>
  )
}

// ── Robotic Arm ───────────────────────────────────────────────────────────────
// Top-down: base circle, two arm segments, dashed reach zone
function RobotSymbol({ width: w, height: h }: SymbolProps) {
  const cx = w / 2
  const cy = h / 2
  const baseR = Math.min(w, h) * 0.12
  const reachR = Math.min(w, h) * 0.42
  // Arm segments from center
  const a1x = cx + reachR * 0.45
  const a1y = cy - reachR * 0.3
  const a2x = cx + reachR * 0.78
  const a2y = cy + reachR * 0.15

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {/* Reach zone */}
      <circle cx={cx} cy={cy} r={reachR} fill="#F9FAFB" stroke={C} strokeWidth={S2} strokeDasharray="5 3" />
      {/* Arm link 1 */}
      <line x1={cx} y1={cy} x2={a1x} y2={a1y} stroke={C} strokeWidth={parseFloat(S) * 2} strokeLinecap="round" />
      {/* Arm link 2 */}
      <line x1={a1x} y1={a1y} x2={a2x} y2={a2y} stroke={C} strokeWidth={parseFloat(S) * 1.5} strokeLinecap="round" />
      {/* Joint circle */}
      <circle cx={a1x} cy={a1y} r={4} fill="white" stroke={C} strokeWidth={S} />
      {/* End effector */}
      <circle cx={a2x} cy={a2y} r={3} fill={C} />
      {/* Base */}
      <circle cx={cx} cy={cy} r={baseR} fill="white" stroke={C} strokeWidth={S} />
      <circle cx={cx} cy={cy} r={baseR * 0.45} fill={C} />
    </svg>
  )
}

// ── Welding Station ───────────────────────────────────────────────────────────
// Top-down: work table + electrode holder + spark symbol
function WeldingSymbol({ width: w, height: h }: SymbolProps) {
  const pad = 6
  const cx = w / 2
  const cy = h / 2
  const r = Math.min(w, h) * 0.22

  // Spark rays (8 points)
  const sparkRays = Array.from({ length: 8 }).map((_, i) => {
    const angle = (i * Math.PI * 2) / 8
    const inner = r * 0.4
    const outer = r * 0.9
    return {
      x1: cx + Math.cos(angle) * inner,
      y1: cy + Math.sin(angle) * inner,
      x2: cx + Math.cos(angle) * outer,
      y2: cy + Math.sin(angle) * outer,
    }
  })

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {/* Work surface */}
      <rect x={pad} y={pad} width={w - pad * 2} height={h - pad * 2} fill="#F9FAFB" stroke={C} strokeWidth={S} />
      {/* Electrode arm from top */}
      <line x1={cx} y1={pad} x2={cx} y2={cy - r * 0.3} stroke={C} strokeWidth={parseFloat(S) * 2} />
      {/* Spark rays */}
      {sparkRays.map((ray, i) => (
        <line key={i} x1={ray.x1} y1={ray.y1} x2={ray.x2} y2={ray.y2} stroke={C} strokeWidth={S2} />
      ))}
      {/* Weld point */}
      <circle cx={cx} cy={cy} r={4} fill={C} />
    </svg>
  )
}

// ── Paint Booth ───────────────────────────────────────────────────────────────
// Top-down: booth walls + spray nozzle + fan spray pattern
function PaintSymbol({ width: w, height: h }: SymbolProps) {
  const pad = 6
  const cx = w / 2
  const nozzleY = pad + 16
  const fanAngle = Math.PI / 5
  const fanLength = h * 0.55

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {/* Booth outline */}
      <rect x={pad} y={pad} width={w - pad * 2} height={h - pad * 2} fill="#F9FAFB" stroke={C} strokeWidth={S} />
      {/* Nozzle head */}
      <rect x={cx - 8} y={nozzleY - 5} width={16} height={10} fill="white" stroke={C} strokeWidth={S} />
      {/* Spray fan lines */}
      {[-1, -0.5, 0, 0.5, 1].map((t, i) => {
        const angle = Math.PI / 2 + t * fanAngle
        return (
          <line
            key={i}
            x1={cx}
            y1={nozzleY + 5}
            x2={cx + Math.cos(angle) * fanLength}
            y2={nozzleY + 5 + Math.sin(angle) * fanLength}
            stroke={C}
            strokeWidth={S2}
            strokeDasharray="3 2"
            opacity={0.6 + Math.abs(t) * 0.2}
          />
        )
      })}
      {/* Object being painted (small rect in center) */}
      <rect
        x={cx - 14}
        y={h / 2 + 4}
        width={28}
        height={18}
        fill="white"
        stroke={C}
        strokeWidth={S}
      />
    </svg>
  )
}

// ── Assembly Table ────────────────────────────────────────────────────────────
// Top-down: work surface + corner leg dots + center work zone cross
function AssemblySymbol({ width: w, height: h }: SymbolProps) {
  const pad = 6
  const legR = 4
  const cx = w / 2
  const cy = h / 2
  const crossSize = Math.min(w, h) * 0.18

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {/* Table surface */}
      <rect x={pad} y={pad} width={w - pad * 2} height={h - pad * 2} fill="#F9FAFB" stroke={C} strokeWidth={S} />
      {/* Corner legs */}
      {[
        [pad + 8, pad + 8],
        [w - pad - 8, pad + 8],
        [pad + 8, h - pad - 8],
        [w - pad - 8, h - pad - 8],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={legR} fill="white" stroke={C} strokeWidth={S} />
      ))}
      {/* Work zone cross */}
      <line x1={cx - crossSize} y1={cy} x2={cx + crossSize} y2={cy} stroke={C} strokeWidth={S2} />
      <line x1={cx} y1={cy - crossSize} x2={cx} y2={cy + crossSize} stroke={C} strokeWidth={S2} />
      <circle cx={cx} cy={cy} r={crossSize * 0.85} fill={FILL} stroke={C} strokeWidth={S2} strokeDasharray="4 2" />
    </svg>
  )
}

// ── Inspection Station ────────────────────────────────────────────────────────
// Top-down: platform + target reticle (circles + cross-hairs)
function InspectionSymbol({ width: w, height: h }: SymbolProps) {
  const pad = 6
  const cx = w / 2
  const cy = h / 2
  const r1 = Math.min(w, h) * 0.36
  const r2 = Math.min(w, h) * 0.22
  const r3 = Math.min(w, h) * 0.1

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {/* Platform */}
      <rect x={pad} y={pad} width={w - pad * 2} height={h - pad * 2} fill="#F9FAFB" stroke={C} strokeWidth={S} />
      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={r1} fill={FILL} stroke={C} strokeWidth={S} />
      {/* Middle ring */}
      <circle cx={cx} cy={cy} r={r2} fill={FILL} stroke={C} strokeWidth={S} />
      {/* Inner dot */}
      <circle cx={cx} cy={cy} r={r3} fill="white" stroke={C} strokeWidth={S} />
      {/* Cross-hairs */}
      <line x1={cx - r1} y1={cy} x2={cx + r1} y2={cy} stroke={C} strokeWidth={S2} />
      <line x1={cx} y1={cy - r1} x2={cx} y2={cy + r1} stroke={C} strokeWidth={S2} />
    </svg>
  )
}

// ── Storage Rack ──────────────────────────────────────────────────────────────
// Top-down: outer rectangle + internal grid of rack bays
function StorageSymbol({ width: w, height: h }: SymbolProps) {
  const pad = 6
  const cols = 4
  const rows = 3
  const innerW = w - pad * 2
  const innerH = h - pad * 2
  const cellW = innerW / cols
  const cellH = innerH / rows

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {/* Outer rack frame */}
      <rect x={pad} y={pad} width={innerW} height={innerH} fill="#F9FAFB" stroke={C} strokeWidth={S} />
      {/* Horizontal dividers */}
      {Array.from({ length: rows - 1 }).map((_, i) => (
        <line
          key={`h${i}`}
          x1={pad}
          y1={pad + cellH * (i + 1)}
          x2={pad + innerW}
          y2={pad + cellH * (i + 1)}
          stroke={C}
          strokeWidth={S2}
        />
      ))}
      {/* Vertical dividers */}
      {Array.from({ length: cols - 1 }).map((_, i) => (
        <line
          key={`v${i}`}
          x1={pad + cellW * (i + 1)}
          y1={pad}
          x2={pad + cellW * (i + 1)}
          y2={pad + innerH}
          stroke={C}
          strokeWidth={S2}
        />
      ))}
    </svg>
  )
}

// ── Loading Dock ──────────────────────────────────────────────────────────────
// Top-down: dock platform + bumper bar + truck entry arrow
function LoadingSymbol({ width: w, height: h }: SymbolProps) {
  const pad = 6
  const bumperH = 10

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {/* Dock platform */}
      <rect x={pad} y={pad + bumperH} width={w - pad * 2} height={h - pad * 2 - bumperH} fill="#F9FAFB" stroke={C} strokeWidth={S} />
      {/* Bumper bar (top) */}
      <rect x={pad} y={pad} width={w - pad * 2} height={bumperH} fill={C} stroke={C} strokeWidth={S} />
      {/* Truck bay markers */}
      {[0.25, 0.5, 0.75].map((t, i) => (
        <line
          key={i}
          x1={pad + (w - pad * 2) * t}
          y1={pad + bumperH}
          x2={pad + (w - pad * 2) * t}
          y2={pad + bumperH + 20}
          stroke={C}
          strokeWidth={S2}
          strokeDasharray="3 2"
        />
      ))}
      {/* Entry arrow */}
      <line x1={w / 2} y1={h - pad - 8} x2={w / 2} y2={pad + bumperH + 8} stroke={C} strokeWidth={S} markerEnd="url(#loadArrow)" />
      <defs>
        <marker id="loadArrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={C} />
        </marker>
      </defs>
    </svg>
  )
}

// ── Quality Control ───────────────────────────────────────────────────────────
// Top-down: work surface + large checkmark
function QualitySymbol({ width: w, height: h }: SymbolProps) {
  const pad = 6
  const cx = w / 2
  const cy = h / 2
  const size = Math.min(w, h) * 0.32
  // Checkmark path points
  const p1x = cx - size
  const p1y = cy
  const p2x = cx - size * 0.2
  const p2y = cy + size * 0.7
  const p3x = cx + size
  const p3y = cy - size * 0.55

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {/* Platform */}
      <rect x={pad} y={pad} width={w - pad * 2} height={h - pad * 2} fill="#F9FAFB" stroke={C} strokeWidth={S} />
      {/* Circle border */}
      <circle cx={cx} cy={cy} r={size * 1.1} fill={FILL} stroke={C} strokeWidth={S2} />
      {/* Checkmark */}
      <polyline
        points={`${p1x},${p1y} ${p2x},${p2y} ${p3x},${p3y}`}
        fill={FILL}
        stroke={C}
        strokeWidth={parseFloat(S) * 2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ── Packaging Line ────────────────────────────────────────────────────────────
// Top-down: table surface + nested box outlines (packages)
function PackagingSymbol({ width: w, height: h }: SymbolProps) {
  const pad = 6
  const boxPad = 16
  const innerPad = 26

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {/* Platform */}
      <rect x={pad} y={pad} width={w - pad * 2} height={h - pad * 2} fill="#F9FAFB" stroke={C} strokeWidth={S} />
      {/* Box outline 1 */}
      <rect x={boxPad} y={boxPad} width={w - boxPad * 2} height={h - boxPad * 2} fill={FILL} stroke={C} strokeWidth={S} />
      {/* Box outline 2 (inner) */}
      <rect x={innerPad} y={innerPad} width={w - innerPad * 2} height={h - innerPad * 2} fill={FILL} stroke={C} strokeWidth={S2} />
      {/* Tape cross on box */}
      <line x1={boxPad} y1={boxPad} x2={w - boxPad} y2={h - boxPad} stroke={C} strokeWidth={S2} opacity={0.4} />
      <line x1={w - boxPad} y1={boxPad} x2={boxPad} y2={h - boxPad} stroke={C} strokeWidth={S2} opacity={0.4} />
    </svg>
  )
}

// ── Safety Exit ───────────────────────────────────────────────────────────────
// Top-down: room outline + door with swing arc
function ExitSymbol({ width: w, height: h }: SymbolProps) {
  const pad = 6
  const doorW = Math.min(w - pad * 2, 30)
  // Door on right side
  const doorX = w - pad - doorW
  const doorY1 = pad + (h - pad * 2) * 0.3
  const doorY2 = doorY1 + doorW

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {/* Room outline (open on right for door) */}
      <path
        d={`M ${pad} ${pad} L ${w - pad} ${pad} L ${w - pad} ${doorY1} M ${w - pad} ${doorY2} L ${w - pad} ${h - pad} L ${pad} ${h - pad} Z`}
        fill="#F9FAFB"
        stroke={C}
        strokeWidth={S}
        strokeLinejoin="miter"
      />
      <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke={C} strokeWidth={S} />
      {/* Door panel */}
      <line x1={w - pad} y1={doorY1} x2={doorX} y2={doorY2} stroke={C} strokeWidth={S} />
      {/* Swing arc */}
      <path
        d={`M ${w - pad} ${doorY1} A ${doorW} ${doorW} 0 0 0 ${doorX} ${doorY1 + doorW * 0.05}`}
        fill={FILL}
        stroke={C}
        strokeWidth={S2}
        strokeDasharray="4 2"
      />
      {/* EXIT arrow */}
      <line x1={w / 2 - 6} y1={h / 2 + 8} x2={w - pad - 4} y2={h / 2 + 8} stroke={C} strokeWidth={S} markerEnd="url(#exitArrow)" />
      <defs>
        <marker id="exitArrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={C} />
        </marker>
      </defs>
    </svg>
  )
}

// ── Public API ────────────────────────────────────────────────────────────────

const SYMBOL_MAP: Record<string, React.ComponentType<SymbolProps>> = {
  conveyor:   ConveyorSymbol,
  cnc:        CNCSymbol,
  robot:      RobotSymbol,
  welding:    WeldingSymbol,
  paint:      PaintSymbol,
  assembly:   AssemblySymbol,
  inspection: InspectionSymbol,
  storage:    StorageSymbol,
  loading:    LoadingSymbol,
  quality:    QualitySymbol,
  packaging:  PackagingSymbol,
  exit:       ExitSymbol,
}

interface MachineSymbolProps {
  type: string
  width: number
  height: number
}

export function MachineSymbol({ type, width, height }: MachineSymbolProps) {
  const Component = SYMBOL_MAP[type] ?? AssemblySymbol
  return <Component width={width} height={height} />
}

/** Tiny thumbnail version for palette / legend */
export function MachineSymbolThumb({ type }: { type: string }) {
  return <MachineSymbol type={type} width={36} height={28} />
}
