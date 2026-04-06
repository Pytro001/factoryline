import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import {
  ALL_MACHINE_TYPES,
  MACHINE_CATEGORIES,
  type MachineTypeId,
  type MachineCategory,
  type MachineTypeConfig,
} from '@/lib/machineTypes'

const ACCENT: Record<string, string> = {
  conveyor:   '#94A3B8',
  cnc:        '#60A5FA',
  robot:      '#A78BFA',
  welding:    '#FB923C',
  paint:      '#F472B6',
  assembly:   '#4ADE80',
  inspection: '#38BDF8',
  storage:    '#8B9CB6',
  loading:    '#FBBF24',
  quality:    '#2DD4BF',
  packaging:  '#818CF8',
  exit:       '#F87171',
  note:       '#facc15',
}

function machineMatches(machine: MachineTypeConfig, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const catName = MACHINE_CATEGORIES[machine.category].name.toLowerCase()
  return (
    machine.id.toLowerCase().includes(q) ||
    machine.name.toLowerCase().includes(q) ||
    machine.description.toLowerCase().includes(q) ||
    catName.includes(q)
  )
}

interface MachinePaletteProps {
  onAddMachine: (machineType: MachineTypeId) => void
}

export default function MachinePalette({ onAddMachine }: MachinePaletteProps) {
  const [search, setSearch] = useState('')

  const filteredByCategory = useMemo(() => {
    const q = search
    const categories = Object.entries(MACHINE_CATEGORIES) as [MachineCategory, { name: string; color: string }][]
    return categories
      .map(([catId, category]) => {
        const machines = ALL_MACHINE_TYPES.filter(
          (m) => m.category === catId && machineMatches(m, q),
        )
        return { catId, category, machines }
      })
      .filter((row) => row.machines.length > 0)
  }, [search])

  const hasQuery = search.trim().length > 0
  const noResults = hasQuery && filteredByCategory.length === 0

  return (
    <div
      style={{
        width: 200,
        background: 'rgba(10, 10, 10, 0.78)',
        borderRight: '1px solid #1a1a1a',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        userSelect: 'none',
        fontFamily: 'Inter, system-ui, sans-serif',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 14px 10px',
          borderBottom: '1px solid #1a1a1a',
          flexShrink: 0,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 500, color: '#fff', letterSpacing: '-0.01em' }}>
          Machinery
        </div>
        <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
          Click to add
        </div>
      </div>

      {/* Search — above machine list */}
      <div
        style={{
          padding: '8px 10px 6px',
          borderBottom: '1px solid #1a1a1a',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: '#0a0a0a',
            border: '1px solid #222',
            borderRadius: 4,
            padding: '6px 8px',
          }}
        >
          <Search size={14} style={{ color: '#666', flexShrink: 0 }} aria-hidden />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search machines…"
            autoComplete="off"
            aria-label="Search machines"
            className="palette-search-input"
            style={{
              flex: 1,
              minWidth: 0,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#e5e5e5',
              fontSize: 12,
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          />
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 10px' }}>
        {noResults && (
          <div
            style={{
              padding: '12px 4px',
              fontSize: 11,
              color: '#777',
              lineHeight: 1.4,
              textAlign: 'center',
            }}
          >
            No machines match “{search.trim()}”.
          </div>
        )}
        {!noResults &&
          filteredByCategory.map(({ catId, category, machines }) => (
            <div key={catId} style={{ marginBottom: 6 }}>
              <div
                style={{
                  padding: '8px 4px 4px',
                  fontSize: 9,
                  fontWeight: 600,
                  color: '#999',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                }}
              >
                {category.name}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {machines.map((machine) => {
                  const accent = ACCENT[machine.id] ?? '#9CA3AF'
                  return (
                    <button
                      key={machine.id}
                      onClick={() => onAddMachine(machine.id)}
                      title={machine.description}
                      style={{
                        width: '100%',
                        background: '#0f0f0f',
                        border: '1px solid #2a2a2a',
                        borderRadius: 5,
                        padding: '8px 10px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: 'Inter, system-ui, sans-serif',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3,
                        transition: 'border-color 0.1s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = accent + '55')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#2a2a2a')}
                    >
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 600,
                          color: accent,
                          textTransform: 'uppercase',
                          letterSpacing: '0.12em',
                          lineHeight: 1,
                        }}
                      >
                        {machine.id}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: '#fff',
                          lineHeight: 1.2,
                        }}
                      >
                        {machine.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
