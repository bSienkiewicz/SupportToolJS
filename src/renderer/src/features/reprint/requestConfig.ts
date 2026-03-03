/**
 * Stack → host mapping and method → endpoint config for SOAP and REST.
 * Single place to configure endpoints per method and API type.
 * @see https://help.metapack.com/hc/en-gb/articles/6993838482577-SOAP-REST-API-migration
 * @see https://dev.metapack.com/shipping/guides/get-consignment-paperwork/
 */

import type { SendRequestResult } from '@/types/api'

export type ApiType = 'SOAP' | 'REST'

/** Map DM stack to API host for SOAP (dm services). */
export const STACK_HOST_MAP: Record<string, string> = {
  DM1: 'dm1.metapack.com',
  DM2: 'dm2.metapack.com',
  DM3: 'dm3.metapack.com',
  DM4: 'dm4.metapack.com',
  DM5: 'dm5.metapack.com',
  DM6: 'dm6.metapack.com',
  DM8: 'dm8.metapack.com',
  DMASOS: 'asos.dm',
  DELTA: 'dm-delta.metapack.com',
}

/** Map DM stack to API host for REST (shipping API). Can differ from SOAP. */
export const REST_STACK_HOST_MAP: Record<string, string> = {
  DM1: 'api.dm1.metapack.com',
  DM2: 'api.dm2.metapack.com',
  DM3: 'api.dm3.metapack.com',
  DM4: 'api.dm4.metapack.com',
  DM5: 'api.dm5.metapack.com',
  DM6: 'api.dm6.metapack.com',
  DM8: 'api.dm8.metapack.com',
  DMASOS: 'api.asos.dm',
  DELTA: 'api.sbx.metapack.com',
}

export type RequestMethod = 'REPRINT' | 'CREATE_CONSIGNMENT'

/** SOAP: urlTemplate uses {host}. REST: urlTemplate uses {host} and optional path params like {consignmentCode}. */
export const METHOD_ENDPOINTS: Record<
  RequestMethod,
  {
    soap: { urlTemplate: string }
    rest: {
      urlTemplate: string
      method: 'GET'
      /** Path params in template, e.g. ['consignmentCode']. */
      pathParams?: string[]
      /** Query param names for GET (e.g. dimension, format, type, resolution). */
      queryParams?: string[]
    }
  }
> = {
  REPRINT: {
    soap: { urlTemplate: 'https://{host}/dm/services/ConsignmentService' },
    rest: {
      urlTemplate: 'https://{host}/shipping/v1/consignments/{consignmentCode}/paperwork',
      method: 'GET',
      pathParams: ['consignmentCode'],
      queryParams: ['dimension', 'format', 'type', 'resolution'],
    },
  },
  CREATE_CONSIGNMENT: {
    soap: { urlTemplate: 'https://{host}/dm/services/ConsignmentService2' },
    rest: {
      urlTemplate: 'https://{host}/shipping/v1/consignments',
      method: 'GET',
    },
  },
}

const DEFAULT_HOST = 'dm-delta.metapack.com'
const DEFAULT_REST_HOST = 'api.sbx.metapack.com'

/**
 * Resolve SOAP URL for a method and stack.
 */
export function getSoapEndpointUrl(
  stack: string | null | undefined,
  method: RequestMethod
): string {
  const host = (stack && STACK_HOST_MAP[stack]) || DEFAULT_HOST
  const template = METHOD_ENDPOINTS[method]?.soap?.urlTemplate ?? METHOD_ENDPOINTS.REPRINT.soap.urlTemplate
  return template.replace('{host}', host)
}

/**
 * Build REST URL for a method and stack: path params + query string.
 * pathParams: e.g. { consignmentCode: 'DMC123' }
 * queryParams: e.g. { dimension: '6x4', format: 'png', type: 'label', resolution: '200' }
 */
export function getRestEndpointUrl(
  stack: string | null | undefined,
  method: RequestMethod,
  pathParams: Record<string, string> = {},
  queryParams: Record<string, string> = {}
): string {
  const host = (stack && REST_STACK_HOST_MAP[stack]) || DEFAULT_REST_HOST
  const config = METHOD_ENDPOINTS[method]?.rest ?? METHOD_ENDPOINTS.REPRINT.rest
  let url = config.urlTemplate.replace('{host}', host)
  for (const [key, value] of Object.entries(pathParams)) {
    url = url.replace(`{${key}}`, encodeURIComponent(value))
  }
  const names = config.queryParams ?? []
  const search = new URLSearchParams()
  for (const name of names) {
    const value = queryParams[name]
    if (value != null && String(value).trim() !== '') {
      search.set(name, String(value).trim())
    }
  }
  const qs = search.toString()
  return qs ? `${url}?${qs}` : url
}

/**
 * Resolve endpoint URL for the given API type. For REST REPRINT, pass restPathParams and restQueryParams.
 */
export function getEndpointUrl(
  stack: string | null | undefined,
  method: RequestMethod,
  apiType: ApiType = 'SOAP',
  restOptions?: { pathParams?: Record<string, string>; queryParams?: Record<string, string> }
): string {
  if (apiType === 'REST') {
    return getRestEndpointUrl(
      stack,
      method,
      restOptions?.pathParams ?? {},
      restOptions?.queryParams ?? {}
    )
  }
  return getSoapEndpointUrl(stack, method)
}

const SOAP_HEADERS = {
  'Content-Type': 'text/xml; charset=utf-8',
  SOAPAction: '',
} as const

export type RequestCredentials = { login: string; password: string }

function buildBasicAuth(login: string, password: string): string {
  return 'Basic ' + btoa(unescape(encodeURIComponent(login + ':' + password)))
}

export type SendRequestOptions = { method?: 'GET' | 'POST' }

/**
 * Send HTTP request. Optional Basic auth.
 * For SOAP: POST with XML body and SOAP headers.
 * For REST GET: pass options { method: 'GET' }, body is ignored.
 */
export async function sendRequest(
  url: string,
  body: string,
  credentials?: RequestCredentials | null,
  options?: SendRequestOptions
): Promise<SendRequestResult> {
  const method = options?.method ?? 'POST'
  const headers: Record<string, string> = {}
  if (method === 'POST') {
    Object.assign(headers, SOAP_HEADERS)
  }
  if (credentials?.login != null && credentials?.password != null) {
    headers['Authorization'] = buildBasicAuth(credentials.login, credentials.password)
  }
  return window.api.sendRequest({
    url: url.trim(),
    method,
    headers,
    body: method === 'GET' ? '' : body,
  })
}
