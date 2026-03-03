import React, { useEffect, useCallback, useState, useRef } from 'react'
import { CodeEditor } from '@/renderer/src/components/CodeEditor'
import { Input } from '@/renderer/src/components/ui/input'
import { Button } from '@/renderer/src/components/ui/button'
import { Label } from '@/renderer/src/components/ui/label'
import { useRequest } from '@/renderer/src/context/RequestContext'
import {
  getDefaultBody,
  buildSoapXml,
  parseSoapXml,
  CREATE_PAPERWORK_FIELDS,
} from '@/renderer/src/features/reprint/soapRequest'
import { formatXml } from '@/renderer/src/features/reprint/formatUtils'
import {
  getRestEndpointUrl,
  type ApiType,
  type RequestMethod,
} from '@/renderer/src/features/reprint/requestConfig'
import { ButtonGroup } from '@/renderer/src/components/ui/button-group'
import { LucideCopy, LucideForm, LucideChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/renderer/lib/utils'

const REPRINT_FORM_KEYS = ['dmc', 'type', 'format', 'dpi', 'dimension'] as const
const EMPTY_FORM: Record<string, string> = Object.fromEntries(
  REPRINT_FORM_KEYS.map((k) => [k, ''])
)

type RequestEditorProps = {
  apiType: ApiType
  requestType: RequestMethod
  selectedStack: string | null | undefined
}

export function RequestEditor({ apiType, requestType, selectedStack }: RequestEditorProps) {
  const { url, setUrl, requestBody, setRequestBody } = useRequest()
  const [expandedEditor, setExpandedEditor] = useState(false)
  const [formValues, setFormValues] = useState<Record<string, string>>(EMPTY_FORM)
  const skipSyncFromFormRef = useRef(false)

  useEffect(() => {
    if (apiType === 'SOAP') {
      setRequestBody(getDefaultBody(requestType))
    } else {
      setRequestBody('')
    }
  }, [apiType, requestType, setRequestBody])

  // Sync editor body -> form when user edits XML (SOAP REPRINT only)
  useEffect(() => {
    if (skipSyncFromFormRef.current) {
      skipSyncFromFormRef.current = false
      return
    }
    if (apiType !== 'SOAP' || requestType !== 'REPRINT' || !requestBody.trim()) return
    const parsed = parseSoapXml(requestBody)
    if (parsed) setFormValues((prev) => ({ ...EMPTY_FORM, ...prev, ...parsed }))
  }, [apiType, requestBody, requestType])

  // Build REST URL when form or stack changes (REST REPRINT only)
  useEffect(() => {
    if (apiType !== 'REST' || requestType !== 'REPRINT') return
    const firstDmc = (formValues.dmc ?? '').split(',')[0]?.trim() || ''
    const restUrl = getRestEndpointUrl(
      selectedStack,
      'REPRINT',
      { consignmentCode: firstDmc },
      {
        dimension: formValues.dimension ?? '',
        format: formValues.format ?? '',
        type: formValues.type ?? '',
        resolution: formValues.dpi ?? '',
      }
    )
    setUrl(restUrl)
  }, [apiType, requestType, selectedStack, formValues, setUrl])

  const handleFormChange = useCallback(
    (key: string, value: string) => {
      const next = { ...formValues, [key]: value }
      setFormValues(next)
      if (apiType === 'SOAP') {
        skipSyncFromFormRef.current = true
        setRequestBody(buildSoapXml(next))
      }
    },
    [apiType, formValues, setRequestBody]
  )

  const handleFormat = useCallback(() => {
    const formatted = formatXml(requestBody)
    if (formatted !== requestBody) setRequestBody(formatted)
  }, [requestBody, setRequestBody])

  const handleCopy = useCallback(() => {
    if (!requestBody) return
    navigator.clipboard.writeText(requestBody)
    toast.success('Copied to clipboard')
  }, [requestBody])

  const isReprint = requestType === 'REPRINT'

  return (
    <div className="flex flex-col h-full min-h-0">
      <Input
        className="sticky top-0 z-10 w-full rounded-none border-0 border-b px-4 py-2 font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0 bg-background shrink-0"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://…"
      />
      {isReprint && (
        <div className="shrink-0 border-b bg-muted/30 px-4 py-3 space-y-3">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="req-dmc">DMCs</Label>
              <Input
                id="req-dmc"
                value={formValues.dmc ?? ''}
                onChange={(e) => handleFormChange('dmc', e.target.value)}
                placeholder="DMC123..., DMC456..."
                className="font-mono text-sm"
              />
            </div>
            {CREATE_PAPERWORK_FIELDS.filter((f) => f.role === 'parameter').map(
              (f) => (
                <div key={f.key} className="space-y-1.5">
                  <Label htmlFor={`req-${f.key}`}>{f.label}</Label>
                  <Input
                    id={`req-${f.key}`}
                    value={formValues[f.key] ?? ''}
                    onChange={(e) => handleFormChange(f.key, e.target.value)}
                    placeholder={f.label}
                    className="font-mono text-sm"
                  />
                </div>
              )
            )}
          </div>
        </div>
      )}
      <div className="flex-1 flex flex-col p-4 overflow-hidden min-h-0">
        {apiType === 'REST' ? (
          <p className="text-sm text-muted-foreground py-2">
            REST GET: parameters are in the URL above. Edit the form to change dimension, format, type, resolution and consignment code.
          </p>
        ) : (
          <div className={`relative overflow-auto`}>
            <div className={cn('relative flex-1 min-h-0', expandedEditor ? 'flex-1' : '')}>
              <CodeEditor
                className={cn('overflow-auto', expandedEditor ? 'h-full' : '')}
                value={requestBody}
                onChange={setRequestBody}
                language="xml"
                placeholder="Request body (XML)"
                minHeight={expandedEditor ? '100%' : '8rem'}
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
        )}
      </div>
    </div>
  )
}
