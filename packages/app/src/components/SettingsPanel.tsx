import { useState } from 'react'
import { useConfig } from '../hooks'

export function SettingsPanel() {
  const { data: config, isLoading } = useConfig()
  const [activeTab, setActiveTab] = useState<'general' | 'providers' | 'tools'>('general')

  if (isLoading) {
    return <div className="p-4">Loading settings...</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
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
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-2">Application</h2>
        <p className="text-muted-foreground">
          Version: {(config as { version?: string }).version}
        </p>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-2">Memory</h2>
        <p className="text-muted-foreground">
          Type: {(config as { memory?: { memory_type?: string } }).memory?.memory_type}
        </p>
      </div>
    </div>
  )
}

function ProvidersSettings({ config }: { config?: unknown }) {
  const providers = (config as { providers?: unknown[] })?.providers || []
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">AI Providers</h2>
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
    </div>
  )
}

function ToolsSettings({ config }: { config?: unknown }) {
  const tools = (config as { tools?: { shell_enabled?: boolean; file_read_enabled?: boolean; file_write_enabled?: boolean; browser_enabled?: boolean } }).tools
  
  if (!tools) return null
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Tool Permissions</h2>
      
      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={tools.shell_enabled}
            readOnly
            className="rounded"
          />
          <span>Shell commands</span>
        </label>
        
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={tools.file_read_enabled}
            readOnly
            className="rounded"
          />
          <span>File read</span>
        </label>
        
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={tools.file_write_enabled}
            readOnly
            className="rounded"
          />
          <span>File write</span>
        </label>
        
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={tools.browser_enabled}
            readOnly
            className="rounded"
          />
          <span>Browser automation</span>
        </label>
      </div>
    </div>
  )
}
