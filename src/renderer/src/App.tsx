import { useState, useEffect } from 'react'
import { Toaster } from './components/ui/sonner'
import SettingsPage from './SettingsPage'
import Navigation from './layout/Navigation'
import { ROUTES, getPathFromHash } from './routes'
import AlertManagement from './features/alerts/AlertManagement'
import AlertThresholds from './features/alerts/AlertThresholds'
import { FooterProvider, FooterSlot } from './context/FooterContext'

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
    <FooterProvider>
      <div className="flex flex-col h-screen">
        <div className="titlebar"></div>
        <Navigation currentPage={page} onPageChange={onPageChange} />
        <main className="min-h-0 flex-1 overflow-y-auto px-3">
          {page === ROUTES.SETTINGS && <SettingsPage />}
          {page === ROUTES.ALERTS && <div className="p-6">Alerts</div>}
          {page === ROUTES.ALERTS_MANAGEMENT && <AlertManagement />}
          {page === ROUTES.ALERTS_THRESHOLDS && <AlertThresholds />}
          <Toaster />
        </main>
        <FooterSlot />
      </div>
    </FooterProvider>
  )
}

export default App
