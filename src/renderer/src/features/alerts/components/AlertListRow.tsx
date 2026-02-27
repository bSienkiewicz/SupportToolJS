import type { NrAlert } from '@/types/alerts'
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/renderer/src/components/ui/item'
import { Button } from '@/renderer/src/components/ui/button'
import { LucideCircle, LucideCircleCheck } from 'lucide-react'
import { Badge } from '@/renderer/src/components/ui/badge'
import { getAlertType } from '@/renderer/src/features/alerts/alertUtils'

type AlertListRowProps = {
  alert: NrAlert
  originalIndex: number
  onSelect: (index: number) => void
}

function ThresholdBadge({ alert }: { alert: NrAlert }) {
  const type = getAlertType(alert)
  const threshold = alert.critical_threshold
  if (type == null || threshold == null) return null
  const value = Number(threshold)
  if (Number.isNaN(value)) return null
  if (type === 'print_duration') {
    return (
      <Badge variant="secondary">
        {value}s
      </Badge>
    )
  }
  if (type === 'error_rate') {
    return (
      <Badge variant="secondary">
        {value}%
      </Badge>
    )
  }
  return null
}

export function AlertListRow({ alert, originalIndex, onSelect }: AlertListRowProps) {
  const alertType = getAlertType(alert)
  return (
    <Item variant={'outline'} onClick={() => onSelect(originalIndex)} className='cursor-pointer'>
      <ItemMedia>
        {!alert.enabled ? <LucideCircle className='text-gray-500' size={16} strokeWidth={3} /> : <LucideCircleCheck className='text-green-500' size={16} strokeWidth={3} />}
      </ItemMedia>
      <ItemContent>
        <ItemTitle>
          {alert.name}{' '}
          {alertType === 'print_duration' || alertType === 'error_rate' ? (
            <Badge variant={'outline'} className={`${alertType === 'print_duration' ? 'bg-blue-100 text-blue-500' : 'bg-orange-100 text-orange-800'}`}>
              {alertType === 'print_duration' ? 'Print Duration' : 'Error Rate'}
            </Badge>
          ) : (
            <Badge variant={'outline'}>Other</Badge>
          )}
          <ThresholdBadge alert={alert} />
          {alert.close_violations_on_expiration && (
            <Badge variant={'outline'}>LOS</Badge>
          )}
        </ItemTitle>
        <ItemDescription>
          {alert.description}
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button variant={'outline'} size={'xs'} onClick={() => onSelect(originalIndex)}>
          Edit
        </Button>
      </ItemActions>
    </Item>
  )
}
