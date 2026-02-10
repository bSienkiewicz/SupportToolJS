import { useState } from 'react'
import { Toaster } from './components/ui/sonner'
import SettingsPage from './SettingsPage'
import Navigation from './layout/Navigation'
import { ROUTES } from './routes'
import AlertManagement from './pages/AlertManagement'
import AlertThresholds from './pages/AlertThresholds'

function App(): React.JSX.Element {
  const [page, setPage] = useState<string>(ROUTES.SETTINGS)

  return (
    <>
      <div className="titlebar"></div>
      <Navigation currentPage={page} onPageChange={setPage} />
      {page === ROUTES.SETTINGS && <SettingsPage />}
      {page === ROUTES.ALERTS && <div className="p-6">Alerts</div>}
      {page === ROUTES.ALERTS_MANAGEMENT && <AlertManagement />}
      {page === ROUTES.ALERTS_THRESHOLDS && <AlertThresholds />}
      <Toaster />
    </>
  )
}

export default App
