/**
 * SOAP request: field config, build XML from form values, parse XML back to form.
 * Only non-empty values are included in the request.
 *
 * <soapenv:Header/> is the SOAP envelope header (inside the XML body). It is not
 * the same as HTTP headers. HTTP headers (Content-Type, SOAPAction) are sent
 * separately with the request; we set those in the send handler.
 */

const ENVELOPE_START = `<soapenv:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="urn:DeliveryManager/services" xmlns:soapenc="http://schemas.xmlsoap.org/soap/encoding/">
   <soapenv:Header/>
   <soapenv:Body>
      <ser:createPaperworkForConsignments soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
`

const ENVELOPE_END = `      </ser:createPaperworkForConsignments>
   </soapenv:Body>
</soapenv:Envelope>`

export type SoapFieldRole = 'consignmentCodes' | 'parameter'

export interface SoapFieldConfig {
  key: string
  label: string
  role: SoapFieldRole
  /** For role 'parameter', the propertyName in the XML. */
  propertyName?: string
}

/**
 * Fields for createPaperworkForConsignments (Reprint).
 * Default body and build/parse live here; add similar blocks for other methods (e.g. CREATE_CONSIGNMENT).
 */
export const CREATE_PAPERWORK_FIELDS: SoapFieldConfig[] = [
  { key: 'dmc', label: 'DMCs', role: 'consignmentCodes' },
  { key: 'format', label: 'Format', role: 'parameter', propertyName: 'format' },
  { key: 'dpi', label: 'DPI', role: 'parameter', propertyName: 'dpi' },
  { key: 'dimension', label: 'Dimension', role: 'parameter', propertyName: 'dimension' },
  { key: 'type', label: 'Type', role: 'parameter', propertyName: 'type' },
]

/** Build SOAP XML from form values. Omits empty values. */
export function buildSoapXml(values: Record<string, string>): string {
  const dmcRaw = (values['dmc'] ?? '').trim()
  const dmcCodes = dmcRaw ? dmcRaw.split(',').map((s) => s.trim()).filter(Boolean) : []

  const paramFields = CREATE_PAPERWORK_FIELDS.filter((f) => f.role === 'parameter')
  const paramItems: string[] = []
  for (const f of paramFields) {
    const v = (values[f.key] ?? '').trim()
    if (v && f.propertyName) {
      paramItems.push(
        `            <item>
               <propertyName>${escapeXml(f.propertyName)}</propertyName>
               <propertyValue>${escapeXml(v)}</propertyValue>
            </item>`
      )
    }
  }

  let body = ENVELOPE_START

  if (dmcCodes.length > 0) {
    body += `         <consignmentCodes xsi:type="ser:ArrayOf_soapenc_string" soapenc:arrayType="soapenc:string[]">
${dmcCodes.map((c) => `         <item>${escapeXml(c)}</item>`).join('\n')}
        </consignmentCodes>\n`
  }

  if (paramItems.length > 0) {
    body += `         <parameters xsi:type="ser:ArrayOf_tns1_Property" soapenc:arrayType="typ:Property[]" xmlns:typ="urn:DeliveryManager/types">
${paramItems.join('\n')}
         </parameters>\n`
  }

  body += ENVELOPE_END
  return body
}

/** Parse SOAP XML into form values. Returns null if XML is invalid or structure unrecognized. */
export function parseSoapXml(xml: string): Record<string, string> | null {
  const trimmed = xml.trim()
  if (!trimmed) return null
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(trimmed, 'text/xml')
    const parseError = doc.querySelector('parsererror')
    if (parseError) return null

    const out: Record<string, string> = {}

    const itemNodes = doc.getElementsByTagName('consignmentCodes')[0]?.getElementsByTagName('item')
    if (itemNodes?.length) {
      const codes = Array.from(itemNodes).map((el) => el.textContent?.trim() ?? '').filter(Boolean)
      out['dmc'] = codes.join(', ')
    }

    const paramItems = doc.getElementsByTagName('parameters')[0]?.getElementsByTagName('item')
    if (paramItems?.length) {
      for (const item of Array.from(paramItems)) {
        const name = item.getElementsByTagName('propertyName')[0]?.textContent?.trim()
        const value = item.getElementsByTagName('propertyValue')[0]?.textContent?.trim() ?? ''
        if (name) {
          const field = CREATE_PAPERWORK_FIELDS.find((f) => f.propertyName === name && f.role === 'parameter')
          if (field) out[field.key] = value
        }
      }
    }

    return out
  } catch {
    return null
  }
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** Default XML when form has no values (minimal envelope). */
export const DEFAULT_SOAP_XML = ENVELOPE_START + ENVELOPE_END

/** Example default for Reprint (createPaperwork) with sample consignment + params. */
const DEFAULT_REPRINT_BODY = buildSoapXml({
  dmc: '',
  type: 'all',
  format: 'zpl',
  dpi: '300',
  dimension: '6x4',
})

/** Default request body per method. Add entries when adding new request types. */
export function getDefaultBody(method: string): string {
  switch (method) {
    case 'REPRINT':
      return DEFAULT_REPRINT_BODY
    case 'CREATE_CONSIGNMENT':
      return DEFAULT_SOAP_XML
    default:
      return DEFAULT_SOAP_XML
  }
}
