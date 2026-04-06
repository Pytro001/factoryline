import { createContext, useContext } from 'react'

export interface CanvasContextType {
  deleteNode: (id: string) => void
  updateLabel: (id: string, label: string) => void
  updateNotes: (id: string, notes: string) => void
}

export const CanvasContext = createContext<CanvasContextType>({
  deleteNode: () => {},
  updateLabel: () => {},
  updateNotes: () => {},
})

export function useCanvas(): CanvasContextType {
  return useContext(CanvasContext)
}
