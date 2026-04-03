import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { Loader2, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { campaignsApi, type Campaign } from '../api/client'
import { AppShell } from '../components/layout/AppShell'
import { CampaignWizard } from '../components/campaigns/CampaignWizard'

const statusLabel: Record<Campaign['status'], string> = {
  active: 'Attiva',
  paused: 'In pausa',
  completed: 'Completata',
}

const statusColor: Record<Campaign['status'], string> = {
  active: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-gray-100 text-gray-600',
}

export function CampaignsPage() {
  const queryClient = useQueryClient()
  const [showWizard, setShowWizard] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: campaignsApi.list,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => campaignsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: Campaign['status'] }) =>
      campaignsApi.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
  })

  return (
    <AppShell title="Campagne">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{campaigns.length} campagna/e totali</p>
          <button className="btn-primary flex items-center gap-2" onClick={() => setShowWizard(true)}>
            <Plus size={16} />
            Nuova Campagna
          </button>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-gray-400" size={32} />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="card text-center py-12 text-gray-400">
            <p className="text-lg mb-2">Nessuna campagna</p>
            <p className="text-sm">Crea la tua prima campagna con il wizard AI</p>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{campaign.title}</h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[campaign.status]}`}
                      >
                        {statusLabel[campaign.status]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">Topic: {campaign.topic}</p>
                    {campaign.description && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                        {campaign.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Creata il {format(new Date(campaign.created_at), 'dd MMM yyyy', { locale: it })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={campaign.status}
                      onChange={(e) =>
                        updateStatusMutation.mutate({
                          id: campaign.id,
                          status: e.target.value as Campaign['status'],
                        })
                      }
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1"
                    >
                      <option value="active">Attiva</option>
                      <option value="paused">In pausa</option>
                      <option value="completed">Completata</option>
                    </select>
                    <button
                      onClick={() => setExpandedId(expandedId === campaign.id ? null : campaign.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {expandedId === campaign.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Eliminare questa campagna e tutti i suoi dati?')) {
                          deleteMutation.mutate(campaign.id)
                        }
                      }}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {expandedId === campaign.id && campaign.clusters && campaign.clusters.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                      Cluster ({campaign.clusters.length})
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {campaign.clusters.map((cluster) => (
                        <div key={cluster.id} className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm font-medium text-gray-800">{cluster.name}</p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {cluster.description}
                          </p>
                          {cluster.hashtags && cluster.hashtags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {cluster.hashtags.slice(0, 3).map((h) => (
                                <span key={h} className="text-xs text-blue-600">
                                  #{h}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showWizard && <CampaignWizard onClose={() => setShowWizard(false)} />}
    </AppShell>
  )
}
