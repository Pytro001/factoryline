import { useState, useEffect } from 'react'
import { X, Trash2 } from 'lucide-react'
import type { Node } from '@xyflow/react'
import { getMachineType } from '@/lib/machineTypes'
import { useCanvas } from '@/lib/canvasContext'
import type { MachineNodeData } from './MachineNode'

interface PropertiesPanelProps {
  node: Node<MachineNodeData>
  onClose: () => void
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#0a0a0a',
  border: '1px solid #222',
  borderRadius: 4,
  padding: '8px 10px',
  fontSize: 13,
  fontFamily: 'Inter, system-ui, sans-serif',
  color: '#ddd',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 10,
  fontWeight: 500,
  color: '#999',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  marginBottom: 6,
  fontFamily: 'Inter, system-ui, sans-serif',
}

export default function PropertiesPanel({ node, onClose }: PropertiesPanelProps) {
  const { updateLabel, updateNotes, deleteNode } = useCanvas()
  const config = getMachineType(node.data.machineType)

  const [label, setLabel] = useState(node.data.label)
  const [notes, setNotes] = useState(node.data.notes ?? '')

  useEffect(() => {
    setLabel(node.data.label)
    setNotes(node.data.notes ?? '')
  }, [node.id, node.data.label, node.data.notes])

  const handleLabelBlur = () => {
    if (label.trim() && label !== node.data.label) updateLabel(node.id, label.trim())
  }

  const handleNotesBlur = () => {
    if (notes !== node.data.notes) updateNotes(node.id, notes)
  }

  const handleDelete = () => {
    deleteNode(node.id)
    onClose()
  }

  return (
    <div
      style={{
        width: 260,
        background: '#000',
        borderLeft: '1px solid #1a1a1a',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        fontFamily: 'Inter, system-ui, sans-serif',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 14px',
          borderBottom: '1px solid #1a1a1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div>
          <div style={{ fontSize: 11, fontWeight: 500, color: '#fff' }}>{config.name}</div>
          <div style={{ fontSize: 10, color: '#777', marginTop: 2, fontFamily: 'monospace' }}>{node.id}</div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#777', cursor: 'pointer', padding: 4 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#777')}
        >
          <X size={14} />
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Label */}
        <div>
          <label style={labelStyle}>Label</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleLabelBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleLabelBlur()}
            style={inputStyle}
            placeholder="Station name..."
            onFocus={(e) => (e.currentTarget.style.borderColor = '#444')}
          />
        </div>

        {/* Notes */}
        <div>
          <label style={labelStyle}>Engineering Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleNotesBlur}
            rows={4}
            style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
            placeholder="Cycle time · capacity · specs..."
            onFocus={(e) => (e.currentTarget.style.borderColor = '#444')}
          />
        </div>

        {/* Dimensions */}
        <div>
          <label style={labelStyle}>Dimensions</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: 'W', value: node.data.width ?? config.defaultWidth },
              { label: 'H', value: node.data.height ?? config.defaultHeight },
            ].map(({ label: l, value }) => (
              <div key={l} style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 4, padding: '7px 10px' }}>
                <div style={{ fontSize: 9, color: '#999', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{l}</div>
                <div style={{ fontSize: 13, fontFamily: 'monospace', color: '#ccc', marginTop: 2 }}>{value}px</div>
              </div>
            ))}
          </div>
        </div>

        {/* Position */}
        <div>
          <label style={labelStyle}>Position</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: 'X', value: Math.round(node.position.x) },
              { label: 'Y', value: Math.round(node.position.y) },
            ].map(({ label: l, value }) => (
              <div key={l} style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 4, padding: '7px 10px' }}>
                <div style={{ fontSize: 9, color: '#999', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{l}</div>
                <div style={{ fontSize: 13, fontFamily: 'monospace', color: '#ccc', marginTop: 2 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label style={labelStyle}>Type</label>
          <div style={{ fontSize: 12, color: '#aaa', lineHeight: 1.5 }}>{config.description}</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: 14, borderTop: '1px solid #1a1a1a', flexShrink: 0 }}>
        <button
          onClick={handleDelete}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '8px',
            background: 'none',
            border: '1px solid #2a1a1a',
            borderRadius: 4,
            fontSize: 12,
            fontFamily: 'Inter, system-ui, sans-serif',
            color: '#c0392b',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#0d0000'
            e.currentTarget.style.borderColor = '#5a2020'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none'
            e.currentTarget.style.borderColor = '#2a1a1a'
          }}
        >
          <Trash2 size={12} />
          Delete Machine
        </button>
      </div>
    </div>
  )
}
