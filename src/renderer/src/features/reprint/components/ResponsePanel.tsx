import React, { useCallback, useEffect, useState } from 'react'
import { CodeEditor } from '@/renderer/src/components/CodeEditor'
import { Button } from '@/renderer/src/components/ui/button'
import { useRequest } from '@/renderer/src/context/RequestContext'
import { formatXml, getFaultString, getLabelsBase64, getZplFromBase64 } from '@/renderer/src/features/reprint/xmlUtils'
import { LucideCopy, LucideForm } from 'lucide-react'
import { ButtonGroup } from '@/renderer/src/components/ui/button-group'
import { toast } from 'sonner'
import { Badge } from '@/renderer/src/components/ui/badge'
import { Spinner } from '@/renderer/src/components/ui/spinner'
import { Input } from '@/renderer/src/components/ui/input'
import { Label } from '@/renderer/src/components/ui/label'

export function ResponsePanel() {
  const { response, loading, updateResponseBody } = useRequest()
  const [b64, setB64] = useState<string | null>(null)
  const [zpl, setZpl] = useState<string | null>(null)

  useEffect(() => {
    if (!response?.body) return
    const b64 = getLabelsBase64(response.body)
    if (b64) setB64(b64)
    const zpl = b64 ? getZplFromBase64(b64) : null
    if (zpl) setZpl(zpl)
  }, [response?.body])

  const handleFormat = useCallback(() => {
    if (!response?.body || response.error) return
    const formatted = formatXml(response.body)
    if (formatted !== response.body) updateResponseBody(formatted)
  }, [response?.body, response?.error, updateResponseBody])

  const handleCopyToClipboard = useCallback((text: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }, [])

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
      <div className="min-h-0 relative">
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
          <Button variant="outline" size="xs" onClick={() => handleCopyToClipboard(body)}>
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
      {!response.error && !faultSummary && response.body && (
        <>
        <Label htmlFor='b64-input'>Base64:</Label>
        <div className='relative'>
        <Input id='b64-input' value={b64 ?? ''} readOnly className='w-full' />
        <Button variant="default" className='absolute top-1.5 right-1.5' size="xs" onClick={() => handleCopyToClipboard(b64 ?? '')}>
          <LucideCopy /> Copy
        </Button>
        </div>
        
        <Label htmlFor='zpl-input'>ZPL:</Label>
        <div className='relative'>
          <Input id='zpl-input' value={zpl ?? ''} readOnly className='w-full' />
          <Button variant="default" className='absolute top-1.5 right-1.5' size="xs" onClick={() => handleCopyToClipboard(zpl ?? '')}>
            <LucideCopy /> Copy
          </Button>
        </div>
        </>
      )}
    </div>
  )
}
