import { useRef, useState, useCallback } from 'react'
import Toolbar from '@/components/Toolbar'
import MachinePalette from '@/components/MachinePalette'
import FactoryCanvas from '@/components/FactoryCanvas'
import type { FactoryLayout } from '@/lib/api'
import type { MachineTypeId } from '@/lib/machineTypes'

interface CanvasPageProps {
  layout: FactoryLayout
  onBack: () => void
}

export default function CanvasPage({ layout, onBack }: CanvasPageProps) {
  const fitViewRef = useRef<(() => void) | null>(null)
  const [nodeCount, setNodeCount] = useState(layout.nodes.length)
  const [edgeCount, setEdgeCount] = useState((layout.edges ?? []).length)

  const handleFitViewReady = useCallback((fn: () => void) => {
    fitViewRef.current = fn
  }, [])

  const handleCountsChange = useCallback((nodes: number, edges: number) => {
    setNodeCount(nodes)
    setEdgeCount(edges)
  }, [])

  const handleAddMachine = useCallback((machineType: MachineTypeId) => {
    window.dispatchEvent(
      new CustomEvent('fl:addMachine', { detail: { machineType } })
    )
  }, [])

  const handleFitView = () => {
    fitViewRef.current?.()
  }

  return (
    <div className="h-full flex flex-col" style={{ background: '#000' }}>
      <Toolbar
        title={layout.title}
        onBack={onBack}
        onFitView={handleFitView}
        nodeCount={nodeCount}
        edgeCount={edgeCount}
      />

      {layout.throughput && (
        <div
          style={{
            padding: '10px 16px',
            fontSize: 12,
            color: '#a3a3a3',
            borderBottom: '1px solid #1a1a1a',
            fontFamily: 'Inter, system-ui, sans-serif',
            lineHeight: 1.45,
            flexShrink: 0,
            background: '#050505',
          }}
        >
          <span style={{ color: '#e5e5e5', fontWeight: 500 }}>Material / product flow — capacity</span>
          <span style={{ color: '#525252', margin: '0 8px' }}>·</span>
          Target {layout.throughput.unitsPerYear.toLocaleString()} units/yr · takt{' '}
          <span style={{ color: '#fafafa' }}>{layout.throughput.taktSec.toFixed(2)}s</span> effective
          <span style={{ color: '#525252', margin: '0 8px' }}>·</span>
          Bottleneck: <span style={{ color: '#fb923c' }}>{layout.throughput.bottleneckLabel || '—'}</span>
          {layout.throughput.bottleneckCycleSec > 0 && (
            <> ({layout.throughput.bottleneckCycleSec.toFixed(1)}s station)</>
          )}
          <span style={{ color: '#525252', margin: '0 8px' }}>·</span>
          Line cap ≈ {layout.throughput.lineTheoreticalUnitsPerYear.toLocaleString()} units/yr (serial model)
          <span style={{ color: '#525252', margin: '0 8px' }}>·</span>
          {layout.throughput.meetsTakt ? (
            <span style={{ color: '#4ade80' }}>Meets takt</span>
          ) : (
            <span style={{ color: '#f87171' }}>
              Over takt — ~{layout.throughput.parallelStationsSuggested} parallel cells suggested
            </span>
          )}
          {layout.throughput.warnings?.length > 0 && (
            <div style={{ marginTop: 6, fontSize: 11, color: '#78716c' }}>
              {layout.throughput.warnings.join(' ')}
            </div>
          )}
        </div>
      )}

      {layout.demo && (
        <div
          style={{
            padding: '8px 16px',
            fontSize: 11,
            color: '#888',
            borderBottom: '1px solid #1a1a1a',
            textAlign: 'center',
            fontFamily: 'Inter, system-ui, sans-serif',
            lineHeight: 1.4,
            flexShrink: 0,
          }}
        >
          {layout.demoHint ||
            'Demo layout from built-in lean template. Add GROQ_API_KEY or OPENAI_API_KEY in Vercel for AI-generated factories.'}
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        <MachinePalette onAddMachine={handleAddMachine} />

        <FactoryCanvas
          layout={layout}
          onFitViewReady={handleFitViewReady}
          onCountsChange={handleCountsChange}
        />
      </div>
    </div>
  )
}
