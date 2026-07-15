'use client'

import { useState, useEffect } from 'react'
import type { ApiResponse } from '../lib/types'
import CopyButton from './CopyButton'

function extractFilename(headers: Record<string, string>): string {
  const contentDisposition = headers['content-disposition'] || ''
  const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
  if (filenameMatch && filenameMatch[1]) {
    return filenameMatch[1].replace(/['"]/g, '')
  }
  return 'downloaded-file'
}

interface ResponseDisplayProps {
  response: ApiResponse | null
  error: string | null
  isLoading: boolean
}
function getStatusBadge(status: number) {
  if (status >= 200 && status < 300) {
    return {
      bg: 'bg-emerald-500',
      text: 'text-white',
    }
  }
  if (status >= 400 && status < 500) {
    return {
      bg: 'bg-amber-500',
      text: 'text-white',
    }
  }
  if (status >= 500) {
    return {
      bg: 'bg-red-500',
      text: 'text-white',
    }
  }
  return {
    bg: 'bg-gray-500',
    text: 'text-white',
  }
}
export default function ResponseDisplay({ response, error, isLoading }: ResponseDisplayProps) {
  const [showHeaders, setShowHeaders] = useState(false)

  // Automatically download file when blob response is received
  useEffect(() => {
    if (!response?.blob) return
    const filename = extractFilename(response.headers)
    const url = URL.createObjectURL(response.blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [response])

  if (isLoading) {
    return (
      <div className="p-6 bg-white/50 border-t border-primary-default/10">
        <div className="flex items-center gap-3 text-primary-default/70">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-sm font-medium">Sending request...</span>
        </div>
      </div>
    )
  }
  if (error) {
    return (
      <div className="p-6 bg-red-50 border-t border-red-200">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-red-500 mt-0.5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-red-800">Request Failed</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }
  if (!response) {
    return null
  }
  const bodyString =
    typeof response.body === 'string' ? response.body : JSON.stringify(response.body, null, 2)
  const statusBadge = getStatusBadge(response.status)
  return (
    <div className="border-t border-primary-default/10">
      {/* Response Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white/50">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-primary-default/60 uppercase tracking-wide">
            Response
          </span>
          <span
            className={`px-2.5 py-1 text-xs font-bold rounded-full ${statusBadge.bg} ${statusBadge.text}`}
          >
            {response.status} {response.statusText}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-primary-default/50 font-mono">{response.responseTime}ms</span>
        </div>
      </div>
      {/* Headers Toggle */}
      {Object.keys(response.headers).length > 0 && (
        <div className="px-6 py-3 border-b border-primary-default/5 bg-white/30">
          <button
            onClick={() => setShowHeaders(!showHeaders)}
            className="flex items-center gap-2 text-xs text-primary-default/60 hover:text-primary-default transition-colors"
          >
            <svg
              className={`w-3 h-3 transition-transform duration-200 ${showHeaders ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="font-medium">Headers</span>
            <span className="text-primary-default/40">({Object.keys(response.headers).length})</span>
          </button>
          {showHeaders && (
            <div className="mt-3 p-4 bg-primary-default rounded-xl text-xs font-mono space-y-1">
              {Object.entries(response.headers).map(([key, value]) => (
                <div key={key} className="flex">
                  <span className="text-secondary-default min-w-[180px]">{key}:</span>
                  <span className="text-white/80">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Response Body */}
      <div className="relative">
        <div className="flex items-center justify-between px-5 py-3 bg-primary-default border-b border-white/10">
          <span className="text-xs font-medium text-white/50">Body</span>
          {!response.blob && <CopyButton text={bodyString} />}
        </div>
        <div className="bg-primary-default p-5 overflow-x-auto max-h-96">
          <pre className="text-sm text-white/90 font-mono leading-relaxed whitespace-pre-wrap">
            <code>{bodyString}</code>
          </pre>
        </div>
      </div>
    </div>
  )
}
