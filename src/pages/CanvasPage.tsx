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
    <div className="relative h-full flex flex-col" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundColor: '#0a0a0a',
          backgroundImage:
            'radial-gradient(circle at center, rgba(255, 255, 255, 0.18) 1.5px, transparent 1.6px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col h-full">
        <Toolbar
          title={layout.title}
          onBack={onBack}
          onFitView={handleFitView}
          nodeCount={nodeCount}
          edgeCount={edgeCount}
        />

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
              background: 'rgba(0, 0, 0, 0.35)',
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
    </div>
  )
}
