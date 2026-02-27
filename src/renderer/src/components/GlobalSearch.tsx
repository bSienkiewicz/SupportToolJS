import { useCallback, useEffect, useRef, useState } from 'react'
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command'
import { Button } from './ui/button'
import { Kbd, KbdGroup } from './ui/kbd'
import type { NrAlert } from '@/types/alerts'
import { EditAlertDialog } from './EditAlertDialog'

const SEARCH_DEBOUNCE_MS = 150

type Props = {
  onPageChange: (path: string) => void
}

const GlobalSearch = (_props: Props) => {
  const [open, setOpen] = useState(false)
  const [modifierKey, setModifierKey] = useState<string>('⌘')
  const [searchResults, setSearchResults] = useState<{ stack: string; alerts: NrAlert[] }[]>([])
  const [selectedForEdit, setSelectedForEdit] = useState<{ stack: string; alert: NrAlert } | null>(null)
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

  const handleAlertSelect = useCallback((stack: string, alert: NrAlert) => {
    setSelectedForEdit({ stack, alert })
    setOpen(false)
  }, [])

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
                  <CommandItem key={`${result.stack}:${alert.name}`} value={alert.name} onSelect={() => handleAlertSelect(result.stack, alert)}>
                    {alert.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )
          })}
          {/* {Array.from(itemsByGroup.entries()).map(([group, groupItems]) => (
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
          ))} */}
        </CommandList>
      </CommandDialog>
      {selectedForEdit && (
        <EditAlertDialog
          open={true}
          onOpenChange={(open) => !open && setSelectedForEdit(null)}
          stack={selectedForEdit.stack}
          alert={selectedForEdit.alert}
        />
      )}
    </>
  )
}

export default GlobalSearch