import { useCallback, useEffect, memo, useMemo, useRef, useState } from 'react'
import AlertHeader from './Header'
import {
  type NrAlert,
  SEVERITY_OPTIONS,
  AGGREGATION_METHOD_OPTIONS,
  CRITICAL_OPERATOR_OPTIONS,
  CRITICAL_THRESHOLD_OCCURRENCES_OPTIONS,
} from '../../../../types/alerts'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@renderer/components/ui/accordion'
import { Button } from '@renderer/components/ui/button'
import { cn } from 'src/renderer/lib/utils'
import { useFooter } from '@renderer/context/FooterContext'
import {
  Field,
  FieldContent,
  FieldLabel,
  FieldSet,
} from '@renderer/components/ui/field'
import { Input } from '@renderer/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@renderer/components/ui/select'
import { Textarea } from '@renderer/components/ui/textarea'
import { ButtonGroup } from '@renderer/components/ui/button-group'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@renderer/components/ui/dialog'
import { LucideTrash2, LucideUndo2 } from 'lucide-react'
import { Spinner } from '../../components/ui/spinner'
import { Switch } from '../../components/ui/switch'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group'

const FORBIDDEN_CHARS_REGEX = /[\[\]{}]/g
function stripForbiddenChars(s: string): string {
  return s.replace(FORBIDDEN_CHARS_REGEX, '')
}
function hasForbiddenChars(s: string): boolean {
  return /[\[\]{}]/.test(s)
}

function isExpirationDurationInvalid(alert: NrAlert): boolean {
  if (alert.close_violations_on_expiration !== true) return false
  const v = alert.expiration_duration
  if (v === undefined || v === null) return true
  const n = Number(v)
  return Number.isNaN(n) || n < 0
}

type AlertRowProps = {
  alert: NrAlert
  originalIndex: number
  updateAlert: (index: number, patch: Partial<NrAlert>) => void
  search: string
  handleDeleteAlert: (index: number) => void
}

