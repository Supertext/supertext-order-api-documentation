import type {
  ParsedOpenApiSpec,
  ParsedEndpoint,
  ParsedParameter,
  ParsedRequestBody,
  ParsedResponse,
  ParsedSchema,
  HttpMethod,
  DocumentationSection,
  TagInfo,
} from './types'
import { PROPERTY_DESCRIPTION_OVERRIDES } from './content-overrides'
interface OpenApiSpec {
  openapi: string
  info: {
    title: string
    description: string
    version: string
  }
  servers: { url: string }[]
  paths: Record<string, Record<string, OpenApiOperation>>
  components?: {
    schemas?: Record<string, unknown>
    securitySchemes?: Record<string, unknown>
  }
  tags?: { name: string; description?: string }[]
}
interface OpenApiOperation {
  tags?: string[]
  summary?: string
  description?: string
  operationId?: string
  parameters?: OpenApiParameter[]
  requestBody?: {
    content: Record<string, { schema: unknown; examples?: Record<string, unknown> }>
    required?: boolean
  }
  responses?: Record<string, OpenApiResponse>
  security?: Record<string, unknown>[]
}
interface OpenApiParameter {
  name: string
  in: 'path' | 'query' | 'header' | 'cookie'
  required?: boolean
  schema?: { type?: string; enum?: string[]; default?: unknown; description?: string }
  description?: string
}
interface OpenApiResponse {
  description?: string
  content?: Record<string, { schema?: unknown; example?: unknown }>
}
function extractSchemaName(schema: unknown): string | undefined {
  if (!schema || typeof schema !== 'object') return undefined
  const s = schema as Record<string, unknown>
  if (s.$ref && typeof s.$ref === 'string') {
    const parts = s.$ref.split('/')
    if (parts.length >= 4 && parts[parts.length - 2] === 'schemas') {
      return parts[parts.length - 1]
    }
  }
  return undefined
}
function resolveRef(spec: OpenApiSpec, ref: string): unknown {
  if (!ref.startsWith('#/')) return null
  const parts = ref.slice(2).split('/')
  let current: unknown = spec
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part]
    } else {
      return null
    }
  }
  return current
}
function parseSchema(spec: OpenApiSpec, schema: unknown): ParsedSchema {
  if (!schema || typeof schema !== 'object') {
    return { type: 'unknown' }
  }
  const s = schema as Record<string, unknown>
  // Handle $ref
  if (s.$ref && typeof s.$ref === 'string') {
    const resolved = resolveRef(spec, s.$ref)
    if (resolved) {
      return parseSchema(spec, resolved)
    }
    return { type: 'unknown', $ref: s.$ref }
  }
  // Handle allOf
  if (Array.isArray(s.allOf) && s.allOf.length > 0) {
    return parseSchema(spec, s.allOf[0])
  }
  const parsed: ParsedSchema = {
    type: (s.type as string) || 'object',
  }
  if (s.description) parsed.description = s.description as string
  if (s.example !== undefined) parsed.example = s.example
  if (Array.isArray(s.enum)) parsed.enum = s.enum as string[]
  if (Array.isArray(s.required)) parsed.required = s.required as string[]
  if (s.properties && typeof s.properties === 'object') {
    parsed.properties = {}
    for (const [key, value] of Object.entries(s.properties as Record<string, unknown>)) {
      const prop = value as Record<string, unknown>
      parsed.properties[key] = {
        type: (prop.type as string) || 'unknown',
        title: prop.title as string | undefined,
        description: prop.description as string | undefined,
        example: prop.example,
        enum: prop.enum as string[] | undefined,
        default: prop.default,
        format: prop.format as string | undefined,
        required: Array.isArray(s.required) && (s.required as string[]).includes(key),
      }
      if (prop.items) {
        parsed.properties[key].items = parseSchema(spec, prop.items)
      }
      if (prop.properties) {
        parsed.properties[key].properties = parseSchema(spec, prop).properties
      }
      if (prop.$ref) {
        const resolved = resolveRef(spec, prop.$ref as string)
        if (resolved) {
          const resolvedSchema = parseSchema(spec, resolved)
          const { required: _req, ...schemaWithoutRequired } = resolvedSchema
          parsed.properties[key] = {
            ...parsed.properties[key],
            ...schemaWithoutRequired,
            type: resolvedSchema.type,
          }
        }
      }
      if (prop.allOf && Array.isArray(prop.allOf)) {
        const resolvedSchema = parseSchema(spec, prop.allOf[0])
        const { required: _req, ...schemaWithoutRequired } = resolvedSchema
        parsed.properties[key] = {
          ...parsed.properties[key],
          ...schemaWithoutRequired,
          type: resolvedSchema.type,
        }
      }
      if (PROPERTY_DESCRIPTION_OVERRIDES[key]) {
        parsed.properties[key].description = PROPERTY_DESCRIPTION_OVERRIDES[key]
      }
    }
  }
  if (s.items) {
    parsed.items = parseSchema(spec, s.items)
  }
  return parsed
}
function parseParameter(param: OpenApiParameter): ParsedParameter {
  return {
    name: param.name,
    in: param.in,
    required: param.required || false,
    type: param.schema?.type || 'string',
    description: param.description || param.schema?.description || '',
    example: undefined,
    enum: param.schema?.enum,
    default: param.schema?.default,
  }
}
function parseRequestBody(
  spec: OpenApiSpec,
  requestBody: OpenApiOperation['requestBody']
): ParsedRequestBody | undefined {
  if (!requestBody?.content) return undefined
  const contentTypes = Object.keys(requestBody.content)
  const contentType = contentTypes[0] || 'application/json'
  const content = requestBody.content[contentType]
  return {
    required: requestBody.required || false,
    contentType,
    schema: parseSchema(spec, content.schema),
    schemaName: extractSchemaName(content.schema),
    examples: content.examples as ParsedRequestBody['examples'],
  }
}
function parseResponses(spec: OpenApiSpec, responses: Record<string, OpenApiResponse>): ParsedResponse[] {
  return Object.entries(responses).map(([statusCode, response]) => {
    const contentTypes = response.content ? Object.keys(response.content) : []
    const contentType = contentTypes[0]
    const content = contentType ? response.content?.[contentType] : undefined
    const parsedSchema = content?.schema ? parseSchema(spec, content.schema) : undefined
    const schemaName = content?.schema ? extractSchemaName(content.schema) : undefined
    // Get example from inline content, or fallback to schema example
    let example = content?.example
    if (!example && parsedSchema?.example) {
      example = parsedSchema.example
    }
    return {
      statusCode,
      description: response.description || '',
      contentType,
      schema: parsedSchema,
      schemaName,
      example,
    }
  })
}
function parseDescriptionSections(description: string): DocumentationSection[] {
  const sections: DocumentationSection[] = []
  const lines = description.split('\n')
  let currentSection: DocumentationSection | null = null
  let contentLines: string[] = []
  // Check for intro text before first heading
  const introLines: string[] = []
  let foundFirstHeading = false
  for (const line of lines) {
    const h2Match = line.match(/^## (.+)$/)
    const h3Match = line.match(/^### (.+)$/)
    if (h2Match || h3Match) {
      // Save intro as a section if we have intro content and haven't found a heading yet
      if (!foundFirstHeading && introLines.length > 0) {
        const introContent = introLines.join('\n').trim()
        if (introContent) {
          sections.push({
            id: 'introduction',
            title: 'Introduction',
            content: introContent,
            level: 2,
          })
        }
      }
      foundFirstHeading = true
      // Save previous section
      if (currentSection) {
        currentSection.content = contentLines.join('\n').trim()
        sections.push(currentSection)
      }
      // Start new section
      const title = h2Match ? h2Match[1] : h3Match![1]
      const level = h2Match ? 2 : 3
      currentSection = {
        id: title
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, ''),
        title,
        content: '',
        level,
      }
      contentLines = []
    } else if (!foundFirstHeading) {
      introLines.push(line)
    } else if (currentSection) {
      contentLines.push(line)
    }
  }
  // Don't forget the last section
  if (currentSection) {
    currentSection.content = contentLines.join('\n').trim()
    sections.push(currentSection)
  }
  return sections
}
export function parseOpenApiSpec(spec: OpenApiSpec): ParsedOpenApiSpec {
  const endpoints: ParsedEndpoint[] = []
  const tagsSet = new Set<string>()
  for (const [path, methods] of Object.entries(spec.paths)) {
    for (const [method, operation] of Object.entries(methods)) {
      if (!operation || typeof operation !== 'object') continue
      const tag = operation.tags?.[0] || 'Other'
      tagsSet.add(tag)
      const endpoint: ParsedEndpoint = {
        id: `${method}-${path}`.replace(/[^a-zA-Z0-9-]/g, '-'),
        path,
        method: method.toUpperCase() as HttpMethod,
        tag,
        operationId: operation.operationId || '',
        summary: operation.summary || '',
        description: operation.description || '',
        parameters: (operation.parameters || []).map(parseParameter),
        requestBody: parseRequestBody(spec, operation.requestBody),
        responses: operation.responses ? parseResponses(spec, operation.responses) : [],
        security: operation.security ? Object.keys(operation.security[0] || {}) : [],
      }
      endpoints.push(endpoint)
    }
  }
  // Parse all schemas from components
  const schemas: Record<string, ParsedSchema> = {}
  if (spec.components?.schemas) {
    for (const [name, schema] of Object.entries(spec.components.schemas)) {
      schemas[name] = parseSchema(spec, schema)
    }
  }
  // Build tag info with descriptions from top-level tags array
  const tagDescriptions = new Map<string, string>()
  if (spec.tags) {
    for (const tag of spec.tags) {
      tagDescriptions.set(tag.name, tag.description || '')
    }
  }
  const tags: TagInfo[] = Array.from(tagsSet).map((name) => ({
    name,
    description: tagDescriptions.get(name) || '',
  }))
  const sections = parseDescriptionSections(spec.info.description || '')
  return {
    info: {
      title: spec.info.title,
      description: spec.info.description,
      version: spec.info.version,
      sections,
    },
    servers: spec.servers,
    endpoints,
    tags,
    schemas,
  }
}
