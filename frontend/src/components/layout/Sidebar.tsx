import {
  BarChart3,
  Calendar,
  FileText,
  LayoutDashboard,
  Megaphone,
  Settings,
  X,
} from 'lucide-react'
import { useUiStore, type PageName } from '../../stores/ui.store'

interface NavItem {
  label: string
  page: PageName
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { label: 'Dashboard', page: 'dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'Campagne', page: 'campaigns', icon: <Megaphone size={18} /> },
  { label: 'Post', page: 'posts', icon: <FileText size={18} /> },
  { label: 'Calendario', page: 'calendar', icon: <Calendar size={18} /> },
  { label: 'Analytics', page: 'analytics', icon: <BarChart3 size={18} /> },
  { label: 'Impostazioni', page: 'settings', icon: <Settings size={18} /> },
]

export function Sidebar() {
  const { currentPage, navigate, sidebarOpen, setSidebarOpen } = useUiStore()

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-60 bg-white border-r border-gray-200 z-30 transform transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:block`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <span className="text-lg font-bold text-blue-600">SocialManager</span>
          <button
            className="lg:hidden text-gray-400 hover:text-gray-600"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const active = currentPage === item.page
            return (
              <button
                key={item.page}
                onClick={() => {
                  navigate(item.page)
                  setSidebarOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
              >
                {item.icon}
                {item.label}
              </button>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
