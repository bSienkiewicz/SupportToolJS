import React, { useCallback } from 'react'
import { CodeEditor } from '@/renderer/src/components/CodeEditor'
import { Button } from '@/renderer/src/components/ui/button'
import { useRequest } from '@/renderer/src/context/RequestContext'
import { formatXml, getFaultString } from '@/renderer/src/features/reprint/xmlUtils'
import { LucideCopy, LucideForm } from 'lucide-react'
import { ButtonGroup } from '@/renderer/src/components/ui/button-group'
import { toast } from 'sonner'
import { Badge } from '@/renderer/src/components/ui/badge'
import { Spinner } from '@/renderer/src/components/ui/spinner'

export function ResponsePanel() {
  const { response, loading, updateResponseBody } = useRequest()

  const handleFormat = useCallback(() => {
    if (!response?.body || response.error) return
    const formatted = formatXml(response.body)
    if (formatted !== response.body) updateResponseBody(formatted)
  }, [response?.body, response?.error, updateResponseBody])

  const handleCopy = useCallback(() => {
    if (!response?.body) return
    navigator.clipboard.writeText(response.body)
    toast.success('Copied to clipboard')
  }, [response?.body])

  const faultSummary = response?.body ? getFaultString(response.body) : null

  if (loading) {
    return (
      <div className="text-muted-foreground text-sm py-4 flex items-center gap-2"><Spinner className="size-4" />Sending request…</div>
    )
  }

  if (!response) {
    return (
      <div className="text-muted-foreground text-sm py-4">
        Run a request to see the response.
      </div>
    )
  }

  const body = response.error ? `Error: ${response.error}` : (response.body || '(empty)')
  const canFormat = !response.error && response.body?.trim()

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex items-center shrink-0 justify-end">
        <Badge variant="outline">
          {response.status} {response.statusText}
        </Badge>
      </div>
      <div className="flex-1 min-h-0 relative">
        <CodeEditor
          value={body}
          onChange={() => { }}
          language="xml"
          readOnly
          minHeight="20rem"
        />
        <ButtonGroup className='absolute top-2 right-2'>
          {canFormat && (
            <Button variant="outline" size="xs" onClick={handleFormat}>
              <LucideForm /> Format
            </Button>
          )}
          <Button variant="outline" size="xs" onClick={handleCopy}>
            <LucideCopy />
          </Button>
        </ButtonGroup>
      </div>
      {faultSummary && (
        <span className="text-xs bg-red-200/50 p-2 rounded-md border-red-300 text-red-800">
          {response.error && (<span className='font-bold'>{response.error}</span>)}
          {!response.error && (<span className='font-bold'>{faultSummary}</span>)}
        </span>
      )}
    </div>
  )
}
