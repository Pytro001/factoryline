import { ALL_MACHINE_TYPES, MACHINE_CATEGORIES, type MachineTypeId, type MachineCategory } from '@/lib/machineTypes'
import { MachineSymbolThumb } from './MachineSymbols'

interface MachinePaletteProps {
  onAddMachine: (machineType: MachineTypeId) => void
}

export default function MachinePalette({ onAddMachine }: MachinePaletteProps) {
  const categories = Object.entries(MACHINE_CATEGORIES) as [MachineCategory, { name: string; color: string }][]

  return (
    <div
      style={{
        width: 200,
        background: '#000',
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
        <div style={{ fontSize: 11, fontWeight: 500, color: '#fff', letterSpacing: '-0.01em' }}>
          Machinery
        </div>
        <div style={{ fontSize: 11, color: '#444', marginTop: 2 }}>
          Click to add
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', paddingTop: 4 }}>
        {categories.map(([catId, category]) => {
          const machines = ALL_MACHINE_TYPES.filter((m) => m.category === catId)
          if (machines.length === 0) return null

          return (
            <div key={catId} style={{ marginBottom: 8 }}>
              {/* Category label */}
              <div
                style={{
                  padding: '8px 14px 4px',
                  fontSize: 10,
                  fontWeight: 500,
                  color: '#333',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                {category.name}
              </div>

              {/* Machine items */}
              {machines.map((machine) => (
                <MachineRow
                  key={machine.id}
                  machine={machine}
                  onClick={() => onAddMachine(machine.id)}
                />
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MachineRow({
  machine,
  onClick,
}: {
  machine: { id: string; name: string; description: string; defaultWidth: number; defaultHeight: number }
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      title={machine.description}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '7px 14px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#0f0f0f')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
    >
      {/* CAD symbol thumbnail */}
      <div
        style={{
          flexShrink: 0,
          width: 36,
          height: 28,
          background: '#fff',
          border: '1px solid #333',
          overflow: 'hidden',
        }}
      >
        <MachineSymbolThumb type={machine.id} />
      </div>

      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 400, color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
          {machine.name}
        </div>
        <div style={{ fontSize: 10, color: '#333', fontFamily: 'monospace', marginTop: 1 }}>
          {machine.defaultWidth}×{machine.defaultHeight}
        </div>
      </div>
    </button>
  )
}
