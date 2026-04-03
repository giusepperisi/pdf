import type { Post } from '../../api/client'

const statusConfig: Record<
  Post['status'],
  { label: string; className: string }
> = {
  draft: { label: 'Bozza', className: 'bg-gray-100 text-gray-600' },
  scheduled: { label: 'Pianificato', className: 'bg-blue-100 text-blue-700' },
  published: { label: 'Pubblicato', className: 'bg-green-100 text-green-700' },
  failed: { label: 'Fallito', className: 'bg-red-100 text-red-700' },
}

interface PostStatusBadgeProps {
  status: Post['status']
}

export function PostStatusBadge({ status }: PostStatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' }
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  )
}
