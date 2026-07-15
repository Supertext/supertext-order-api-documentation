// TypeScript definitions for parsed OpenAPI structures
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
export interface DocumentationSection {
  id: string
  title: string
  content: string
  level: number // 2 for ##, 3 for ###, etc.
}
export interface OpenApiInfo {
  title: string
  description: string
  version: string
  sections: DocumentationSection[]
}
export interface OpenApiServer {
  url: string
}
export interface ParsedParameter {
  name: string
  in: 'path' | 'query' | 'header' | 'cookie'
  required: boolean
  type: string
  description: string
  example?: unknown
  enum?: string[]
  default?: unknown
}
export interface ParsedSchema {
  type: string
  properties?: Record<string, ParsedSchemaProperty>
  required?: string[]
  items?: ParsedSchema
  enum?: string[]
  description?: string
  example?: unknown
  $ref?: string
}
export interface ParsedSchemaProperty {
  type: string
  title?: string
  description?: string
  required?: boolean
  example?: unknown
  enum?: string[]
  default?: unknown
  items?: ParsedSchema
  properties?: Record<string, ParsedSchemaProperty>
  format?: string
}
export interface ParsedRequestBody {
  required: boolean
  contentType: string
  schema: ParsedSchema
  schemaName?: string
  examples?: Record<string, { summary: string; description?: string; value: unknown }>
}
export interface ParsedResponse {
  statusCode: string
  description: string
  contentType?: string
  schema?: ParsedSchema
  schemaName?: string
  example?: unknown
}
export interface ParsedEndpoint {
  id: string
  path: string
  method: HttpMethod
  tag: string
  operationId: string
  summary: string
  description: string
  parameters: ParsedParameter[]
  requestBody?: ParsedRequestBody
  responses: ParsedResponse[]
  security: string[]
}
export interface TagInfo {
  name: string
  description: string
}
export interface ParsedOpenApiSpec {
  info: OpenApiInfo
  servers: OpenApiServer[]
  endpoints: ParsedEndpoint[]
  tags: TagInfo[]
  schemas: Record<string, ParsedSchema>
}
export interface ApiRequestState {
  apiKey: string
  parameters: Record<string, string>
  body: string
  isLoading: boolean
  response: ApiResponse | null
  error: string | null
}
export interface ApiResponse {
  status: number
  statusText: string
  headers: Record<string, string>
  body: unknown
  responseTime: number
  blob?: Blob
}
