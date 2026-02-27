import React, { useLayoutEffect, useRef } from 'react'
import { cn } from '../../lib/utils'
import { tokenizeNrql } from '../features/alerts/nrqlSyntax'

const baseClasses =
  'border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm font-mono'

type NrqlHighlightedTextareaProps = Omit<React.ComponentProps<'textarea'>, 'className'> & {
  className?: string
}

export function NrqlHighlightedTextarea({
  className,
  value = '',
  onScroll,
  ...props
}: NrqlHighlightedTextareaProps) {
  const mirrorRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const tokens = React.useMemo(() => tokenizeNrql(String(value)), [value])

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (mirrorRef.current) {
      mirrorRef.current.scrollTop = e.currentTarget.scrollTop
      mirrorRef.current.scrollLeft = e.currentTarget.scrollLeft
    }
    onScroll?.(e)
  }

  useLayoutEffect(() => {
    const ta = textareaRef.current
    const mirror = mirrorRef.current
    if (!ta || !mirror) return
    mirror.scrollTop = ta.scrollTop
    mirror.scrollLeft = ta.scrollLeft
  }, [value])

  return (
    <div className={cn('relative overflow-hidden rounded-md', className)}>
      <div
        ref={mirrorRef}
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0 overflow-auto whitespace-pre-wrap break-words px-3 py-2 text-base md:text-sm font-mono',
          'border border-transparent rounded-md'
        )}
      >
        <div className="min-h-16">
          {tokens.map((t, i) => (
            <span
              key={i}
              className={
                t.type === 'keyword'
                  ? 'text-purple-600 dark:text-purple-400'
                  : t.type === 'string'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-foreground'
              }
            >
              {t.value}
            </span>
          ))}
        </div>
      </div>
      <textarea
        ref={textareaRef}
        data-slot="textarea"
        value={value}
        onScroll={handleScroll}
        className={cn(
          baseClasses,
          'relative z-[1] text-transparent caret-foreground selection:bg-primary/20'
        )}
        spellCheck={false}
        {...props}
      />
    </div>
  )
}
