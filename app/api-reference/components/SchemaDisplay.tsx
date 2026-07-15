'use client'
import { useState } from 'react'
import type { ParsedSchema, ParsedSchemaProperty } from '../lib/types'
interface SchemaDisplayProps {
  schema: ParsedSchema
}
function PropertyRow({
  name,
  property,
  depth = 0,
  isRequired = false,
}: {
  name: string
  property: ParsedSchemaProperty
  depth?: number
  isRequired?: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(depth < 1)
  const hasNested = property.properties || property.items?.properties
  const getTypeDisplay = () => {
    if (property.type === 'array' && property.items) {
      return `array<${property.items.type || 'object'}>`
    }
    return property.type
  }
  return (
    <>
      <tr className="group">
        <td className="py-3 pr-4 align-top max-w-52 min-w-52">
          <div className="flex items-center gap-2 flex-wrap">
            {hasNested && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-5 h-5 flex items-center justify-center text-primary-default/40 hover:text-primary-default transition-colors rounded-md hover:bg-primary-default/5 shrink-0"
              >
                <svg
                  className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
            <span className="text-sm font-mono text-primary-default break-words min-w-0">{name}</span>
            {isRequired && (
              <span className="text-[9px] font-semibold text-red-500 uppercase tracking-wide">required</span>
            )}
          </div>
        </td>
        <td className="py-3 pr-4 align-top">
          <span className="text-sm font-mono text-blue-600">{getTypeDisplay()}</span>
          {property.format && (
            <span className="ml-1 text-xs text-primary-default/40">({property.format})</span>
          )}
        </td>
        <td className="py-3 align-top text-sm text-primary-default/60">
          {property.description && <span className="whitespace-pre-line">{property.description}</span>}
          {property.enum && (
            <div className="mt-2">
              <span className="text-xs text-primary-default/40">Enum: </span>
              <span className="text-xs font-mono text-primary-default/60">
                {property.enum.map((v, i) => (
                  <span key={v}>
                    {i > 0 && ' | '}
                    <span className="text-purple-600">&quot;{v}&quot;</span>
                  </span>
                ))}
              </span>
            </div>
          )}
          {property.default !== undefined && (
            <div className="mt-1 text-xs text-primary-default/40">
              Default: <code className="text-primary-default/60">{JSON.stringify(property.default)}</code>
            </div>
          )}
          {property.example !== undefined && (
            <div className="mt-1 text-xs text-primary-default/40">
              Example: <code className="text-primary-default/60">{JSON.stringify(property.example)}</code>
            </div>
          )}
        </td>
      </tr>
      {hasNested &&
        isExpanded &&
        property.properties &&
        Object.entries(property.properties).map(([childName, childProp]) => (
          <PropertyRow
            key={childName}
            name={childName}
            property={childProp}
            depth={depth + 1}
            isRequired={childProp.required}
          />
        ))}
    </>
  )
}
export default function SchemaDisplay({ schema }: SchemaDisplayProps) {
  if (!schema.properties || Object.keys(schema.properties).length === 0) {
    return <div className="text-sm text-primary-default/50">No schema properties defined</div>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-primary-default/10">
            <th className="text-left pb-3 text-xs font-semibold text-primary-default/50 uppercase tracking-wide w-48">
              Property
            </th>
            <th className="text-left pb-3 text-xs font-semibold text-primary-default/50 uppercase tracking-wide w-32">
              Type
            </th>
            <th className="text-left pb-3 text-xs font-semibold text-primary-default/50 uppercase tracking-wide">
              Description
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-primary-default/5">
          {Object.entries(schema.properties).map(([name, property]) => (
            <PropertyRow
              key={name}
              name={name}
              property={property}
              isRequired={schema.required?.includes(name)}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
