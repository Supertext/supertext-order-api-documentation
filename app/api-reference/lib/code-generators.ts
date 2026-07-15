import type { ParsedEndpoint } from './types'
// Define supported languages
export interface LanguageConfig {
  id: string
  label: string
}
export const supportedLanguages: LanguageConfig[] = [
  { id: 'curl', label: 'cURL' },
  { id: 'python', label: 'Python' },
  { id: 'javascript', label: 'JavaScript' },
]
/**
 * Generate code snippet for the given language
 */
export function generateCodeSnippet(
  languageId: string,
  endpoint: ParsedEndpoint,
  baseUrl: string,
  params: Record<string, string>,
  body: string | null,
  apiKey: string
): string {
  const language = supportedLanguages.find((l) => l.id === languageId)
  if (!language) {
    return `// Unsupported language: ${languageId}`
  }
  switch (languageId) {
    case 'curl':
      return generateCurlSnippet(endpoint, baseUrl, params, body, apiKey)
    case 'python':
      return generatePythonSnippet(endpoint, baseUrl, params, body, apiKey)
    case 'javascript':
      return generateJavaScriptSnippet(endpoint, baseUrl, params, body, apiKey)
    default:
      return `// Code generation not available for ${languageId}`
  }
}
function generateCurlSnippet(
  endpoint: ParsedEndpoint,
  baseUrl: string,
  params: Record<string, string>,
  body: string | null,
  apiKey: string
): string {
  let { path } = endpoint
  endpoint.parameters
    .filter((p) => p.in === 'path')
    .forEach((p) => {
      const value = params[p.name] || `{${p.name}}`
      path = path.replace(`{${p.name}}`, value)
    })
  const queryParams = endpoint.parameters
    .filter((p) => p.in === 'query' && params[p.name])
    .map((p) => `${encodeURIComponent(p.name)}=${encodeURIComponent(params[p.name])}`)
    .join('&')
  const fullUrl = queryParams ? `${baseUrl}${path}?${queryParams}` : `${baseUrl}${path}`
  const lines: string[] = [`curl -X ${endpoint.method} '${fullUrl}'`]
  lines.push(`  -H 'Authorization: ${apiKey || '<your-api-key>'}'`)

  if (endpoint.requestBody?.contentType === 'multipart/form-data') {
    lines.push(`  -F 'file=@/path/to/your/file.docx'`)
    if (body) {
      try {
        const bodyObj = JSON.parse(body)
        Object.entries(bodyObj).forEach(([key, value]) => {
          if (key !== 'file') lines.push(`  -F '${key}=${value}'`)
        })
      } catch {
        /* ignore */
      }
    }
  } else if (body && endpoint.method !== 'GET') {
    lines.push(`  -H 'Content-Type: application/json'`)
    lines.push(`  -d '${body}'`)
  }
  return lines.join(' \\\n')
}
function generatePythonSnippet(
  endpoint: ParsedEndpoint,
  baseUrl: string,
  params: Record<string, string>,
  body: string | null,
  apiKey: string
): string {
  let { path } = endpoint
  endpoint.parameters
    .filter((p) => p.in === 'path')
    .forEach((p) => {
      const value = params[p.name] || `{${p.name}}`
      path = path.replace(`{${p.name}}`, value)
    })
  const lines: string[] = ['import requests', '', `url = "${baseUrl}${path}"`, '']
  lines.push('headers = {')
  lines.push(`    "Authorization": "${apiKey || '<your-api-key>'}"`)
  lines.push('}')
  if (body && endpoint.method !== 'GET') {
    lines.push('')
    lines.push(`data = ${body.replace(/null/g, 'None').replace(/true/g, 'True').replace(/false/g, 'False')}`)
  }
  lines.push('')
  if (body && endpoint.method !== 'GET') {
    lines.push(`response = requests.${endpoint.method.toLowerCase()}(url, headers=headers, json=data)`)
  } else {
    lines.push(`response = requests.${endpoint.method.toLowerCase()}(url, headers=headers)`)
  }
  lines.push('print(response.json())')
  return lines.join('\n')
}
function generateJavaScriptSnippet(
  endpoint: ParsedEndpoint,
  baseUrl: string,
  params: Record<string, string>,
  body: string | null,
  apiKey: string
): string {
  let { path } = endpoint
  endpoint.parameters
    .filter((p) => p.in === 'path')
    .forEach((p) => {
      const value = params[p.name] || `{${p.name}}`
      path = path.replace(`{${p.name}}`, value)
    })
  const queryParams = endpoint.parameters
    .filter((p) => p.in === 'query' && params[p.name])
    .map((p) => `${encodeURIComponent(p.name)}=${encodeURIComponent(params[p.name])}`)
    .join('&')
  const fullUrl = queryParams ? `${baseUrl}${path}?${queryParams}` : `${baseUrl}${path}`
  const lines: string[] = []
  lines.push(`const response = await fetch("${fullUrl}", {`)
  lines.push(`  method: "${endpoint.method}",`)
  lines.push('  headers: {')
  lines.push(
    `    "Authorization": "${apiKey || '<your-api-key>'}"${body && endpoint.method !== 'GET' ? ',' : ''}`
  )
  if (body && endpoint.method !== 'GET') {
    lines.push('    "Content-Type": "application/json"')
  }
  lines.push(`  }${body && endpoint.method !== 'GET' ? ',' : ''}`)
  if (body && endpoint.method !== 'GET') {
    lines.push(`  body: JSON.stringify(${body})`)
  }
  lines.push('});')
  lines.push('')
  lines.push('const data = await response.json();')
  lines.push('console.log(data);')
  return lines.join('\n')
}
// Legacy exports for backwards compatibility
export const generateCurl = (
  endpoint: ParsedEndpoint,
  baseUrl: string,
  params: Record<string, string>,
  body: string | null,
  apiKey: string
) => generateCodeSnippet('curl', endpoint, baseUrl, params, body, apiKey)
export const generatePython = (
  endpoint: ParsedEndpoint,
  baseUrl: string,
  params: Record<string, string>,
  body: string | null,
  apiKey: string
) => generateCodeSnippet('python', endpoint, baseUrl, params, body, apiKey)
export const generateJavaScript = (
  endpoint: ParsedEndpoint,
  baseUrl: string,
  params: Record<string, string>,
  body: string | null,
  apiKey: string
) => generateCodeSnippet('javascript', endpoint, baseUrl, params, body, apiKey)
