/* eslint-disable jsx-a11y/label-has-associated-control */

'use client'
import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import type { ParsedEndpoint } from '../lib/types'
import { useApiRequest } from '../hooks/useApiRequest'
import { PROPERTY_PLACEHOLDER_OVERRIDES } from '../lib/content-overrides'
import ResponseDisplay from './ResponseDisplay'
interface RequestBuilderProps {
  endpoint: ParsedEndpoint
  baseUrl: string
  apiKey: string
  onParamsChange: (params: Record<string, string>) => void
  onBodyChange: (body: string | null) => void
  incursCost: boolean
}
export default function RequestBuilder({
  endpoint,
  baseUrl,
  apiKey,
  onParamsChange,
  onBodyChange,
  incursCost,
}: RequestBuilderProps) {
  const [params, setParams] = useState<Record<string, string>>({})
  const [body, setBody] = useState<string>('')
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { isLoading, response, error, execute, reset } = useApiRequest()
  const examples = endpoint.requestBody?.examples
  const exampleKeys = useMemo(() => (examples ? Object.keys(examples) : []), [examples])
  const [selectedExampleKey, setSelectedExampleKey] = useState<string | null>(exampleKeys[0] ?? null)
  // Reset example selection when the endpoint changes
  useEffect(() => {
    setSelectedExampleKey(exampleKeys[0] ?? null)
  }, [exampleKeys])
  // Sync body with the selected example (or fall back to schema.example)
  useEffect(() => {
    if (selectedExampleKey && examples?.[selectedExampleKey]?.value !== undefined) {
      const bodyStr = JSON.stringify(examples[selectedExampleKey].value, null, 2)
      setBody(bodyStr)
      onBodyChange(bodyStr)
    } else if (!examples && endpoint.requestBody?.schema?.example !== undefined) {
      const bodyStr = JSON.stringify(endpoint.requestBody.schema.example, null, 2)
      setBody(bodyStr)
      onBodyChange(bodyStr)
    }
  }, [selectedExampleKey, examples, endpoint.requestBody?.schema?.example, onBodyChange])
  const handleParamChange = useCallback(
    (name: string, value: string) => {
      setParams((prev) => {
        const updated = { ...prev, [name]: value }
        onParamsChange(updated)
        return updated
      })
    },
    [onParamsChange]
  )
  const handleBodyChange = useCallback(
    (value: string) => {
      setBody(value)
      onBodyChange(value || null)
    },
    [onBodyChange]
  )
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
  }, [])
  const clearFile = useCallback(() => {
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])
  const handleSubmit = useCallback(() => {
    reset()
    execute(endpoint, baseUrl, params, body || null, apiKey, file || undefined)
  }, [endpoint, baseUrl, params, body, apiKey, file, execute, reset])
  const isMultipart = endpoint.requestBody?.contentType === 'multipart/form-data'
  const pathParams = endpoint.parameters.filter((p) => p.in === 'path')
  const queryParams = endpoint.parameters.filter((p) => p.in === 'query')
  return (
    <div>
      <div className="p-5">
        {/* API Key Notice */}
        {!apiKey && (
          <div className="mb-6 p-4 bg-primary-default/5 border border-primary-default/10 rounded-xl">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <svg
                  className="w-4 h-4 text-primary-default/50 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
                <span className="text-sm text-primary-default/70">Add your API key to send requests</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  document.getElementById('api-key')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }
                className="px-4 py-1.5 text-sm font-medium bg-primary-default text-white rounded-full hover:bg-primary-default/90 transition-colors whitespace-nowrap"
              >
                Add key
              </button>
            </div>
          </div>
        )}
        {/* Path Parameters */}
        {pathParams.length > 0 && (
          <div className="mb-6">
            <label className="block text-xs font-semibold text-primary-default/60 uppercase tracking-wide mb-3">
              Path Parameters
            </label>
            <div className="space-y-3">
              {pathParams.map((param) => (
                <div key={param.name}>
                  <label className="block text-sm text-primary-default/80 mb-2">
                    {param.name}
                    {param.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type="text"
                    value={params[param.name] || ''}
                    onChange={(e) => handleParamChange(param.name, e.target.value)}
                    placeholder={param.description || param.name}
                    className="w-full px-4 py-3 text-sm bg-white border border-primary-default/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-default/40 focus:border-secondary-default transition-all"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Query Parameters */}
        {queryParams.length > 0 && (
          <div className="mb-6">
            <label className="block text-xs font-semibold text-primary-default/60 uppercase tracking-wide mb-3">
              Query Parameters
            </label>
            <div className="space-y-3">
              {queryParams.map((param) => (
                <div key={param.name}>
                  <label className="block text-sm text-primary-default/80 mb-2">
                    {param.name}
                    {param.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {param.enum ? (
                    <select
                      value={params[param.name] || ''}
                      onChange={(e) => handleParamChange(param.name, e.target.value)}
                      className="w-full px-4 py-3 text-sm bg-white border border-primary-default/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-default/40"
                    >
                      <option value="">Select {param.name}</option>
                      {param.enum.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={params[param.name] || ''}
                      onChange={(e) => handleParamChange(param.name, e.target.value)}
                      placeholder={param.description || param.name}
                      className="w-full px-4 py-3 text-sm bg-white border border-primary-default/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-default/40 transition-all"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {/* File Upload */}
        {isMultipart && (
          <div className="mb-6">
            <label className="block text-xs font-semibold text-primary-default/60 uppercase tracking-wide mb-3">
              File Upload
              <span className="text-red-500 ml-1">*</span>
            </label>
            {file ? (
              <div className="flex items-center gap-3 p-3 bg-primary-default/5 border border-primary-default/10 rounded-xl">
                <svg
                  className="w-5 h-5 text-primary-default/50 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-primary-default truncate">{file.name}</p>
                  <p className="text-xs text-primary-default/50">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  type="button"
                  onClick={clearFile}
                  className="p-1.5 text-primary-default/40 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove file"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ) : (
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                accept=".docx,.pptx,.xlsx,.pdf,.html,.txt,.srt"
                className="w-full text-sm file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-secondary-default file:text-primary-default hover:file:bg-secondary-lighten file:cursor-pointer cursor-pointer"
              />
            )}
            <p className="text-xs text-primary-default/50 mt-2">
              Supported: DOCX, PPTX, XLSX, PDF, HTML, TXT, SRT
            </p>
          </div>
        )}
        {/* Example Picker */}
        {!isMultipart && exampleKeys.length >= 2 && examples && (
          <div className="mb-6">
            <label className="block text-xs font-semibold text-primary-default/60 uppercase tracking-wide mb-3">
              Examples
            </label>
            <div className="flex flex-wrap gap-2">
              {exampleKeys.map((key) => {
                const isActive = key === selectedExampleKey
                const label = examples[key]?.summary || key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedExampleKey(key)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                      isActive
                        ? 'bg-primary-default text-white'
                        : 'bg-primary-default/5 text-primary-default/70 hover:bg-primary-default/10'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            {selectedExampleKey && examples[selectedExampleKey]?.description && (
              <p className="mt-2 text-xs text-primary-default/50">
                {examples[selectedExampleKey].description}
              </p>
            )}
          </div>
        )}
        {/* Request Body */}
        {endpoint.requestBody && !isMultipart && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs font-semibold text-primary-default/60 uppercase tracking-wide">
                Request Body
                <span className="text-primary-default/40 font-normal lowercase tracking-normal ml-2">
                  JSON
                </span>
              </label>
              <span className="flex items-center gap-1 text-xs text-primary-default/40">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
                Editable
              </span>
            </div>
            <div className="relative">
              <textarea
                value={body}
                onChange={(e) => handleBodyChange(e.target.value)}
                rows={10}
                spellCheck={false}
                className="w-full px-4 py-4 text-sm bg-primary-default text-white/90 font-mono rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-default/40 resize-y cursor-text"
                placeholder='{"key": "value"}'
              />
            </div>
          </div>
        )}
        {/* Multipart Additional Params */}
        {isMultipart && endpoint.requestBody?.schema?.properties && (
          <div className="mb-6">
            <label className="block text-xs font-semibold text-primary-default/60 uppercase tracking-wide mb-3">
              Additional Parameters
            </label>
            <div className="space-y-3">
              {Object.entries(endpoint.requestBody.schema.properties)
                .filter(([key]) => key !== 'file')
                .map(([key, prop]) => (
                  <div key={key}>
                    <label className="block text-sm text-primary-default/80 mb-2">
                      {key}
                      {prop.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {prop.type === 'boolean' ? (
                      <select
                        value={params[key] || prop.default?.toString() || 'false'}
                        onChange={(e) => handleParamChange(key, e.target.value)}
                        className="w-full px-4 py-3 text-sm bg-white border border-primary-default/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-default/40"
                      >
                        <option value="">Select {key}</option>
                        <option value="true">true</option>
                        <option value="false">false</option>
                      </select>
                    ) : prop.enum ? (
                      <select
                        value={params[key] || prop.default?.toString() || ''}
                        onChange={(e) => handleParamChange(key, e.target.value)}
                        className="w-full px-4 py-3 text-sm bg-white border border-primary-default/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-default/40"
                      >
                        <option value="">Select {key}</option>
                        {prop.enum.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={params[key] || ''}
                        onChange={(e) => handleParamChange(key, e.target.value)}
                        placeholder={PROPERTY_PLACEHOLDER_OVERRIDES[key] || prop.description || key}
                        className="w-full px-4 py-3 text-sm bg-white border border-primary-default/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-default/40 transition-all"
                      />
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
        {/* Submit Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSubmit}
            disabled={isLoading || !apiKey}
            className="py-3 px-8 font-medium rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-secondary-default hover:bg-secondary-lighten text-primary-default"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Sending...
              </span>
            ) : (
              'Try it!'
            )}
          </button>
          {incursCost && <p className="text-xs text-red-500">This request will incur usage costs</p>}
        </div>
      </div>
      {/* Response */}
      <ResponseDisplay response={response} error={error} isLoading={isLoading} />
    </div>
  )
}
