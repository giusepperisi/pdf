import { useQuery } from '@tanstack/react-query'
import { useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import itLocale from '@fullcalendar/core/locales/it'
import { postsApi, type Post } from '../api/client'
import { AppShell } from '../components/layout/AppShell'

const statusColors: Record<Post['status'], string> = {
  draft: '#9ca3af',
  scheduled: '#3b82f6',
  published: '#10b981',
  failed: '#ef4444',
}

export function CalendarPage() {
  const calendarRef = useRef<FullCalendar>(null)

  const { data: scheduledPosts = [] } = useQuery({
    queryKey: ['posts', 'scheduled'],
    queryFn: () => postsApi.list({ post_status: 'scheduled' }),
  })

  const { data: publishedPosts = [] } = useQuery({
    queryKey: ['posts', 'published'],
    queryFn: () => postsApi.list({ post_status: 'published' }),
  })

  const allPosts = [...scheduledPosts, ...publishedPosts]

  const events = allPosts
    .filter((p) => p.scheduled_at || p.published_at)
    .map((post) => ({
      id: String(post.id),
      title:
        (post.text_content ? post.text_content.slice(0, 40) + '…' : 'Post') +
        ` [${post.platform}]`,
      start: post.published_at || post.scheduled_at!,
      backgroundColor: statusColors[post.status],
      borderColor: statusColors[post.status],
      extendedProps: { post },
    }))

  return (
    <AppShell title="Calendario">
      <div className="space-y-4">
        {/* Legend */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-gray-600">Pianificato</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-gray-600">Pubblicato</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-gray-600">Fallito</span>
          </div>
        </div>

        {/* Calendar */}
        <div className="card p-4">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale={itLocale}
            events={events}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,dayGridWeek',
            }}
            height="auto"
            eventClick={(info) => {
              const post = info.event.extendedProps.post as Post
              alert(
                `Post #${post.id}\nPiattaforma: ${post.platform}\nStato: ${post.status}\n\n${post.text_content?.slice(0, 200) || 'Nessun testo'}`
              )
            }}
          />
        </div>
      </div>
    </AppShell>
  )
}
