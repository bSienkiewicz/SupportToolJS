import React, { useMemo } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { EditorView } from '@codemirror/view'
import { langs } from '@uiw/codemirror-extensions-langs'
import { cn } from '@/renderer/lib/utils'

export type CodeEditorLanguage = 'json' | 'xml'

type CodeEditorProps = {
  value: string
  onChange: (value: string) => void
  language: CodeEditorLanguage
  placeholder?: string
  className?: string
  minHeight?: string
  readOnly?: boolean
}

const languageExtensions = {
  json: () => langs.json(),
  xml: () => langs.xml(),
} as const

export function CodeEditor({
  value,
  onChange,
  language,
  placeholder,
  className,
  minHeight = '12rem',
  readOnly = false,
}: CodeEditorProps) {
  const extensions = useMemo(
    () => [EditorView.lineWrapping, languageExtensions[language]()],
    [language]
  )

  return (
    <div className={cn('min-h-48 overflow-hidden rounded-md border border-input wrap-break-word', className)} style={{ minHeight }}>
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={extensions}
        placeholder={placeholder}
        readOnly={readOnly}
        height={minHeight}
        data-slot="code-editor"
      />
    </div>
  )
}
