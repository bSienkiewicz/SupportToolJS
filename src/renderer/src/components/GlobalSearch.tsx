import { useEffect, useMemo, useState } from 'react'
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command'
import { Button } from './ui/button'
import { Kbd, KbdGroup } from './ui/kbd'
import { getNavCommandItems } from '../routes'

type Props = {
  onPageChange: (path: string) => void
}

const GlobalSearch = ({ onPageChange }: Props) => {
  const [open, setOpen] = useState(false)
  const [modifierKey, setModifierKey] = useState<string>('⌘')

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

  const handleSelect = (path: string) => {
    onPageChange(path)
    setOpen(false)
  }

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
        <CommandInput placeholder="Search navigation..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
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