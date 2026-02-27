import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command'
import { Button } from './ui/button'
import { Kbd, KbdGroup } from './ui/kbd'
import { getNavCommandItems } from '../routes'
import type { NrAlert } from '@/types/alerts'

const SEARCH_DEBOUNCE_MS = 150

type Props = {
  onPageChange: (path: string) => void
}

const GlobalSearch = ({ onPageChange }: Props) => {
  const [open, setOpen] = useState(false)
  const [modifierKey, setModifierKey] = useState<string>('⌘')
  const [searchResults, setSearchResults] = useState<{ stack: string; alerts: NrAlert[] }[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    window.api.getPlatform().then((platform) => {
      setModifierKey(platform === 'darwin' ? '⌘' : 'Ctrl')
    })
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey && e.key === 'k') || (e.ctrlKey && e.key === 'k')) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const itemsByGroup = useMemo(() => {
    const items = getNavCommandItems()
    const map = new Map<string, typeof items>()
    for (const item of items) {
      const list = map.get(item.group) ?? []
      list.push(item)
      map.set(item.group, list)
    }
    return map
  }, [])

  const handleSelect = useCallback(
    (path: string) => {
      onPageChange(path)
      setOpen(false)
    },
    [onPageChange]
  )

  const handleSearchValueChange = useCallback((value: string) => {
    const query = value.trim()
    if (!query) {
      setSearchResults([])
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null
      window.api.searchAlertsCache(query).then(({ results }) => {
        setSearchResults(results)
      })
    }, SEARCH_DEBOUNCE_MS)
  }, [])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  useEffect(() => {
    if (!open) setSearchResults([])
  }, [open])

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="w-44 flex items-center justify-between p-2">
        <span className="text-xs font-normal text-muted-foreground">Search...</span>
        <KbdGroup>
          <Kbd>{modifierKey}</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search..." onValueChange={handleSearchValueChange} />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {searchResults.map((result) => {
            return (
              <CommandGroup key={result.stack} heading={result.stack.toUpperCase()}>
                {result.alerts.map((alert) => (
                  <CommandItem key={alert.name} value={alert.name} onSelect={() => handleSelect(alert.name)}>
                    {alert.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )
          })}
          {Array.from(itemsByGroup.entries()).map(([group, groupItems]) => (
            <CommandGroup key={group} heading={group}>
              {groupItems.map((item) => (
                <CommandItem
                  key={item.path}
                  value={`${item.label} ${item.path}`}
                  onSelect={() => handleSelect(item.path)}
                >
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  )
}

export default GlobalSearch