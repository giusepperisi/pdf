import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { Calendar, Image, Send, Trash2 } from 'lucide-react'
import type { Post } from '../../api/client'
import { PostStatusBadge } from './PostStatusBadge'

interface PostCardProps {
  post: Post
  onPublishNow?: (id: number) => void
  onDelete?: (id: number) => void
  onSchedule?: (post: Post) => void
}

export function PostCard({ post, onPublishNow, onDelete, onSchedule }: PostCardProps) {
  return (
    <div className="card flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <PostStatusBadge status={post.status} />
        <span className="text-xs text-gray-400 capitalize">{post.platform}</span>
      </div>

      {/* Image */}
      {post.image_url && (
        <div className="rounded-lg overflow-hidden bg-gray-100 h-40">
          <img src={post.image_url} alt="Post" className="w-full h-full object-cover" />
        </div>
      )}
      {!post.image_url && post.image_prompt && (
        <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 p-2 rounded-lg">
          <Image size={14} />
          <span className="truncate">{post.image_prompt}</span>
        </div>
      )}

      {/* Text */}
      {post.text_content && (
        <p className="text-sm text-gray-700 line-clamp-4 whitespace-pre-wrap">
          {post.text_content}
        </p>
      )}

      {/* Scheduled date */}
      {post.scheduled_at && (
        <div className="flex items-center gap-1.5 text-xs text-blue-600">
          <Calendar size={12} />
          {format(new Date(post.scheduled_at), 'dd MMM yyyy HH:mm', { locale: it })}
        </div>
      )}

      {/* Published date */}
      {post.published_at && (
        <div className="text-xs text-green-600">
          Pubblicato: {format(new Date(post.published_at), 'dd MMM yyyy HH:mm', { locale: it })}
        </div>
      )}

      {/* Error */}
      {post.error_message && (
        <p className="text-xs text-red-500 bg-red-50 p-2 rounded">{post.error_message}</p>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-2 border-t border-gray-100">
        {post.status !== 'published' && onSchedule && (
          <button
            onClick={() => onSchedule(post)}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
          >
            <Calendar size={12} />
            Pianifica
          </button>
        )}
        {post.status !== 'published' && onPublishNow && (
          <button
            onClick={() => onPublishNow(post.id)}
            className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800"
          >
            <Send size={12} />
            Pubblica ora
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(post.id)}
            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 ml-auto"
          >
            <Trash2 size={12} />
            Elimina
          </button>
        )}
      </div>
    </div>
  )
}
