import type { ParsedEndpoint, ApiResponse } from './types'
export async function executeRequest(
  endpoint: ParsedEndpoint,
  baseUrl: string,
  params: Record<string, string>,
  body: string | null,
  apiKey: string,
  file?: File
): Promise<ApiResponse> {
  const startTime = performance.now()
  let { path } = endpoint
  // Replace path parameters
  endpoint.parameters
    .filter((p) => p.in === 'path')
    .forEach((p) => {
      const value = params[p.name] || ''
      path = path.replace(`{${p.name}}`, encodeURIComponent(value))
    })
  // Build query string
  const queryParams = endpoint.parameters
    .filter((p) => p.in === 'query' && params[p.name])
    .map((p) => `${encodeURIComponent(p.name)}=${encodeURIComponent(params[p.name])}`)
    .join('&')
  const fullUrl = queryParams ? `${baseUrl}${path}?${queryParams}` : `${baseUrl}${path}`
  const headers: Record<string, string> = {
    Authorization: apiKey,
  }
  let requestBody: BodyInit | null = null
  if (endpoint.requestBody?.contentType === 'multipart/form-data' && file) {
    const formData = new FormData()
    formData.append('file', file)
    // Add additional parameters from the params object for form fields
    const schemaProperties = endpoint.requestBody?.schema?.properties || {}
    Object.keys(schemaProperties).forEach((key) => {
      if (key !== 'file' && params[key] !== undefined && params[key] !== '') {
        formData.append(key, params[key])
      }
    })
    // Also check body for backwards compatibility
    if (body) {
      try {
        const bodyObj = JSON.parse(body)
        Object.entries(bodyObj).forEach(([key, value]) => {
          if (key !== 'file' && value !== undefined && value !== null && !formData.has(key)) {
            formData.append(key, String(value))
          }
        })
      } catch {
        // ignore parse errors
      }
    }
    requestBody = formData
    // Don't set Content-Type for FormData - browser will set it with boundary
  } else if (body && endpoint.method !== 'GET') {
    headers['Content-Type'] = 'application/json'
    requestBody = body
  }
  try {
    const response = await fetch(fullUrl, {
      method: endpoint.method,
      headers,
      body: requestBody,
    })
    const endTime = performance.now()
    const responseTime = Math.round(endTime - startTime)
    // Get response headers
    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })
    let responseBody: unknown
    let responseBlob: Blob | undefined
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      responseBody = await response.json()
    } else if (contentType.includes('text/')) {
      responseBody = await response.text()
    } else {
      // For binary responses (like file downloads)
      responseBlob = await response.blob()
      responseBody = '[Binary data]'
    }
    return {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody,
      responseTime,
      blob: responseBlob,
    }
  } catch (error) {
    const endTime = performance.now()
    const responseTime = Math.round(endTime - startTime)
    return {
      status: 0,
      statusText: 'Network Error',
      headers: {},
      body: { error: error instanceof Error ? error.message : 'Unknown error' },
      responseTime,
    }
  }
}
