/**
 * Stack → host mapping and method → endpoint config.
 * Single place to configure endpoints per method and host per stack.
 */

import type { SendRequestResult } from '@/types/api'

/** Map DM stack (user selection) to API host. Extend as needed. */
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

export type RequestMethod = 'REPRINT' | 'CREATE_CONSIGNMENT'

/** Endpoint config per method. urlTemplate uses {host} placeholder. */
export const METHOD_ENDPOINTS: Record<RequestMethod, { urlTemplate: string }> = {
  REPRINT: {
    urlTemplate: 'https://{host}/dm/services/ConsignmentService',
  },
  CREATE_CONSIGNMENT: {
    urlTemplate: 'https://{host}/dm/services/ConsignmentService',
  },
}

const DEFAULT_HOST = 'dm2.metapack.com'

/**
 * Resolve full URL for a method and stack. Uses STACK_HOST_MAP and METHOD_ENDPOINTS.
 */
export function getEndpointUrl(stack: string | null | undefined, method: RequestMethod): string {
  const host = (stack && STACK_HOST_MAP[stack]) || DEFAULT_HOST
  const template = METHOD_ENDPOINTS[method]?.urlTemplate ?? METHOD_ENDPOINTS.REPRINT.urlTemplate
  return template.replace('{host}', host)
}

const SOAP_HEADERS = {
  'Content-Type': 'text/xml; charset=utf-8',
  SOAPAction: '',
} as const

export type RequestCredentials = { login: string; password: string }

function buildBasicAuth(login: string, password: string): string {
  return 'Basic ' + btoa(unescape(encodeURIComponent(login + ':' + password)))
}

/**
 * Send POST with body. Optional Basic auth from selected user (login/password).
 */
export async function sendRequest(
  url: string,
  body: string,
  credentials?: RequestCredentials | null
): Promise<SendRequestResult> {
  const headers: Record<string, string> = { ...SOAP_HEADERS }
  if (credentials?.login != null && credentials?.password != null) {
    headers['Authorization'] = buildBasicAuth(credentials.login, credentials.password)
  }
  return window.api.sendRequest({
    url: url.trim(),
    method: 'POST',
    headers,
    body,
  })
}
