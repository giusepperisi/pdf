import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { analyticsApi } from '../api/client'
import { AppShell } from '../components/layout/AppShell'

interface BarProps {
  label: string
  value: number
  total: number
  color: string
}

function Bar({ label, value, total, color }: BarProps) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 capitalize">{label}</span>
        <span className="font-semibold text-gray-900">
          {value} <span className="text-gray-400 font-normal">({pct}%)</span>
        </span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

const platformColors: Record<string, string> = {
  facebook: 'bg-blue-500',
  instagram: 'bg-pink-500',
  both: 'bg-purple-500',
}

const statusColors: Record<string, string> = {
  published: 'bg-green-500',
  scheduled: 'bg-blue-400',
  draft: 'bg-gray-400',
  failed: 'bg-red-400',
}

export function AnalyticsPage() {
  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['analytics'],
    queryFn: analyticsApi.posts,
  })

  const { data: byPlatform, isLoading: loadingPlatform } = useQuery({
    queryKey: ['analytics', 'by-platform'],
    queryFn: analyticsApi.byPlatform,
  })

  const { data: byStatus, isLoading: loadingStatus } = useQuery({
    queryKey: ['analytics', 'by-status'],
    queryFn: analyticsApi.byStatus,
  })

  const isLoading = loadingAnalytics || loadingPlatform || loadingStatus

  return (
    <AppShell title="Analytics">
      <div className="space-y-6 max-w-3xl">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-gray-400" size={32} />
          </div>
        ) : (
          <>
            {/* Summary cards */}
            {analytics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Campagne', value: analytics.active_campaigns, cls: 'text-blue-600' },
                  { label: 'Cluster', value: analytics.total_clusters, cls: 'text-purple-600' },
                  { label: 'Post totali', value: analytics.total_posts, cls: 'text-gray-700' },
                  { label: 'Pubblicati', value: analytics.published, cls: 'text-green-600' },
                ].map((item) => (
                  <div key={item.label} className="card text-center">
                    <p className={`text-3xl font-bold ${item.cls}`}>{item.value}</p>
                    <p className="text-sm text-gray-500 mt-1">{item.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* By status */}
            {byStatus && analytics && analytics.total_posts > 0 && (
              <div className="card space-y-4">
                <h3 className="font-semibold text-gray-900">Post per stato</h3>
                {Object.entries(byStatus).map(([status, count]) => (
                  <Bar
                    key={status}
                    label={status}
                    value={count}
                    total={analytics.total_posts}
                    color={statusColors[status] || 'bg-gray-400'}
                  />
                ))}
              </div>
            )}

            {/* By platform */}
            {byPlatform && analytics && analytics.total_posts > 0 && (
              <div className="card space-y-4">
                <h3 className="font-semibold text-gray-900">Post per piattaforma</h3>
                {Object.entries(byPlatform).map(([platform, count]) => (
                  <Bar
                    key={platform}
                    label={platform}
                    value={count}
                    total={analytics.total_posts}
                    color={platformColors[platform] || 'bg-gray-400'}
                  />
                ))}
              </div>
            )}

            {analytics && analytics.total_posts === 0 && (
              <div className="card text-center py-12 text-gray-400">
                <p>Nessun dato disponibile. Crea e pubblica post per vedere le metriche.</p>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
