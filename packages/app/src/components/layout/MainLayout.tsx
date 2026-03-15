import { Outlet } from 'react-router'
import { Sidebar } from './Sidebar'

/**
 * Main Layout Component
 * Sidebar on left, content area on right
 */
export function MainLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar navigation */}
      <Sidebar />
      
      {/* Main content area */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
