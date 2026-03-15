import { Link } from 'react-router'
import { useSessions } from '../hooks'

export function Sidebar() {
  const { sessions, createSession } = useSessions()

  return (
    <aside className="w-64 border-r bg-sidebar p-4">
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">ZeroClaw</h2>
        <button
          onClick={() => createSession('New Session')}
          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          + New Session
        </button>
      </div>
      
      <nav className="space-y-1">
        <Link
          to="/"
          className="block px-3 py-2 rounded-md hover:bg-accent"
        >
          Home
        </Link>
        <Link
          to="/settings"
          className="block px-3 py-2 rounded-md hover:bg-accent"
        >
          Settings
        </Link>
      </nav>
      
      <div className="mt-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">
          Recent Sessions
        </h3>
        {sessions && sessions.length > 0 ? (
          <ul className="space-y-1">
            {sessions.slice(0, 5).map((session: unknown) => (
              <li key={(session as { id: string }).id}>
                <Link
                  to={`/session/${(session as { id: string }).id}`}
                  className="block px-3 py-2 rounded-md hover:bg-accent truncate"
                >
                  {(session as { name: string }).name}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No recent sessions</p>
        )}
      </div>
    </aside>
  )
}
