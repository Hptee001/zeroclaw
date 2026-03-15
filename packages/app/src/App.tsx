import { Routes, Route, Link, useLocation } from 'react-router'
import { useSessions, useVersion } from './hooks'
import { ChatView } from './components/ChatView'
import { SettingsPanel } from './components/SettingsPanel'

function App() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/session/:id" element={<ChatView />} />
          <Route path="/settings" element={<SettingsPanel />} />
        </Routes>
      </main>
    </div>
  )
}

function Sidebar() {
  const { sessions, createSession, isLoading } = useSessions()
  const { data: version } = useVersion()
  const location = useLocation()

  return (
    <aside className="w-64 border-r bg-sidebar flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">ZeroClaw</h2>
        <p className="text-xs text-muted-foreground">v{version}</p>
      </div>
      
      {/* New Session Button */}
      <div className="p-4">
        <button
          onClick={() => createSession('New Session')}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          + New Session
        </button>
      </div>
      
      {/* Navigation */}
      <nav className="px-2 space-y-1">
        <Link
          to="/"
          className={`block px-3 py-2 rounded-md ${
            location.pathname === '/' ? 'bg-accent' : 'hover:bg-accent'
          }`}
        >
          Home
        </Link>
        <Link
          to="/settings"
          className={`block px-3 py-2 rounded-md ${
            location.pathname === '/settings' ? 'bg-accent' : 'hover:bg-accent'
          }`}
        >
          Settings
        </Link>
      </nav>
      
      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-2">
        <h3 className="text-xs font-medium text-muted-foreground mb-2 px-3">
          Recent Sessions
        </h3>
        {isLoading ? (
          <p className="text-sm text-muted-foreground px-3">Loading...</p>
        ) : sessions && sessions.length > 0 ? (
          <ul className="space-y-1">
            {sessions.slice(0, 10).map((session: unknown) => (
              <li key={(session as { id: string }).id}>
                <Link
                  to={`/session/${(session as { id: string }).id}`}
                  className={`block px-3 py-2 rounded-md truncate ${
                    location.pathname === `/session/${(session as { id: string }).id}`
                      ? 'bg-accent'
                      : 'hover:bg-accent'
                  }`}
                >
                  {(session as { name: string }).name}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground px-3">No sessions yet</p>
        )}
      </div>
    </aside>
  )
}

function HomePage() {
  const { data: version } = useVersion()
  const { sessions } = useSessions()

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-4">Welcome to ZeroClaw</h1>
      <p className="text-muted-foreground mb-6">
        Zero overhead. Zero compromise. 100% Rust.
      </p>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Version</h2>
          <p className="text-muted-foreground">{version}</p>
        </div>
        
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Sessions</h2>
          <p className="text-muted-foreground">
            {sessions?.length || 0} total
          </p>
        </div>
        
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Status</h2>
          <p className="text-green-600">● Online</p>
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Quick Start</h2>
        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
          <li>Create a new session using the button in the sidebar</li>
          <li>Type your message and press Enter</li>
          <li>Watch the AI respond in real-time</li>
          <li>Configure providers and tools in Settings</li>
        </ol>
      </div>
    </div>
  )
}

export default App
