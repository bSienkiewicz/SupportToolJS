import { useState } from 'react'
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  navigationMenuTriggerStyle,
} from '@/renderer/src/components/ui/navigation-menu'
import { cn } from 'src/renderer/lib/utils'
import { NAV } from '../routes'

type Props = {
  currentPage: string
  onPageChange: (page: string) => void
}

const Navigation = ({ currentPage, onPageChange }: Props) => {
  const [openValue, setOpenValue] = useState('')

  return (
    <nav className="w-full p-2">
      <NavigationMenu value={openValue} onValueChange={setOpenValue}>
        <NavigationMenuList className="gap-1">
          {NAV.map((item) =>
            'submenus' in item && item.submenus.length > 0 ? (
              <NavigationMenuItem key={item.path} value={item.path}>
                <NavigationMenuTrigger
                  onPointerMove={(e) => e.preventDefault()}
                  onPointerLeave={(e) => e.preventDefault()}
                  className={cn(
                    (currentPage === item.path ||
                      item.submenus.some((s) => s.path === currentPage)) &&
                      'bg-accent text-accent-foreground'
                  )}
                >
                  {item.label}
                </NavigationMenuTrigger>
                <NavigationMenuContent
                  onPointerMove={(e) => e.preventDefault()}
                  onPointerLeave={(e) => e.preventDefault()}
                >
                  <ul className="grid w-96 gap-1">
                    {item.submenus.map((sub) => (
                      <li key={sub.path}>
                        <button
                          type="button"
                          className={cn(
                            'flex w-full rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer',
                            currentPage === sub.path &&
                              'bg-accent text-accent-foreground'
                          )}
                          onClick={() => {
                          onPageChange(sub.path)
                          setOpenValue('')
                        }}
                        >
                          <div className="flex flex-col gap-1 items-start">
                            {sub.label}
                            {sub.description && <span className="text-xs text-muted-foreground text-left">{sub.description}</span>}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            ) : (
              <NavigationMenuItem key={item.path}>
                <button
                  type="button"
                  className={cn(
                    navigationMenuTriggerStyle(),
                    currentPage === item.path &&
                      'bg-accent text-accent-foreground'
                  )}
                  onClick={() => onPageChange(item.path)}
                >
                  {item.label}
                </button>
              </NavigationMenuItem>
            )
          )}
        </NavigationMenuList>
      </NavigationMenu>
    </nav>
  )
}

export default Navigation
