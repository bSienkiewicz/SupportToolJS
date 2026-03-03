import React from 'react'
import { CodeEditor } from '@/renderer/src/components/CodeEditor'
import { useRequest } from '@/renderer/src/context/RequestContext'

export function ResponsePanel() {
  const { response, loading } = useRequest()

  if (loading) {
    return (
      <div className="text-muted-foreground text-sm py-4">Sending request…</div>
    )
  }

  if (!response) {
    return (
      <div className="text-muted-foreground text-sm py-4">
        No response yet. Use Send to run the request.
      </div>
    )
  }

  const body = response.error ? `Error: ${response.error}` : (response.body || '(empty)')

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="text-xs text-muted-foreground shrink-0">
        {response.status} {response.statusText}
        {response.error && ` — ${response.error}`}
      </div>
      <div className="flex-1 min-h-0">
        <CodeEditor
          value={body}
          onChange={() => {}}
          language="xml"
          readOnly
          minHeight="20rem"
        />
      </div>
    </div>
  )
}
