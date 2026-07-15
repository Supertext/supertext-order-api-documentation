'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
interface UseScrollSpyOptions {
  offset?: number
  updateHash?: boolean
}
export function useScrollSpy(
  ids: string[],
  options: UseScrollSpyOptions = {}
): [string | null, (id: string) => void] {
  const { offset = 100, updateHash = false } = options
  const [activeId, setActiveId] = useState<string | null>(null)
  const isScrollingFromClick = useRef(false)
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null)
  const lastScrollY = useRef(0)
  // Update URL hash without triggering scroll
  const updateUrlHash = useCallback(
    (id: string | null) => {
      if (!updateHash || !id) return
      // Use replaceState to avoid adding to history on every scroll
      const newUrl = `${window.location.pathname}${window.location.search}#${id}`
      window.history.replaceState(null, '', newUrl)
    },
    [updateHash]
  )
  // Manually set active ID (used when clicking sidebar links)
  const setManualActiveId = useCallback(
    (id: string) => {
      isScrollingFromClick.current = true
      setActiveId(id)
      // Update hash immediately on click
      if (updateHash) {
        const newUrl = `${window.location.pathname}${window.location.search}#${id}`
        window.history.pushState(null, '', newUrl)
      }
      // Clear any existing timeout
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current)
      }
    },
    [updateHash]
  )
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY
    // If scrolling from a click, wait until scroll stops completely
    if (isScrollingFromClick.current) {
      // Clear existing timeout
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current)
      }
      // Set a timeout to detect when scrolling has stopped
      scrollTimeout.current = setTimeout(() => {
        isScrollingFromClick.current = false
        // Now update based on current position
        let currentActiveId: string | null = null
        for (const id of ids) {
          const element = document.getElementById(id)
          if (element) {
            const rect = element.getBoundingClientRect()
            if (rect.top <= offset) {
              currentActiveId = id
            }
          }
        }
        const newActiveId = currentActiveId || ids[0] || null
        setActiveId(newActiveId)
        updateUrlHash(newActiveId)
      }, 150)
      lastScrollY.current = currentScrollY
      return
    }
    // Normal scroll spy behavior
    let currentActiveId: string | null = null
    for (const id of ids) {
      const element = document.getElementById(id)
      if (element) {
        const rect = element.getBoundingClientRect()
        if (rect.top <= offset) {
          currentActiveId = id
        }
      }
    }
    const newActiveId = currentActiveId || ids[0] || null
    if (newActiveId !== activeId) {
      setActiveId(newActiveId)
      updateUrlHash(newActiveId)
    }
    lastScrollY.current = currentScrollY
  }, [ids, offset, activeId, updateUrlHash])
  useEffect(() => {
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current)
      }
    }
  }, [handleScroll])
  return [activeId, setManualActiveId]
}
