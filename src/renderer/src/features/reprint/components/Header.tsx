import { Button } from '@/renderer/src/components/ui/button'
import { Sheet, SheetTitle, SheetHeader, SheetContent, SheetTrigger } from '@/renderer/src/components/ui/sheet'
import { LucideUsersRound } from 'lucide-react'
import React from 'react'

const Header = () => {
  return (
    <header className='border-b pb-6 px-4 flex items-center justify-between'>
      <h1 className="text-xl font-bold">Reprint</h1>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="default" size="xs">
            <LucideUsersRound /> Change user
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Change user</SheetTitle>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </header>
  )
}

export default Header