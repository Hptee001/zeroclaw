import { useState, useEffect } from 'react'
import { Save, RotateCcw, Eye, EyeOff, ExternalLink, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useConfigStore, type ProviderConfig } from '@/stores/config'
import { cn } from '@/lib/utils'

export function Settings() {
  const { config, loading, fetchConfig, updateConfig } = useConfigStore()
  const [activeTab, setActiveTab] = useState<'general' | 'providers' | 'tools'>('providers')

  useEffect(() => {
    void fetchConfig()
  }, [fetchConfig])

  if (loading || !config) {
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
          <GeneralSettings config={config} onUpdate={updateConfig} />
        )}

        {activeTab === 'providers' && (
          <ProvidersSettings config={config} onUpdate={updateConfig} />
        )}

        {activeTab === 'tools' && (
          <ToolsSettings config={config} onUpdate={updateConfig} />
        )}
      </div>
    </div>
  )
}

// ============================================================================
// General Settings
// ============================================================================

interface GeneralSettingsProps {
  config: {
    version: string
    identifier: string
  }
  onUpdate: (config: any) => Promise<void>
}

function GeneralSettings({ config }: GeneralSettingsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>About ZeroClaw</CardTitle>
          <CardDescription>Application information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Version</div>
              <div className="font-medium">{config.version}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Identifier</div>
              <div className="font-medium">{config.identifier}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// Providers Settings - Complete Implementation
// ============================================================================

interface ProvidersSettingsProps {
  config: {
    providers: ProviderConfig[]
  }
  onUpdate: (config: any) => Promise<void>
}

function ProvidersSettings({ config, onUpdate }: ProvidersSettingsProps) {
  const [localProviders, setLocalProviders] = useState<ProviderConfig[]>(config.providers)
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onUpdate({ ...config, providers: localProviders })
      toast.success('Provider settings saved')
    } catch {
      toast.error('Failed to save provider settings')
    }
    setSaving(false)
  }

  const updateProvider = (type: string, updates: Partial<ProviderConfig>) => {
    setLocalProviders((prev) =>
      prev.map((p) => (p.type === type ? { ...p, ...updates } : p))
    )
  }

  const toggleApiKeyVisibility = (type: string) => {
    setShowApiKeys((prev) => ({ ...prev, [type]: !prev[type] }))
  }

  return (
    <div className="space-y-6">
      {/* Provider Cards */}
      {localProviders.map((provider) => (
        <ProviderCard
          key={provider.type}
          provider={provider}
          onUpdate={updateProvider}
          showApiKey={showApiKeys[provider.type] || false}
          toggleApiKeyVisibility={() => toggleApiKeyVisibility(provider.type)}
        />
      ))}

      {/* Save Button */}
      <div className="flex justify-end gap-2 sticky bottom-0 bg-background py-4 border-t">
        <Button variant="outline" onClick={() => setLocalProviders(config.providers)}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}

// ============================================================================
// Individual Provider Card
// ============================================================================

interface ProviderCardProps {
  provider: ProviderConfig
  onUpdate: (type: string, updates: Partial<ProviderConfig>) => void
  showApiKey: boolean
  toggleApiKeyVisibility: () => void
}

