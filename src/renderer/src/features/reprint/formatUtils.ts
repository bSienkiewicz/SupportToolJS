import xmlFormat from 'xml-formatter'
/**
 * Parse an XML string into a DOM Document. Returns null if invalid.
 * Navigate with standard DOM: doc.getElementsByTagName('foo'), doc.querySelector('bar'), .textContent, .childNodes, etc.
 */
export function parseXml(xml: string): Document | null {
  const trimmed = xml.trim()
  if (!trimmed) return null
  try {
    const doc = new DOMParser().parseFromString(trimmed, 'text/xml')
    const parseError = doc.querySelector('parsererror')
    if (parseError) return null
    return doc
  } catch {
    return null
  }
}

/**
 * Reduce a SOAP/Java-style fault string to the basic error message.
 * Strips "nested exception is: ..." and normalizes whitespace.
 */
export function reduceFaultString(raw: string): string {
  const withoutNested = raw.split(/;\s*nested\s+exception\s+is\s*:/i)[0] ?? raw
  return withoutNested.replace(/\s+/g, ' ').trim()
}

export function getFaultString(xml: string): string | null {
  const doc = parseXml(xml)
  const raw = doc?.querySelector('faultstring')?.textContent?.trim() ?? null
  return raw ? reduceFaultString(raw) : null
}

export function getLabelsBase64(xml: string): string | null {
  const doc = parseXml(xml)
  const labelsB64 = doc?.querySelector('labels')?.textContent?.trim() ?? null
  return labelsB64 ? labelsB64 : null
}

/** Try parse string as JSON. Returns parsed value or null. */
export function tryParseJson(s: string): unknown | null {
  const trimmed = s?.trim()
  if (!trimmed || (trimmed[0] !== '{' && trimmed[0] !== '[')) return null
  try {
    return JSON.parse(trimmed) as unknown
  } catch {
    return null
  }
}

/** Metapack REST error shape: { errorCode, message, systemMessage }. Returns short message for display. */
export function getJsonErrorSummary(body: string): string | null {
  const obj = tryParseJson(body) as Record<string, unknown> | null
  if (!obj || typeof obj !== 'object') return null
  const msg = obj['message']
  const system = obj['systemMessage']
  if (typeof msg === 'string' && msg.trim()) return msg.trim()
  if (typeof system === 'string' && system.trim()) return system.trim()
  if (obj['errorCode']) return `${obj['errorCode']}: ${String(msg || system || 'Unknown error')}`
  return null
}

/** REST success shape: { paperwork: { labels: "base64..." } }. Returns first labels string. */
export function getLabelsBase64FromJson(body: string): string | null {
  const obj = tryParseJson(body) as Record<string, unknown> | null
  if (!obj || typeof obj !== 'object') return null
  const paperwork = obj['paperwork']
  if (paperwork && typeof paperwork === 'object' && paperwork !== null) {
    const labels = (paperwork as Record<string, unknown>)['labels']
    if (typeof labels === 'string' && labels.trim()) return labels.trim()
  }
  return null
}

/** Pretty-print JSON. Returns original string if parse fails. */
export function formatJson(s: string, indentSize = 2): string {
  const parsed = tryParseJson(s)
  if (parsed === null) return s
  try {
    return JSON.stringify(parsed, null, indentSize)
  } catch {
    return s
  }
}

export function getZplFromBase64(base64: string): string | null {
  const decoded = atob(base64)
  return decoded ? decoded : null
}

/**
 * Get text content of the first element matching tagName (optional namespace).
 * Example: getText(doc, 'consignmentId') or getText(doc, 'ns:status', 'ns')
 */
export function getText(
  doc: Document | Element | null,
  tagName: string,
  _ns?: string
): string | null {
  if (!doc) return null
  const el = doc.getElementsByTagName(tagName)[0]
  return el?.textContent?.trim() ?? null
}

/**
 * Get all elements by tag name. Returns array of Element for easy iteration.
 */
export function getElements(doc: Document | Element | null, tagName: string): Element[] {
  if (!doc) return []
  return Array.from(doc.getElementsByTagName(tagName))
}

/**
 * Pretty-print XML using xml-formatter. Returns original string if parse fails.
 */
export function formatXml(xml: string, indentSize = 2): string {
  const trimmed = xml.trim()
  if (!trimmed) return xml
  try {
    return xmlFormat(trimmed, {
      indentation: ' '.repeat(indentSize),
      lineSeparator: '\n',
      throwOnFailure: false,
    })
  } catch {
    return xml
  }
}
