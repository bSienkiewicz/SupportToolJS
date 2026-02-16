import type { NrAlert } from '../../../../types/alerts'
import { cn } from 'src/renderer/lib/utils'

type AlertListRowProps = {
  alert: NrAlert
  originalIndex: number
  onSelect: (index: number) => void
}

export function AlertListRow({ alert, originalIndex, onSelect }: AlertListRowProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(originalIndex)}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-2.5 text-left rounded-md',
        'hover:bg-muted/80 transition-colors border border-transparent hover:border-border'
      )}
    >
      <div
        className={cn(
          'w-2 h-2 rounded-full shrink-0',
          alert.enabled ? 'bg-green-500' : 'bg-red-500'
        )}
      />
      <span className="truncate">{alert.name}</span>
    </button>
  )
}
