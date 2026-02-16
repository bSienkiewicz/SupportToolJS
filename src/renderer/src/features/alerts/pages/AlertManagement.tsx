import { useCallback, useEffect, useMemo, useState } from 'react'
import AlertHeader from '../Header'
import { AlertListRow } from '../AlertListRow'
import { EditAlertDialog } from '../EditAlertDialog'
import type { NrAlert } from '../../../../../types/alerts'
import { newAlertTemplate, type AlertChange } from '../alertUtils'
import { Button } from '@renderer/components/ui/button'
import { useFooter } from '@renderer/context/FooterContext'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@renderer/components/ui/dialog'
import { LucideUndo2 } from 'lucide-react'
import { Spinner } from '../../../components/ui/spinner'
import { ButtonGroup } from '@renderer/components/ui/button-group'

const AlertManagement = () => {
  const [changedAlerts, setChangedAlerts] = useState<AlertChange[]>([])
  const [alertToDelete, setAlertToDelete] = useState<{ index: number; name: string } | null>(null)
  const { setFooter } = useFooter()
  const [selectedStack, setSelectedStack] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [alerts, setAlerts] = useState<NrAlert[]>([])
  const [openResetDialog, setOpenResetDialog] = useState(false)
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

  const saveAlertFromDialog = useCallback((index: number, updated: NrAlert) => {
    setAlerts((prev) =>
      prev.map((a, i) => (i === index ? updated : a))
    )
    setChangedAlerts((prev) => {
      const hasModifyOrAdd = prev.some(
        (c) => (c.type === 'modify' || c.type === 'add') && c.index === index
      )
      if (hasModifyOrAdd) return prev
      return [...prev, { type: 'modify', index }]
    })
  }, [])

  const handleResetChanges = useCallback(() => {
    if (!selectedStack) return setOpenResetDialog(false)
    loadAlerts(selectedStack, { onDone: () => setOpenResetDialog(false) })
  }, [selectedStack, loadAlerts])

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
      <div className="flex gap-2 items-center">
        <span>Hello world</span>
        <ButtonGroup className="ml-auto">
          <Button
            onClick={() => setOpenResetDialog(true)}
            disabled={changedAlerts.length === 0}
            size="xs"
            variant="outline"
          >
            <LucideUndo2 />
            Reset
          </Button>
        </ButtonGroup>
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

      <Dialog open={openResetDialog} onOpenChange={setOpenResetDialog}>
        <DialogContent showCloseButton={true}>
          <DialogHeader>
            <DialogTitle>Reset all changes</DialogTitle>
            <DialogDescription>
              This will reset all changes to the alerts. Unsaved changes will
              be lost. Continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton={false}>
            <Button
              variant="outline"
              onClick={() => setOpenResetDialog(false)}
              size="sm"
            >
              Cancel
            </Button>
            <Button onClick={handleResetChanges} size="sm">
              Reset all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
