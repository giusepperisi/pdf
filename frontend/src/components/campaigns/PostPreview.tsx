import { Image, Loader2 } from 'lucide-react'
import type { Post } from '../../api/client'
import { PostStatusBadge } from '../posts/PostStatusBadge'

interface PostPreviewProps {
  post: Post
  loading?: boolean
}

export function PostPreview({ post, loading }: PostPreviewProps) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* Platform header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
            {post.platform === 'facebook' ? 'F' : post.platform === 'instagram' ? 'I' : 'F+I'}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 capitalize">{post.platform}</p>
            <p className="text-xs text-gray-400">Anteprima post</p>
          </div>
        </div>
        <PostStatusBadge status={post.status} />
      </div>

      {/* Image area */}
      {loading ? (
        <div className="h-48 bg-gray-100 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      ) : post.image_url ? (
        <img
          src={post.image_url}
          alt="Post image"
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="h-48 bg-gray-100 flex flex-col items-center justify-center gap-2 text-gray-400">
          <Image size={32} />
          <span className="text-sm">
            {post.image_prompt ? 'Immagine non generata' : 'Nessuna immagine'}
          </span>
        </div>
      )}

      {/* Text content */}
      {post.text_content && (
        <div className="px-4 py-3">
          <p className="text-sm text-gray-800 whitespace-pre-wrap line-clamp-6">
            {post.text_content}
          </p>
        </div>
      )}

      {/* Image prompt */}
      {post.image_prompt && !post.image_url && (
        <div className="px-4 pb-3">
          <p className="text-xs text-gray-400 italic">Prompt immagine: {post.image_prompt}</p>
        </div>
      )}
    </div>
  )
}
