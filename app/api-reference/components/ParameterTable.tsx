'use client'
import type { ParsedParameter } from '../lib/types'
interface ParameterTableProps {
  parameters: ParsedParameter[]
  title?: string
}
export default function ParameterTable({ parameters, title = 'Parameters' }: ParameterTableProps) {
  if (parameters.length === 0) return null
  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold text-primary-default mb-2">{title}</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-primary-default/10">
              <th className="text-left py-2 pr-4 font-medium text-primary-default/70">Name</th>
              <th className="text-left py-2 pr-4 font-medium text-primary-default/70">Type</th>
              <th className="text-left py-2 pr-4 font-medium text-primary-default/70">Required</th>
              <th className="text-left py-2 font-medium text-primary-default/70">Description</th>
            </tr>
          </thead>
          <tbody>
            {parameters.map((param) => (
              <tr key={param.name} className="border-b border-primary-default/5">
                <td className="py-2 pr-4">
                  <code className="text-xs bg-primary-default/5 px-1.5 py-0.5 rounded font-mono">
                    {param.name}
                  </code>
                </td>
                <td className="py-2 pr-4">
                  <span className="text-primary-default/70">{param.type}</span>
                  {param.enum && (
                    <span className="text-xs text-primary-default/50 ml-1">({param.enum.join(' | ')})</span>
                  )}
                </td>
                <td className="py-2 pr-4">
                  {param.required ? (
                    <span className="text-xs text-red-600 font-medium">required</span>
                  ) : (
                    <span className="text-xs text-primary-default/50">optional</span>
                  )}
                </td>
                <td className="py-2 text-primary-default/70">
                  {param.description}
                  {param.default !== undefined && (
                    <span className="text-xs text-primary-default/50 ml-1">
                      (default: {String(param.default)})
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
