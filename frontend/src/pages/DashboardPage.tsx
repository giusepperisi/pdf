import { useQuery } from '@tanstack/react-query'
import { BarChart3, Calendar, CheckCircle, FileText, Megaphone, XCircle } from 'lucide-react'
import { analyticsApi } from '../api/client'
import { AppShell } from '../components/layout/AppShell'

interface StatCardProps {
  label: string
  value: number | string
  icon: React.ReactNode
  color: string
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: analyticsApi.posts,
    refetchInterval: 60_000,
  })

  return (
    <AppShell title="Dashboard">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Benvenuto in SocialManager-AI</h2>
          <p className="text-sm text-gray-500">
            Gestisci campagne social con l'assistenza dell'intelligenza artificiale.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card animate-pulse h-24 bg-gray-100" />
            ))}
          </div>
        ) : analytics ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <StatCard
              label="Campagne attive"
              value={analytics.active_campaigns}
              icon={<Megaphone size={22} className="text-blue-600" />}
              color="bg-blue-100"
            />
            <StatCard
              label="Cluster totali"
              value={analytics.total_clusters}
              icon={<BarChart3 size={22} className="text-purple-600" />}
              color="bg-purple-100"
            />
            <StatCard
              label="Post totali"
              value={analytics.total_posts}
              icon={<FileText size={22} className="text-gray-600" />}
              color="bg-gray-100"
            />
            <StatCard
              label="Post pubblicati"
              value={analytics.published}
              icon={<CheckCircle size={22} className="text-green-600" />}
              color="bg-green-100"
            />
            <StatCard
              label="Post pianificati"
              value={analytics.scheduled}
              icon={<Calendar size={22} className="text-blue-600" />}
              color="bg-blue-100"
            />
            <StatCard
              label="Bozze"
              value={analytics.draft}
              icon={<FileText size={22} className="text-yellow-600" />}
              color="bg-yellow-100"
            />
            <StatCard
              label="Falliti"
              value={analytics.failed}
              icon={<XCircle size={22} className="text-red-600" />}
              color="bg-red-100"
            />
          </div>
        ) : null}

        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-3">Come iniziare</h3>
          <ol className="space-y-2 text-sm text-gray-600 list-decimal list-inside">
            <li>Vai su <strong>Impostazioni</strong> e aggiungi il tuo Page Access Token di Facebook/Instagram</li>
            <li>Vai su <strong>Campagne</strong> e crea una nuova campagna con il wizard AI</li>
            <li>Il sistema genererà automaticamente cluster semantici, testi e immagini</li>
            <li>Pianifica o pubblica i post direttamente dal modulo <strong>Post</strong></li>
            <li>Monitora le pubblicazioni nel <strong>Calendario</strong></li>
          </ol>
        </div>
      </div>
    </AppShell>
  )
}
