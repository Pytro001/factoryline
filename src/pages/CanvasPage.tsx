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
