import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/renderer/src/components/ui/select'
import type { ApiType, RequestMethod } from '@/renderer/src/features/reprint/requestConfig'
import { ButtonGroup } from '@/renderer/src/components/ui/button-group'
import { Button } from '@/renderer/src/components/ui/button'

export function RequestHeader({
  requestType,
  setRequestType,
  apiType,
  setApiType,
}: {
  requestType: RequestMethod
  setRequestType: (t: RequestMethod) => void
  apiType: ApiType
  setApiType: (t: ApiType) => void
}) {
  return (
    <header className="border-b pb-4 px-4 flex flex-wrap justify-between items-center gap-3 shrink-0">
      <h1 className="text-xl font-bold">Request</h1>
      <div className="flex items-center gap-2">
        <ButtonGroup>
          <Button variant={apiType === 'SOAP' ? 'default' : 'outline'} size="xs" onClick={() => setApiType('SOAP')}>SOAP</Button>
          <Button variant={apiType === 'REST' ? 'default' : 'outline'} size="xs" onClick={() => setApiType('REST')}>REST</Button>
        </ButtonGroup>
        <Select value={requestType} onValueChange={(v) => setRequestType(v as RequestMethod)}>
          <SelectTrigger className='text-xs '>
            <SelectValue placeholder="Select request type" />
          </SelectTrigger>
          <SelectContent className='text-xs'>
            <SelectGroup>
              <SelectItem value="REPRINT">Reprint</SelectItem>
              <SelectItem value="CREATE_CONSIGNMENT">Create Consignment</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </header>
  )
}
