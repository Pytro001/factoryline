import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  MarkerType,
  type Connection,
  type Node,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import MachineNode, { type MachineNodeData } from './MachineNode'
import MeasurementEdge from './MeasurementEdge'
import PropertiesPanel from './PropertiesPanel'
import { CanvasContext } from '@/lib/canvasContext'
import { getMachineType, type MachineTypeId } from '@/lib/machineTypes'
import type { FactoryLayout } from '@/lib/api'

const nodeTypes: NodeTypes = { machine: MachineNode }
const edgeTypes: EdgeTypes = { measurement: MeasurementEdge }

// ── Layout → React Flow nodes/edges ──────────────────────────────────────────
function buildNodes(layout: FactoryLayout): Node<MachineNodeData>[] {
  return layout.nodes.map((n) => ({
    id: n.id,
    type: 'machine',
    position: { x: n.x, y: n.y },
    data: {
      machineType: n.machineType,
      label: n.label,
      notes: n.notes ?? '',
      width: n.width ?? getMachineType(n.machineType).defaultWidth,
      height: n.height ?? getMachineType(n.machineType).defaultHeight,
      cycleTimeSec: n.cycleTimeSec,
      isBottleneck: n.isBottleneck,
    },
    style: { width: n.width ?? getMachineType(n.machineType).defaultWidth },
  }))
}

const EDGE_MARKER = {
  type: MarkerType.ArrowClosed,
  width: 14,
  height: 14,
  color: '#9CA3AF',
}

function buildEdges(layout: FactoryLayout): Edge[] {
  return (layout.edges ?? []).map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    type: 'measurement',
    animated: false,
    markerEnd: EDGE_MARKER,
  }))
}

// ── Inner canvas (inside ReactFlowProvider) ───────────────────────────────────
interface FactoryCanvasInnerProps {
  layout: FactoryLayout
  onFitViewReady: (fn: () => void) => void
  onCountsChange: (nodes: number, edges: number) => void
}

function FactoryCanvasInner({ layout, onFitViewReady, onCountsChange }: FactoryCanvasInnerProps) {
  const { fitView, screenToFlowPosition } = useReactFlow()
  const [nodes, setNodes, onNodesChange] = useNodesState(buildNodes(layout))
  const [edges, setEdges, onEdgesChange] = useEdgesState(buildEdges(layout))
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const idCounter = useRef(layout.nodes.length + 100)

  useEffect(() => {
    setNodes(buildNodes(layout))
    setEdges(buildEdges(layout))
    idCounter.current = layout.nodes.length + 100
    setSelectedNodeId(null)
  }, [layout, setNodes, setEdges])

  // Expose fitView to parent
  useEffect(() => {
    onFitViewReady(() => fitView({ padding: 0.1, duration: 600 }))
  }, [fitView, onFitViewReady])

  // Report counts to parent toolbar
  useEffect(() => {
    onCountsChange(nodes.length, edges.length)
  }, [nodes.length, edges.length, onCountsChange])

  // ── Canvas context callbacks ────────────────────────────────────────────────
  const deleteNode = useCallback((id: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== id))
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id))
    setSelectedNodeId((prev) => (prev === id ? null : prev))
  }, [setNodes, setEdges])

  const updateLabel = useCallback((id: string, label: string) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, label } } : n))
    )
  }, [setNodes])

  const updateNotes = useCallback((id: string, notes: string) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, notes } } : n))
    )
  }, [setNodes])

  // ── Add machine from palette (via custom event) ────────────────────────────
  const addMachine = useCallback((machineType: MachineTypeId) => {
    const config = getMachineType(machineType)
    const id = `node_${++idCounter.current}`

    // Place in visible center of the canvas
    const canvasEl = document.querySelector('.react-flow__viewport')?.parentElement
    const cx = canvasEl ? canvasEl.clientWidth / 2 : 400
    const cy = canvasEl ? canvasEl.clientHeight / 2 : 300
    const flowPos = screenToFlowPosition({ x: cx, y: cy })

    const newNode: Node<MachineNodeData> = {
      id,
      type: 'machine',
      position: {
        x: flowPos.x - config.defaultWidth / 2,
        y: flowPos.y - config.defaultHeight / 2,
      },
      data: {
        machineType,
        label: config.name,
        notes: '',
        width: config.defaultWidth,
        height: config.defaultHeight,
      },
      style: { width: config.defaultWidth },
    }

    setNodes((nds) => [...nds, newNode])
    setSelectedNodeId(id)
  }, [screenToFlowPosition, setNodes])

  useEffect(() => {
    const handler = (e: Event) => {
      const { machineType } = (e as CustomEvent<{ machineType: MachineTypeId }>).detail
      addMachine(machineType)
    }
    window.addEventListener('fl:addMachine', handler)
    return () => window.removeEventListener('fl:addMachine', handler)
  }, [addMachine])

  // ── Edge connect ─────────────────────────────────────────────────────────────
  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) =>
      addEdge({ ...connection, type: 'measurement', label: '—', markerEnd: EDGE_MARKER }, eds)
    )
  }, [setEdges])

  // ── Selected node ─────────────────────────────────────────────────────────────
  const selectedNode = nodes.find((n) => n.id === selectedNodeId) as Node<MachineNodeData> | undefined

  return (
    <CanvasContext.Provider value={{ deleteNode, updateLabel, updateNotes }}>
      <div className="flex flex-1 h-full min-h-0 min-w-0 relative">
        {/* Canvas */}
        <div className="flex-1 h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onPaneClick={() => setSelectedNodeId(null)}
            deleteKeyCode="Delete"
            selectionKeyCode="Shift"
            multiSelectionKeyCode="Shift"
            fitView
            fitViewOptions={{ padding: 0.1 }}
            minZoom={0.05}
            maxZoom={4}
            snapToGrid
            snapGrid={[10, 10]}
            className="bg-black"
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={28}
              size={1}
              color="#2a2a2a"
            />
            <Controls showInteractive={false} />
            <MiniMap
              style={{
                backgroundColor: '#111',
                border: '1px solid #222',
              }}
              nodeColor={() => '#fff'}
              nodeStrokeColor={() => '#555'}
              nodeStrokeWidth={1}
              maskColor="rgba(0,0,0,0.5)"
              zoomable
              pannable
            />
          </ReactFlow>
        </div>

        {/* Properties panel */}
        {selectedNode && (
          <PropertiesPanel
            node={selectedNode}
            onClose={() => setSelectedNodeId(null)}
          />
        )}
      </div>
    </CanvasContext.Provider>
  )
}

// ── Public component (wraps ReactFlowProvider) ────────────────────────────────
interface FactoryCanvasProps {
  layout: FactoryLayout
  onFitViewReady: (fn: () => void) => void
  onCountsChange: (nodes: number, edges: number) => void
}

export default function FactoryCanvas({ layout, onFitViewReady, onCountsChange }: FactoryCanvasProps) {
  return (
    <ReactFlowProvider>
      <FactoryCanvasInner
        layout={layout}
        onFitViewReady={onFitViewReady}
        onCountsChange={onCountsChange}
      />
    </ReactFlowProvider>
  )
}
