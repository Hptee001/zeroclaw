import { useConfig } from '@/hooks/useTauri'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function SettingsPage() {
  const { data: config, isLoading } = useConfig()

  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-4xl font-bold mb-4">Settings</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Settings</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Application</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <div className="text-sm font-medium">Version</div>
              <div className="text-muted-foreground">
                {(config as { version?: string })?.version || 'Unknown'}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Providers</CardTitle>
          </CardHeader>
          <CardContent>
            {(config as { providers?: unknown[] })?.providers &&
            (config as { providers: unknown[] }).providers.length > 0 ? (
              <ul className="space-y-2">
                {(config as { providers: { name: string; provider_type: string; model: string }[] }).providers.map(
                  (provider) => (
                    <li key={provider.name} className="p-3 rounded-lg border">
                      <div className="font-medium">{provider.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Type: {provider.provider_type} • Model: {provider.model}
                      </div>
                    </li>
                  )
                )}
              </ul>
            ) : (
              <p className="text-muted-foreground">No providers configured</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span>Shell commands: {(config as { tools?: { shell_enabled?: boolean } })?.tools?.shell_enabled ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span>File read: {(config as { tools?: { file_read_enabled?: boolean } })?.tools?.file_read_enabled ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span>File write: {(config as { tools?: { file_write_enabled?: boolean } })?.tools?.file_write_enabled ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
