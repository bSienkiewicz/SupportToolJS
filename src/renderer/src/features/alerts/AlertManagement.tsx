import { useCallback, useEffect, memo, useRef, useState } from 'react'
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
import { LucideUndo2 } from 'lucide-react'

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
  index: number
  updateAlert: (index: number, patch: Partial<NrAlert>) => void
}

const AlertRow = memo(function AlertRow({
  alert,
  index,
  updateAlert,
}: AlertRowProps) {
  return (
    <AccordionItem value={`alert-management-list-${index}`}>
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
                updateAlert(index, { name: stripForbiddenChars(e.target.value) })
              }
              aria-invalid={hasForbiddenChars(alert.name)}
            />
          </Field>
          <Field>
            <FieldLabel>Severity</FieldLabel>
            <Select
              value={String(alert.severity)}
              onValueChange={(value) =>
                updateAlert(index, {
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
                updateAlert(index, {
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
                updateAlert(index, {
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
                updateAlert(index, {
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
                    updateAlert(index, {
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
                <Input
                  type="number"
                  value={alert.aggregation_window}
                  onChange={(e) =>
                    updateAlert(index, {
                      aggregation_window: Number(e.target.value),
                    })
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Aggregation Delay</FieldLabel>
                <Input
                  type="number"
                  value={alert.aggregation_delay}
                  onChange={(e) =>
                    updateAlert(index, {
                      aggregation_delay: Number(e.target.value),
                    })
                  }
                />
              </Field>
            </div>
            <div className="flex flex-col gap-4">
              <Field>
                <FieldLabel>Critical Operator</FieldLabel>
                <Select
                  value={String(alert.critical_operator)}
                  onValueChange={(value) =>
                    updateAlert(index, {
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
                    updateAlert(index, {
                      critical_threshold: Number(e.target.value),
                    })
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Critical Threshold Duration</FieldLabel>
                <Input
                  type="number"
                  value={alert.critical_threshold_duration}
                  onChange={(e) =>
                    updateAlert(index, {
                      critical_threshold_duration: Number(
                        e.target.value
                      ),
                    })
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Critical Threshold Occurrences</FieldLabel>
                <Select
                  value={String(alert.critical_threshold_occurrences)}
                  onValueChange={(value) =>
                    updateAlert(index, {
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
              <Field className="flex flex-row items-center gap-2">
                <input
                  type="checkbox"
                  id={`close-viol-${index}`}
                  checked={!!alert.close_violations_on_expiration}
                  onChange={(e) =>
                    updateAlert(index, {
                      close_violations_on_expiration:
                        e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-input"
                />
                <FieldLabel htmlFor={`close-viol-${index}`}>
                  Close violations on expiration
                </FieldLabel>
              </Field>
              {alert.close_violations_on_expiration === true && (
                <Field>
                  <FieldLabel>Expiration Duration (required)</FieldLabel>
                  <Input
                    type="number"
                    value={
                      alert.expiration_duration ??
                      ''
                    }
                    onChange={(e) => {
                      const v = e.target.value
                      updateAlert(index, {
                        expiration_duration:
                          v === '' ? undefined : Number(v),
                      })
                    }}
                    aria-invalid={isExpirationDurationInvalid(alert)}
                    min={0}
                  />
                </Field>
              )}
              <Field className="flex flex-row items-center gap-2">
                <input
                  type="checkbox"
                  id={`enabled-${index}`}
                  checked={alert.enabled}
                  onChange={(e) =>
                    updateAlert(index, { enabled: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-input"
                />
                <FieldLabel htmlFor={`enabled-${index}`}>
                  Enabled
                </FieldLabel>
              </Field>
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
  const [alerts, setAlerts] = useState<NrAlert[]>([])
  const [alertsFilePath, setAlertsFilePath] = useState<string | null>(null)
  const alertsRef = useRef(alerts)
  alertsRef.current = alerts
  const [openResetDialog, setOpenResetDialog] = useState(false)
  useEffect(() => {
    window.api.getConfigValue('selectedStack').then((value) => {
      if (value) setSelectedStack(value)
    })
  }, [])

  useEffect(() => {
    if (!selectedStack) return
    window.api.getNRAlertsForStack(selectedStack).then((result) => {
      setAlerts(result.alerts)
      setAlertsFilePath(result.filePath)
      setChangedAlerts(new Set())
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
    setAlerts((prev) =>
      prev.map((a) => ({ ...a, enabled: true }))
    )
    setChangedAlerts(new Set())
    setOpenResetDialog(false)
  }, [setOpenResetDialog])

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
        <AlertHeader title="Alert Management" onChange={setSelectedStack} />
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="flex flex-col gap-2">
          <Accordion type="single" collapsible>
            {alerts.map((alert, index) => (
              <AlertRow
                key={`alert-${index}`}
                alert={alert}
                index={index}
                updateAlert={updateAlert}
              />
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  )
}

export default AlertManagement
