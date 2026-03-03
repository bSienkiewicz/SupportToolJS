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
