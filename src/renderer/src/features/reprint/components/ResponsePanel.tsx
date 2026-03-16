import { useCallback, useEffect, useState } from 'react'
import { CodeEditor } from '@/renderer/src/components/CodeEditor'
import { Button } from '@/renderer/src/components/ui/button'
import { useRequest } from '@/renderer/src/context/RequestContext'
import {
  formatXml,
  formatJson,
  getFaultString,
  getJsonErrorSummary,
  getLabelsBase64,
  getLabelsBase64FromJson,
  getZplFromBase64,
  tryParseJson,
} from '@/renderer/src/features/reprint/formatUtils'
import { getLabelaryOptionsFromParams, renderZplToPngDataUrl } from '@/renderer/src/features/reprint/labelary'
import { parseSoapXml } from '@/renderer/src/features/reprint/soapRequest'
import { LucideChevronDown, LucideCopy, LucideForm, LucideMaximize, LucideRotateCcw } from 'lucide-react'
import { ButtonGroup } from '@/renderer/src/components/ui/button-group'
import { toast } from 'sonner'
import { Badge } from '@/renderer/src/components/ui/badge'
import { Spinner } from '@/renderer/src/components/ui/spinner'
import { Input } from '@/renderer/src/components/ui/input'
import { Label } from '@/renderer/src/components/ui/label'
import { cn } from '@/renderer/lib/utils'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/renderer/src/components/ui/dialog'


/** Derive dpi and dimension from the request that was sent (SOAP body or REST URL). */
function getRequestLabelParams(requestBody: string, url: string): { dpi?: string; dimension?: string } {
  const soapParams = parseSoapXml(requestBody)
  if (soapParams) {
    return { dpi: soapParams.dpi, dimension: soapParams.dimension }
  }
  try {
    const u = new URL(url)
    return {
      dpi: u.searchParams.get('resolution') ?? undefined,
      dimension: u.searchParams.get('dimension') ?? undefined,
    }
  } catch {
    return {}
  }
}

