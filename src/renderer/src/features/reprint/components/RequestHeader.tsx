import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/renderer/src/components/ui/select'
import React from 'react'
import type { RequestMethod } from '@/renderer/src/features/reprint/requestConfig'

export function RequestHeader({
  requestType,
  setRequestType,
}: {
  requestType: RequestMethod
  setRequestType: (t: RequestMethod) => void
}) {
  return (
    <header className="border-b pb-4 px-4 flex justify-between items-center shrink-0">
      <h1 className="text-xl font-bold">Request</h1>
      <Select value={requestType} onValueChange={(v) => setRequestType(v as RequestMethod)}>
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
    </header>
  )
}
