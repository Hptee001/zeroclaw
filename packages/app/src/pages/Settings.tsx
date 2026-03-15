import { useState } from 'react'
import { useConfigStore } from '@/stores/config'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export function Settings() {
  const { config, updateConfig, loading } = useConfigStore()
  const [localConfig, setLocalConfig] = useState(config)

  const handleSave = async () => {
    try {
      await updateConfig(localConfig!)
      toast.success('Settings saved successfully')
    } catch (err) {
      toast.error('Failed to save settings')
    }
  }

  if (!config) return null

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Application</CardTitle>
          <CardDescription>General application settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Version</Label>
            <div className="text-sm text-muted-foreground">{config.version}</div>
          </div>
          <div className="space-y-2">
            <Label>Identifier</Label>
            <div className="text-sm text-muted-foreground">{config.identifier}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tools</CardTitle>
          <CardDescription>Configure tool permissions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Shell Commands</Label>
              <p className="text-sm text-muted-foreground">Allow shell command execution</p>
            </div>
            <Switch
              checked={config.tools.shell_enabled}
              onCheckedChange={(checked) => 
                setLocalConfig({ ...config, tools: { ...config.tools, shell_enabled: checked } })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>File Read</Label>
              <p className="text-sm text-muted-foreground">Allow reading files</p>
            </div>
            <Switch
              checked={config.tools.file_read_enabled}
              onCheckedChange={(checked) => 
                setLocalConfig({ ...config, tools: { ...config.tools, file_read_enabled: checked } })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>File Write</Label>
              <p className="text-sm text-muted-foreground">Allow writing files</p>
            </div>
            <Switch
              checked={config.tools.file_write_enabled}
              onCheckedChange={(checked) => 
                setLocalConfig({ ...config, tools: { ...config.tools, file_write_enabled: checked } })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Browser Automation</Label>
              <p className="text-sm text-muted-foreground">Allow browser automation</p>
            </div>
            <Switch
              checked={config.tools.browser_enabled}
              onCheckedChange={(checked) => 
                setLocalConfig({ ...config, tools: { ...config.tools, browser_enabled: checked } })
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}
