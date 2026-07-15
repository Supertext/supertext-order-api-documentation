import { parseOpenApiSpec } from './api-reference/lib/openapi-parser'
import ApiDocLayout from './api-reference/components/ApiDocLayout'
import type { ParsedOpenApiSpec } from './api-reference/lib/types'
// The Order API spec is bundled statically (no backend fetch).
import spec from '../openapi.json'

export default function OrderApiReferencePage() {
  const parsed = parseOpenApiSpec(spec as unknown as Parameters<typeof parseOpenApiSpec>[0])
  return (
    <div className="bg-backgrounds-backgroundLight">
      <main className="api-docs min-h-screen bg-backgrounds-backgroundLight max-w-screen-2xl mx-auto pt-20 pb-20">
        <ApiDocLayout spec={parsed as ParsedOpenApiSpec} />
      </main>
    </div>
  )
}
