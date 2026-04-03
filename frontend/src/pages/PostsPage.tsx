import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { Calendar, Loader2, Send, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { postsApi, type Post } from '../api/client'
import { AppShell } from '../components/layout/AppShell'
import { PostStatusBadge } from '../components/posts/PostStatusBadge'

type FilterStatus = 'all' | Post['status']

const STATUSES: FilterStatus[] = ['all', 'draft', 'scheduled', 'published', 'failed']

const statusLabels: Record<FilterStatus, string> = {
  all: 'Tutti',
  draft: 'Bozze',
  scheduled: 'Pianificati',
  published: 'Pubblicati',
  failed: 'Falliti',
}

export function PostsPage() {
  const queryClient = useQueryClient()
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [schedulingPost, setSchedulingPost] = useState<Post | null>(null)
  const [scheduleDate, setScheduleDate] = useState('')

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['posts', filterStatus],
    queryFn: () =>
      postsApi.list(filterStatus !== 'all' ? { post_status: filterStatus } : undefined),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => postsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  })

  const publishNowMutation = useMutation({
    mutationFn: (id: number) => postsApi.publishNow(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  })

  const scheduleMutation = useMutation({
    mutationFn: ({ id, date }: { id: number; date: string }) =>
      postsApi.schedule(id, new Date(date).toISOString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      setSchedulingPost(null)
      setScheduleDate('')
    },
  })

  return (
    <AppShell title="Post">
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${filterStatus === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
            >
              {statusLabels[s]}
            </button>
          ))}
          <span className="ml-auto text-sm text-gray-400 self-center">
            {posts.length} post
          </span>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-gray-400" size={32} />
          </div>
        ) : posts.length === 0 ? (
          <div className="card text-center py-12 text-gray-400">
            <p>Nessun post trovato</p>
          </div>
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Contenuto</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Piattaforma</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Stato</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Pianificato</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Pubblicato</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {post.image_url && (
                          <img
                            src={post.image_url}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                        <p className="text-gray-800 line-clamp-2 max-w-xs">
                          {post.text_content || <span className="text-gray-400 italic">Nessun testo</span>}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="capitalize text-gray-600">{post.platform}</span>
                    </td>
                    <td className="px-4 py-3">
                      <PostStatusBadge status={post.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {post.scheduled_at
                        ? format(new Date(post.scheduled_at), 'dd/MM/yy HH:mm', { locale: it })
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {post.published_at
                        ? format(new Date(post.published_at), 'dd/MM/yy HH:mm', { locale: it })
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        {post.status !== 'published' && (
                          <>
                            <button
                              title="Pianifica"
                              onClick={() => {
                                setSchedulingPost(post)
                                setScheduleDate(
                                  post.scheduled_at
                                    ? post.scheduled_at.slice(0, 16)
                                    : new Date(Date.now() + 3600_000).toISOString().slice(0, 16)
                                )
                              }}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              <Calendar size={15} />
                            </button>
                            <button
                              title="Pubblica ora"
                              onClick={() => {
                                if (confirm('Pubblicare questo post adesso?')) {
                                  publishNowMutation.mutate(post.id)
                                }
                              }}
                              disabled={publishNowMutation.isPending}
                              className="text-green-500 hover:text-green-700 disabled:opacity-40"
                            >
                              <Send size={15} />
                            </button>
                          </>
                        )}
                        <button
                          title="Elimina"
                          onClick={() => {
                            if (confirm('Eliminare questo post?')) {
                              deleteMutation.mutate(post.id)
                            }
                          }}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedule modal */}
      {schedulingPost && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Pianifica post</h3>
            <div>
              <label className="label">Data e ora di pubblicazione (UTC locale)</label>
              <input
                type="datetime-local"
                className="input"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                className="btn-secondary"
                onClick={() => setSchedulingPost(null)}
              >
                Annulla
              </button>
              <button
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
                disabled={!scheduleDate || scheduleMutation.isPending}
                onClick={() =>
                  scheduleMutation.mutate({ id: schedulingPost.id, date: scheduleDate })
                }
              >
                {scheduleMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                Pianifica
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
