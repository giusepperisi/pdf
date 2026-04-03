import { create } from 'zustand'

export type PageName =
  | 'dashboard'
  | 'campaigns'
  | 'posts'
  | 'calendar'
  | 'settings'
  | 'analytics'

interface UiState {
  currentPage: PageName
  sidebarOpen: boolean
  navigate: (page: PageName) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useUiStore = create<UiState>((set) => ({
  currentPage: 'dashboard',
  sidebarOpen: true,
  navigate: (page) => set({ currentPage: page }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
