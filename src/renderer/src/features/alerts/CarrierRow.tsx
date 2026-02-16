import React, { memo } from 'react'
import { TableCell, TableRow } from '@renderer/components/ui/table'
import { Checkbox } from '@renderer/components/ui/checkbox'
import type { Presence } from './alertAuditHelpers'
import { Input } from '../../components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group'

const CarrierRow = memo(function CarrierRow({
  name,
  presence,
  checked,
  onToggle,
}: {
  name: string
  presence: Presence
  checked: boolean
  onToggle: (name: string, checked: boolean) => void
}) {
  return (
    <TableRow>
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
      <TableCell>
        <InputGroup className="max-w-[100px]" >
          <InputGroupInput min={0} value={presence.printDurationThreshold ?? ''} />
          <InputGroupAddon align="inline-end">
            <span>s</span>
          </InputGroupAddon>
        </InputGroup>
      </TableCell>
    </TableRow>
  )
})

export default CarrierRow
