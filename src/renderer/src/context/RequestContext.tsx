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
} from '@/renderer/src/features/reprint/requestConfig'

type RequestContextValue = {
  url: string
  setUrl: (url: string) => void
  requestBody: string
  setRequestBody: (body: string) => void
  response: SendRequestResult | null
  loading: boolean
  sendRequest: (credentials?: RequestCredentials | null) => Promise<void>
}

const RequestContext = createContext<RequestContextValue | null>(null)

export function RequestProvider({ children }: { children: ReactNode }) {
  const [url, setUrl] = useState('')
  const [requestBody, setRequestBody] = useState('')
  const [response, setResponse] = useState<SendRequestResult | null>(null)
  const [loading, setLoading] = useState(false)

  const sendRequest = useCallback(
    async (credentials?: RequestCredentials | null) => {
      if (!url.trim() || !requestBody.trim()) return
      setLoading(true)
      setResponse(null)
      try {
        const result = await sendRequestApi(url, requestBody, credentials)
        setResponse(result)
      } finally {
        setLoading(false)
      }
    },
    [url, requestBody]
  )

  return (
    <RequestContext.Provider
      value={{
        url,
        setUrl,
        requestBody,
        setRequestBody,
        response,
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
