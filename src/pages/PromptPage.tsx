import { useState, useEffect, useRef } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { generateLayout, checkHealth, type FactoryLayout } from '@/lib/api'

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
  const [ollamaReady, setOllamaReady] = useState<boolean | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    checkHealth().then(({ ollamaRunning, modelReady }) => {
      setOllamaReady(ollamaRunning && modelReady)
    })
  }, [])

  const handleGenerate = async () => {
    if (!prompt.trim() || status === 'generating') return
    setError('')
    setStatus('generating')
    try {
      const layout = await generateLayout(prompt.trim())
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

        {/* Show warning only when Ollama is not running */}
        {ollamaReady === false && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
            <span style={{ fontSize: 13, color: '#555' }}>Run: ollama serve</span>
          </div>
        )}
      </nav>

      {/* Main */}
      <main
        className="flex-1 flex flex-col"
        style={{ maxWidth: 640, margin: '0 auto', width: '100%', padding: '60px 32px 80px' }}
      >
        {/* Hero */}
        <h1
          style={{
            fontSize: 'clamp(2.125rem, 5.5vw + 1.25rem, 4rem)',
            fontWeight: 500,
            lineHeight: 1.12,
            color: '#fff',
            letterSpacing: '-0.035em',
            marginBottom: 48,
            textAlign: 'center',
          }}
        >
          <span style={{ display: 'block', whiteSpace: 'nowrap' }}>Optimize your factory</span>
          <span style={{ display: 'block', marginTop: '0.06em' }}>with one prompt.</span>
        </h1>

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
