import { useState, useEffect } from 'react'
import { Save, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useConfigStore } from '@/stores/config'
import { useSettingsStore } from '@/stores/settings'
import { cn } from '@/lib/utils'

export function Settings() {
  const { config, loading, fetchConfig, updateConfig } = useConfigStore()
  const { theme, setTheme, language, setLanguage } = useSettingsStore()
  const [activeTab, setActiveTab] = useState<'general' | 'providers' | 'tools'>('general')

  useEffect(() => {
    void fetchConfig()
  }, [fetchConfig])

  const handleSave = async () => {
    try {
      if (config) {
        await updateConfig(config)
        toast.success('Settings saved')
      }
    } catch {
      toast.error('Failed to save')
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Configure your ZeroClaw instance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void fetchConfig()}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        {(['general', 'providers', 'tools'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors border-b-2',
              activeTab === tab
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'general' && (
          <GeneralSettings
            theme={theme}
            setTheme={setTheme}
            language={language}
            setLanguage={setLanguage}
            version={config?.version || 'Unknown'}
          />
        )}

        {activeTab === 'providers' && (
          <ProvidersSettings />
        )}

        {activeTab === 'tools' && (
          <ToolsSettings />
        )}
      </div>
    </div>
  )
}

// ============================================================================
// General Settings
// ============================================================================

interface GeneralSettingsProps {
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  language: string
  setLanguage: (language: string) => void
  version: string
}

function GeneralSettings({ theme, setTheme, language, setLanguage, version }: GeneralSettingsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize the look and feel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Theme</Label>
            <div className="flex gap-2 mt-2">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('light')}
              >
                ☀️ Light
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('dark')}
              >
                🌙 Dark
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('system')}
              >
                💻 System
              </Button>
            </div>
          </div>

          <div>
            <Label>Language</Label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="en">English</option>
              <option value="zh-CN">简体中文</option>
              <option value="ja">日本語</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Version: {version}</div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// Providers Settings
// ============================================================================

function ProvidersSettings() {
  const { config, updateProvider } = useConfigStore()
  const providers = config?.providers || []

  return (
    <div className="space-y-6">
      {providers.map((provider) => (
        <Card key={provider.type}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{provider.name}</CardTitle>
                <CardDescription>
                  {provider.enabled ? 'Enabled' : 'Disabled'}
                  {provider.api_key && ' • API Key configured'}
                </CardDescription>
              </div>
              <Switch
                checked={provider.enabled}
                onCheckedChange={(enabled) => {
                  void updateProvider(provider.type, { enabled })
                }}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>API Key</Label>
              <input
                type="password"
                value={provider.api_key || ''}
                onChange={(e) => {
                  void updateProvider(provider.type, { api_key: e.target.value })
                }}
                placeholder="sk-..."
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <Label>Model</Label>
              <input
                value={provider.model}
                onChange={(e) => {
                  void updateProvider(provider.type, { model: e.target.value })
                }}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ============================================================================
// Tools Settings
// ============================================================================

function ToolsSettings() {
  const { config, updateConfig } = useConfigStore()
  const tools = config?.tools

  if (!tools) return null

  const handleToolToggle = (tool: keyof typeof tools, enabled: boolean) => {
    if (!config) return
    void updateConfig({
      ...config,
      tools: { ...tools, [tool]: enabled },
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tool Permissions</CardTitle>
          <CardDescription>Enable or disable specific tool capabilities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'shell_enabled', label: 'Shell Commands', icon: '💻', desc: 'Execute system commands' },
            { key: 'file_read_enabled', label: 'File Read', icon: '📖', desc: 'Read files from filesystem' },
            { key: 'file_write_enabled', label: 'File Write', icon: '✏️', desc: 'Create and modify files' },
            { key: 'browser_enabled', label: 'Browser Automation', icon: '🌐', desc: 'Control web browser' },
          ].map((tool) => (
            <div key={tool.key} className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-xl">{tool.icon}</span>
                </div>
                <div>
                  <div className="font-medium">{tool.label}</div>
                  <div className="text-sm text-muted-foreground">{tool.desc}</div>
                </div>
              </div>
              <Switch
                checked={tools[tool.key as keyof typeof tools] as boolean}
                onCheckedChange={(enabled) => handleToolToggle(tool.key as keyof typeof tools, enabled)}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
