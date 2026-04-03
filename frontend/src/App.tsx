import { useUiStore } from './stores/ui.store'
import { DashboardPage } from './pages/DashboardPage'
import { CampaignsPage } from './pages/CampaignsPage'
import { PostsPage } from './pages/PostsPage'
import { CalendarPage } from './pages/CalendarPage'
import { SettingsPage } from './pages/SettingsPage'
import { AnalyticsPage } from './pages/AnalyticsPage'

function App() {
  const currentPage = useUiStore((s) => s.currentPage)

  switch (currentPage) {
    case 'dashboard':
      return <DashboardPage />
    case 'campaigns':
      return <CampaignsPage />
    case 'posts':
      return <PostsPage />
    case 'calendar':
      return <CalendarPage />
    case 'analytics':
      return <AnalyticsPage />
    case 'settings':
      return <SettingsPage />
    default:
      return <DashboardPage />
  }
}

export default App
