'use client'
import { useState, useCallback } from 'react'
import type { ParsedEndpoint, ApiResponse } from '../lib/types'
import { executeRequest } from '../lib/api-client'
interface UseApiRequestReturn {
  isLoading: boolean
  response: ApiResponse | null
  error: string | null
  execute: (
    endpoint: ParsedEndpoint,
    baseUrl: string,
    params: Record<string, string>,
    body: string | null,
    apiKey: string,
    file?: File
  ) => Promise<void>
  reset: () => void
}
export function useApiRequest(): UseApiRequestReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const execute = useCallback(
    async (
      endpoint: ParsedEndpoint,
      baseUrl: string,
      params: Record<string, string>,
      body: string | null,
      apiKey: string,
      file?: File
    ) => {
      setIsLoading(true)
      setError(null)
      setResponse(null)
      try {
        const result = await executeRequest(endpoint, baseUrl, params, body, apiKey, file)
        setResponse(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    },
    []
  )
  const reset = useCallback(() => {
    setResponse(null)
    setError(null)
    setIsLoading(false)
  }, [])
  return { isLoading, response, error, execute, reset }
}
