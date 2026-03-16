/**
 * Render ZPL to PNG using Labelary's web API.
 * Matches the working curl: GET with ZPL in the URL (path segment).
 * @see https://labelary.com/service.html
 */

const LABELARY_BASE = 'https://api.labelary.com/v1/printers'

export interface LabelaryOptions {
  dpmm?: 6 | 8 | 12 | 24
  widthInches?: number
  heightInches?: number
  index?: number
}

const DEFAULT_OPTIONS: Required<LabelaryOptions> = {
  dpmm: 8,
  widthInches: 4,
  heightInches: 6,
  index: 0,
}

/**
 * Map DPI/resolution (e.g. from API request) to Labelary dpmm.
 * 152 → 6, 200/203 → 8, 300 → 12, 600 → 24.
 */
function dpiToDpmm(dpi: string | undefined): 6 | 8 | 12 | 24 {
  const n = dpi ? parseInt(dpi, 10) : NaN
  if (n <= 152) return 6
  if (n <= 203) return 8
  if (n <= 400) return 12
  return 24
}

/**
 * Parse dimension string "WxH" (e.g. "4x6", "6x4") to width and height in inches.
 */
function parseDimension(dimension: string | undefined): { heightInches: number; widthInches: number } {
  const def = { heightInches: 6, widthInches: 4 }
  if (!dimension?.trim()) return def
  const parts = dimension.trim().split(/x/i).map((s) => parseFloat(s.trim()))
  if (parts.length !== 2 || !Number.isFinite(parts[0]) || !Number.isFinite(parts[1])) return def
  const [h, w] = parts
  if (h <= 0 || w <= 0) return def
  return { heightInches: h, widthInches: w }
}

/**
 * Build Labelary options from API request params (dpi/resolution and dimension).
 * Used so the label preview matches the request that was sent.
 */
export function getLabelaryOptionsFromParams(params: {
  dpi?: string
  dimension?: string
}): LabelaryOptions {
  const { widthInches, heightInches } = parseDimension(params.dimension)
  return {
    dpmm: dpiToDpmm(params.dpi),
    widthInches,
    heightInches,
    index: 0,
  }
}

/**
 * Render ZPL to a PNG data URL via Labelary API.
 * Uses GET with ZPL as the last path segment (URL-encoded), same as:
 *   curl --get "http://api.labelary.com/v1/printers/8dpmm/labels/4x6/0/" --data-urlencode "<ZPL>"
 */
export async function renderZplToPngDataUrl(
  zpl: string,
  options: LabelaryOptions = {}
): Promise<string> {
  const trimmed = zpl?.trim() ?? ''
  console.log('[Labelary] 1. input', {
    zplLength: trimmed.length,
    zplStart: trimmed.slice(0, 80),
    zplEnd: trimmed.length > 80 ? trimmed.slice(-60) : null,
  })

  if (!trimmed) {
    console.warn('[Labelary] empty ZPL, skipping request')
    throw new Error('ZPL is empty')
  }

  const { dpmm, widthInches, heightInches, index } = { ...DEFAULT_OPTIONS, ...options }
  const encodedZpl = encodeURIComponent(trimmed)
  const url = `${LABELARY_BASE}/${dpmm}dpmm/labels/${widthInches}x${heightInches}/${index}/${encodedZpl}`

  console.log('[Labelary] 2. request', {
    urlLength: url.length,
    urlStart: url.slice(0, 100),
    encodedZplLength: encodedZpl.length,
  })

  const res = await fetch(url, { method: 'GET' })

  console.log('[Labelary] 3. response', {
    ok: res.ok,
    status: res.status,
    statusText: res.statusText,
    contentType: res.headers.get('Content-Type'),
    contentLength: res.headers.get('Content-Length'),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error('[Labelary] 4. error body', text.slice(0, 500))
    throw new Error(`Labelary error: ${res.status} ${res.statusText}${text ? ` — ${text.slice(0, 200)}` : ''}`)
  }

  const blob = await res.blob()
  console.log('[Labelary] 5. blob', { size: blob.size, type: blob.type })

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const dataUrl = reader.result as string
      console.log('[Labelary] 6. data URL', {
        length: dataUrl?.length,
        prefix: dataUrl?.slice(0, 60),
      })
      resolve(dataUrl)
    }
    reader.onerror = () => {
      console.error('[Labelary] FileReader error', reader.error)
      reject(new Error('Failed to read label image'))
    }
    reader.readAsDataURL(blob)
  })
}
