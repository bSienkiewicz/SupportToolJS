import React, { useEffect } from 'react'
import { CodeEditor } from '@/renderer/src/components/CodeEditor'
import { Input } from '@/renderer/src/components/ui/input'
import { useRequest } from '@/renderer/src/context/RequestContext'
import { getDefaultBody } from '@/renderer/src/features/reprint/soapRequest'
import type { RequestMethod } from '@/renderer/src/features/reprint/requestConfig'

type RequestEditorProps = {
  requestType: RequestMethod
}

export function RequestEditor({ requestType }: RequestEditorProps) {
  const { url, setUrl, requestBody, setRequestBody } = useRequest()

  useEffect(() => {
    setRequestBody(getDefaultBody(requestType))
  }, [requestType, setRequestBody])

  return (
    <div className="flex flex-col h-full">
      <Input
        className="sticky top-0 z-10 w-full rounded-none border-0 border-b px-4 py-2 font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0 bg-background shrink-0"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://…"
      />
      <div className="flex-1 min-h-0 p-4">
        <CodeEditor
          value={requestBody}
          onChange={setRequestBody}
          language="xml"
          placeholder="Request body (XML)"
          minHeight="100%"
        />
      </div>
    </div>
  )
}
