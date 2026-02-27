import { useCallback, useEffect, useMemo, useState } from 'react'
import AlertHeader from '../../../components/Header'
import { AlertListRow } from '../../../components/AlertListRow'
import { EditAlertDialog } from '../../../components/EditAlertDialog'
import type { NrAlert } from '../../../../../types/alerts'
import { newAlertTemplate, type AlertChange } from '../alertUtils'
import { useFooter } from '@/renderer/src/context/FooterContext'
import { RepoFooterInfo } from '@/renderer/src/components/RepoFooterInfo'
import { Spinner } from '../../../components/ui/spinner'
import { toast } from 'sonner'

const AlertManagement = () => {
  const [changedAlerts, setChangedAlerts] = useState<AlertChange[]>([])
  const { setFooter } = useFooter()
  const [selectedStack, setSelectedStack] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [alerts, setAlerts] = useState<NrAlert[]>([])
  const [search, setSearch] = useState('')
  const [editingAlertIndex, setEditingAlertIndex] = useState<number | null>(null)

  const filteredAlertsWithIndex = useMemo(
    () =>
      alerts
        .map((alert, originalIndex) => ({ alert, originalIndex }))
        .filter(
          ({ alert }) =>
            alert.name.toLowerCase().includes(search.toLowerCase().trim()) ||
            alert.nrql_query.toLowerCase().includes(search.toLowerCase().trim())
        ),
    [alerts, search]
  )

  useEffect(() => {
    window.api.getConfigValue('selectedStack').then((v) => v && setSelectedStack(v))
  }, [])

  const loadAlerts = useCallback(
    async (stack: string, options?: { clearFirst?: boolean; onDone?: () => void; toastId?: string }) => {
      setLoading(true)
      if (options?.clearFirst) {
        setAlerts([])
        setSearch('')
      }
      try {
        let result = await window.api.getNRAlertsForStack(stack)
        if (result.error === 'cache_not_loaded') {
          await window.api.loadAllAlerts()
          result = await window.api.getNRAlertsForStack(stack)
        }
        setAlerts(result.alerts)
        setChangedAlerts([])
        setEditingAlertIndex(null)
        options?.onDone?.()
      } catch {
        setAlerts([])
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    if (selectedStack) loadAlerts(selectedStack, { clearFirst: true })
  }, [selectedStack, loadAlerts])

  const handleRefetch = useCallback(async () => {
    setLoading(true)
    try {
      const result = await window.api.loadAllAlerts()
      if (result.ok && selectedStack) loadAlerts(selectedStack, { clearFirst: true })
      if (!result.ok) toast.error('Failed to rebuild alerts cache')
    } catch {
      toast.error('Failed to rebuild alerts cache')
    } finally {
      setLoading(false)
    }
  }, [selectedStack, loadAlerts])

  const handleAddAlert = useCallback(() => {
    const newIndex = alerts.length
    setAlerts((prev) => [...prev, newAlertTemplate(newIndex)])
    setChangedAlerts((prev) => [...prev, { type: 'add', index: newIndex }])
    setEditingAlertIndex(newIndex)
  }, [alerts.length])

  useEffect(() => {
    setFooter(
      <div className="flex items-center justify-between w-full gap-4">
        <RepoFooterInfo />
      </div>
    )
    return () => setFooter(null)
  }, [setFooter, changedAlerts.length])

  const editingAlert =
    editingAlertIndex != null ? alerts[editingAlertIndex] ?? null : null

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0">
        <AlertHeader
          title="Alert Management"
          showItems={['search', 'refetch', 'addAlert']}
          onChange={setSelectedStack}
          onSearch={setSearch}
          onRefetch={handleRefetch}
          refetchDisabled={!selectedStack}
          onAddAlert={handleAddAlert}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="flex flex-col gap-2 p-2">
          {filteredAlertsWithIndex.map(({ alert, originalIndex }) => (
            <AlertListRow
              key={`alert-${originalIndex}`}
              alert={alert}
              originalIndex={originalIndex}
              onSelect={setEditingAlertIndex}
            />
          ))}
          {loading && (
            <div className="py-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Spinner />
              <span>Loading alerts...</span>
            </div>
          )}
          {alerts.length === 0 && !loading && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No alerts loaded. Select a stack above.
            </p>
          )}
          {alerts.length > 0 && filteredAlertsWithIndex.length === 0 && !loading && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No alerts match &quot;{search}&quot;.
            </p>
          )}
        </div>
      </div>

      {editingAlert != null && selectedStack && (
        <EditAlertDialog
          open={true}
          onOpenChange={(open) => !open && setEditingAlertIndex(null)}
          stack={selectedStack}
          alert={editingAlert}
          onSaved={() => loadAlerts(selectedStack)}
        />
      )}
    </div>
  )
}

export default AlertManagement
export type { AlertChange } from '../alertUtils'
