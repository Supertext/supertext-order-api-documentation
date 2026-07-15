/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */

'use client'
import { useMemo, useState, useEffect, useRef } from 'react'
import type { ParsedEndpoint, DocumentationSection, TagInfo } from '../lib/types'
import { useScrollSpy } from '../hooks/useScrollSpy'
type Platform = 'mac' | 'windows' | 'mobile' | null
interface ApiSidebarProps {
  endpoints: ParsedEndpoint[]
  tags: TagInfo[]
  sections: DocumentationSection[]
  isOpen: boolean
  onClose: () => void
  costEndpoints: string[]
}
const methodColors: Record<string, string> = {
  GET: 'text-emerald-600',
  POST: 'text-blue-600',
  PUT: 'text-amber-600',
  DELETE: 'text-red-600',
  PATCH: 'text-purple-600',
}
export default function ApiSidebar({
  endpoints,
  tags,
  sections,
  isOpen,
  onClose,
  costEndpoints,
}: ApiSidebarProps) {
  const tagIds = useMemo(() => tags.map((t) => `tag-${t.name.toLowerCase().replace(/\s+/g, '-')}`), [tags])
  const allIds = useMemo(
    () => [
      ...sections.map((s) => `section-${s.id}`),
      ...tagIds.flatMap((tagId, i) => {
        const tag = tags[i]
        const tagEndpoints = endpoints.filter((e) => e.tag === tag.name)
        return [tagId, ...tagEndpoints.map((e) => e.id)]
      }),
    ],
    [sections, tagIds, tags, endpoints]
  )
  const [activeId, setManualActiveId] = useScrollSpy(allIds, { offset: 200, updateHash: true })
  const searchInputRef = useRef<HTMLInputElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const [platform, setPlatform] = useState<Platform>(null)
  const [searchQuery, setSearchQuery] = useState('')
  // Detect platform for keyboard shortcut display
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase()
    const isMobile = /iphone|ipad|ipod|android|webos|blackberry|windows phone/i.test(userAgent)
    if (isMobile) {
      setPlatform('mobile')
    } else if (navigator.platform?.toLowerCase().includes('mac') || userAgent.includes('mac')) {
      setPlatform('mac')
    } else {
      setPlatform('windows')
    }
  }, [])
  // Keyboard shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = platform === 'mac'
      const modifier = isMac ? e.metaKey : e.ctrlKey
      if (modifier && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      } else if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        setSearchQuery('')
        searchInputRef.current?.blur()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [platform])
  // Auto-scroll sidebar to keep active link visible
  useEffect(() => {
    if (!activeId || !navRef.current || searchQuery) return
    const activeElement = navRef.current.querySelector(`[data-sidebar-id="${activeId}"]`)
    if (!activeElement) return
    const navRect = navRef.current.getBoundingClientRect()
    const activeRect = activeElement.getBoundingClientRect()
    // Check if the active element is outside the visible area of the nav
    const isAboveView = activeRect.top < navRect.top
    const isBelowView = activeRect.bottom > navRect.bottom
    if (isAboveView || isBelowView) {
      activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [activeId, searchQuery])
  // Track expanded state for each tag section (all expanded by default)
  const [expandedTags, setExpandedTags] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    tags.forEach((tag) => {
      initial[tag.name] = true
    })
    return initial
  })
  const toggleTag = (tagName: string) => {
    setExpandedTags((prev) => ({ ...prev, [tagName]: !prev[tagName] }))
  }
  const endpointsByTag = useMemo(() => {
    const grouped: Record<string, ParsedEndpoint[]> = {}
    tags.forEach((tag) => {
      grouped[tag.name] = endpoints.filter((e) => e.tag === tag.name)
    })
    return grouped
  }, [endpoints, tags])
  // Filter results based on search query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null
    const query = searchQuery.toLowerCase()
    const filteredSections = sections.filter(
      (s) => s.title.toLowerCase().includes(query) || s.content.toLowerCase().includes(query)
    )
    const filteredEndpoints = endpoints.filter(
      (e) =>
        e.summary.toLowerCase().includes(query) ||
        e.path.toLowerCase().includes(query) ||
        e.method.toLowerCase().includes(query) ||
        e.description.toLowerCase().includes(query)
    )
    return { sections: filteredSections, endpoints: filteredEndpoints }
  }, [searchQuery, sections, endpoints])
  const handleClick = (id: string) => {
    setManualActiveId(id)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    setSearchQuery('')
    onClose()
  }
  return (
    <>
      {/* Overlay */}
      {isOpen && <div className="fixed inset-0 bg-primary-default/40 z-[500] lg:hidden" onClick={onClose} />}
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-[72px] left-0 h-screen lg:h-[calc(100vh-72px)] w-80 bg-backgrounds-backgroundLight z-[500] lg:z-auto transition-transform duration-300 ease-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col border-r border-primary-default/10">
          {/* Header */}
          <div className="px-4 py-5 border-b border-primary-default/10">
            <div className="flex items-center justify-end mb-4 lg:hidden">
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-primary-default/5 transition-colors"
              >
                <svg
                  className="w-5 h-5 text-primary-default/60"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            {/* Search Input */}
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-default/40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search docs..."
                className="w-full pl-10 pr-16 py-2.5 text-sm bg-primary-default/5 border border-transparent rounded-xl focus:outline-none focus:border-primary-default/20 focus:bg-white text-primary-default placeholder:text-primary-default/40 transition-all"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-primary-default/40 hover:text-primary-default transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              ) : (
                platform &&
                platform !== 'mobile' && (
                  <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-medium text-primary-default/40 bg-primary-default/5 border border-primary-default/10 rounded">
                    {platform === 'mac' ? '⌘K' : 'Ctrl+K'}
                  </kbd>
                )
              )}
            </div>
          </div>
          {/* Navigation */}
          <nav ref={navRef} className="flex-1 overflow-y-auto py-6">
            {/* Search Results */}
            {searchResults ? (
              <div>
                {searchResults.sections.length === 0 && searchResults.endpoints.length === 0 ? (
                  <div className="px-6 py-8 text-center">
                    <svg
                      className="w-12 h-12 mx-auto text-primary-default/20 mb-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-sm text-primary-default/50">No results found</p>
                    <p className="text-xs text-primary-default/40 mt-1">Try a different search term</p>
                  </div>
                ) : (
                  <>
                    {/* Search - Documentation */}
                    {searchResults.sections.length > 0 && (
                      <div className="mb-6">
                        <h3 className="px-6 mb-3 text-sm font-heading text-primary-default/50">
                          Documentation
                        </h3>
                        <ul className="space-y-1">
                          {searchResults.sections.map((section) => (
                            <li key={section.id} className="px-3">
                              <button
                                onClick={() => handleClick(`section-${section.id}`)}
                                className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-primary-default/[0.03] transition-all"
                              >
                                <span className="text-sm font-heading text-primary-default/80">
                                  {section.title}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {/* Search - Endpoints */}
                    {searchResults.endpoints.length > 0 && (
                      <div className="mb-6">
                        <h3 className="px-6 mb-3 text-sm font-heading text-primary-default/50">Endpoints</h3>
                        <ul className="space-y-1">
                          {searchResults.endpoints.map((endpoint) => (
                            <li key={endpoint.id} className="px-3">
                              <button
                                onClick={() => handleClick(endpoint.id)}
                                className="w-full text-left px-4 py-3 rounded-lg hover:bg-primary-default/[0.03] transition-all flex items-center gap-3"
                              >
                                <span
                                  className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide ${methodColors[endpoint.method] || 'text-gray-600'}`}
                                >
                                  {endpoint.method}
                                </span>
                                <span className="text-sm font-heading text-primary-default/80 truncate">
                                  {endpoint.summary || endpoint.path}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <>
                {/* Documentation Sections */}
                {sections.length > 0 && (
                  <div className="mb-8">
                    <h3 className="px-6 mb-3 text-base font-heading text-primary-default">Documentation</h3>
                    <ul className="space-y-1">
                      {sections.map((section) => {
                        const sectionId = `section-${section.id}`
                        const isActive = activeId === sectionId
                        return (
                          <li key={section.id} className="px-3">
                            <button
                              data-sidebar-id={sectionId}
                              onClick={() => handleClick(sectionId)}
                              className={`w-full text-left px-4 py-2.5 rounded-xl transition-all group ${
                                isActive ? 'bg-primary-default' : 'hover:bg-primary-default/[0.03]'
                              }`}
                              style={{ paddingLeft: section.level === 3 ? '1.5rem' : undefined }}
                            >
                              <span
                                className={`text-sm font-heading ${isActive ? 'text-white font-medium' : 'text-primary-default/80'}`}
                              >
                                {section.title}
                              </span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
                {/* Endpoint Tags */}
                {tags.map((tag, tagIndex) => {
                  const isExpanded = expandedTags[tag.name] ?? true
                  const tagId = tagIds[tagIndex]
                  const isTagActive = activeId === tagId
                  return (
                    <div key={tag.name} className="mb-4">
                      <div
                        className={`w-full px-6 py-2 flex items-center justify-between transition-colors ${isTagActive ? 'bg-primary-default/5' : 'hover:bg-primary-default/[0.03]'}`}
                      >
                        <button
                          data-sidebar-id={tagId}
                          onClick={() => handleClick(tagId)}
                          className="flex-1 text-left"
                        >
                          <h3
                            className={`text-base font-heading text-primary-default ${isTagActive ? 'font-semibold' : ''}`}
                          >
                            {tag.name}
                          </h3>
                        </button>
                        <button onClick={() => toggleTag(tag.name)} className="p-1 -mr-1">
                          <svg
                            className={`w-3 h-3 text-primary-default/40 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                      </div>
                      {isExpanded && (
                        <ul className="space-y-1 mt-1">
                          {endpointsByTag[tag.name]?.map((endpoint) => {
                            const isActive = activeId === endpoint.id
                            const hasCost = costEndpoints.includes(endpoint.path)
                            return (
                              <li key={endpoint.id} className="px-3">
                                <button
                                  data-sidebar-id={endpoint.id}
                                  onClick={() => handleClick(endpoint.id)}
                                  className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-2.5 group ${
                                    isActive ? 'bg-primary-default' : 'hover:bg-primary-default/[0.03]'
                                  }`}
                                >
                                  {hasCost && (
                                    <span
                                      className={`shrink-0 w-2 h-2 rounded-full ${isActive ? 'bg-red-300' : 'bg-red-400'}`}
                                      title="Usage incurs costs"
                                    />
                                  )}
                                  <span
                                    className={`text-sm font-heading truncate flex-1 ${isActive ? 'text-white font-medium' : 'text-primary-default/80'}`}
                                  >
                                    {endpoint.summary || endpoint.path}
                                  </span>
                                  <span
                                    className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap ${isActive ? 'text-secondary-default' : methodColors[endpoint.method] || 'text-gray-600'}`}
                                  >
                                    {endpoint.method}
                                  </span>
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>
                  )
                })}
              </>
            )}
          </nav>
          {/* Footer Legend */}
          <div className="px-6 py-5 border-t border-primary-default/10 bg-backgrounds-backgroundDark">
            <div className="flex items-center gap-2 text-xs text-primary-default/50">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span>Usage incurs costs</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
