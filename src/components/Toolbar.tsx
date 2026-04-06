import { ArrowLeft, Maximize2 } from 'lucide-react'

interface ToolbarProps {
  title: string
  onBack: () => void
  onFitView: () => void
  nodeCount: number
  edgeCount: number
}

export default function Toolbar({ title, onBack, onFitView, nodeCount, edgeCount }: ToolbarProps) {
  return (
    <header
      style={{
        height: 44,
        background: 'transparent',
        borderBottom: '1px solid #1a1a1a',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 20,
        flexShrink: 0,
        fontFamily: 'Inter, system-ui, sans-serif',
        userSelect: 'none',
      }}
    >
      {/* Left: back + wordmark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
            fontSize: 13,
            fontFamily: 'inherit',
            padding: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#888')}
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>

        <span style={{ width: 1, height: 16, background: '#1a1a1a', display: 'inline-block' }} />

        <span style={{ fontSize: 14, fontWeight: 500, color: '#fff', letterSpacing: '-0.01em' }}>
          Factoryline
        </span>
      </div>

      {/* Center: factory title */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <span
          style={{
            fontSize: 13,
            fontWeight: 400,
            color: '#aaa',
            maxWidth: 380,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </span>
      </div>

      {/* Right: counts + fit */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 12, color: '#888' }}>
          {nodeCount} machines
        </span>
        <span style={{ fontSize: 12, color: '#555' }}>·</span>
        <span style={{ fontSize: 12, color: '#888' }}>
          {edgeCount} connections
        </span>

        <span style={{ width: 1, height: 16, background: '#1a1a1a', display: 'inline-block' }} />

        <button
          onClick={onFitView}
          title="Fit to screen"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: '1px solid #222',
            borderRadius: 4,
            color: '#666',
            cursor: 'pointer',
            fontSize: 12,
            fontFamily: 'inherit',
            padding: '4px 10px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#fff'
            e.currentTarget.style.borderColor = '#444'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#666'
            e.currentTarget.style.borderColor = '#222'
          }}
        >
          <Maximize2 size={12} />
          <span>Fit</span>
        </button>
      </div>
    </header>
  )
}
