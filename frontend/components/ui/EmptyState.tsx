import { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title?: string
  description?: string
  action?: ReactNode
}

export function EmptyState({
  icon,
  title = 'No items',
  description,
  action
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {icon && (
        <div className="mb-6 p-4 bg-surface-50 rounded-full">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-semibold text-surface-900 mb-2">{title}</h3>
      {description && (
        <p className="text-surface-500 text-center max-w-sm mb-6">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  )
}

export default EmptyState
