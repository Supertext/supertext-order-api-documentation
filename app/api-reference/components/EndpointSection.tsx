'use client'
import { useState, useCallback } from 'react'
import type { ParsedEndpoint, HttpMethod, ParsedResponse } from '../lib/types'
import SchemaDisplay from './SchemaDisplay'
import CodeExamples from './CodeExamples'
import RequestBuilder from './RequestBuilder'
interface EndpointSectionProps {
  endpoint: ParsedEndpoint
  baseUrl: string
  apiKey: string
  incursCost: boolean
}
const methodStyles: Record<HttpMethod, string> = {
  GET: 'text-emerald-600',
  POST: 'text-blue-600',
  PUT: 'text-amber-600',
  DELETE: 'text-red-600',
  PATCH: 'text-purple-600',
}
function ModelLink({ name, onClick }: { name: string; onClick: () => void }) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick()
  }
  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
      title={`View ${name} model`}
    >
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
        />
      </svg>
      {name}
    </button>
  )
}
function AccordionSection({
  title,
  badge,
  defaultOpen = false,
  children,
}: {
  title: string
  badge?: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  return (
    <div className="border border-primary-default/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 bg-backgrounds-backgroundDark hover:bg-primary-default/[0.04] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-primary-default">{title}</span>
          {badge}
        </div>
        <svg
          className={`w-4 h-4 text-primary-default/40 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && <div className="p-5 border-t border-primary-default/10">{children}</div>}
    </div>
  )
}
type PanelTab = 'try-it-out' | 'code-examples' | 'error-responses' | 'models'
function ModelsPanel({ endpoint }: { endpoint: ParsedEndpoint }) {
  const items: { name: string; schema: NonNullable<ParsedResponse['schema']>; role: string }[] = []
  if (endpoint.requestBody?.schemaName && endpoint.requestBody.schema) {
    items.push({
      name: endpoint.requestBody.schemaName,
      schema: endpoint.requestBody.schema,
      role: 'Request Body',
    })
  }
  const seen = new Set<string>()
  for (const response of endpoint.responses) {
    if (response.schemaName && response.schema && !seen.has(response.schemaName)) {
      seen.add(response.schemaName)
      items.push({
        name: response.schemaName,
        schema: response.schema,
        role: `Response ${response.statusCode}`,
      })
    }
  }
  if (items.length === 0) {
    return (
      <p className="text-sm text-primary-default/50 text-center py-8">No models defined for this endpoint</p>
    )
  }
  return (
    <div className="p-5 space-y-6">
      {items.map((item) => (
        <div
          key={`${item.role}-${item.name}`}
          className="bg-white rounded-xl overflow-hidden border border-primary-default/10"
        >
          <div className="px-4 py-3 border-b border-primary-default/10">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-semibold text-primary-default/50 uppercase tracking-wide">
                {item.role}
              </span>
              <span className="text-sm font-mono text-primary-default">{item.name}</span>
            </div>
            {item.schema.description && (
              <p className="text-xs text-primary-default/60 mt-1">{item.schema.description}</p>
            )}
          </div>
          <div className="p-4">
            <SchemaDisplay schema={item.schema} />
          </div>
        </div>
      ))}
    </div>
  )
}
function TryItOutPanel({
  endpoint,
  baseUrl,
  apiKey,
  params,
  body,
  onParamsChange,
  onBodyChange,
  incursCost,
  errorResponses,
  activeTab,
  onTabChange,
}: {
  endpoint: ParsedEndpoint
  baseUrl: string
  apiKey: string
  params: Record<string, string>
  body: string | null
  onParamsChange: (params: Record<string, string>) => void
  onBodyChange: (body: string | null) => void
  incursCost: boolean
  errorResponses: ParsedResponse[]
  activeTab: PanelTab
  onTabChange: (tab: PanelTab) => void
}) {
  const hasModels =
    !!endpoint.requestBody?.schemaName || endpoint.responses.some((r) => r.schemaName && r.schema)
  return (
    <div className="border border-primary-default/10 rounded-xl overflow-hidden bg-backgrounds-backgroundDark">
      {/* Tab Header */}
      <div className="flex items-center border-b border-primary-default/10">
        <button
          onClick={() => onTabChange('try-it-out')}
          className={`flex-1 px-3 py-3 text-sm font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'try-it-out'
              ? 'text-primary-default bg-white'
              : 'text-primary-default/60 hover:text-primary-default hover:bg-white/50'
          }`}
        >
          Try It Out
          {incursCost && activeTab === 'try-it-out' && (
            <span
              className="ml-2 inline-flex items-center gap-1 text-[10px] font-normal text-red-500"
              title="Incurs usage costs"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L14.71 3.86a2 2 0 00-3.42 0z"
                />
              </svg>
              Costs
            </span>
          )}
        </button>
        <button
          onClick={() => onTabChange('code-examples')}
          className={`flex-1 px-3 py-3 text-sm font-semibold transition-colors ${
            activeTab === 'code-examples'
              ? 'text-primary-default bg-white'
              : 'text-primary-default/60 hover:text-primary-default hover:bg-white/50'
          }`}
        >
          Code Examples
        </button>
        {hasModels && (
          <button
            onClick={() => onTabChange('models')}
            className={`flex-1 px-3 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'models'
                ? 'text-primary-default bg-white'
                : 'text-primary-default/60 hover:text-primary-default hover:bg-white/50'
            }`}
          >
            Models
          </button>
        )}
        {errorResponses.length > 0 && (
          <button
            onClick={() => onTabChange('error-responses')}
            className={`flex-1 px-3 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'error-responses'
                ? 'text-primary-default bg-white'
                : 'text-primary-default/60 hover:text-primary-default hover:bg-white/50'
            }`}
          >
            Errors
            <span
              className={`ml-1.5 text-[10px] font-medium ${activeTab === 'error-responses' ? 'text-primary-default/50' : 'text-primary-default/40'}`}
            >
              ({errorResponses.length})
            </span>
          </button>
        )}
      </div>
      {/* Tab Content */}
      <div className="max-h-[70vh] overflow-auto">
        {activeTab === 'try-it-out' && (
          <RequestBuilder
            endpoint={endpoint}
            baseUrl={baseUrl}
            apiKey={apiKey}
            onParamsChange={onParamsChange}
            onBodyChange={onBodyChange}
            incursCost={incursCost}
          />
        )}
        {activeTab === 'code-examples' && (
          <div className="p-5">
            <CodeExamples endpoint={endpoint} baseUrl={baseUrl} params={params} body={body} apiKey={apiKey} />
          </div>
        )}
        {activeTab === 'models' && <ModelsPanel endpoint={endpoint} />}
        {activeTab === 'error-responses' && (
          <div className="p-5">
            {errorResponses.length === 0 ? (
              <p className="text-sm text-primary-default/50 text-center py-8">
                No error responses documented
              </p>
            ) : (
              <div className="space-y-3">
                {errorResponses.map((resp) => (
                  <ErrorResponseItem key={resp.statusCode} response={resp} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
function ErrorResponseItem({ response }: { response: ParsedResponse }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasExample = response.example !== undefined
  const hasSchema = response.schema !== undefined
  const statusColor = response.statusCode.startsWith('4')
    ? 'bg-amber-100 text-amber-700 border-amber-200'
    : 'bg-red-100 text-red-700 border-red-200'
  return (
    <div className="border border-primary-default/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-4 px-4 py-3 bg-primary-default/[0.02] hover:bg-primary-default/[0.04] transition-colors text-left"
      >
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${statusColor}`}>
          {response.statusCode}
        </span>
        <span className="flex-1 text-sm text-primary-default/80">{response.description}</span>
        {(hasExample || hasSchema) && (
          <svg
            className={`w-4 h-4 text-primary-default/40 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>
      {isExpanded && (hasExample || hasSchema) && (
        <div className="border-t border-primary-default/10 bg-primary-default/[0.02]">
          {hasExample && (
            <div className="p-4">
              <span className="text-xs font-semibold text-primary-default/50 uppercase tracking-wide">
                Example Response
              </span>
              <pre className="mt-2 p-3 bg-primary-default rounded-lg overflow-x-auto">
                <code className="text-xs text-white/90 font-mono">
                  {JSON.stringify(response.example, null, 2)}
                </code>
              </pre>
            </div>
          )}
          {hasSchema && !hasExample && (
            <div className="p-4">
              <span className="text-xs font-semibold text-primary-default/50 uppercase tracking-wide">
                Response Schema
              </span>
              <div className="mt-2">
                <SchemaDisplay schema={response.schema!} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let listItems: string[] = []
  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc pl-5 my-3 space-y-1">
          {listItems.map((item, i) => (
            <li key={i} className="text-primary-default/70">
              {renderInlineMarkdown(item)}
            </li>
          ))}
        </ul>
      )
      listItems = []
    }
  }
  lines.forEach((line, i) => {
    // Headers
    if (line.startsWith('### ')) {
      flushList()
      elements.push(
        <h4 key={i} className="text-lg font-heading text-primary-default mt-6 mb-3">
          {line.slice(4)}
        </h4>
      )
    } else if (line.startsWith('## ')) {
      flushList()
      elements.push(
        <h3 key={i} className="text-xl font-heading text-primary-default mt-6 mb-3">
          {line.slice(3)}
        </h3>
      )
    } else if (line.startsWith('# ')) {
      flushList()
      elements.push(
        <h2 key={i} className="text-2xl font-heading text-primary-default mt-6 mb-3">
          {line.slice(2)}
        </h2>
      )
    }
    // List items
    else if (line.match(/^[-*]\s/)) {
      listItems.push(line.slice(2))
    }
    // Numbered list
    else if (line.match(/^\d+\.\s/)) {
      listItems.push(line.replace(/^\d+\.\s/, ''))
    }
    // Bold line (full line)
    else if (line.startsWith('**') && line.endsWith('**')) {
      flushList()
      elements.push(
        <p key={i} className="font-semibold text-primary-default my-2">
          {line.slice(2, -2)}
        </p>
      )
    }
    // Regular paragraph
    else if (line.trim()) {
      flushList()
      elements.push(
        <p key={i} className="text-primary-default/70 my-2">
          {renderInlineMarkdown(line)}
        </p>
      )
    }
  })
  flushList()
  return elements
}
function renderInlineMarkdown(text: string): React.ReactNode {
  // Handle inline code, bold, and italic
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0
  while (remaining.length > 0) {
    // Inline code
    const codeMatch = remaining.match(/`([^`]+)`/)
    // Bold
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/)
    // Italic
    const italicMatch = remaining.match(/\*([^*]+)\*/)
    const matches = [
      codeMatch ? { match: codeMatch, type: 'code', index: codeMatch.index! } : null,
      boldMatch ? { match: boldMatch, type: 'bold', index: boldMatch.index! } : null,
      italicMatch && !boldMatch ? { match: italicMatch, type: 'italic', index: italicMatch.index! } : null,
    ]
      .filter(Boolean)
      .sort((a, b) => a!.index - b!.index)
    if (matches.length === 0 || matches[0]!.index > 0) {
      const textEnd = matches.length > 0 ? matches[0]!.index : remaining.length
      parts.push(remaining.slice(0, textEnd))
      remaining = remaining.slice(textEnd)
      continue
    }
    const { match, type } = matches[0]!
    if (type === 'code') {
      parts.push(
        <code
          key={key++}
          className="px-1.5 py-0.5 bg-primary-default/5 rounded text-sm font-mono text-primary-default"
        >
          {match![1]}
        </code>
      )
    } else if (type === 'bold') {
      parts.push(
        <strong key={key++} className="font-semibold text-primary-default">
          {match![1]}
        </strong>
      )
    } else if (type === 'italic') {
      parts.push(<em key={key++}>{match![1]}</em>)
    }
    remaining = remaining.slice(match![0].length)
  }
  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : parts
}
export default function EndpointSection({ endpoint, baseUrl, apiKey, incursCost }: EndpointSectionProps) {
  const [params, setParams] = useState<Record<string, string>>({})
  const [body, setBody] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<PanelTab>('try-it-out')
  const handleParamsChange = useCallback((newParams: Record<string, string>) => {
    setParams(newParams)
  }, [])
  const handleBodyChange = useCallback((newBody: string | null) => {
    setBody(newBody)
  }, [])
  const handleTabChange = useCallback((tab: PanelTab) => {
    setActiveTab(tab)
  }, [])
  const pathParams = endpoint.parameters.filter((p) => p.in === 'path')
  const queryParams = endpoint.parameters.filter((p) => p.in === 'query')
  const successResponse = endpoint.responses.find((r) => r.statusCode.startsWith('2'))
  const errorResponses = endpoint.responses.filter((r) => !r.statusCode.startsWith('2'))
  const methodColor = methodStyles[endpoint.method] || 'text-gray-600'
  return (
    <section
      id={endpoint.id}
      className="py-10 border-b border-primary-default/10 scroll-mt-24 last:border-b-0"
    >
      {/* Two-column layout on desktop */}
      <div className="xl:flex xl:gap-10">
        {/* Left Column - Documentation */}
        <div className="xl:flex-1 xl:min-w-0">
          {/* Header */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span
              className={`text-xs font-semibold uppercase tracking-wide whitespace-nowrap ${methodColor}`}
            >
              {endpoint.method}
            </span>
            <code className="text-base lg:text-lg font-mono text-primary-default/80 break-all">
              {endpoint.path}
            </code>
            {incursCost && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-600 text-xs font-medium rounded">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Costs
              </span>
            )}
          </div>
          {/* Title & Description */}
          <h3 className="text-xl lg:text-2xl font-heading text-primary-default mb-4">{endpoint.summary}</h3>
          {endpoint.description && <div className="mb-10">{renderMarkdown(endpoint.description)}</div>}
          {/* Parameters */}
          {(pathParams.length > 0 || queryParams.length > 0) && (
            <div className="mb-6">
              <AccordionSection title="Parameters" defaultOpen={false}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-primary-default/10">
                      <th className="text-left pb-3 font-medium text-primary-default/60">Name</th>
                      <th className="text-left pb-3 font-medium text-primary-default/60">Type</th>
                      <th className="text-left pb-3 font-medium text-primary-default/60">In</th>
                      <th className="text-left pb-3 font-medium text-primary-default/60">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...pathParams, ...queryParams].map((param) => (
                      <tr key={param.name} className="border-b border-primary-default/5 last:border-b-0">
                        <td className="py-3 pr-4">
                          <code className="text-xs bg-primary-default/5 px-2 py-1 rounded font-mono text-primary-default">
                            {param.name}
                          </code>
                          {param.required && (
                            <span className="ml-2 text-[10px] font-medium text-red-500 uppercase">
                              required
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-primary-default/70 font-mono text-xs">
                          {param.type}
                          {param.enum && (
                            <div className="text-[10px] text-primary-default/50 mt-1 font-sans">
                              {param.enum.join(' | ')}
                            </div>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-xs text-primary-default/60">{param.in}</span>
                        </td>
                        <td className="py-3 text-primary-default/70">
                          {param.description}
                          {param.default !== undefined && (
                            <span className="ml-1 text-xs text-primary-default/40">
                              (default: {String(param.default)})
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </AccordionSection>
            </div>
          )}
          {/* Request Body Schema */}
          {endpoint.requestBody?.schema && (
            <div className="mb-6">
              <AccordionSection
                title="Request Body"
                badge={
                  <div className="flex items-center gap-2">
                    {endpoint.requestBody.schemaName && (
                      <ModelLink
                        name={endpoint.requestBody.schemaName}
                        onClick={() => handleTabChange('models')}
                      />
                    )}
                    {endpoint.requestBody.contentType && (
                      <span className="text-xs text-primary-default/50 font-normal">
                        {endpoint.requestBody.contentType}
                      </span>
                    )}
                  </div>
                }
                defaultOpen={false}
              >
                <SchemaDisplay schema={endpoint.requestBody.schema} />
              </AccordionSection>
            </div>
          )}
          {/* Response Schema */}
          {successResponse?.schema && (
            <div className="mb-6">
              <AccordionSection
                title="Response"
                badge={
                  <div className="flex items-center gap-2">
                    {successResponse.schemaName && (
                      <ModelLink
                        name={successResponse.schemaName}
                        onClick={() => handleTabChange('models')}
                      />
                    )}
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-xs font-medium rounded">
                      {successResponse.statusCode}
                    </span>
                  </div>
                }
                defaultOpen={false}
              >
                {successResponse.example !== undefined && (
                  <div className="mb-4">
                    <span className="text-xs font-semibold text-primary-default/50 uppercase tracking-wide">
                      Example Response
                    </span>
                    <pre className="mt-2 p-3 bg-primary-default rounded-lg overflow-x-auto">
                      <code className="text-xs text-white/90 font-mono">
                        {JSON.stringify(successResponse.example, null, 2)}
                      </code>
                    </pre>
                  </div>
                )}
                <SchemaDisplay schema={successResponse.schema} />
              </AccordionSection>
            </div>
          )}
        </div>
        {/* Right Column - Try It Out & Code Examples (Sticky on Desktop) */}
        <div className="xl:w-[480px] xl:shrink-0 mt-10 xl:mt-0">
          <div className="xl:sticky xl:top-24">
            <TryItOutPanel
              endpoint={endpoint}
              baseUrl={baseUrl}
              apiKey={apiKey}
              params={params}
              body={body}
              onParamsChange={handleParamsChange}
              onBodyChange={handleBodyChange}
              incursCost={incursCost}
              errorResponses={errorResponses}
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
