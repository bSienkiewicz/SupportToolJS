import { useEffect, useState } from 'react'
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
  FieldGroup,
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
import { Textarea } from '../../components/ui/textarea'

const AlertManagement = () => {
  const { setFooter } = useFooter()
  const [selectedStack, setSelectedStack] = useState<string | undefined>(
    undefined
  )
  const [alerts, setAlerts] = useState<NrAlert[]>([])
  const [alertsFilePath, setAlertsFilePath] = useState<string | null>(null)

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
    })
  }, [selectedStack])

  const saveAlerts = () => {
    if (!alertsFilePath) return
    window.api.saveNRAlertsForStack(alertsFilePath, alerts).then(({ ok }) => {
      if (ok) {
        // optional: toast success
      }
    })
  }

  const updateAlert = (index: number, patch: Partial<NrAlert>) => {
    setAlerts((prev) =>
      prev.map((a, i) => (i === index ? { ...a, ...patch } : a))
    )
  }

  useEffect(() => {
    setFooter(
      <div className="flex">
        <Button
          onClick={saveAlerts}
          disabled={!alertsFilePath}
          size="xs"
          className="ml-auto"
        >
          Save changes
        </Button>
      </div>
    )
    return () => setFooter(null)
  }, [setFooter, alertsFilePath, alerts])

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0">
        <AlertHeader title="Alert Management" onChange={setSelectedStack} />
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="flex flex-col gap-2">
          <Accordion type="single" collapsible>
            {alerts.map((alert, index) => (
              <AccordionItem
                value={`alert-management-list-${index}`}
                key={`alert-${index}`}
              >
                <AccordionTrigger>
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
                            updateAlert(index, { name: e.target.value })
                          }
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
                            updateAlert(index, { description: e.target.value })
                          }
                        />
                      </Field>
                      <Field>
                        <FieldLabel>NRQL Query</FieldLabel>
                        <Textarea
                          value={alert.nrql_query}
                          onChange={(e) =>
                            updateAlert(index, { nrql_query: e.target.value })
                          }
                          className="font-mono text-sm"
                        />
                      </Field>
                      <Field>
                        <FieldLabel>Runbook URL</FieldLabel>
                        <Input
                          value={alert.runbook_url}
                          onChange={(e) =>
                            updateAlert(index, { runbook_url: e.target.value })
                          }
                        />
                      </Field>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="flex flex-col gap-4">
                          <h4 className="text-sm font-medium text-muted-foreground">
                            Aggregation
                          </h4>
                          <Field>
                            <FieldLabel>Method</FieldLabel>
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
                            <FieldLabel>Window</FieldLabel>
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
                            <FieldLabel>Delay</FieldLabel>
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
                          <h4 className="text-sm font-medium text-muted-foreground">
                            Critical
                          </h4>
                          <Field>
                            <FieldLabel>Operator</FieldLabel>
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
                            <FieldLabel>Threshold</FieldLabel>
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
                            <FieldLabel>Threshold duration</FieldLabel>
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
                            <FieldLabel>Threshold occurrences</FieldLabel>
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
                          {alert.expiration_duration != null && (
                            <Field>
                              <FieldLabel>Expiration duration</FieldLabel>
                              <Input
                                type="number"
                                value={alert.expiration_duration}
                                onChange={(e) =>
                                  updateAlert(index, {
                                    expiration_duration: Number(e.target.value),
                                  })
                                }
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
                          {alert.close_violations_on_expiration != null && (
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
                          )}
                        </div>
                      </div>
                  </FieldSet>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  )
}

export default AlertManagement
