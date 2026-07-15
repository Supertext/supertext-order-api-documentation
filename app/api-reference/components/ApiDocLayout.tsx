'use client'
import { useState, useEffect, useCallback } from 'react'
import type { ParsedOpenApiSpec } from '../lib/types'
import ApiSidebar from './ApiSidebar'
import EndpointSection from './EndpointSection'
function MarkdownContent({ content }: { content: string }) {
  const elements: React.ReactNode[] = []
  const lines = content.split('\n')
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    // Skip empty lines
    if (!line.trim()) {
      i += 1
      continue
    }
    // Code block (indented with 4 spaces or more)
    if (line.match(/^ {4,}/)) {
      const codeLines: string[] = []
      while (i < lines.length && (lines[i].match(/^ {4,}/) || !lines[i].trim())) {
        if (lines[i].trim()) {
          codeLines.push(lines[i].replace(/^ {4}/, ''))
        }
        i += 1
      }
      elements.push(
        <pre key={elements.length} className="bg-primary-default/5 rounded-xl p-4 my-4">
          <code className="text-sm font-mono text-primary-default/80 whitespace-pre-wrap break-all">
            {codeLines.join('\n')}
          </code>
        </pre>
      )
      continue
    }
    // Bullet list
    if (line.match(/^[-*]\s/)) {
      const listItems: string[] = []
      while (i < lines.length && lines[i].match(/^[-*]\s/)) {
        listItems.push(lines[i].replace(/^[-*]\s/, ''))
        i++
      }
      elements.push(
        <ul key={elements.length} className="list-disc pl-5 my-4 space-y-2">
          {listItems.map((item, j) => (
            <li key={j} className="text-primary-default/70">
              <InlineMarkdown text={item} />
            </li>
          ))}
        </ul>
      )
      continue
    }
    // Ordered (numbered) list
    if (line.match(/^\d+\.\s/)) {
      const listItems: string[] = []
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
        listItems.push(lines[i].replace(/^\d+\.\s/, ''))
        i++
      }
      elements.push(
        <ol key={elements.length} className="list-decimal pl-5 my-4 space-y-2">
          {listItems.map((item, j) => (
            <li key={j} className="text-primary-default/70">
              <InlineMarkdown text={item} />
            </li>
          ))}
        </ol>
      )
      continue
    }
    // Regular paragraph - collect consecutive non-empty, non-special lines
    const paragraphLines: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].match(/^ {4,}/) &&
      !lines[i].match(/^[-*]\s/) &&
      !lines[i].match(/^\d+\.\s/)
    ) {
      paragraphLines.push(lines[i])
      i++
    }
    if (paragraphLines.length > 0) {
      elements.push(
        <p key={elements.length} className="my-4 text-primary-default/70 leading-relaxed">
          <InlineMarkdown text={paragraphLines.join(' ')} />
        </p>
      )
    }
  }
  return <>{elements}</>
}
function InlineMarkdown({ text }: { text: string }) {
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0
  while (remaining.length > 0) {
    // Link: [text](url)
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/)
    // Inline code: `code`
    const codeMatch = remaining.match(/`([^`]+)`/)
    // Bold: **text**
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/)
    const matches = [
      linkMatch ? { match: linkMatch, type: 'link', index: linkMatch.index! } : null,
      codeMatch ? { match: codeMatch, type: 'code', index: codeMatch.index! } : null,
      boldMatch ? { match: boldMatch, type: 'bold', index: boldMatch.index! } : null,
    ]
      .filter(Boolean)
      .sort((a, b) => a!.index - b!.index)
    if (matches.length === 0) {
      parts.push(remaining)
      break
    }
    const { match, type, index } = matches[0]!
    // Add text before the match
    if (index > 0) {
      parts.push(remaining.slice(0, index))
    }
    if (type === 'link') {
      parts.push(
        <a
          key={key++}
          href={match![2]}
          className="text-secondary-darken hover:text-secondary-default underline underline-offset-2 transition-colors"
        >
          {match![1]}
        </a>
      )
    } else if (type === 'code') {
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
    }
    remaining = remaining.slice(index + match![0].length)
  }
  return <>{parts}</>
}
function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </svg>
    )
  }
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
      />
    </svg>
  )
}
interface ApiDocLayoutProps {
  spec: ParsedOpenApiSpec
}
const API_KEY_STORAGE_KEY = 'supertext-api-key'
// Endpoints that incur costs when used
const COST_ENDPOINTS = [
  '/translate/ai/text',
  '/translate/ai/file',
  '/translate/fused/text',
  '/detect-languages/text',
  '/detect-languages/file',
]
export default function ApiDocLayout({ spec }: ApiDocLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  useEffect(() => {
    const stored = localStorage.getItem(API_KEY_STORAGE_KEY)
    if (stored) setApiKey(stored)
  }, [])
  // Scroll to hash on initial page load
  useEffect(() => {
    const hash = window.location.hash.slice(1) // Remove the #
    if (hash) {
      setTimeout(() => {
        const element = document.getElementById(hash)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    }
  }, [])
  const handleApiKeyChange = useCallback((key: string) => {
    setApiKey(key)
    if (key) {
      localStorage.setItem(API_KEY_STORAGE_KEY, key)
    } else {
      localStorage.removeItem(API_KEY_STORAGE_KEY)
    }
  }, [])
  const baseUrl = spec.servers[0]?.url || 'https://api.supertext.com/v1'
  return (
    <div className="max-w-screen-7xl mx-auto">
      {/* Mobile Header - positioned below main nav (72px) */}
      <header className="sticky top-[72px] z-30 bg-backgrounds-backgroundLight/95 backdrop-blur border-b border-primary-default/10 lg:hidden">
        <div className="flex items-center gap-4 px-6 py-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-full hover:bg-primary-default/5 transition-colors"
            aria-label="Open navigation"
          >
            <svg
              className="w-5 h-5 text-primary-default"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <span className="font-heading text-primary-default text-lg">API Reference</span>
        </div>
      </header>
      <div className="lg:flex">
        {/* Sidebar */}
        <ApiSidebar
          endpoints={spec.endpoints}
          tags={spec.tags}
          sections={spec.info.sections}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          costEndpoints={COST_ENDPOINTS}
        />
        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
            {/* Documentation Area - Two Column Layout */}
            <div className="xl:flex xl:gap-10 border-b border-primary-default/10">
              {/* Left Column - Title & Documentation Sections */}
              <div className="xl:flex-1 xl:min-w-0">
                {/* Page Header */}
                <section className="pt-10 lg:pt-20 pb-12 lg:pb-16">
                  <span className="inline-block px-3 py-1 text-sm font-medium text-primary-default/70 bg-primary-default/5 border border-primary-default/10 rounded-full mb-4">
                    {spec.info.version}
                  </span>
                  <h1 className="text-4xl lg:text-5xl font-heading text-primary-default">{spec.info.title}</h1>
                </section>
                {/* Documentation Sections */}
                {spec.info.sections.map((section) => (
                  <section
                    key={section.id}
                    id={`section-${section.id}`}
                    className="py-12 lg:py-16 border-t border-primary-default/10 scroll-mt-24"
                  >
                    <div className="max-w-3xl">
                      <h2 className="text-2xl lg:text-3xl font-heading text-primary-default mb-6">
                        {section.title}
                      </h2>
                      <div className="prose prose-lg max-w-none text-primary-default/70">
                        <MarkdownContent content={section.content} />
                      </div>
                    </div>
                  </section>
                ))}
              </div>
              {/* Right Column - Server & Auth Cards (Sticky on Desktop) */}
              <div className="xl:w-[400px] xl:shrink-0 pb-12 lg:pb-16 xl:pb-0">
                <div className="xl:sticky xl:top-24 xl:pt-16 lg:xl:pt-20 space-y-4">
                  {/* Server Card */}
                  <div className="bg-backgrounds-backgroundDark rounded-xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-primary-default/10">
                      <span className="text-sm font-medium text-primary-default">Server</span>
                    </div>
                    <div className="px-5 py-4">
                      <code className="text-sm text-primary-default/70 font-mono">{baseUrl}</code>
                    </div>
                  </div>
                  {/* Authentication Card */}
                  <div className="bg-backgrounds-backgroundDark rounded-xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-primary-default/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-primary-default">Authentication</span>
                        <span className="text-sm text-primary-default/40">Optional</span>
                      </div>
                    </div>
                    <div className="px-5 py-4 space-y-3">
                      <div className="flex items-center">
                        <span className="text-sm text-primary-default/60 w-16">Name:</span>
                        <span className="text-sm text-primary-default">Authorization</span>
                      </div>
                      <div className="flex items-center border-t border-primary-default/5 pt-3">
                        <span className="text-sm text-primary-default/60 w-16">Value:</span>
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            id="api-key"
                            type={showApiKey ? 'text' : 'password'}
                            value={apiKey}
                            onChange={(e) => handleApiKeyChange(e.target.value)}
                            placeholder="<your-api-key>"
                            className="flex-1 min-w-0 text-sm bg-transparent border-none focus:outline-none text-primary-default font-mono placeholder:text-primary-default/30"
                          />
                          <button
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="p-1 text-primary-default/40 hover:text-primary-default transition-colors shrink-0"
                            type="button"
                          >
                            <EyeIcon open={showApiKey} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Endpoints grouped by tag */}
            <div className="py-12 lg:py-16">
              {spec.endpoints.length === 0 ? (
                <div className="py-24 text-center">
                  <p className="text-primary-default/50 text-lg">
                    No endpoints available. Please try again later.
                  </p>
                </div>
              ) : (
                spec.tags.map((tag) => {
                  const tagEndpoints = spec.endpoints.filter((e) => e.tag === tag.name)
                  if (tagEndpoints.length === 0) return null
                  return (
                    <div key={tag.name}>
                      {/* Tag Section Header */}
                      <div
                        id={`tag-${tag.name.toLowerCase().replace(/\s+/g, '-')}`}
                        className="py-12 lg:py-16 border-t border-primary-default/10 scroll-mt-24"
                      >
                        <div className="max-w-3xl">
                          <h2 className="text-2xl lg:text-3xl font-heading text-primary-default mb-6">
                            {tag.name}
                          </h2>
                          {tag.description && (
                            <div className="prose prose-lg max-w-none text-primary-default/70">
                              <MarkdownContent content={tag.description} />
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Tag Endpoints */}
                      {tagEndpoints.map((endpoint) => (
                        <EndpointSection
                          key={endpoint.id}
                          endpoint={endpoint}
                          baseUrl={baseUrl}
                          apiKey={apiKey}
                          incursCost={COST_ENDPOINTS.includes(endpoint.path)}
                        />
                      ))}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
