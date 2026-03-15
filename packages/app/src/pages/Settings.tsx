import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useConfig } from '@/hooks/useTauri'

export function Settings() {
  const { data: config, isLoading } = useConfig()
  const [activeTab, setActiveTab] = useState<'general' | 'providers' | 'tools'>('general')

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-4xl font-bold mb-4">Settings</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">Settings</h1>
      
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 ${
            activeTab === 'general'
              ? 'border-b-2 border-primary'
              : 'text-muted-foreground'
          }`}
        >
          General
        </button>
        <button
          onClick={() => setActiveTab('providers')}
          className={`px-4 py-2 ${
            activeTab === 'providers'
              ? 'border-b-2 border-primary'
              : 'text-muted-foreground'
          }`}
        >
          Providers
        </button>
        <button
          onClick={() => setActiveTab('tools')}
          className={`px-4 py-2 ${
            activeTab === 'tools'
              ? 'border-b-2 border-primary'
              : 'text-muted-foreground'
          }`}
        >
          Tools
        </button>
      </div>

      <div className="space-y-6">
        {activeTab === 'general' && <GeneralSettings config={config} />}
        {activeTab === 'providers' && <ProvidersSettings config={config} />}
        {activeTab === 'tools' && <ToolsSettings config={config} />}
      </div>
    </div>
  )
}

function GeneralSettings({ config }: { config?: unknown }) {
  if (!config) return null
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Application</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-sm font-medium">Version</div>
          <div className="text-muted-foreground">
            {(config as { version?: string }).version}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ProvidersSettings({ config }: { config?: unknown }) {
  const providers = (config as { providers?: unknown[] })?.providers || []
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Providers</CardTitle>
      </CardHeader>
      <CardContent>
        {providers.length === 0 ? (
          <p className="text-muted-foreground">No providers configured</p>
        ) : (
          <ul className="space-y-2">
            {providers.map((provider: unknown) => (
              <li key={(provider as { name: string }).name} className="p-4 border rounded-lg">
                <div className="font-medium">{(provider as { name: string }).name}</div>
                <div className="text-sm text-muted-foreground">
                  Type: {(provider as { provider_type?: string }).provider_type}
                </div>
                <div className="text-sm text-muted-foreground">
                  Model: {(provider as { model?: string }).model}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function ToolsSettings({ config }: { config?: unknown }) {
  const tools = (config as { tools?: { shell_enabled?: boolean; file_read_enabled?: boolean; file_write_enabled?: boolean; browser_enabled?: boolean } }).tools
  
  if (!tools) return null
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tool Permissions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${tools.shell_enabled ? 'bg-green-500' : 'bg-gray-500'}`} />
          <span>Shell commands: {tools.shell_enabled ? 'Enabled' : 'Disabled'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${tools.file_read_enabled ? 'bg-green-500' : 'bg-gray-500'}`} />
          <span>File read: {tools.file_read_enabled ? 'Enabled' : 'Disabled'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${tools.file_write_enabled ? 'bg-green-500' : 'bg-gray-500'}`} />
          <span>File write: {tools.file_write_enabled ? 'Enabled' : 'Disabled'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${tools.browser_enabled ? 'bg-green-500' : 'bg-gray-500'}`} />
          <span>Browser automation: {tools.browser_enabled ? 'Enabled' : 'Disabled'}</span>
        </div>
      </CardContent>
    </Card>
  )
}
