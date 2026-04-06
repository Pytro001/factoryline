import { memo, useState, useRef, useEffect } from 'react'
import { Handle, Position, NodeToolbar, type NodeProps, type Node } from '@xyflow/react'
import { Trash2, Pencil, Check } from 'lucide-react'
import { useCanvas } from '@/lib/canvasContext'

export type MachineNodeData = {
  machineType: string
  label: string
  notes: string
  width: number
  height: number
  [key: string]: unknown
}

export type MachineFlowNode = Node<MachineNodeData, 'machine'>

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
}

const HANDLE_STYLE = {
  width: 7,
  height: 7,
  background: '#1a1a1a',
  border: '1px solid #444',
  borderRadius: '50%',
}

const MachineNode = memo(({ id, data, selected }: NodeProps<MachineFlowNode>) => {
  const { deleteNode, updateLabel } = useCanvas()

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(data.label)
  const inputRef = useRef<HTMLInputElement>(null)

  const type = data.machineType as string
  const accent = ACCENT[type] ?? '#9CA3AF'

  const firstSpec = (data.notes ?? '').split('·')[0].trim()

  useEffect(() => {
    if (editing) {
      setDraft(data.label)
      setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select() }, 10)
    }
  }, [editing, data.label])

  const commitEdit = () => {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== data.label) updateLabel(id, trimmed)
    setEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitEdit()
    if (e.key === 'Escape') setEditing(false)
    e.stopPropagation()
  }

  const w = (data.width as number) ?? 160
  const h = (data.height as number) ?? 90

  return (
    <>
      <NodeToolbar isVisible={selected} position={Position.Top} offset={6}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            background: '#111',
            border: '1px solid #2a2a2a',
            borderRadius: 5,
            padding: '3px 4px',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          <button
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setEditing(true) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '3px 8px', fontSize: 11, color: '#aaa',
              background: 'none', border: 'none', borderRadius: 3,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#aaa')}
          >
            <Pencil size={9} /> Rename
          </button>
          <span style={{ width: 1, height: 12, background: '#2a2a2a' }} />
          <button
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); deleteNode(id) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '3px 8px', fontSize: 11, color: '#888',
              background: 'none', border: 'none', borderRadius: 3,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#F87171')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#888')}
          >
            <Trash2 size={9} /> Delete
          </button>
        </div>
      </NodeToolbar>

      <div
        onDoubleClick={() => setEditing(true)}
        style={{
          width: w,
          height: h,
          background: '#0f0f0f',
          border: selected ? `1px solid ${accent}88` : '1px solid #2a2a2a',
          borderRadius: 5,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '9px 11px 8px',
          boxSizing: 'border-box',
          cursor: 'grab',
          userSelect: 'none',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {/* Type label */}
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
          {type}
        </span>

        {/* Station name */}
        {editing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              style={{
                flex: 1,
                fontSize: 12,
                fontWeight: 500,
                fontFamily: 'Inter, system-ui, sans-serif',
                color: '#fff',
                background: '#1a1a1a',
                border: `1px solid ${accent}66`,
                borderRadius: 3,
                padding: '2px 6px',
                outline: 'none',
              }}
            />
            <button
              onMouseDown={(e) => { e.preventDefault(); commitEdit() }}
              style={{ color: accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
            >
              <Check size={11} />
            </button>
          </div>
        ) : (
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: '#fff',
              lineHeight: 1.3,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {data.label}
          </span>
        )}

        {/* First spec from notes */}
        {firstSpec && (
          <span
            style={{
              fontSize: 9,
              color: '#666',
              lineHeight: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {firstSpec}
          </span>
        )}
      </div>

      <Handle type="target"  position={Position.Left}   style={{ ...HANDLE_STYLE, left: -4 }} />
      <Handle type="source"  position={Position.Right}  style={{ ...HANDLE_STYLE, right: -4 }} />
      <Handle type="target"  position={Position.Top}    style={{ ...HANDLE_STYLE, top: -4 }} />
      <Handle type="source"  position={Position.Bottom} style={{ ...HANDLE_STYLE, bottom: -4 }} />
    </>
  )
})

MachineNode.displayName = 'MachineNode'
export default MachineNode
