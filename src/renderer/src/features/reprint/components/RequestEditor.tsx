import React, { useEffect, useCallback } from 'react'
import { CodeEditor } from '@/renderer/src/components/CodeEditor'
import { Input } from '@/renderer/src/components/ui/input'
import { Button } from '@/renderer/src/components/ui/button'
import { useRequest } from '@/renderer/src/context/RequestContext'
import { getDefaultBody } from '@/renderer/src/features/reprint/soapRequest'
import { formatXml } from '@/renderer/src/features/reprint/xmlUtils'
import type { RequestMethod } from '@/renderer/src/features/reprint/requestConfig'
import { ButtonGroup } from '@/renderer/src/components/ui/button-group'
import { LucideCopy, LucideForm } from 'lucide-react'
import { toast } from 'sonner'

type RequestEditorProps = {
  requestType: RequestMethod
}

export function RequestEditor({ requestType }: RequestEditorProps) {
  const { url, setUrl, requestBody, setRequestBody } = useRequest()

  useEffect(() => {
    setRequestBody(getDefaultBody(requestType))
  }, [requestType, setRequestBody])

  const handleFormat = useCallback(() => {
    const formatted = formatXml(requestBody)
    if (formatted !== requestBody) setRequestBody(formatted)
  }, [requestBody, setRequestBody])

  const handleCopy = useCallback(() => {
    if (!requestBody) return
    navigator.clipboard.writeText(requestBody)
    toast.success('Copied to clipboard')
  }, [requestBody])

  return (
    <div className="flex flex-col h-full min-h-0">
      <Input
        className="sticky top-0 z-10 w-full rounded-none border-0 border-b px-4 py-2 font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0 bg-background shrink-0"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://…"
      />
      <div className="flex-1 min-h-0 flex flex-col p-4 overflow-hidden">
        <div className="flex-1 min-h-0 relative overflow-hidden">
          <CodeEditor
            className="h-full"
            value={requestBody}
            onChange={setRequestBody}
            language="xml"
            placeholder="Request body (XML)"
            minHeight="100%"
          />
          <ButtonGroup className="absolute top-2 right-2">
            <Button variant="outline" size="xs" onClick={handleFormat}>
              <LucideForm /> Format
            </Button>
            <Button variant="outline" size="xs" onClick={handleCopy}>
              <LucideCopy />
            </Button>
          </ButtonGroup>
        </div>
      </div>
    </div>
  )
}
