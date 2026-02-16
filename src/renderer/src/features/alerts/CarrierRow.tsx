import React, { memo } from 'react'
import { TableCell, TableRow } from '@renderer/components/ui/table'
import { Checkbox } from '@renderer/components/ui/checkbox'
import type { Presence } from './alertAuditHelpers'

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
        <Checkbox
          disabled
          checked={presence.printDuration}
          aria-label={`Print duration alert for ${name}`}
        />
      </TableCell>
      <TableCell>
        <Checkbox
          disabled
          checked={presence.errorRate}
          aria-label={`Error rate alert for ${name}`}
        />
      </TableCell>
    </TableRow>
  )
})

export default CarrierRow