const AlertRow = memo(function AlertRow({
  alert,
  originalIndex,
  updateAlert,
  handleDeleteAlert,
}: AlertRowProps) {
  return (
    <AccordionItem value={`alert-management-list-${originalIndex}`}>
      <AccordionTrigger headerClassName="sticky top-0 z-10 bg-background data-[state=open]:border-b">
        <div className="flex gap-2 items-center">
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              alert.enabled ? 'bg-green-500' : 'bg-red-500'
            )}
          />
          <span>{alert.name}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="p-4">
        <FieldSet>
          <Field>
            <FieldLabel>Name</FieldLabel>
            <Input
              value={alert.name}
              onChange={(e) =>
                updateAlert(originalIndex, { name: stripForbiddenChars(e.target.value) })
              }
              aria-invalid={hasForbiddenChars(alert.name)}
            />
          </Field>
          <Field>
            <FieldLabel>Severity</FieldLabel>
            <Select
              value={String(alert.severity)}
              onValueChange={(value) =>
                updateAlert(originalIndex, {
                  severity: value as NrAlert['severity'],
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent>
                {SEVERITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Description</FieldLabel>
            <Input
              value={alert.description}
              onChange={(e) =>
                updateAlert(originalIndex, {
                  description: stripForbiddenChars(e.target.value),
                })
              }
              aria-invalid={hasForbiddenChars(alert.description)}
            />
          </Field>
          <Field>
            <FieldLabel>NRQL Query</FieldLabel>
            <Textarea
              value={alert.nrql_query}
              onChange={(e) =>
                updateAlert(originalIndex, {
                  nrql_query: stripForbiddenChars(e.target.value),
                })
              }
              className="font-mono text-sm"
              aria-invalid={hasForbiddenChars(alert.nrql_query)}
            />
          </Field>
          <Field>
            <FieldLabel>Runbook URL</FieldLabel>
            <Input
              value={alert.runbook_url}
              onChange={(e) =>
                updateAlert(originalIndex, {
                  runbook_url: stripForbiddenChars(e.target.value),
                })
              }
              aria-invalid={hasForbiddenChars(alert.runbook_url)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
              <Field>
                <FieldLabel>Aggregation Method</FieldLabel>
                <Select
                  value={String(alert.aggregation_method)}
                  onValueChange={(value) =>
                    updateAlert(originalIndex, {
                      aggregation_method:
                        value as NrAlert['aggregation_method'],
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    {AGGREGATION_METHOD_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Aggregation Window</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    type="number"
                    value={alert.aggregation_window}
                    onChange={(e) =>
                      updateAlert(originalIndex, {
                        aggregation_window: Number(e.target.value),
                      })
                    }
                  />
                  <InputGroupAddon align="inline-end">
                    <span>seconds</span>
                  </InputGroupAddon>
                </InputGroup>
              </Field>
              <Field>
                <FieldLabel>Aggregation Delay</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                  type="number"
                    value={alert.aggregation_delay}
                    onChange={(e) =>
                      updateAlert(originalIndex, {
                        aggregation_delay: Number(e.target.value),
                      })
                    }
                  />
                  <InputGroupAddon align="inline-end">
                    <span>seconds</span>
                  </InputGroupAddon>
                </InputGroup>
              </Field>
            </div>
            <div className="flex flex-col gap-4">
              <Field>
                <FieldLabel>Critical Operator</FieldLabel>
                <Select
                  value={String(alert.critical_operator)}
                  onValueChange={(value) =>
                    updateAlert(originalIndex, {
                      critical_operator:
                        value as NrAlert['critical_operator'],
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select operator" />
                  </SelectTrigger>
                  <SelectContent>
                    {CRITICAL_OPERATOR_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Critical Threshold</FieldLabel>
                <Input
                  type="number"
                  value={alert.critical_threshold}
                  onChange={(e) =>
                    updateAlert(originalIndex, {
                      critical_threshold: Number(e.target.value),
                    })
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Critical Threshold Duration</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    type="number"
                    value={alert.critical_threshold_duration}
                    onChange={(e) =>
                      updateAlert(originalIndex, {
                        critical_threshold_duration: Number(e.target.value),
                      })
                    }
                  />
                  <InputGroupAddon align="inline-end">
                    <span>seconds</span>
                  </InputGroupAddon>
                </InputGroup>
              </Field>
              <Field>
                <FieldLabel>Critical Threshold Occurrences</FieldLabel>
                <Select
                  value={String(alert.critical_threshold_occurrences)}
                  onValueChange={(value) =>
                    updateAlert(originalIndex, {
                      critical_threshold_occurrences:
                        value as NrAlert['critical_threshold_occurrences'],
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {CRITICAL_THRESHOLD_OCCURRENCES_OPTIONS.map(
                      (opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </Field>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor={`enabled-${originalIndex}`}>Enabled</FieldLabel>
                </FieldContent>
                <Switch
                  id={`enabled-${originalIndex}`}
                  checked={alert.enabled}
                  onCheckedChange={(checked) =>
                    updateAlert(originalIndex, { enabled: checked })
                  }
                />
              </Field>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor={`close-violations-on-expiration-${originalIndex}`}>Close violations on expiration</FieldLabel>
                </FieldContent>
                <Switch
                  id={`close-violations-on-expiration-${originalIndex}`}
                  checked={!!alert.close_violations_on_expiration}
                  onCheckedChange={(checked) =>
                    updateAlert(originalIndex, {
                      close_violations_on_expiration: checked,
                    })
                  }
                />
              </Field>
              {alert.close_violations_on_expiration === true && (
                <Field>
                  <FieldLabel>Expiration Duration (required)</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      type="number"
                      value={alert.expiration_duration ?? ''}
                      onChange={e =>
                        updateAlert(originalIndex, {
                          expiration_duration: Number(e.target.value),
                        })
                      }
                      min={0}
                      aria-invalid={isExpirationDurationInvalid(alert)}
                    />
                    <InputGroupAddon  align="inline-end">
                      <span>seconds</span>
                    </InputGroupAddon>
                  </InputGroup>
                </Field>
              )}
              <Button variant="destructive" size="sm" onClick={() => handleDeleteAlert(originalIndex)}>
                <LucideTrash2 />
                <span>Delete alert</span>
              </Button>
            </div>
          </div>
        </FieldSet>
      </AccordionContent>
    </AccordionItem>
  )
})

const AlertManagement = () => {
  const [changedAlerts, setChangedAlerts] = useState<Set<number>>(new Set())
  const { setFooter } = useFooter()
  const [selectedStack, setSelectedStack] = useState<string | undefined>(
    undefined
  )
  const [loading, setLoading] = useState(false)
  const [alerts, setAlerts] = useState<NrAlert[]>([])
  const [alertsFilePath, setAlertsFilePath] = useState<string | null>(null)
  const alertsRef = useRef(alerts)
  alertsRef.current = alerts
  const [openResetDialog, setOpenResetDialog] = useState(false)
  const [search, setSearch] = useState('')

  const filteredAlertsWithIndex = useMemo(
    () =>
      alerts
        .map((alert, originalIndex) => ({ alert, originalIndex }))
        .filter(({ alert }) =>
          alert.name.toLowerCase().includes(search.toLowerCase().trim()) || alert.nrql_query.toLowerCase().includes(search.toLowerCase().trim())
        ),
    [alerts, search]
  )

  useEffect(() => {
    window.api.getConfigValue('selectedStack').then((value) => {
      if (value) setSelectedStack(value)
    })
  }, [])

  useEffect(() => {
    if (!selectedStack) return
    setLoading(true)
    setAlerts([])
    setSearch('')
    window.api.getNRAlertsForStack(selectedStack).then((result) => {
      setAlerts(result.alerts)
      setAlertsFilePath(result.filePath)
      setChangedAlerts(new Set())
      setLoading(false)
    }).catch(() => {
      setAlerts([])
      setLoading(false)
    })
  }, [selectedStack])

  const saveAlerts = useCallback(() => {
    const current = alertsRef.current
    if (!alertsFilePath) return
    window.api.saveNRAlertsForStack(alertsFilePath, current).then(({ ok }) => {
      if (ok) {
        setChangedAlerts(new Set())
      }
    })
  }, [alertsFilePath])

  const updateAlert = useCallback((index: number, patch: Partial<NrAlert>) => {
    setAlerts((prev) =>
      prev.map((a, i) => (i === index ? { ...a, ...patch } : a))
    )
    setChangedAlerts((prev) => new Set(prev).add(index))
  }, [])

  const handleResetChanges = useCallback(() => {
    if (!selectedStack) {
      setOpenResetDialog(false)
      return
    }
    setLoading(true)
    window.api.getNRAlertsForStack(selectedStack).then((result) => {
      setAlerts(result.alerts)
      setAlertsFilePath(result.filePath)
      setChangedAlerts(new Set())
      setOpenResetDialog(false)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
      setOpenResetDialog(false)
    })
  }, [selectedStack])

  const handleRefetch = useCallback(() => {
    if (!selectedStack) return
    setLoading(true)
    setAlerts([])
    setAlertsFilePath(null)
    setChangedAlerts(new Set())
    window.api.getNRAlertsForStack(selectedStack).then((result) => {
      setAlerts(result.alerts)
      setAlertsFilePath(result.filePath)
      setChangedAlerts(new Set())
    }).catch(() => {
      // keep current state on error
    }).finally(() => {
      setLoading(false)
    })
  }, [selectedStack])

  const handleDeleteAlert = useCallback((index: number) => {
    setAlerts((prev) => prev.filter((_, i) => i !== index))
    setChangedAlerts((prev) => {
      const next = new Set<number>()
      prev.forEach((i) => {
        if (i < index) next.add(i)
        else if (i > index) next.add(i - 1)
      })
      return next
    })
  }, [])

  const hasValidationError = alerts.some(
    (a) =>
      isExpirationDurationInvalid(a) ||
      hasForbiddenChars(a.name) ||
      hasForbiddenChars(a.description) ||
      hasForbiddenChars(a.nrql_query) ||
      hasForbiddenChars(a.runbook_url)
  )

  useEffect(() => {
    setFooter(
      <div className="flex gap-2">
        <ButtonGroup className='ml-auto'>
          <Button onClick={() => setOpenResetDialog(true)} disabled={changedAlerts.size === 0} size="xs" variant="outline">
            <LucideUndo2 />
          </Button>
          <Button
            onClick={saveAlerts}
            disabled={!alertsFilePath || hasValidationError}
            size="xs"
          >
            Save changes <span className="text-xs text-muted-foreground">+{changedAlerts.size}</span>
          </Button>
        </ButtonGroup>
      </div>
    )
    return () => setFooter(null)
  }, [setFooter, alertsFilePath, hasValidationError, changedAlerts.size])


  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0">
        <AlertHeader
          title="Alert Management"
          onChange={setSelectedStack}
          onSearch={setSearch}
          onRefetch={handleRefetch}
          refetchDisabled={!selectedStack}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="flex flex-col gap-2">
          <Accordion type="single" collapsible>
            {filteredAlertsWithIndex.map(({ alert, originalIndex }) => (
              <AlertRow
                key={`alert-${originalIndex}`}
                alert={alert}
                originalIndex={originalIndex}
                updateAlert={updateAlert}
                search={search}
                handleDeleteAlert={handleDeleteAlert}
              />
            ))}
          </Accordion>
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

      <Dialog open={openResetDialog} onOpenChange={setOpenResetDialog}>
        <DialogContent showCloseButton={true}>
          <DialogHeader>
            <DialogTitle>Reset all changes</DialogTitle>
            <DialogDescription>
              This will reset all changes to the alerts. Unsaved
              changes will be lost. Continue?
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
    </div>
  )
}

export default AlertManagement
