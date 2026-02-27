import React, { useState, useEffect } from 'react'
import { CodeEditor, type CodeEditorLanguage } from '@/renderer/src/components/CodeEditor'
import { Input } from '@/renderer/src/components/ui/input'
import { Button } from '@/renderer/src/components/ui/button'
import { DEFAULT_REST_JSON, DEFAULT_SOAP_XML } from '../defaultBodies'

const DEFAULT_API_URL = 'https://dm2.metapack.com/dm/services/ConsignmentService'

type FormReprintProps = {
  requestType: 'rest' | 'soap'
}

const FormReprint = ({ requestType }: FormReprintProps) => {
  const [value, setValue] = useState<string>('')
  const [url, setUrl] = useState<string>(DEFAULT_API_URL)

  const language: CodeEditorLanguage = requestType === 'soap' ? 'xml' : 'json'
  const placeholder =
    requestType === 'soap'
      ? 'Paste or type SOAP/XML request body…'
      : 'Paste or type REST/JSON request body…'

  useEffect(() => {
    setValue(requestType === 'soap' ? DEFAULT_SOAP_XML : DEFAULT_REST_JSON)
  }, [requestType])

  const handleSend = async () => {
    if (!url.trim()) return
    const isSoap = requestType === 'soap'
    const headers: Record<string, string> = isSoap
      ? {
          'Content-Type': 'text/xml; charset=utf-8',
          SOAPAction: '',
        }
      : {
          'Content-Type': 'application/json',
        }
    const result = await window.api.sendRequest({
      url: url.trim(),
      method: 'POST',
      headers,
      body: value,
    })
    if (result.error) {
      console.error('Request failed:', result.error)
      return
    }
    console.log('Response:', result.status, result.statusText, result.headers, result.body)
    const contentType = result.headers['content-type'] ?? ''
    if (contentType.includes('application/json') && result.body) {
      try {
        const data = JSON.parse(result.body)
        console.log('Parsed JSON:', data)
      } catch {
        console.log('Body:', result.body)
      }
    } else {
      console.log('Body:', result.body)
    }
  }

  return (
    <div className="relative">
      <CodeEditor
        value={value}
        onChange={setValue}
        language={language}
        placeholder={placeholder}
        minHeight="24rem"
      />
      <Input placeholder="https://..." type='url' className='mt-2' value={url} onChange={(e) => setUrl(e.target.value)} />
      <Button type='submit' className='mt-2' onClick={handleSend}>Send</Button>
    </div>
  )
}

export default FormReprint