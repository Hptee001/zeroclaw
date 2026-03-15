import { useVersion, useSessions } from '@/hooks/useTauri'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router'
import { Plus } from 'lucide-react'

export function HomePage() {
  const { data: version } = useVersion()
  const { sessions, createSession } = useSessions()
  const navigate = useNavigate()

  return (
    <div className="container mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Welcome to ZeroClaw</h1>
        <p className="text-muted-foreground">
          Zero overhead. Zero compromise. 100% Rust.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Version
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{version}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-lg font-medium">Online</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Quick Start</h2>
        <div className="flex gap-4">
          <Button
            onClick={() => createSession('New Session')}
            className="h-11 px-6"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Session
          </Button>
          <Button variant="outline" onClick={() => navigate('/settings')}>
            Open Settings
          </Button>
        </div>
      </div>

      {/* Recent Sessions */}
      {sessions && sessions.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Recent Sessions</h2>
          <div className="space-y-2">
            {sessions.slice(0, 5).map((session: unknown) => (
              <button
                key={(session as { id: string }).id}
                onClick={() => navigate(`/session/${(session as { id: string }).id}`)}
                className="w-full text-left p-4 rounded-lg border hover:bg-accent transition-colors"
              >
                <div className="font-medium">{(session as { name: string }).name}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Updated {new Date((session as { updated_at: string }).updated_at).toLocaleString()}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

