import React, { memo, useCallback } from 'react'
import { TableCell, TableRow } from '@renderer/components/ui/table'
import { Checkbox } from '@renderer/components/ui/checkbox'
import { buildConfirmationNrql, type Presence } from '../features/alerts/alertAuditHelpers'
import { InputGroup, InputGroupAddon, InputGroupInput } from './ui/input-group'
import { Button } from './ui/button'
import { toast } from 'sonner'
import { LucideCopy } from 'lucide-react'

const CarrierRow = memo(function CarrierRow({
  name,
  presence,
  checked,
  onToggle,
  proposedThreshold,
  onProposedThresholdChange,
}: {
  name: string
  presence: Presence
  checked: boolean
  onToggle: (name: string, checked: boolean) => void
  proposedThreshold?: number | string
  onProposedThresholdChange?: (name: string, value: number | string | '') => void
}) {
  const proposedPrintDurationThreshold =
    proposedThreshold !== undefined && proposedThreshold !== null && proposedThreshold !== ''
      ? String(proposedThreshold)
      : presence.printDuration && presence.printDurationThreshold != null
        ? String(presence.printDurationThreshold)
        : ''

  const handleThresholdChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!onProposedThresholdChange) return
      const raw = e.target.value
      if (raw === '') {
        onProposedThresholdChange(name, '')
        return
      }
      onProposedThresholdChange(name, raw)
    },
    [name, onProposedThresholdChange]
  )

  const handleCopyConfirmationNrql = useCallback(async () => {
    const nrql = await buildConfirmationNrql(name, presence.printDurationThreshold, proposedPrintDurationThreshold, 7)
    navigator.clipboard.writeText(nrql)
    toast.success('Confirmation NRQL copied to clipboard')
  }, [name, presence.printDurationThreshold, proposedPrintDurationThreshold])

  const handleRowClick = useCallback(
    (e: React.MouseEvent<HTMLTableRowElement>) => {
      const target = e.target as HTMLElement
      if (target.closest('input, button, [role="checkbox"]')) return
      onToggle(name, !checked)
    },
    [name, checked, onToggle]
  )

  const stopPropagation = useCallback((e: React.MouseEvent) => e.stopPropagation(), [])

  return (
    <TableRow onClick={handleRowClick} className="cursor-pointer">
      <TableCell>
        <Checkbox
          checked={checked}
          onCheckedChange={(c) => onToggle(name, c === true)}
          aria-label={`Select ${name}`}
        />
      </TableCell>
      <TableCell>{name}</TableCell>
      <TableCell>
        <span className="flex items-center gap-2">
          <Checkbox
            disabled
            checked={presence.printDuration}
            aria-label={`Print duration alert for ${name}`}
          />
          {presence.printDuration && presence.printDurationThreshold != null && (
            <span className="text-muted-foreground text-sm tabular-nums">
              {presence.printDurationThreshold} s
            </span>
          )}
        </span>
      </TableCell>
      <TableCell>
        <Checkbox
          disabled
          checked={presence.errorRate}
          aria-label={`Error rate alert for ${name}`}
        />
      </TableCell>
      <TableCell onClick={stopPropagation}>
        {presence.printDuration ? (
          <div className="flex items-center gap-2">
            <InputGroup className="max-w-[100px]">
              <InputGroupInput
                type="number"
                min={0}
                step={0.5}
                value={proposedPrintDurationThreshold}
                onChange={handleThresholdChange}
                aria-label={`Threshold for ${name}`}
              />
              <InputGroupAddon align="inline-end">
                <span>s</span>
              </InputGroupAddon>
            </InputGroup>
            <span>
              {presence.printDurationThreshold != null && proposedPrintDurationThreshold !== '' && !isNaN(Number(proposedPrintDurationThreshold)) ? (
                <span className={`text-xs ${(() => {
                  const current = Number(presence.printDurationThreshold)
                  const proposed = Number(proposedPrintDurationThreshold)
                  const diff = proposed - current
                  if (!isFinite(diff) || diff === 0) return "text-muted-foreground"
                  return Math.abs(diff) > 2 ? "text-red-500" : "text-muted-foreground"
                })()}`}>
                  {(() => {
                    const current = Number(presence.printDurationThreshold)
                    const proposed = Number(proposedPrintDurationThreshold)
                    const diff = proposed - current
                    if (!isFinite(diff) || diff === 0) return null
                    const sign = diff > 0 ? '+' : ''
                    return (
                      <span>
                        ({sign}{diff % 1 === 0 ? diff : diff.toFixed(2)} s)
                      </span>
                    )
                  })()}
                </span>
              ) : null}
              {!presence.printDurationThreshold && '—'}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </TableCell>
      <TableCell onClick={stopPropagation}>
        <Button variant={'outline'} size={'xs'} onClick={() => handleCopyConfirmationNrql()}>
          <LucideCopy />
        </Button>
      </TableCell>
    </TableRow>
  )
})

export default CarrierRow
