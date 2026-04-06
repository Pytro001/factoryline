/**
 * Takt + bottleneck analysis for factory layouts (serial line heuristic).
 */

const MAX_UNITS_PER_YEAR = 1_000_000_000

const PROCESSING_TYPES = new Set([
  'assembly',
  'cnc',
  'robot',
  'welding',
  'paint',
  'inspection',
  'packaging',
])

/** Fallback process time (seconds per unit) when model omits data */
const DEFAULT_CYCLE_BY_TYPE = {
  loading: 0,
  storage: 0,
  conveyor: 8,
  cnc: 95,
  robot: 48,
  welding: 72,
  paint: 140,
  assembly: 58,
  inspection: 32,
  quality: 0,
  packaging: 42,
  exit: 0,
}

const CYCLE_NOTE_RE =
  /(?:cycle|cyc)\s*[:\s]\s*(\d+(?:\.\d+)?)\s*(?:s(?:ec)?|seconds?)?/i
const TAKT_NOTE_RE =
  /takt\s*[:\s]\s*(\d+(?:\.\d+)?)\s*(?:s(?:ec)?|seconds?)?/i

function clampNumber(v, min, max, fallback) {
  const n = Number(v)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

function clampInt(v, min, max, fallback) {
  return Math.round(clampNumber(v, min, max, fallback))
}

/**
 * @param {Record<string, unknown> | null | undefined} raw
 * @returns {{ unitsPerYear: number, workingDaysPerYear: number, shiftsPerDay: number, hoursPerShift: number, oee: number } | null}
 */
export function normalizeProductionInput(raw) {
  if (!raw || typeof raw !== 'object') return null
  const units = Number(raw.unitsPerYear)
  if (!Number.isFinite(units) || units <= 0) return null
  return {
    unitsPerYear: Math.min(MAX_UNITS_PER_YEAR, Math.round(units)),
    workingDaysPerYear: clampInt(raw.workingDaysPerYear, 1, 366, 250),
    shiftsPerDay: clampInt(raw.shiftsPerDay, 1, 4, 1),
    hoursPerShift: clampNumber(raw.hoursPerShift, 0.5, 24, 8),
    oee: clampNumber(raw.oee, 0.05, 1, 0.85),
  }
}

/**
 * @param {ReturnType<typeof normalizeProductionInput> extends infer T ? T : never} p
 */
export function computeTaktSeconds(p) {
  const workedSecondsPerYear =
    p.workingDaysPerYear * p.shiftsPerDay * p.hoursPerShift * 3600
  const effectiveSecondsPerYear = workedSecondsPerYear * p.oee
  const taktSec = effectiveSecondsPerYear / p.unitsPerYear
  return { workedSecondsPerYear, effectiveSecondsPerYear, taktSec }
}

/**
 * @param {Record<string, unknown>} node
 */
export function inferCycleTimeSec(node) {
  const direct = Number(node.cycleTimeSec)
  if (Number.isFinite(direct) && direct > 0) return direct

  const notes = typeof node.notes === 'string' ? node.notes : ''
  let m = notes.match(CYCLE_NOTE_RE)
  if (m) {
    const v = Number(m[1])
    if (Number.isFinite(v) && v > 0) return v
  }
  m = notes.match(TAKT_NOTE_RE)
  if (m) {
    const v = Number(m[1])
    if (Number.isFinite(v) && v > 0) return v
  }

  const mt = typeof node.machineType === 'string' ? node.machineType.toLowerCase() : ''
  return DEFAULT_CYCLE_BY_TYPE[mt] ?? 45
}

export function formatTaktSnippet(params) {
  const { taktSec } = computeTaktSeconds(params)
  return (
    `Production target: ${params.unitsPerYear.toLocaleString()} units/year. ` +
    `Calendar: ${params.workingDaysPerYear} d/yr × ${params.shiftsPerDay} shift(s) × ${params.hoursPerShift} h/shift, OEE ${params.oee}. ` +
    `Required effective takt ≈ ${taktSec.toFixed(2)} s/unit (one finished unit every takt across the line). ` +
    `Set each node's "cycleTimeSec" to process time per unit at that station (seconds). ` +
    `For a serial line the slowest processing step must have cycleTimeSec ≤ ${taktSec.toFixed(2)} unless you model parallel cells as duplicate stations. ` +
    `Non-processing areas (loading, storage, exit) may use cycleTimeSec 0.`
  )
}

/**
 * Attach layout.throughput, node.cycleTimeSec (filled if missing), node.isBottleneck, clears old flags.
 * @param {{ nodes: object[], throughput?: object }} layout
 * @param {NonNullable<ReturnType<typeof normalizeProductionInput>>} params
 */
export function applyThroughputAnalysis(layout, params) {
  const { taktSec, effectiveSecondsPerYear, workedSecondsPerYear } = computeTaktSeconds(params)

  for (const n of layout.nodes) {
    delete n.isBottleneck
    const raw = n.cycleTimeSec
    if (raw === undefined || raw === null || raw === '') {
      n.cycleTimeSec = inferCycleTimeSec(n)
    } else {
      const num = Number(raw)
      n.cycleTimeSec = Number.isFinite(num) ? Math.round(num * 10) / 10 : inferCycleTimeSec(n)
    }
  }

  const rows = layout.nodes.map((n) => {
    const mt = typeof n.machineType === 'string' ? n.machineType.toLowerCase() : ''
    const cycle = Number(n.cycleTimeSec)
    const cyc = Number.isFinite(cycle) && cycle > 0 ? cycle : inferCycleTimeSec(n)
    return {
      id: n.id,
      label: String(n.label ?? n.id),
      machineType: mt,
      cycleSec: cyc,
      isProcessing: PROCESSING_TYPES.has(mt),
    }
  })

  const processing = rows.filter((r) => r.isProcessing && r.cycleSec > 0)
  const pool = processing.length > 0 ? processing : rows.filter((r) => r.cycleSec > 0)

  const warnings = []
  if (pool.length === 0) {
    layout.throughput = {
      unitsPerYear: params.unitsPerYear,
      workingDaysPerYear: params.workingDaysPerYear,
      shiftsPerDay: params.shiftsPerDay,
      hoursPerShift: params.hoursPerShift,
      oee: params.oee,
      taktSec,
      workedSecondsPerYear,
      effectiveSecondsPerYear,
      bottleneckNodeId: null,
      bottleneckLabel: '',
      bottleneckCycleSec: 0,
      lineTheoreticalUnitsPerYear: 0,
      meetsTakt: false,
      parallelStationsSuggested: 0,
      warnings: ['No processing stations with cycle time — add cycleTimeSec on key nodes.'],
    }
    return layout
  }

  const worst = pool.reduce((a, b) => (a.cycleSec >= b.cycleSec ? a : b))
  const bn = layout.nodes.find((n) => n.id === worst.id)
  if (bn) bn.isBottleneck = true

  const lineTheoreticalUnitsPerYear = effectiveSecondsPerYear / worst.cycleSec
  const meetsTakt = worst.cycleSec <= taktSec + 1e-6
  const parallelStationsSuggested =
    meetsTakt ? 1 : Math.max(2, Math.ceil(worst.cycleSec / taktSec))

  if (!meetsTakt) {
    warnings.push(
      `Bottleneck "${worst.label}" is ${worst.cycleSec.toFixed(1)}s vs takt ${taktSec.toFixed(1)}s — need ~${parallelStationsSuggested} parallel cells or faster cycle.`,
    )
  }

  layout.throughput = {
    unitsPerYear: params.unitsPerYear,
    workingDaysPerYear: params.workingDaysPerYear,
    shiftsPerDay: params.shiftsPerDay,
    hoursPerShift: params.hoursPerShift,
    oee: params.oee,
    taktSec,
    workedSecondsPerYear,
    effectiveSecondsPerYear,
    bottleneckNodeId: worst.id,
    bottleneckLabel: worst.label,
    bottleneckCycleSec: worst.cycleSec,
    lineTheoreticalUnitsPerYear: Math.round(lineTheoreticalUnitsPerYear),
    meetsTakt,
    parallelStationsSuggested,
    warnings,
  }

  return layout
}
