import { Menu } from 'lucide-react'
import { useUiStore } from '../../stores/ui.store'
import { Sidebar } from './Sidebar'

interface AppShellProps {
  children: React.ReactNode
  title: string
}

export function AppShell({ children, title }: AppShellProps) {
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-3 flex-shrink-0">
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700"
            onClick={toggleSidebar}
          >
            <Menu size={20} />
          </button>
          <h1 className="text-base font-semibold text-gray-800">{title}</h1>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
