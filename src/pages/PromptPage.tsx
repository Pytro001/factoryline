import { useState, useRef } from 'react'
import { Loader2, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react'
import {
  createEmptyFactoryLayout,
  generateLayout,
  type FactoryLayout,
  type ProductionParams,
} from '@/lib/api'

const EXAMPLES = [
  'Aerospace subassembly line (pylon / structural kit)',
  'Insourcing a supplier part onto the main line',
  'Final assembly with lower station density (spacing)',
]

interface PromptPageProps {
  onGenerated: (layout: FactoryLayout) => void
}

type Status = 'idle' | 'generating' | 'error'

const ANNUAL_OUTPUT_LABEL_COLOR = '#999'
const MAX_ANNUAL_OUTPUT = 1_000_000_000
/** ~fits "1,000,000,000" at 13px Inter + horizontal padding */
const ANNUAL_OUTPUT_INPUT_WIDTH = 158

function formatAnnualOutputInput(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits === '') return ''
  let n = parseInt(digits, 10)
  if (!Number.isFinite(n) || n === 0) return digits === '' ? '' : '0'
  n = Math.min(n, MAX_ANNUAL_OUTPUT)
  return n.toLocaleString('en-US')
}

export default function PromptPage({ onGenerated }: PromptPageProps) {
  const [prompt, setPrompt] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [annualVolume, setAnnualVolume] = useState('')
  const [aiDraftOpen, setAiDraftOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const parseProduction = (): ProductionParams | null => {
    const raw = annualVolume.replace(/[\s,]/g, '')
    const u = parseInt(raw, 10)
    if (!Number.isFinite(u) || u <= 0) return null
    return { unitsPerYear: Math.min(u, MAX_ANNUAL_OUTPUT) }
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

  const handleStartFromScratch = () => {
    if (status === 'generating') return
    setError('')
    onGenerated(createEmptyFactoryLayout())
  }

  const canGenerate = prompt.trim().length > 5 && status !== 'generating'

  const applyExample = (ex: string) => {
    setPrompt(ex)
    setError('')
    setStatus('idle')
    setAiDraftOpen(true)
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

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
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col" style={{ overflowY: 'auto' }}>
      {/* Nav */}
      <nav className="flex items-center px-8 py-5 flex-shrink-0">
        <span style={{ fontSize: 15, fontWeight: 500, color: '#fff', letterSpacing: '-0.01em' }}>
          Factoryline
        </span>
      </nav>

      {/* Main */}
      <main
        className="flex-1 flex flex-col"
        style={{ maxWidth: 720, margin: '0 auto', width: '100%', padding: '60px 32px 80px' }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
            marginBottom: 20,
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
            <span style={{ display: 'block' }}>Lean line planning,</span>
            <span style={{ display: 'block', marginTop: '0.06em' }}>from the first layout.</span>
          </h1>
        </div>

        <p
          style={{
            fontSize: 13,
            color: '#555',
            lineHeight: 1.5,
            margin: '0 0 36px',
            maxWidth: 520,
          }}
        >
          Experiment with material flow and scenarios in hours—not weeks of sticky-note redraws. Build from scratch or
          generate an AI draft to iterate on.
        </p>

        {/* Primary: blank board */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-start',
            marginBottom: 20,
          }}
        >
          <button
            type="button"
            onClick={handleStartFromScratch}
            disabled={status === 'generating'}
            style={{
              background: 'none',
              border: '1px solid #2a2a2a',
              borderRadius: 4,
              color: '#999',
              fontSize: 12,
              fontWeight: 500,
              fontFamily: 'Inter, system-ui, sans-serif',
              padding: '8px 14px',
              cursor: status === 'generating' ? 'not-allowed' : 'pointer',
              transition: 'background 0.12s ease',
            }}
            onMouseEnter={(e) => {
              if (status === 'generating') return
              e.currentTarget.style.background = '#2a2a2a'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none'
            }}
          >
            Start from scratch
          </button>
        </div>

        {/* Optional AI draft — collapsed by default */}
        <button
          type="button"
          onClick={() => setAiDraftOpen((v) => !v)}
          disabled={status === 'generating'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'none',
            border: 'none',
            padding: '4px 0 12px',
            cursor: status === 'generating' ? 'not-allowed' : 'pointer',
            color: '#999',
            fontSize: 12,
            fontWeight: 500,
            fontFamily: 'Inter, system-ui, sans-serif',
            textAlign: 'left',
          }}
          aria-expanded={aiDraftOpen}
        >
          {aiDraftOpen ? <ChevronDown size={14} aria-hidden /> : <ChevronRight size={14} aria-hidden />}
          Generate a draft layout (optional)
        </button>

        {aiDraftOpen && (
          <div
            style={{
              border: `1px solid ${status === 'generating' ? '#444' : '#222'}`,
              borderRadius: 6,
              background: '#000',
              overflow: 'hidden',
              transition: 'border-color 0.15s',
              marginBottom: 8,
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
              placeholder="Describe a planning scenario…"
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
                padding: '10px 16px',
                borderTop: '1px solid #111',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <label
                style={{
                  fontSize: 11,
                  color: ANNUAL_OUTPUT_LABEL_COLOR,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  flexShrink: 0,
                }}
              >
                Annual output
              </label>
              <input
                type="text"
                inputMode="numeric"
                className="annual-output-input"
                value={annualVolume}
                onChange={(e) => setAnnualVolume(formatAnnualOutputInput(e.target.value))}
                disabled={status === 'generating'}
                placeholder="1,000,000,000"
                style={{
                  flex: '0 0 auto',
                  width: ANNUAL_OUTPUT_INPUT_WIDTH,
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  background: '#0a0a0a',
                  border: '1px solid #222',
                  borderRadius: 4,
                  color: ANNUAL_OUTPUT_LABEL_COLOR,
                  fontSize: 13,
                  padding: '7px 10px',
                  outline: 'none',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              />
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 18px',
                  marginLeft: 'auto',
                  background: canGenerate ? '#fff' : '#111',
                  color: canGenerate ? '#000' : '#444',
                  border: 'none',
                  borderRadius: 4,
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: 'Inter, system-ui, sans-serif',
                  cursor: canGenerate ? 'pointer' : 'not-allowed',
                  transition: 'background 0.15s, color 0.15s',
                  flexShrink: 0,
                }}
              >
                {status === 'generating' ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Generating
                  </>
                ) : (
                  'Generate draft'
                )}
              </button>
            </div>
          </div>
        )}

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
            Scenario ideas
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => applyExample(ex)}
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
