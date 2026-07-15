'use client'
import { useState, useMemo } from 'react'
import type { ParsedEndpoint } from '../lib/types'
import { supportedLanguages, generateCodeSnippet } from '../lib/code-generators'
import CopyButton from './CopyButton'
interface CodeExamplesProps {
  endpoint: ParsedEndpoint
  baseUrl: string
  params: Record<string, string>
  body: string | null
  apiKey: string
}
export default function CodeExamples({ endpoint, baseUrl, params, body, apiKey }: CodeExamplesProps) {
  const [activeLanguage, setActiveLanguage] = useState(supportedLanguages[0].id)
  // Code for display (with obscured API key)
  const displayCode = useMemo(() => {
    const obscuredKey = apiKey ? '••••••••••••••••' : '<your-api-key>'
    return generateCodeSnippet(activeLanguage, endpoint, baseUrl, params, body, obscuredKey)
  }, [activeLanguage, endpoint, baseUrl, params, body, apiKey])
  // Code for copying (with actual API key)
  const copyCode = useMemo(() => {
    const actualKey = apiKey || '<your-api-key>'
    return generateCodeSnippet(activeLanguage, endpoint, baseUrl, params, body, actualKey)
  }, [activeLanguage, endpoint, baseUrl, params, body, apiKey])
  return (
    <div className="rounded-lg overflow-hidden bg-primary-default">
      {/* Header with dropdown and copy button */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="relative">
          <select
            value={activeLanguage}
            onChange={(e) => setActiveLanguage(e.target.value)}
            className="appearance-none bg-white/10 text-white text-sm font-medium pl-3 pr-8 py-1.5 rounded-lg border border-white/10 focus:outline-none focus:border-white/30 cursor-pointer hover:bg-white/15 transition-colors"
          >
            {supportedLanguages.map((lang) => (
              <option key={lang.id} value={lang.id} className="bg-primary-default text-white">
                {lang.label}
              </option>
            ))}
          </select>
          <svg
            className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <CopyButton text={copyCode} />
      </div>
      {/* Code */}
      <div className="p-4 overflow-x-auto max-h-[400px] overflow-y-auto">
        <pre className="text-sm font-mono text-white/90 leading-relaxed whitespace-pre">
          <code>{displayCode}</code>
        </pre>
      </div>
    </div>
  )
}
