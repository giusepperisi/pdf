import { Check, Loader2, Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import { clustersApi, type GeneratedCluster } from '../../api/client'

interface ClusterPickerProps {
  topic: string
  language: string
  tone: string
  selectedClusters: GeneratedCluster[]
  onSelectionChange: (clusters: GeneratedCluster[]) => void
}

export function ClusterPicker({
  topic,
  language,
  tone,
  selectedClusters,
  onSelectionChange,
}: ClusterPickerProps) {
  const [generatedClusters, setGeneratedClusters] = useState<GeneratedCluster[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateClusters = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await clustersApi.generate({
        topic,
        language,
        n_clusters: 5,
        tone,
      })
      setGeneratedClusters(result)
    } catch (e) {
      setError('Errore nella generazione dei cluster. Riprova.')
    } finally {
      setLoading(false)
    }
  }

  const isSelected = (cluster: GeneratedCluster) =>
    selectedClusters.some((c) => c.name === cluster.name)

  const toggleCluster = (cluster: GeneratedCluster) => {
    if (isSelected(cluster)) {
      onSelectionChange(selectedClusters.filter((c) => c.name !== cluster.name))
    } else {
      onSelectionChange([...selectedClusters, cluster])
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">
            Genera cluster semantici AI per il topic: <strong>{topic}</strong>
          </p>
        </div>
        <button
          type="button"
          onClick={generateClusters}
          disabled={loading || !topic}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {generatedClusters.length > 0 ? 'Rigenera' : 'Genera Cluster'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600 flex items-start gap-2">
          <X size={16} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {generatedClusters.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {generatedClusters.map((cluster) => {
            const selected = isSelected(cluster)
            return (
              <button
                key={cluster.name}
                type="button"
                onClick={() => toggleCluster(cluster)}
                className={`text-left p-4 rounded-xl border-2 transition-all
                  ${selected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-semibold text-sm text-gray-900">{cluster.name}</span>
                  {selected && (
                    <span className="text-blue-500 flex-shrink-0">
                      <Check size={16} />
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-2 line-clamp-2">{cluster.description}</p>
                <div className="flex flex-wrap gap-1">
                  {cluster.keywords.slice(0, 4).map((kw) => (
                    <span
                      key={kw}
                      className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {selectedClusters.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-sm font-medium text-blue-800 mb-2">
            {selectedClusters.length} cluster selezionati:
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedClusters.map((c) => (
              <span
                key={c.name}
                className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full flex items-center gap-1"
              >
                {c.name}
                <button
                  type="button"
                  onClick={() => toggleCluster(c)}
                  className="hover:text-blue-900"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
