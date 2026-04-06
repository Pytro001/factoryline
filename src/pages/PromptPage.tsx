import { useState, useEffect, useRef } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import {
  generateLayout,
  checkHealth,
  type FactoryLayout,
  type HealthStatus,
  type ProductionParams,
} from '@/lib/api'

const EXAMPLES = [
  'Automotive assembly line',
  'Semiconductor wafer fab',
  'Electronics PCB factory',
]

interface PromptPageProps {
  onGenerated: (layout: FactoryLayout) => void
}

type Status = 'idle' | 'generating' | 'error'

export default function PromptPage({ onGenerated }: PromptPageProps) {
  const [prompt, setPrompt] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [annualVolume, setAnnualVolume] = useState('')
  const [workingDays, setWorkingDays] = useState('250')
  const [shiftsPerDay, setShiftsPerDay] = useState('1')
  const [hoursPerShift, setHoursPerShift] = useState('8')
  const [oeePct, setOeePct] = useState('85')
  const [showSchedule, setShowSchedule] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    checkHealth().then(setHealth)
  }, [])

  const parseProduction = (): ProductionParams | null => {
    const raw = annualVolume.replace(/[\s,]/g, '')
    const u = parseInt(raw, 10)
    if (!Number.isFinite(u) || u <= 0) return null
    const wd = parseInt(workingDays, 10)
    const sh = parseInt(shiftsPerDay, 10)
    const hs = parseFloat(hoursPerShift)
    const oeeRaw = parseFloat(oeePct)
    const p: ProductionParams = { unitsPerYear: u }
    if (Number.isFinite(wd) && wd > 0) p.workingDaysPerYear = Math.min(366, Math.max(1, wd))
    if (Number.isFinite(sh) && sh > 0) p.shiftsPerDay = Math.min(4, Math.max(1, sh))
    if (Number.isFinite(hs) && hs > 0) p.hoursPerShift = Math.min(24, Math.max(0.5, hs))
    if (Number.isFinite(oeeRaw)) {
      const r = oeeRaw > 1 ? oeeRaw / 100 : oeeRaw
      p.oee = Math.min(1, Math.max(0.05, r))
    }
    return p
  }

  const handleGenerate = async () => {
    if (!prompt.trim() || status === 'generating') return
    setError('')
    setStatus('generating')
    try {
      const layout = await generateLayout(prompt.trim(), parseProduction())
      onGenerated(layout)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
      setStatus('error')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleGenerate()
  }

  const canGenerate = prompt.trim().length > 5 && status !== 'generating'

  return (
    <div className="relative z-[1] h-full flex flex-col" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Fixed dot layer — always visible behind content */}
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
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 flex-shrink-0">
        <span style={{ fontSize: 15, fontWeight: 500, color: '#fff', letterSpacing: '-0.01em' }}>
          Factoryline
        </span>

        {health && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, maxWidth: '52%', justifyContent: 'flex-end' }}>
            {health.llmReady ? (
              <>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#666', textAlign: 'right', lineHeight: 1.3 }}>
                  AI · {health.provider}
                  {health.model ? ` · ${health.model}` : ''}
                </span>
              </>
            ) : health.demoMode ? (
              <>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa', display: 'inline-block', flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: '#666', textAlign: 'right', lineHeight: 1.35 }}>
                  Demo layouts on Vercel. Add <span style={{ color: '#888' }}>GROQ_API_KEY</span> (free) for live AI.
                </span>
              </>
            ) : (
              <>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', display: 'inline-block', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#555' }}>Run: ollama serve — or set GROQ_API_KEY</span>
              </>
            )}
          </div>
        )}
      </nav>

      {/* Main */}
      <main
        className="flex-1 flex flex-col"
        style={{ maxWidth: 720, margin: '0 auto', width: '100%', padding: '60px 32px 80px' }}
      >
        {/* Hero — flex centers the text block as a whole; lines stay aligned to each other */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
            marginBottom: 48,
          }}
        >
          <h1
            style={{
              fontSize: 'clamp(2.125rem, 5.5vw + 1.25rem, 4rem)',
              fontWeight: 500,
              lineHeight: 1.12,
              color: '#fff',
              letterSpacing: '-0.035em',
              margin: 0,
              textAlign: 'left',
              maxWidth: '100%',
            }}
          >
            <span style={{ display: 'block', whiteSpace: 'nowrap' }}>Optimize your factory</span>
            <span style={{ display: 'block', marginTop: '0.06em' }}>with one prompt.</span>
          </h1>
        </div>

        {/* Input */}
        <div
          style={{
            border: `1px solid ${status === 'generating' ? '#444' : '#222'}`,
            borderRadius: 6,
            background: '#000',
            overflow: 'hidden',
            transition: 'border-color 0.15s',
          }}
        >
          <textarea
            ref={textareaRef}
            className="placeholder:text-white/60 placeholder:font-normal"
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value)
              if (status === 'error') setStatus('idle')
            }}
            onKeyDown={handleKeyDown}
            disabled={status === 'generating'}
            rows={4}
            placeholder="Describe your factory line..."
            style={{
              width: '100%',
              background: 'transparent',
              color: '#fff',
              fontSize: 14,
              fontWeight: 400,
              fontFamily: 'Inter, system-ui, sans-serif',
              lineHeight: 1.6,
              padding: '16px 18px 12px',
              border: 'none',
              outline: 'none',
              resize: 'none',
              display: 'block',
              boxSizing: 'border-box',
            }}
          />

          <div
            style={{
              padding: '12px 18px 14px',
              borderTop: '1px solid #111',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
              <label style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: '0.07em', flexShrink: 0 }}>
                Annual output
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={annualVolume}
                onChange={(e) => setAnnualVolume(e.target.value)}
                disabled={status === 'generating'}
                placeholder="e.g. 1000000 (optional — enables takt & bottleneck)"
                style={{
                  flex: '1 1 200px',
                  minWidth: 160,
                  background: '#0a0a0a',
                  border: '1px solid #222',
                  borderRadius: 4,
                  color: '#e5e5e5',
                  fontSize: 13,
                  padding: '8px 10px',
                  outline: 'none',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              />
              <button
                type="button"
                onClick={() => setShowSchedule((v) => !v)}
                disabled={status === 'generating'}
                style={{
                  fontSize: 11,
                  color: showSchedule ? '#fff' : '#666',
                  background: 'none',
                  border: '1px solid #2a2a2a',
                  borderRadius: 4,
                  padding: '6px 10px',
                  cursor: status === 'generating' ? 'not-allowed' : 'pointer',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                Schedule &amp; OEE
              </button>
            </div>
            {showSchedule && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: 10,
                }}
              >
                <Field label="Days / yr" value={workingDays} onChange={setWorkingDays} disabled={status === 'generating'} />
                <Field label="Shifts / day" value={shiftsPerDay} onChange={setShiftsPerDay} disabled={status === 'generating'} />
                <Field label="Hours / shift" value={hoursPerShift} onChange={setHoursPerShift} disabled={status === 'generating'} />
                <Field label="OEE %" value={oeePct} onChange={setOeePct} disabled={status === 'generating'} hint="e.g. 85" />
              </div>
            )}
            <p style={{ margin: 0, fontSize: 11, color: '#444', lineHeight: 1.4 }}>
              With a target volume we compute effective takt, mark the slowest process step, and estimate serial line capacity. Add shifts or OEE so the model sizes <code style={{ color: '#555' }}>cycleTimeSec</code> on each station.
            </p>
          </div>

          {/* Input footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 16px',
              borderTop: '1px solid #111',
            }}
          >
            <span style={{ fontSize: 12, color: '#333' }}>
              Cmd + Enter
            </span>

            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 18px',
                background: canGenerate ? '#fff' : '#111',
                color: canGenerate ? '#000' : '#444',
                border: 'none',
                borderRadius: 4,
                fontSize: 13,
                fontWeight: 500,
                fontFamily: 'Inter, system-ui, sans-serif',
                cursor: canGenerate ? 'pointer' : 'not-allowed',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {status === 'generating' ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Generating
                </>
              ) : (
                'Generate'
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {status === 'error' && (
          <div
            style={{
              marginTop: 12,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '12px 16px',
              border: '1px solid #2a1a1a',
              borderRadius: 4,
              background: '#0d0000',
            }}
          >
            <AlertCircle size={14} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: 13, color: '#ef4444', margin: 0 }}>{error}</p>
              {error.toLowerCase().includes('ollama') && (
                <code style={{ display: 'inline-block', marginTop: 8, fontSize: 12, color: '#555', background: '#0a0a0a', padding: '2px 8px', borderRadius: 3 }}>
                  ollama serve
                </code>
              )}
            </div>
          </div>
        )}

        {/* Examples */}
        <div style={{ marginTop: 36 }}>
          <p style={{ fontSize: 12, color: '#333', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Examples
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => {
                  setPrompt(ex)
                  setError('')
                  setStatus('idle')
                  textareaRef.current?.focus()
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '6px 0',
                  textAlign: 'left',
                  fontSize: 14,
                  fontWeight: 300,
                  fontFamily: 'Inter, system-ui, sans-serif',
                  color: '#555',
                  cursor: 'pointer',
                  letterSpacing: '-0.01em',
                  transition: 'color 0.1s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#555')}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </main>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  disabled,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  hint?: string
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={hint}
        style={{
          background: '#0a0a0a',
          border: '1px solid #222',
          borderRadius: 4,
          color: '#e5e5e5',
          fontSize: 13,
          padding: '8px 10px',
          outline: 'none',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      />
    </label>
  )
}