export function ResponsePanel() {
  const { response, loading, updateResponseBody, requestBody, url } = useRequest()
  const [b64, setB64] = useState<string | null>(null)
  const [zpl, setZpl] = useState<string | null>(null)
  const [zplImageUrl, setZplImageUrl] = useState<string | null>(null)
  const [zplRenderError, setZplRenderError] = useState<string | null>(null)
  const [zplRendering, setZplRendering] = useState(false)
  const [zplRotation, setZplRotation] = useState(0)
  const [zplImageSize, setZplImageSize] = useState<{ width: number; height: number } | null>(null)
  const [expandedEditor, setExpandedEditor] = useState<boolean>(false)

  const labelOptions = getLabelaryOptionsFromParams(getRequestLabelParams(requestBody, url))

  function renderZplToDataUrl(zpl: string): Promise<string> {
    return renderZplToPngDataUrl(zpl, labelOptions)
  }

  useEffect(() => {
    if (!response?.body) return
    const isJson = tryParseJson(response.body) !== null
    const b64 = isJson
      ? getLabelsBase64FromJson(response.body)
      : getLabelsBase64(response.body)
    if (b64) setB64(b64)
    const decoded = b64 ? getZplFromBase64(b64) : null
    if (decoded) setZpl(decoded)
    else setZpl(null)
    setExpandedEditor(false)
    setZplImageUrl(null)
    setZplRenderError(null)
    setZplImageSize(null)
  }, [response?.body])

  useEffect(() => {
    if (!zpl?.trim()) {
      setZplImageUrl(null)
      setZplRenderError(null)
      setZplRendering(false)
      setZplImageSize(null)
      return
    }
    let cancelled = false
    setZplRendering(true)
    setZplRenderError(null)
    console.log('[ResponsePanel] calling Labelary with ZPL', { length: zpl.length, start: zpl.slice(0, 60) })
    renderZplToDataUrl(zpl)
      .then((dataUrl) => {
        console.log('[ResponsePanel] label preview result', { hasDataUrl: !!dataUrl, dataUrlLength: dataUrl?.length })
        if (!cancelled) {
          setZplImageUrl(dataUrl)
          setZplRenderError(null)
        }
      })
      .catch((err) => {
        console.error('[ResponsePanel] label preview error', err)
        if (!cancelled) {
          setZplImageUrl(null)
          setZplRenderError(err instanceof Error ? err.message : String(err))
        }
      })
      .finally(() => {
        if (!cancelled) setZplRendering(false)
      })
    return () => {
      cancelled = true
    }
  }, [zpl, requestBody, url])

  const isJsonBody = response?.body ? tryParseJson(response.body) !== null : false
  const handleFormat = useCallback(() => {
    if (!response?.body || response.error) return
    const formatted = isJsonBody ? formatJson(response.body) : formatXml(response.body)
    if (formatted !== response.body) updateResponseBody(formatted)
  }, [response?.body, response?.error, isJsonBody, updateResponseBody])

  const handleCopyToClipboard = useCallback((text: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }, [])

  const handleRotateZpl = useCallback(() => {
    if (!zpl) return
    setZplRotation((zplRotation - 90) % 360)
  }, [zplRotation])

  const faultSummary = response?.body
    ? (tryParseJson(response.body) !== null
      ? getJsonErrorSummary(response.body)
      : getFaultString(response.body))
    : null

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
  const editorLanguage = isJsonBody ? 'json' : 'xml'

  return (
    <div className="flex flex-col gap-2 h-full overflow-auto">
      <div className="flex items-center shrink-0 justify-end">
        <Badge variant="outline">
          {response.status} {response.statusText}
        </Badge>
      </div>
      <div className="relative">
        <CodeEditor
          value={body}
          onChange={() => { }}
          language={editorLanguage}
          readOnly
          minHeight={expandedEditor ? '20rem' : '6rem'}
        />
        {!expandedEditor && (
          <div className='absolute top-0 left-0 h-full w-full bg-linear-to-b from-transparent to-white/90 rounded-md z-10 cursor-pointer flex items-end justify-center gap-2' onClick={() => setExpandedEditor(!expandedEditor)}>
            <LucideChevronDown className='size-4' />
          </div>
        )}
        <ButtonGroup className='absolute top-2 right-2 z-20'>
          {canFormat && (
            <Button variant="outline" size="xs" onClick={handleFormat}>
              <LucideForm /> Format
            </Button>
          )}
          <Button variant="outline" size="xs" onClick={() => handleCopyToClipboard(body)}>
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
      {faultSummary && (
        <span className="text-xs bg-red-200/50 p-2 rounded-md border-red-300 text-red-800">
          {response.error && (<span className='font-bold'>{response.error}</span>)}
          {!response.error && (<span className='font-bold'>{faultSummary}</span>)}
        </span>
      )}
      {!response.error && !faultSummary && b64 && zpl && (
        <div className='flex flex-col gap-2 mt-2'>
          <Label htmlFor='b64-input'>Base64:</Label>
          <div className='relative'>
            <Input id='b64-input' value={b64} readOnly className='w-full' />
            <Button variant="default" className='absolute top-1.5 right-1.5' size="xs" onClick={() => handleCopyToClipboard(b64 ?? '')}>
              <LucideCopy /> Copy
            </Button>
          </div>

          <Label htmlFor='zpl-input'>Decoded:</Label>
          <div className='relative'>
            <Input id='zpl-input' value={zpl} readOnly className='w-full' />
            <Button variant="default" className='absolute top-1.5 right-1.5' size="xs" onClick={() => handleCopyToClipboard(zpl ?? '')}>
              <LucideCopy /> Copy
            </Button>
          </div>

          <Label>Label preview</Label>
          {zplRendering && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <Spinner className="size-4" /> Rendering ZPL…
            </div>
          )}
          {zplRenderError && (
            <p className="text-xs text-destructive bg-destructive/10 p-2 rounded-md">
              {zplRenderError}
            </p>
          )}
          {zplImageUrl && !zplRendering && (
            <div className="rounded border bg-muted/30 p-2 flex max-w-full w-full relative group">
              <div
                className={cn(
                  'min-w-0 flex items-center justify-center',
                  zplImageSize ? 'w-full' : 'max-w-full'
                )}
                style={
                  zplImageSize && (Math.abs(zplRotation) === 90 || Math.abs(zplRotation) === 270)
                    ? {
                        aspectRatio: `${zplImageSize.height} / ${zplImageSize.width}`,
                        containerType: 'size',
                      }
                    : zplImageSize
                      ? {
                          aspectRatio: `${zplImageSize.width} / ${zplImageSize.height}`,
                          containerType: 'size',
                        }
                      : undefined
                }
              >
                {(Math.abs(zplRotation) === 90 || Math.abs(zplRotation) === 270) && zplImageSize ? (
                  <div
                    className="flex items-center justify-center"
                    style={{ width: '100cqh', height: '100cqw' }}
                  >
                    <img
                      src={zplImageUrl}
                      alt="Rendered ZPL label"
                      className="w-full h-full object-contain"
                      style={{ transform: `rotate(${zplRotation}deg)` }}
                      onLoad={(e) => {
                        const img = e.currentTarget
                        setZplImageSize({ width: img.naturalWidth, height: img.naturalHeight })
                      }}
                    />
                  </div>
                ) : (
                  <img
                    src={zplImageUrl}
                    alt="Rendered ZPL label"
                    className={cn(
                      'object-contain',
                      zplImageSize ? 'w-full h-full' : 'w-full h-auto'
                    )}
                    style={zplRotation !== 0 ? { transform: `rotate(${zplRotation}deg)` } : undefined}
                    onLoad={(e) => {
                      const img = e.currentTarget
                      setZplImageSize({ width: img.naturalWidth, height: img.naturalHeight })
                    }}
                  />
                )}
              </div>
              <ButtonGroup className='absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200'>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="xs">
                      <LucideMaximize /> Fullscreen
                    </Button>
                  </DialogTrigger>
                  <DialogContent className='bg-accent' showCloseButton={false}>
                    <DialogTitle className='sr-only'>Label preview</DialogTitle>
                    <img src={zplImageUrl} alt="Rendered ZPL label" className="w-full h-full object-contain" />
                  </DialogContent>
                </Dialog>
                <Button variant="outline" size="xs" onClick={() => handleCopyToClipboard(zplImageUrl ?? '')}>
                  <LucideCopy /> Copy
                </Button>
                <Button variant="outline" size="xs" onClick={handleRotateZpl}>
                  <LucideRotateCcw /> Rotate
                </Button>
              </ButtonGroup>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
