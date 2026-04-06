import { memo } from 'react'
import {
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
  type EdgeProps,
  type Edge,
} from '@xyflow/react'

type MeasurementEdgeData = Record<string, unknown>
export type MeasurementFlowEdge = Edge<MeasurementEdgeData, 'measurement'>

const MeasurementEdge = memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    label,
    selected,
  }: EdgeProps<MeasurementFlowEdge>) => {
    const [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    })

    return (
      <>
        <BaseEdge
          id={id}
          path={edgePath}
          style={{
            stroke: selected ? '#60A5FA' : '#9CA3AF',
            strokeWidth: selected ? 2 : 1.5,
            strokeDasharray: '8 4',
          }}
        />
        {label && (
          <EdgeLabelRenderer>
            <div
              style={{
                transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                pointerEvents: 'all',
              }}
              className="absolute nodrag nopan"
            >
              <span
                className="inline-flex items-center text-[10px] font-mono font-semibold px-2 py-0.5 rounded-sm border whitespace-nowrap"
                style={{
                  backgroundColor: selected ? '#1e3a5f' : '#111',
                  borderColor: selected ? '#60A5FA' : '#333',
                  color: selected ? '#93C5FD' : '#9CA3AF',
                }}
              >
                {label}
              </span>
            </div>
          </EdgeLabelRenderer>
        )}
      </>
    )
  }
)

MeasurementEdge.displayName = 'MeasurementEdge'
export default MeasurementEdge
