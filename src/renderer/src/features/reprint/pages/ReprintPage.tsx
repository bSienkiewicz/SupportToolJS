import React, { useState } from 'react'
import Header from '../components/Header'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/renderer/src/components/ui/select'
import FormReprint from '@/renderer/src/features/reprint/components/FormReprint'
import { ButtonGroup } from '@/renderer/src/components/ui/button-group'
import { cn } from '@/renderer/lib/utils'
import { Button } from '@/renderer/src/components/ui/button'
import { Separator } from '@/renderer/src/components/ui/separator'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/renderer/src/components/ui/resizable'

type Tab = 'REPRINT' | 'CREATE_CONSIGNMENT'

const ReprintPage = () => {
  const [selectedTab, setSelectedTab] = useState<Tab>('REPRINT')
  const [requestType, setRequestType] = useState<'rest' | 'soap'>('rest')

  const handleChangeRequestType = (type: 'rest' | 'soap') => {
    setRequestType(type)
  }

  const handleSelectTab = (tab: Tab) => {
    setSelectedTab(tab)
  }

  return (
    <div className="flex flex-col h-full">
      <Header />
      <ResizablePanelGroup className='flex-1 h-full'>
        <ResizablePanel className='p-4 overflow-auto' minSize={300}>
          <div className="flex justify-between">
            <Select value={selectedTab} onValueChange={handleSelectTab}>
              <SelectTrigger>
                <SelectValue placeholder="Select request type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="REPRINT">Reprint</SelectItem>
                  <SelectItem value="CREATE_CONSIGNMENT">Create Consignment</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <ButtonGroup
                className="relative">
                <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    className={cn(requestType === 'rest' ? 'bg-accent' : '', 'text-xs')}
                    onClick={() => handleChangeRequestType('rest')}
                >
                    rest
                </Button>
                <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    className={cn(requestType === 'soap' ? 'bg-accent' : '', 'text-xs')}
                    onClick={() => handleChangeRequestType('soap')}
                >
                    soap
                </Button>
            </ButtonGroup>
          </div>
          <div className="mt-2">
            {selectedTab === 'REPRINT' && <FormReprint requestType={requestType} />}
          </div>
        </ResizablePanel>
        
        <ResizableHandle withHandle />

        <ResizablePanel className='p-4' minSize={300}>
          
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

export default ReprintPage