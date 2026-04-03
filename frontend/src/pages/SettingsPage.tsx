import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, Loader2, Plus, Trash2, XCircle } from 'lucide-react'
import { useState } from 'react'
import { socialAccountsApi, type SocialAccountCreate } from '../api/client'
import { AppShell } from '../components/layout/AppShell'

const defaultForm: SocialAccountCreate = {
  platform: 'facebook',
  page_id: '',
  page_name: '',
  access_token: '',
  ig_business_id: '',
  token_expires_at: undefined,
}

export function SettingsPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<SocialAccountCreate>({ ...defaultForm })
  const [verifyStatus, setVerifyStatus] = useState<Record<number, { valid: boolean; name?: string; error?: string } | null>>({})

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['social-accounts'],
    queryFn: socialAccountsApi.list,
  })

  const createMutation = useMutation({
    mutationFn: (data: SocialAccountCreate) => socialAccountsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] })
      setShowForm(false)
      setForm({ ...defaultForm })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => socialAccountsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['social-accounts'] }),
  })

  const verifyAccount = async (id: number) => {
    setVerifyStatus((prev) => ({ ...prev, [id]: null }))
    const result = await socialAccountsApi.verify(id)
    setVerifyStatus((prev) => ({ ...prev, [id]: result }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: SocialAccountCreate = {
      ...form,
      ig_business_id: form.ig_business_id || undefined,
      page_name: form.page_name || undefined,
      token_expires_at: form.token_expires_at || undefined,
    }
    createMutation.mutate(payload)
  }

  return (
    <AppShell title="Impostazioni">
      <div className="max-w-2xl space-y-6">
        {/* Social accounts */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Account Social</h2>
            <button
              className="btn-primary flex items-center gap-2"
              onClick={() => setShowForm(!showForm)}
            >
              <Plus size={16} />
              Aggiungi Account
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="card mb-4 space-y-4">
              <h3 className="font-semibold text-gray-900">Nuovo Account Social</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Piattaforma *</label>
                  <select
                    className="input"
                    value={form.platform}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, platform: e.target.value as 'facebook' | 'instagram' }))
                    }
                  >
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                  </select>
                </div>
                <div>
                  <label className="label">Nome pagina</label>
                  <input
                    className="input"
                    placeholder="es. La Mia Pagina"
                    value={form.page_name || ''}
                    onChange={(e) => setForm((f) => ({ ...f, page_name: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="label">Page ID *</label>
                <input
                  className="input"
                  placeholder="ID numerico della pagina Facebook"
                  value={form.page_id}
                  onChange={(e) => setForm((f) => ({ ...f, page_id: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="label">Page Access Token *</label>
                <textarea
                  className="input h-24 font-mono text-xs resize-none"
                  placeholder="Incolla qui il Page Access Token (verrà cifrato)"
                  value={form.access_token}
                  onChange={(e) => setForm((f) => ({ ...f, access_token: e.target.value }))}
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Il token viene cifrato prima del salvataggio nel database.
                </p>
              </div>

              {form.platform === 'instagram' && (
                <div>
                  <label className="label">Instagram Business Account ID</label>
                  <input
                    className="input"
                    placeholder="ID numerico IG Business Account"
                    value={form.ig_business_id || ''}
                    onChange={(e) => setForm((f) => ({ ...f, ig_business_id: e.target.value }))}
                  />
                </div>
              )}

              <div>
                <label className="label">Scadenza token (opzionale)</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={form.token_expires_at ? String(form.token_expires_at).slice(0, 16) : ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      token_expires_at: e.target.value
                        ? (new Date(e.target.value).toISOString() as unknown as undefined)
                        : undefined,
                    }))
                  }
                />
              </div>

              {createMutation.isError && (
                <p className="text-sm text-red-500">
                  Errore: {(createMutation.error as Error)?.message}
                </p>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowForm(false)}
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                  Salva Account
                </button>
              </div>
            </form>
          )}

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-gray-400" size={24} />
            </div>
          ) : accounts.length === 0 ? (
            <div className="card text-center py-8 text-gray-400">
              <p>Nessun account social configurato</p>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => {
                const vs = verifyStatus[account.id]
                return (
                  <div key={account.id} className="card">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                              account.platform === 'facebook' ? 'bg-blue-600' : 'bg-pink-500'
                            }`}
                          >
                            {account.platform === 'facebook' ? 'F' : 'I'}
                          </div>
                          <p className="font-semibold text-gray-900 capitalize">
                            {account.page_name || account.platform}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500">Page ID: {account.page_id}</p>
                        {account.ig_business_id && (
                          <p className="text-xs text-gray-500">IG ID: {account.ig_business_id}</p>
                        )}
                        {account.days_until_expiry !== undefined &&
                          account.days_until_expiry !== null && (
                            <p
                              className={`text-xs mt-1 ${
                                account.days_until_expiry < 7 ? 'text-red-500' : 'text-gray-400'
                              }`}
                            >
                              Token scade tra {account.days_until_expiry} giorni
                            </p>
                          )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => verifyAccount(account.id)}
                          className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 px-2 py-1 rounded-lg"
                        >
                          Verifica
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Rimuovere questo account?')) {
                              deleteMutation.mutate(account.id)
                            }
                          }}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {vs !== undefined && vs !== null && (
                      <div
                        className={`mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-sm ${
                          vs.valid ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {vs.valid ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        {vs.valid
                          ? `Token valido — ${vs.name || 'OK'}`
                          : `Token non valido: ${vs.error}`}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="card bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">Come ottenere un Page Access Token</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Vai su developers.facebook.com</li>
            <li>Crea o apri la tua App</li>
            <li>Vai su Graph API Explorer</li>
            <li>Seleziona la tua Pagina e genera un Page Access Token</li>
            <li>Per token non scadenti, usa l'API di exchange per token a lungo termine</li>
          </ol>
        </div>
      </div>
    </AppShell>
  )
}
