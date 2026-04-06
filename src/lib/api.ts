export interface FactoryNode {
  id: string
  machineType: string
  label: string
  x: number
  y: number
  width: number
  height: number
  notes?: string
}

export interface FactoryEdge {
  id: string
  source: string
  target: string
  label?: string
}

export interface FactoryLayout {
  title: string
  nodes: FactoryNode[]
  edges: FactoryEdge[]
}

export interface HealthStatus {
  ollamaRunning: boolean
  modelReady: boolean
  models: string[]
}

export async function generateLayout(prompt: string): Promise<FactoryLayout> {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.error ?? `Request failed (${res.status})`)
  }

  return res.json()
}

export async function checkHealth(): Promise<HealthStatus> {
  try {
    const res = await fetch('/api/health')
    return res.json()
  } catch {
    return { ollamaRunning: false, modelReady: false, models: [] }
  }
}
