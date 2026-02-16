import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { NrAlert } from '../../../../types/alerts'
import {
  SEVERITY_OPTIONS,
  AGGREGATION_METHOD_OPTIONS,
  CRITICAL_OPERATOR_OPTIONS,
  CRITICAL_THRESHOLD_OCCURRENCES_OPTIONS,
} from '../../../../types/alerts'
import {
  getAlertChangelog,
  isAlertInvalid,
  isExpirationDurationInvalid,
  stripForbiddenChars,
  hasForbiddenChars,
} from './alertUtils'
import { Button } from '@renderer/components/ui/button'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@renderer/components/ui/dialog'
import { LucideSave, LucideTrash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Switch } from '../../components/ui/switch'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group'

export type EditAlertDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  alert: NrAlert
  alertIndex: number
  onSave: (index: number, patch: NrAlert) => void
  onRequestDelete: (index: number, name: string) => void
}

export function EditAlertDialog({
  open,
  onOpenChange,
  alert,
  alertIndex,
  onSave,
  onRequestDelete,
}: EditAlertDialogProps) {
  const [localAlert, setLocalAlert] = useState<NrAlert>(alert)
  const [showChangelog, setShowChangelog] = useState(false)
  const originalSnapshotRef = useRef<NrAlert>(alert)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setLocalAlert({ ...alert })
      originalSnapshotRef.current = { ...alert }
      setShowChangelog(false)
    }
  }, [open, alert])

  const changelog = useMemo(
    () => getAlertChangelog(originalSnapshotRef.current, localAlert),
    [localAlert]
  )
  const hasChanges = changelog.length > 0

  const updateLocal = useCallback((patch: Partial<NrAlert>) => {
    setLocalAlert((prev) => ({ ...prev, ...patch }))
    setShowChangelog(false)
  }, [])

  const handleSaveClick = useCallback(() => {
    if (!hasChanges) {
      toast.info('No changes to save')
      return
    }
    setShowChangelog(true)
  }, [hasChanges])

  useEffect(() => {
    if (!showChangelog || !hasChanges) return
    const el = scrollAreaRef.current
    if (!el) return
    const id = requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    })
    return () => cancelAnimationFrame(id)
  }, [showChangelog, hasChanges])

  const handleConfirmSave = useCallback(() => {
    onSave(alertIndex, localAlert)
    setShowChangelog(false)
    onOpenChange(false)
    toast.success('Alert saved')
  }, [alertIndex, localAlert, onSave, onOpenChange])

  const handleCancelChangelog = useCallback(() => {
    setShowChangelog(false)
  }, [])

  const handleDelete = useCallback(() => {
    onOpenChange(false)
    onRequestDelete(alertIndex, localAlert.name)
  }, [alertIndex, localAlert.name, onOpenChange, onRequestDelete])

  const invalid = isAlertInvalid(localAlert)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={true}
        className="max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden min-w-0"
      >
        <DialogHeader className="p-6 pb-0 shrink-0 min-w-0">
          <DialogTitle className="truncate pr-8 pb-4 border-b">
            Edit alert: {localAlert.name}
          </DialogTitle>
        </DialogHeader>

        <div
          ref={scrollAreaRef}
          className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 min-w-0 px-6 py-4"
        >
          <FieldSet className="space-y-4 min-w-0 max-w-full">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-muted-foreground">Basic Settings</span>
              <Field>
                <FieldLabel>Name</FieldLabel>
                <Input
                  value={localAlert.name}
                  onChange={(e) =>
                    updateLocal({ name: stripForbiddenChars(e.target.value) })
                  }
                  aria-invalid={hasForbiddenChars(localAlert.name)}
                />
              </Field>
              <Field>
                <FieldLabel>Severity</FieldLabel>
                <Select
                  value={String(localAlert.severity)}
                  onValueChange={(value) =>
                    updateLocal({ severity: value as NrAlert['severity'] })
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
                  value={localAlert.description}
                  onChange={(e) =>
                    updateLocal({ description: stripForbiddenChars(e.target.value) })
                  }
                  aria-invalid={hasForbiddenChars(localAlert.description)}
                />
              </Field>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-muted-foreground">NRQL & Runbook Settings</span>
              <Field>
                <FieldLabel>NRQL Query</FieldLabel>
                <Textarea
                  value={localAlert.nrql_query}
                  onChange={(e) =>
                    updateLocal({ nrql_query: stripForbiddenChars(e.target.value) })
                  }
                  className="font-mono text-sm"
                  aria-invalid={hasForbiddenChars(localAlert.nrql_query)}
                />
              </Field>
              <Field>
                <FieldLabel>Runbook URL</FieldLabel>
                <Input
                  value={localAlert.runbook_url}
                  onChange={(e) =>
                    updateLocal({ runbook_url: stripForbiddenChars(e.target.value) })
                  }
                  aria-invalid={hasForbiddenChars(localAlert.runbook_url)}
                />
              </Field>
            </div>
            <div className="flex flex-col gap-4">
              <span className="text-sm font-medium text-muted-foreground">Aggregation Settings</span>
              <Field>
                <FieldLabel>Aggregation Method</FieldLabel>
                <Select
                  value={String(localAlert.aggregation_method)}
                  onValueChange={(value) =>
                    updateLocal({
                      aggregation_method: value as NrAlert['aggregation_method'],
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
                    value={localAlert.aggregation_window}
                    onChange={(e) =>
                      updateLocal({ aggregation_window: Number(e.target.value) })
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
                    value={localAlert.aggregation_delay}
                    onChange={(e) =>
                      updateLocal({ aggregation_delay: Number(e.target.value) })
                    }
                  />
                  <InputGroupAddon align="inline-end">
                    <span>seconds</span>
                  </InputGroupAddon>
                </InputGroup>
              </Field>
            </div>
            <div className="flex flex-col gap-4">
              <span className="text-sm font-medium text-muted-foreground">Critical Settings</span>
              <Field>
                <FieldLabel>Critical Operator</FieldLabel>
                <Select
                  value={String(localAlert.critical_operator)}
                  onValueChange={(value) =>
                    updateLocal({
                      critical_operator: value as NrAlert['critical_operator'],
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
                  value={localAlert.critical_threshold}
                  onChange={(e) =>
                    updateLocal({ critical_threshold: Number(e.target.value) })
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Critical Threshold Duration</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    type="number"
                    value={localAlert.critical_threshold_duration}
                    onChange={(e) =>
                      updateLocal({
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
                  value={String(localAlert.critical_threshold_occurrences)}
                  onValueChange={(value) =>
                    updateLocal({
                      critical_threshold_occurrences:
                        value as NrAlert['critical_threshold_occurrences'],
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {CRITICAL_THRESHOLD_OCCURRENCES_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor={`enabled-dialog-${alertIndex}`}>Enabled</FieldLabel>
                </FieldContent>
                <Switch
                  id={`enabled-dialog-${alertIndex}`}
                  checked={localAlert.enabled}
                  onCheckedChange={(checked) => updateLocal({ enabled: checked })}
                />
              </Field>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor={`close-violations-dialog-${alertIndex}`}>
                    Close violations on expiration
                  </FieldLabel>
                </FieldContent>
                <Switch
                  id={`close-violations-dialog-${alertIndex}`}
                  checked={!!localAlert.close_violations_on_expiration}
                  onCheckedChange={(checked) =>
                    updateLocal({ close_violations_on_expiration: checked })
                  }
                />
              </Field>
              {localAlert.close_violations_on_expiration === true && (
                <Field>
                  <FieldLabel>Expiration Duration (required)</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      type="number"
                      value={localAlert.expiration_duration ?? ''}
                      onChange={(e) =>
                        updateLocal({
                          expiration_duration: Number(e.target.value),
                        })
                      }
                      min={0}
                      aria-invalid={isExpirationDurationInvalid(localAlert)}
                    />
                    <InputGroupAddon align="inline-end">
                      <span>seconds</span>
                    </InputGroupAddon>
                  </InputGroup>
                </Field>
              )}
            </div>
          </FieldSet>

          {showChangelog && hasChanges && (
            <div className="mt-6 p-4 rounded-lg border bg-muted/40 space-y-2 min-w-0 overflow-hidden">
              <p className="text-sm font-medium">Changelog</p>
              <ul className="text-sm space-y-1.5 list-none min-w-0 overflow-hidden">
                {changelog.map((item) => (
                  <li key={item.field} className="flex flex-wrap gap-1 min-w-0 break-words">
                    <span className="font-medium shrink-0">{item.label}:</span>
                    <span className="text-muted-foreground line-through break-all min-w-0">
                      {item.from}
                    </span>
                    <span className="shrink-0">→</span>
                    <span className="break-all min-w-0">{item.to}</span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2 pt-2">
                <Button size="sm" onClick={handleConfirmSave}>
                  Confirm save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelChangelog}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 pt-4 border-t flex-row justify-between sm:justify-between shrink-0 min-w-0">
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <LucideTrash2 />
            Delete alert
          </Button>
          <div className="flex gap-2">
            {!showChangelog && (
              <Button
                size="sm"
                onClick={handleSaveClick}
                disabled={invalid || !hasChanges}
              >
                <LucideSave />
                Save alert
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
