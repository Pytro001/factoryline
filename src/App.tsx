import { useState } from 'react'
import PromptPage from '@/pages/PromptPage'
import CanvasPage from '@/pages/CanvasPage'
import type { FactoryLayout } from '@/lib/api'

type View = 'prompt' | 'canvas'

export default function App() {
  const [view, setView] = useState<View>('prompt')
  const [layout, setLayout] = useState<FactoryLayout | null>(null)

  const handleGenerated = (newLayout: FactoryLayout) => {
    setLayout(newLayout)
    setView('canvas')
  }

  const handleBack = () => {
    setView('prompt')
  }

  return (
    <div className="h-full">
      {view === 'prompt' ? (
        <PromptPage onGenerated={handleGenerated} />
      ) : layout ? (
        <CanvasPage layout={layout} onBack={handleBack} />
      ) : null}
    </div>
  )
}
