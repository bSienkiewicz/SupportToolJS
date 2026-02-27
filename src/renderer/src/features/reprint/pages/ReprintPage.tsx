import React, { useState } from 'react'
import Header from '../components/Header'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/renderer/src/components/ui/select'
import FormReprint from '@/renderer/src/features/reprint/components/FormReprint'
import { ButtonGroup } from '@/renderer/src/components/ui/button-group'
import { cn } from '@/renderer/lib/utils'
import { Button } from '@/renderer/src/components/ui/button'
import { Separator } from '@/renderer/src/components/ui/separator'

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
    <div className="">
      <Header />
      <div className="grid grid-cols-[1fr_auto_300px] gap-4">
        <div className="w-full p-4 pr-0">
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
                    variant="outline"
                    className={cn(requestType === 'rest' ? 'bg-accent' : '', 'text-xs')}
                    onClick={() => handleChangeRequestType('rest')}
                >
                    rest
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    className={cn(requestType === 'soap' ? 'bg-accent' : '', 'text-xs')}
                    onClick={() => handleChangeRequestType('soap')}
                >
                    soap
                </Button>
            </ButtonGroup>
          </div>
          <div className="mt-2">
            {selectedTab === 'REPRINT' && <FormReprint />}
          </div>
        </div>

        <Separator orientation="vertical" />

        <div className="w-full p-4 pl-0">
          <div className="flex flex-col">
            <Button>Create user</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReprintPage