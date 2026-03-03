import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { SendRequestResult } from '@/types/api'
import {
  sendRequest as sendRequestApi,
  type RequestCredentials,
  type SendRequestOptions,
} from '@/renderer/src/features/reprint/requestConfig'
import { formatXml, formatJson, tryParseJson } from '@/renderer/src/features/reprint/xmlUtils'

type RequestContextValue = {
  url: string
  setUrl: (url: string) => void
  requestBody: string
  setRequestBody: (body: string) => void
  response: SendRequestResult | null
  updateResponseBody: (body: string) => void
  loading: boolean
  sendRequest: (credentials?: RequestCredentials | null, options?: SendRequestOptions) => Promise<void>
}

const RequestContext = createContext<RequestContextValue | null>(null)

export function RequestProvider({ children }: { children: ReactNode }) {
  const [url, setUrl] = useState('')
  const [requestBody, setRequestBody] = useState('')
  const [response, setResponse] = useState<SendRequestResult | null>(null)
  const [loading, setLoading] = useState(false)

  const sendRequest = useCallback(
    async (credentials?: RequestCredentials | null, options?: SendRequestOptions) => {
      const isGet = options?.method === 'GET'
      if (!url.trim()) return
      if (!isGet && !requestBody.trim()) return
      setLoading(true)
      setResponse(null)
      try {
        const result = await sendRequestApi(
          url,
          isGet ? '' : requestBody,
          credentials,
          options
        )
        const raw = result.body?.trim() ?? ''
        const body =
          raw && !result.error
            ? tryParseJson(raw) !== null
              ? formatJson(raw)
              : formatXml(raw)
            : result.body
        setResponse({ ...result, body })
      } finally {
        setLoading(false)
      }
    },
    [url, requestBody]
  )

  const updateResponseBody = useCallback((body: string) => {
    setResponse((prev) => (prev ? { ...prev, body } : null))
  }, [])

  return (
    <RequestContext.Provider
      value={{
        url,
        setUrl,
        requestBody,
        setRequestBody,
        response,
        updateResponseBody,
        loading,
        sendRequest,
      }}
    >
      {children}
    </RequestContext.Provider>
  )
}

export function useRequest() {
  const ctx = useContext(RequestContext)
  if (!ctx) throw new Error('useRequest must be used within RequestProvider')
  return ctx
}
