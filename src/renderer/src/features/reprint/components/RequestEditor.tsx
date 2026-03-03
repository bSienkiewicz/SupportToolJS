import React, { useEffect, useCallback, useState } from 'react'
import { CodeEditor } from '@/renderer/src/components/CodeEditor'
import { Input } from '@/renderer/src/components/ui/input'
import { Button } from '@/renderer/src/components/ui/button'
import { useRequest } from '@/renderer/src/context/RequestContext'
import { getDefaultBody } from '@/renderer/src/features/reprint/soapRequest'
import { formatXml } from '@/renderer/src/features/reprint/xmlUtils'
import type { RequestMethod } from '@/renderer/src/features/reprint/requestConfig'
import { ButtonGroup } from '@/renderer/src/components/ui/button-group'
import { LucideCopy, LucideForm, LucideChevronDown } from 'lucide-react'
import { toast } from 'sonner'

type RequestEditorProps = {
  requestType: RequestMethod
}

export function RequestEditor({ requestType }: RequestEditorProps) {
  const { url, setUrl, requestBody, setRequestBody } = useRequest()
  const [expandedEditor, setExpandedEditor] = useState(false)

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
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        <div
          className='relative'
        >
          <CodeEditor
            value={requestBody}
            onChange={setRequestBody}
            language="xml"
            placeholder="Request body (XML)"
            minHeight={expandedEditor ? '25rem' : '6rem'}
          />
          {!expandedEditor && (
            <div
              className="absolute inset-0 bg-linear-to-b from-transparent to-background/90 rounded-md z-10 cursor-pointer flex items-end justify-center pb-2"
              onClick={() => setExpandedEditor(true)}
              role="button"
              tabIndex={0}
              aria-label="Expand editor"
            >
              <LucideChevronDown className="size-4 text-muted-foreground" />
            </div>
          )}
          <ButtonGroup className="absolute top-2 right-2 z-20">
            <Button variant="outline" size="xs" onClick={handleFormat}>
              <LucideForm /> Format
            </Button>
            <Button variant="outline" size="xs" onClick={handleCopy}>
              <LucideCopy />
            </Button>
            {expandedEditor && (
              <Button
                variant="outline"
                size="xs"
                onClick={() => setExpandedEditor(false)}
              >
                <LucideChevronDown className="rotate-180" /> Collapse
              </Button>
            )}
          </ButtonGroup>
        </div>
      </div>
    </div>
  )
}
