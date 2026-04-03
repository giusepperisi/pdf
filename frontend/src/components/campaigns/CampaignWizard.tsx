import { Loader2, X } from 'lucide-react'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { campaignsApi, clustersApi, type GeneratedCluster } from '../../api/client'
import { ClusterPicker } from './ClusterPicker'

interface CampaignWizardProps {
  onClose: () => void
  onSuccess?: (campaignId: number) => void
}

type Step = 1 | 2 | 3

export function CampaignWizard({ onClose, onSuccess }: CampaignWizardProps) {
  const queryClient = useQueryClient()
  const [step, setStep] = useState<Step>(1)
  const [error, setError] = useState<string | null>(null)

  // Step 1 fields
  const [title, setTitle] = useState('')
  const [topic, setTopic] = useState('')
  const [description, setDescription] = useState('')
  const [language, setLanguage] = useState('it')
  const [tone, setTone] = useState('professionale')

  // Step 2: cluster selection
  const [selectedClusters, setSelectedClusters] = useState<GeneratedCluster[]>([])

  // Step 3: schedule (optional)
  const [generateContent, setGenerateContent] = useState(true)
  const [platform, setPlatform] = useState<'both' | 'facebook' | 'instagram'>('both')

  const createMutation = useMutation({
    mutationFn: async () => {
      setError(null)
      // 1. Create campaign
      const campaign = await campaignsApi.create({ title, topic, description })

      // 2. Create clusters from selected generated clusters
      const savedClusters = await Promise.all(
        selectedClusters.map((gc) =>
          clustersApi.create({
            campaign_id: campaign.id,
            name: gc.name,
            keywords: gc.keywords,
            description: gc.description,
            tone: gc.tone,
            hashtags: gc.hashtags,
            language: gc.language,
          })
        )
      )

      // 3. Optionally generate content for each cluster
      if (generateContent) {
        await Promise.all(
          savedClusters.map((cluster) =>
            clustersApi.generateContent(cluster.id, platform, true).catch((e) => {
              console.warn(`Content gen failed for cluster ${cluster.id}:`, e)
            })
          )
        )
      }

      return campaign
    },
    onSuccess: (campaign) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      onSuccess?.(campaign.id)
      onClose()
    },
    onError: (e: Error) => {
      setError(e.message || 'Errore nella creazione della campagna')
    },
  })

  const canGoStep2 = title.trim() && topic.trim()
  const canGoStep3 = selectedClusters.length > 0

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Nuova Campagna</h2>
            <p className="text-sm text-gray-500">Step {step} di 3</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 py-3 flex gap-2">
          {([1, 2, 3] as Step[]).map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-blue-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Informazioni campagna</h3>

              <div>
                <label className="label">Titolo campagna *</label>
                <input
                  className="input"
                  placeholder="es. Lancio Prodotto Estate 2024"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Topic principale *</label>
                <input
                  className="input"
                  placeholder="es. abbigliamento sostenibile"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Descrizione</label>
                <textarea
                  className="input h-24 resize-none"
                  placeholder="Descrizione opzionale della campagna..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Lingua</label>
                  <select className="input" value={language} onChange={(e) => setLanguage(e.target.value)}>
                    <option value="it">Italiano</option>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>
                <div>
                  <label className="label">Tono comunicativo</label>
                  <select className="input" value={tone} onChange={(e) => setTone(e.target.value)}>
                    <option value="professionale">Professionale</option>
                    <option value="informale">Informale</option>
                    <option value="emozionale">Emozionale</option>
                    <option value="umoristico">Umoristico</option>
                    <option value="ispirazionale">Ispirazionale</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Seleziona cluster semantici</h3>
              <ClusterPicker
                topic={topic}
                language={language}
                tone={tone}
                selectedClusters={selectedClusters}
                onSelectionChange={setSelectedClusters}
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Opzioni di pubblicazione</h3>

              <div className="card">
                <p className="text-sm font-medium text-gray-900 mb-1">Riepilogo campagna</p>
                <p className="text-sm text-gray-600">
                  <strong>Titolo:</strong> {title}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Topic:</strong> {topic}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Cluster:</strong> {selectedClusters.length} selezionati
                </p>
              </div>

              <div>
                <label className="label">Piattaforma di pubblicazione</label>
                <select
                  className="input"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as typeof platform)}
                >
                  <option value="both">Facebook + Instagram</option>
                  <option value="facebook">Solo Facebook</option>
                  <option value="instagram">Solo Instagram</option>
                </select>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={generateContent}
                  onChange={(e) => setGenerateContent(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">Genera contenuti AI automaticamente</p>
                  <p className="text-xs text-gray-500">
                    Crea testo e immagini per ogni cluster selezionato
                  </p>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          {step > 1 ? (
            <button
              className="btn-secondary"
              onClick={() => setStep((s) => (s - 1) as Step)}
              disabled={createMutation.isPending}
            >
              Indietro
            </button>
          ) : (
            <button className="btn-secondary" onClick={onClose}>
              Annulla
            </button>
          )}

          {step < 3 ? (
            <button
              className="btn-primary disabled:opacity-50"
              onClick={() => setStep((s) => (s + 1) as Step)}
              disabled={(step === 1 && !canGoStep2) || (step === 2 && !canGoStep3)}
            >
              Avanti
            </button>
          ) : (
            <button
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending && <Loader2 size={16} className="animate-spin" />}
              {createMutation.isPending ? 'Creazione...' : 'Crea Campagna'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
