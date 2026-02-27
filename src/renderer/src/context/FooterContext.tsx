import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

type FooterContextValue = {
  content: ReactNode
  setFooter: (content: ReactNode) => void
}

const FooterContext = createContext<FooterContextValue | null>(null)

export function FooterProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<ReactNode>(null)
  const setFooter = useCallback((next: ReactNode) => setContent(next), [])
  return <FooterContext.Provider value={{ content, setFooter }}>{children}</FooterContext.Provider>
}

export function useFooter() {
  const ctx = useContext(FooterContext)
  if (!ctx) throw new Error('useFooter must be used within FooterProvider')
  return ctx
}

/** Renders the footer when a page has set content via useFooter(). Place once in the app layout. */
export function FooterSlot() {
  const { content } = useFooter()
  if (content == null) return null
  return <footer className="shrink-0 border-t px-4 py-1 bg-background">{content}</footer>
}
