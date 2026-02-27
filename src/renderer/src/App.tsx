import { useState, useEffect } from 'react'
import { Toaster } from '@/renderer/src/components/ui/sonner'
import SettingsPage from '@/renderer/src/features/settings/pages/SettingsPage'
import Navigation from '@/renderer/src/layout/Navigation'
import { ROUTES, getPathFromHash } from '@/renderer/src/routes'
import AlertManagement from '@/renderer/src/features/alerts/pages/AlertManagement'
import { FooterProvider, FooterSlot } from '@/renderer/src/context/FooterContext'
import AlertAudit from '@/renderer/src/features/alerts/pages/AlertAudit'
import { TooltipProvider } from '@/renderer/src/components/ui/tooltip'
import ReprintPage from './features/reprint/pages/ReprintPage'

function App(): React.JSX.Element {
  const [page, setPage] = useState<string>(getPathFromHash)

  useEffect(() => {
    const path = getPathFromHash()
    if (window.location.hash.slice(1) !== path) window.location.hash = path
  }, [])

  useEffect(() => {
    const onHashChange = (): void => setPage(getPathFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const onPageChange = (path: string): void => {
    setPage(path)
    window.location.hash = path
  }

  return (
    <TooltipProvider>
      <FooterProvider>
        <div className="flex flex-col h-screen">
          <div className="titlebar"></div>
          <Navigation currentPage={page} onPageChange={onPageChange} />
          <main className="min-h-0 flex-1 overflow-y-auto">
            {page === ROUTES.SETTINGS && <SettingsPage />}
            {page === ROUTES.ALERTS && <div className="p-6">Alerts</div>}
            {page === ROUTES.ALERTS_MANAGEMENT && <AlertManagement />}
            {page === ROUTES.ALERTS_AUDIT && <AlertAudit />}
            {page === ROUTES.REPRINT && <ReprintPage />}
            <Toaster />
          </main>
          <FooterSlot />
        </div>
      </FooterProvider>
    </TooltipProvider>
  )
}

export default App
