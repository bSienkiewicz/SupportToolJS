import { useCallback, useEffect, useMemo, useState } from 'react'
import AlertHeader from '../../../components/Header'
import { AlertListRow } from '../../../components/AlertListRow'
import { EditAlertDialog } from '../../../components/EditAlertDialog'
import type { NrAlert } from '../../../../../types/alerts'
import { newAlertTemplate, type AlertChange } from '../alertUtils'
import { Button } from '@/renderer/src/components/ui/button'
import { useFooter } from '@/renderer/src/context/FooterContext'
import { RepoFooterInfo } from '@/renderer/src/components/RepoFooterInfo'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/renderer/src/components/ui/dialog'
import { Spinner } from '../../../components/ui/spinner'

const AlertManagement = () => {
  const [changedAlerts, setChangedAlerts] = useState<AlertChange[]>([])
  const [alertToDelete, setAlertToDelete] = useState<{ index: number; name: string } | null>(null)
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
    (stack: string, options?: { clearFirst?: boolean; onDone?: () => void }) => {
      setLoading(true)
      if (options?.clearFirst) {
        setAlerts([])
        setSearch('')
      }
      window.api
        .getNRAlertsForStack(stack)
        .then((result) => {
          setAlerts(result.alerts)
          setChangedAlerts([])
          setEditingAlertIndex(null)
          options?.onDone?.()
        })
        .catch(() => {
          setAlerts([])
        })
        .finally(() => setLoading(false))
    },
    []
  )

  useEffect(() => {
    if (selectedStack) loadAlerts(selectedStack, { clearFirst: true })
  }, [selectedStack, loadAlerts])

  const saveAlertFromDialog = useCallback(
    (index: number, updated: NrAlert): Promise<void> => {
      const newAlerts = alerts.map((a, i) => (i === index ? updated : a))
      if (!selectedStack) {
        setAlerts(newAlerts)
        setChangedAlerts((prev) => {
          const hasModifyOrAdd = prev.some(
            (c) => (c.type === 'modify' || c.type === 'add') && c.index === index
          )
          if (hasModifyOrAdd) return prev
          return [...prev, { type: 'modify', index }]
        })
        return Promise.resolve()
      }
      return window.api
        .saveNRAlertsForStack(selectedStack, newAlerts)
        .then((result) => {
          if (result.ok) {
            setAlerts(newAlerts)
            setChangedAlerts((prev) => {
              const hasModifyOrAdd = prev.some(
                (c) => (c.type === 'modify' || c.type === 'add') && c.index === index
              )
              if (hasModifyOrAdd) return prev
              return [...prev, { type: 'modify', index }]
            })
            return
          }
          const msg =
            result.error === 'block_not_found'
              ? 'nr_nrql_alerts block not found in file'
              : result.error === 'no_data_dir'
                ? 'No data directory set'
                : result.error ?? 'Failed to save to file'
          return Promise.reject(new Error(msg))
        })
    },
    [alerts, selectedStack]
  )

  const handleRefetch = useCallback(() => {
    if (selectedStack) loadAlerts(selectedStack, { clearFirst: true })
  }, [selectedStack, loadAlerts])

  const handleAddAlert = useCallback(() => {
    const newIndex = alerts.length
    setAlerts((prev) => [...prev, newAlertTemplate(newIndex)])
    setChangedAlerts((prev) => [...prev, { type: 'add', index: newIndex }])
    setEditingAlertIndex(newIndex)
  }, [alerts.length])

  const requestDeleteAlert = useCallback((index: number, name: string) => {
    setAlertToDelete({ index, name })
  }, [])

  const confirmDeleteAlert = useCallback(() => {
    if (!alertToDelete) return
    const { index, name } = alertToDelete
    setAlerts((prev) => prev.filter((_, i) => i !== index))
    setChangedAlerts((prev) => {
      const next: AlertChange[] = prev
        .filter(
          (c) =>
            (c.type !== 'modify' && c.type !== 'add') || c.index !== index
        )
        .map((c) => {
          if (c.type === 'modify' || c.type === 'add') {
            if (c.index > index) return { ...c, index: c.index - 1 }
          }
          return c
        })
      return [...next, { type: 'delete', name }]
    })
    setAlertToDelete(null)
    setEditingAlertIndex((i) =>
      i === index ? null : i != null && i > index ? i - 1 : i
    )
  }, [alertToDelete])

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

      {editingAlert != null && editingAlertIndex != null && (
        <EditAlertDialog
          open={editingAlertIndex !== null}
          onOpenChange={(open) => !open && setEditingAlertIndex(null)}
          alert={editingAlert}
          alertIndex={editingAlertIndex}
          onSave={saveAlertFromDialog}
          onRequestDelete={requestDeleteAlert}
          selectedStack={selectedStack}
        />
      )}


      <Dialog open={!!alertToDelete} onOpenChange={(open) => !open && setAlertToDelete(null)}>
        <DialogContent showCloseButton={true}>
          <DialogHeader>
            <DialogTitle>Delete alert</DialogTitle>
            <DialogDescription>
              Delete alert &quot;{alertToDelete?.name}&quot;? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton={false}>
            <Button
              variant="outline"
              onClick={() => setAlertToDelete(null)}
              size="sm"
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteAlert} size="sm">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AlertManagement
export type { AlertChange } from '../alertUtils'
