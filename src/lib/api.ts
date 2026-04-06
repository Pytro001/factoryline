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

/** Parse API error body whether it is JSON or plain text / HTML */
async function parseErrorBody(res: Response): Promise<string> {
  const text = await res.text()
  const trimmed = text.trim().slice(0, 500)
  if (!trimmed) {
    return `Request failed (${res.status} ${res.statusText}). Is the API running on port 3001?`
  }
  try {
    const json = JSON.parse(trimmed) as { error?: string; message?: string; fix?: string }
    const parts = [json.error, json.message, json.fix].filter(Boolean)
    if (parts.length) return parts.join(' — ')
  } catch {
    /* not JSON */
  }
  if (trimmed.startsWith('<')) {
    return `Server returned HTML (${res.status}). Start the API: npm run dev (or node server.js on port 3001).`
  }
  return trimmed || `Request failed (${res.status})`
}

export async function generateLayout(prompt: string): Promise<FactoryLayout> {
  let res: Response
  try {
    res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    throw new Error(
      `Cannot reach API: ${msg}. Run both servers: npm run dev (starts API on :3001 and Vite on :5173).`,
    )
  }

  if (!res.ok) {
    const message = await parseErrorBody(res)
    throw new Error(message)
  }

  const text = await res.text()
  try {
    return JSON.parse(text) as FactoryLayout
  } catch {
    throw new Error('Invalid JSON from server. Check that node server.js is the latest version.')
  }
}

export async function checkHealth(): Promise<HealthStatus> {
  try {
    const res = await fetch('/api/health')
    return res.json()
  } catch {
    return { ollamaRunning: false, modelReady: false, models: [] }
  }
}
