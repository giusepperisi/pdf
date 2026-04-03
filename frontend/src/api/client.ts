import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Campaign {
  id: number
  title: string
  topic: string
  description?: string
  status: 'active' | 'paused' | 'completed'
  created_at: string
  updated_at?: string
  clusters?: Cluster[]
}

export interface CampaignCreate {
  title: string
  topic: string
  description?: string
}

export interface Cluster {
  id: number
  campaign_id: number
  name: string
  keywords?: string[]
  description?: string
  tone: string
  hashtags?: string[]
  language: string
  created_at: string
}

export interface ClusterCreate {
  campaign_id: number
  name: string
  keywords?: string[]
  description?: string
  tone?: string
  hashtags?: string[]
  language?: string
}

export interface GeneratedCluster {
  name: string
  keywords: string[]
  description: string
  tone: string
  hashtags: string[]
  language: string
}

export interface Post {
  id: number
  cluster_id: number
  platform: 'facebook' | 'instagram' | 'both'
  text_content?: string
  image_prompt?: string
  image_url?: string
  status: 'draft' | 'scheduled' | 'published' | 'failed'
  scheduled_at?: string
  published_at?: string
  fb_post_id?: string
  ig_post_id?: string
  error_message?: string
  created_at: string
  updated_at?: string
}

export interface PostCreate {
  cluster_id: number
  platform?: 'facebook' | 'instagram' | 'both'
  text_content?: string
  image_prompt?: string
  image_url?: string
}

export interface SocialAccount {
  id: number
  platform: 'facebook' | 'instagram'
  page_id: string
  page_name?: string
  ig_business_id?: string
  token_expires_at?: string
  connected_at: string
  days_until_expiry?: number
}

export interface SocialAccountCreate {
  platform: 'facebook' | 'instagram'
  page_id: string
  page_name?: string
  access_token: string
  token_expires_at?: string
  ig_business_id?: string
}

export interface Analytics {
  total_posts: number
  published: number
  scheduled: number
  draft: number
  failed: number
  active_campaigns: number
  total_clusters: number
}

// ─── Campaign API ──────────────────────────────────────────────────────────────

export const campaignsApi = {
  list: () => apiClient.get<Campaign[]>('/campaigns/').then(r => r.data),
  get: (id: number) => apiClient.get<Campaign>(`/campaigns/${id}`).then(r => r.data),
  create: (data: CampaignCreate) => apiClient.post<Campaign>('/campaigns/', data).then(r => r.data),
  update: (id: number, data: Partial<CampaignCreate & { status: string }>) =>
    apiClient.patch<Campaign>(`/campaigns/${id}`, data).then(r => r.data),
  delete: (id: number) => apiClient.delete(`/campaigns/${id}`),
}

// ─── Cluster API ───────────────────────────────────────────────────────────────

export const clustersApi = {
  list: (campaign_id?: number) =>
    apiClient.get<Cluster[]>('/clusters/', { params: campaign_id ? { campaign_id } : {} }).then(r => r.data),
  get: (id: number) => apiClient.get<Cluster>(`/clusters/${id}`).then(r => r.data),
  create: (data: ClusterCreate) => apiClient.post<Cluster>('/clusters/', data).then(r => r.data),
  update: (id: number, data: Partial<ClusterCreate>) =>
    apiClient.patch<Cluster>(`/clusters/${id}`, data).then(r => r.data),
  delete: (id: number) => apiClient.delete(`/clusters/${id}`),
  generate: (params: { topic: string; language: string; n_clusters: number; tone: string }) =>
    apiClient.post<GeneratedCluster[]>('/clusters/generate', params).then(r => r.data),
  generateContent: (id: number, platform: string = 'both', generate_image: boolean = true) =>
    apiClient
      .post<Post>(`/clusters/${id}/generate-content`, null, {
        params: { platform, generate_image },
      })
      .then(r => r.data),
}

// ─── Posts API ─────────────────────────────────────────────────────────────────

export const postsApi = {
  list: (params?: { cluster_id?: number; post_status?: string }) =>
    apiClient.get<Post[]>('/posts/', { params }).then(r => r.data),
  get: (id: number) => apiClient.get<Post>(`/posts/${id}`).then(r => r.data),
  create: (data: PostCreate) => apiClient.post<Post>('/posts/', data).then(r => r.data),
  update: (id: number, data: Partial<Post>) =>
    apiClient.patch<Post>(`/posts/${id}`, data).then(r => r.data),
  delete: (id: number) => apiClient.delete(`/posts/${id}`),
  schedule: (id: number, scheduled_at: string) =>
    apiClient.patch<Post>(`/posts/${id}/schedule`, { scheduled_at }).then(r => r.data),
  publishNow: (id: number) => apiClient.post<Post>(`/posts/${id}/publish-now`).then(r => r.data),
}

// ─── Social Accounts API ────────────────────────────────────────────────────────

export const socialAccountsApi = {
  list: () => apiClient.get<SocialAccount[]>('/social-accounts/').then(r => r.data),
  get: (id: number) => apiClient.get<SocialAccount>(`/social-accounts/${id}`).then(r => r.data),
  create: (data: SocialAccountCreate) =>
    apiClient.post<SocialAccount>('/social-accounts/', data).then(r => r.data),
  update: (id: number, data: Partial<SocialAccountCreate>) =>
    apiClient.patch<SocialAccount>(`/social-accounts/${id}`, data).then(r => r.data),
  delete: (id: number) => apiClient.delete(`/social-accounts/${id}`),
  verify: (id: number) =>
    apiClient
      .post<{ valid: boolean; user_id?: string; name?: string; error?: string }>(
        `/social-accounts/${id}/verify`
      )
      .then(r => r.data),
}

// ─── Analytics API ─────────────────────────────────────────────────────────────

export const analyticsApi = {
  posts: () => apiClient.get<Analytics>('/analytics/posts').then(r => r.data),
  byPlatform: () =>
    apiClient.get<Record<string, number>>('/analytics/posts/by-platform').then(r => r.data),
  byStatus: () =>
    apiClient.get<Record<string, number>>('/analytics/posts/by-status').then(r => r.data),
}