function ProviderCard({ provider, onUpdate, showApiKey, toggleApiKeyVisibility }: ProviderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const providerInfo = getProviderInfo(provider.type)
  const popularModels = getPopularModels(provider.type)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              'h-12 w-12 rounded-xl flex items-center justify-center text-2xl',
              provider.enabled ? 'bg-primary/10' : 'bg-muted'
            )}>
              {providerInfo.icon}
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {provider.name}
                {provider.enabled && (
                  <Badge variant="default" className="text-xs">Enabled</Badge>
                )}
                {provider.api_key && provider.api_key.length > 0 && (
                  <Badge variant="secondary" className="text-xs">API Key Set</Badge>
                )}
              </CardTitle>
              <CardDescription>{providerInfo.description}</CardDescription>
            </div>
          </div>
          <Switch
            checked={provider.enabled}
            onCheckedChange={(enabled) => onUpdate(provider.type, { enabled })}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* API Key */}
        <div className="space-y-2">
          <Label>API Key</Label>
          <div className="relative">
            <Input
              type={showApiKey ? 'text' : 'password'}
              placeholder={providerInfo.apiKeyPlaceholder}
              value={provider.api_key || ''}
              onChange={(e) => onUpdate(provider.type, { api_key: e.target.value })}
              className="pr-20"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={toggleApiKeyVisibility}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              {provider.api_key && provider.api_key.length > 0 && (
                <Check className="h-4 w-4 text-green-600" />
              )}
            </div>
          </div>
          {providerInfo.apiKeyUrl && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ExternalLink className="h-3 w-3" />
              <a href={providerInfo.apiKeyUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                Get your API key from {provider.name}
              </a>
            </p>
          )}
        </div>

        {/* Model Selection */}
        <div className="space-y-2">
          <Label>Default Model</Label>
          <Input
            value={provider.model}
            onChange={(e) => onUpdate(provider.type, { model: e.target.value })}
            placeholder={providerInfo.modelPlaceholder}
          />
          
          {/* Popular Models Quick Select */}
          {popularModels.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {popularModels.map((model) => (
                <Badge
                  key={model}
                  variant="outline"
                  className={cn(
                    'cursor-pointer transition-colors',
                    provider.model === model
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-primary/10'
                  )}
                  onClick={() => onUpdate(provider.type, { model })}
                >
                  {model}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Base URL (for providers that support it) */}
        {providerInfo.supportsBaseUrl && (
          <div className="space-y-2">
            <Label>Base URL (Optional)</Label>
            <Input
              value={provider.base_url || ''}
              onChange={(e) => onUpdate(provider.type, { base_url: e.target.value })}
              placeholder="https://api.example.com"
            />
            <p className="text-xs text-muted-foreground">
              Custom endpoint for self-hosted or proxy setups
            </p>
          </div>
        )}

        {/* Advanced Settings Toggle */}
        <div className="pt-2 border-t">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2"
          >
            <span className={cn('transition-transform', isExpanded && 'rotate-90')}>▶</span>
            {isExpanded ? 'Hide' : 'Show'} Advanced Settings
          </button>
          
          {isExpanded && (
            <div className="mt-4 space-y-4 animate-in slide-in-from-top-2">
              {/* Provider-specific settings can go here */}
              <div className="p-3 rounded-lg bg-muted text-sm text-muted-foreground">
                Advanced configuration options for {provider.name}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Tools Settings
// ============================================================================

interface ToolsSettingsProps {
  config: {
    tools: {
      shell_enabled: boolean
      file_read_enabled: boolean
      file_write_enabled: boolean
      browser_enabled: boolean
      allowed_commands: string[]
    }
  }
  onUpdate: (config: any) => Promise<void>
}

function ToolsSettings({ config, onUpdate }: ToolsSettingsProps) {
  const [localTools, setLocalTools] = useState(config.tools)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onUpdate({ ...config, tools: localTools })
      toast.success('Tool settings saved')
    } catch {
      toast.error('Failed to save tool settings')
    }
    setSaving(false)
  }

  const handleToggle = (tool: keyof typeof localTools, enabled: boolean) => {
    setLocalTools((prev) => ({ ...prev, [tool]: enabled }))
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
            { key: 'shell_enabled', label: 'Shell Commands', icon: '💻', desc: 'Execute system commands and scripts' },
            { key: 'file_read_enabled', label: 'File Read', icon: '📖', desc: 'Read files from the filesystem' },
            { key: 'file_write_enabled', label: 'File Write', icon: '✏️', desc: 'Create and modify files' },
            { key: 'browser_enabled', label: 'Browser Automation', icon: '🌐', desc: 'Control web browser for web tasks' },
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
                checked={localTools[tool.key as keyof typeof localTools] as boolean}
                onCheckedChange={(enabled) => handleToggle(tool.key as keyof typeof localTools, enabled)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end sticky bottom-0 bg-background py-4 border-t">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Security Warning */}
      <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
              <span className="text-lg">⚠️</span>
            </div>
            <div>
              <div className="font-medium text-yellow-800 dark:text-yellow-200">
                Security Warning
              </div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Enabling shell commands and file operations gives the AI assistant 
                significant system access. Only enable these features in trusted 
                environments.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// Provider Info Helpers
// ============================================================================

function getProviderInfo(type: string) {
  const info: Record<string, { icon: string; description: string; apiKeyPlaceholder: string; modelPlaceholder: string; apiKeyUrl?: string; supportsBaseUrl: boolean }> = {
    openrouter: {
      icon: '🌐',
      description: 'Multi-model gateway with access to 100+ AI models',
      apiKeyPlaceholder: 'sk-or-...',
      modelPlaceholder: 'anthropic/claude-3.5-sonnet',
      apiKeyUrl: 'https://openrouter.ai/keys',
      supportsBaseUrl: false,
    },
    anthropic: {
      icon: '🤖',
      description: 'Claude models from Anthropic',
      apiKeyPlaceholder: 'sk-ant-...',
      modelPlaceholder: 'claude-sonnet-4-5-20250929',
      apiKeyUrl: 'https://console.anthropic.com/settings/keys',
      supportsBaseUrl: false,
    },
    openai: {
      icon: '💬',
      description: 'GPT models from OpenAI',
      apiKeyPlaceholder: 'sk-...',
      modelPlaceholder: 'gpt-4',
      apiKeyUrl: 'https://platform.openai.com/api-keys',
      supportsBaseUrl: true,
    },
    gemini: {
      icon: '✨',
      description: 'Gemini models from Google',
      apiKeyPlaceholder: 'AIza...',
      modelPlaceholder: 'gemini-pro',
      apiKeyUrl: 'https://makersuite.google.com/app/apikey',
      supportsBaseUrl: false,
    },
    ollama: {
      icon: '🦙',
      description: 'Local models running on your machine',
      apiKeyPlaceholder: 'Not required for local Ollama',
      modelPlaceholder: 'llama2',
      apiKeyUrl: undefined,
      supportsBaseUrl: true,
    },
    zhipu: {
      icon: '🧠',
      description: 'GLM models from Zhipu AI',
      apiKeyPlaceholder: '...',
      modelPlaceholder: 'glm-4',
      apiKeyUrl: 'https://open.bigmodel.cn/usercenter/apikeys',
      supportsBaseUrl: false,
    },
  }
  return info[type] || {
    icon: '⚙️',
    description: 'Custom provider',
    apiKeyPlaceholder: 'Enter API key...',
    modelPlaceholder: 'model-name',
    apiKeyUrl: undefined,
    supportsBaseUrl: true,
  }
}

function getPopularModels(type: string): string[] {
  const models: Record<string, string[]> = {
    openrouter: [
      'anthropic/claude-3.5-sonnet',
      'anthropic/claude-3-opus',
      'openai/gpt-4-turbo',
      'openai/gpt-4',
      'google/gemini-pro-1.5',
      'meta-llama/llama-3-70b-instruct',
    ],
    anthropic: [
      'claude-sonnet-4-5-20250929',
      'claude-opus-4-5-20250929',
      'claude-3-5-sonnet-20241022',
      'claude-3-opus-20240229',
    ],
    openai: [
      'gpt-4',
      'gpt-4-turbo',
      'gpt-4o',
      'gpt-3.5-turbo',
    ],
    gemini: [
      'gemini-pro',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
    ],
    ollama: [
      'llama2',
      'llama3',
      'mistral',
      'codellama',
      'gemma',
    ],
    zhipu: [
      'glm-4',
      'glm-4-flash',
      'glm-3-turbo',
    ],
  }
  return models[type] || []
}
