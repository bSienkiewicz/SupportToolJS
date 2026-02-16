import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AlertHeader from '../Header'
import type { GetNRAlertsForStackResult } from '@/types/api'
import { Button } from '@renderer/components/ui/button'
import { ButtonGroup } from '@renderer/components/ui/button-group'
import { Spinner } from '../../../components/ui/spinner'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@renderer/components/ui/table'
import { Checkbox } from '../../../components/ui/checkbox'
import { useFooter } from '@renderer/context/FooterContext'
import CarrierRow from '../CarrierRow'
import {
  NRQL_TEMPLATE,
  extractCarrierNames,
  computeAlertPresence,
  type Presence,
  addMissingAlerts,
} from '../alertAuditHelpers'

const DEFAULT_PRESENCE: Presence = { name: '', errorRate: false, printDuration: false }

const AlertAudit = () => {
  const { setFooter } = useFooter()
  const [selectedStack, setSelectedStack] = useState<string | null>(null)
  const [carrierNames, setCarrierNames] = useState<string[]>([])
  const [alertPresence, setAlertPresence] = useState<Presence[]>([])
  const [selectedCarriers, setSelectedCarriers] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const skipNextFetchRef = useRef(false)

  useEffect(() => {
    window.api.getConfigValue('selectedStack').then((v) => {
      skipNextFetchRef.current = true
      setSelectedStack(v ?? null)
    })
  }, [])

  const fetchData = useCallback(async () => {
    if (!selectedStack?.trim()) {
      toast.error('Select a stack first')
      return
    }
    setLoading(true)
    setError(null)
    setCarrierNames([])
    setAlertPresence([])
    setSelectedCarriers(new Set())
    const toastId = toast.loading(`Fetching carriers for ${selectedStack}…`)
    try {
      const nrql = NRQL_TEMPLATE(selectedStack.trim())
      const result = await window.api.executeNrql(nrql)

      if (result.error) {
        toast.error(result.error, { id: toastId })
        setError(result.error)
        return
      }

      const results = Array.isArray(result.data) ? result.data : []
      const names = extractCarrierNames(results)
      setCarrierNames(names)

      if (names.length === 0) {
        toast.info('No carriers found', { id: toastId })
      } else {
        toast.success(`${names.length} carrier${names.length !== 1 ? 's' : ''} loaded`, {
          id: toastId,
        })
        await calculateMissingAlerts(selectedStack.trim(), names)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      toast.error(msg, { id: toastId })
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [selectedStack])

  useEffect(() => {
    if (!selectedStack?.trim()) return
    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false
      return
    }
    fetchData()
  }, [selectedStack, fetchData])

  async function calculateMissingAlerts(stack: string, carriers: string[]) {
    const result: GetNRAlertsForStackResult = await window.api.getNRAlertsForStack(stack)
    const computed = computeAlertPresence(result, carriers)
    if (!computed) {
      toast.error(result.error ?? 'Failed to load alerts')
      setAlertPresence(carriers.map((name) => ({ ...DEFAULT_PRESENCE, name })))
      setSelectedCarriers(new Set(carriers))
      return
    }
    setAlertPresence(computed.presence)
    setSelectedCarriers(new Set(computed.missingCarriers))
  }

  const presenceByName = useMemo(() => {
    const m: Record<string, Presence> = {}
    carrierNames.forEach((name, i) => {
      m[name] = alertPresence[i] ?? DEFAULT_PRESENCE
    })
    return m
  }, [carrierNames, alertPresence])

  const sortedCarriers = useMemo(() => {
    return [...carrierNames].sort((a, b) => {
      const hasAllA = presenceByName[a]?.errorRate && presenceByName[a]?.printDuration
      const hasAllB = presenceByName[b]?.errorRate && presenceByName[b]?.printDuration
      if (!hasAllA && hasAllB) return -1
      if (hasAllA && !hasAllB) return 1
      return 0
    })
  }, [carrierNames, presenceByName])

  const toggleCarrierSelection = useCallback((name: string | null, checked: boolean) => {
    if (name === null) {
      setSelectedCarriers(checked ? new Set(sortedCarriers) : new Set())
      return
    }
    setSelectedCarriers((prev) => {
      const next = new Set(prev)
      if (checked) next.add(name)
      else next.delete(name)
      return next
    })
  }, [sortedCarriers])

  const handleAddMissingAlerts = useCallback(async () => {
    if (!selectedStack?.trim() || carrierNames.length === 0) return
    setAddLoading(true)
    try {
      const { addedNames, saved } = await addMissingAlerts(selectedStack, selectedCarriers, alertPresence)
      if (!saved) return
      if (addedNames.length > 0) {
        toast.success(`Added ${addedNames.length} alert${addedNames.length !== 1 ? 's' : ''}`)
        await calculateMissingAlerts(selectedStack.trim(), carrierNames)
      } else {
        toast.info('No new alerts to add')
      }
    } finally {
      setAddLoading(false)
    }
  }, [selectedStack, selectedCarriers, alertPresence, carrierNames])

  const selectAllChecked =
    sortedCarriers.length === 0
      ? false
      : selectedCarriers.size === sortedCarriers.length
        ? true
        : selectedCarriers.size > 0
          ? ('indeterminate' as const)
          : false

  useEffect(() => {
    setFooter(<div className="flex gap-2" />)
    return () => setFooter(null)
  }, [setFooter, fetchData, loading])

  return (
    <div className="flex flex-col h-full">
      <AlertHeader
        title="Find Missing Alerts"
        showItems={[]}
        onChange={setSelectedStack}
        onSearch={() => { }}
        onRefetch={fetchData}
        onAddAlert={handleAddMissingAlerts}
      />
      <div className="min-h-0 flex-1 overflow-auto">
        {!selectedStack && (
          <p className="text-sm text-muted-foreground">
            Select a stack above, then click Fetch Data.
          </p>
        )}
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <div>
          <div className="flex items-center gap-2">
            <ButtonGroup>
              <Button onClick={fetchData} disabled={loading} size="xs">
                {loading ? (
                  <>
                    <Spinner className="mr-2 size-4" />
                    Fetching…
                  </>
                ) : (
                  'Fetch Data'
                )}
              </Button>
            </ButtonGroup>
            <ButtonGroup>
              <Button
                onClick={() => handleAddMissingAlerts()}
                size="xs"
                disabled={selectedCarriers.size === 0 || !selectedStack || addLoading}
              >
                {addLoading ? (
                  <>
                    <Spinner className="mr-2 size-4" />
                    Adding…
                  </>
                ) : (
                  'Add Missing Alerts'
                )}
              </Button>
            </ButtonGroup>
            <p className="text-xs text-muted-foreground my-3 ml-auto">
              {carrierNames.length} carrier{carrierNames.length !== 1 ? 's' : ''}
            </p>
          </div>

          {carrierNames.length > 0 && (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selectAllChecked}
                        onCheckedChange={(c) => toggleCarrierSelection(null, c === true)}
                        aria-label="Select all carriers"
                      />
                    </TableHead>
                    <TableHead>Carrier Name</TableHead>
                    <TableHead>Print Duration</TableHead>
                    <TableHead>Error Rate</TableHead>
                    <TableHead><Button size="xs" variant="default">Calculate thresholds</Button></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCarriers.map((name) => (
                    <CarrierRow
                      key={name}
                      name={name}
                      presence={presenceByName[name] ?? { ...DEFAULT_PRESENCE, name }}
                      checked={selectedCarriers.has(name)}
                      onToggle={toggleCarrierSelection}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AlertAudit
