import { useEffect, useState } from 'react'
import { Cpu, TrendingUp, DollarSign, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ModelUsage {
  model: string
  provider: string
  tokens_used: number
  cost: number
  last_used: string
}

interface Provider {
  type: string
  name: string
  enabled: boolean
  models: string[]
}

export function Models() {
  const [loading, setLoading] = useState(false)
  const [usageWindow, setUsageWindow] = useState<'7d' | '30d' | '90d'>('7d')
  const [groupBy, setGroupBy] = useState<'model' | 'provider'>('model')
  const [usageData, setUsageData] = useState<ModelUsage[]>([])
  const [providers, setProviders] = useState<Provider[]>([])

  useEffect(() => {
    // Mock data for demo
    setProviders([
      {
        type: 'openai',
        name: 'OpenAI',
        enabled: true,
        models: ['gpt-4', 'gpt-3.5-turbo'],
      },
      {
        type: 'anthropic',
        name: 'Anthropic',
        enabled: true,
        models: ['claude-sonnet-4-5-20250929', 'claude-opus-4-5-20250929'],
      },
      {
        type: 'openrouter',
        name: 'OpenRouter',
        enabled: false,
        models: [],
      },
    ])

    setUsageData([
      {
        model: 'claude-sonnet-4-5-20250929',
        provider: 'anthropic',
        tokens_used: 125000,
        cost: 1.25,
        last_used: new Date().toISOString(),
      },
      {
        model: 'gpt-4',
        provider: 'openai',
        tokens_used: 85000,
        cost: 2.55,
        last_used: new Date(Date.now() - 86400000).toISOString(),
      },
    ])
  }, [])

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast.success('Usage data refreshed')
    }, 500)
  }

  const totalTokens = usageData.reduce((sum, u) => sum + u.tokens_used, 0)
  const totalCost = usageData.reduce((sum, u) => sum + u.cost, 0)

  const groupedData = usageData.reduce((acc, usage) => {
    const key = groupBy === 'model' ? usage.model : usage.provider
    if (!acc[key]) {
      acc[key] = { tokens: 0, cost: 0, count: 0 }
    }
    acc[key].tokens += usage.tokens_used
    acc[key].cost += usage.cost
    acc[key].count += 1
    return acc
  }, {} as Record<string, { tokens: number; cost: number; count: number }>)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Models</h1>
          <p className="text-muted-foreground">
            Manage AI models and track usage
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Usage Summary */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTokens.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Last {usageWindow.replace('d', ' days')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Last {usageWindow.replace('d', ' days')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Models</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageData.length}</div>
            <p className="text-xs text-muted-foreground">
              Across {providers.filter(p => p.enabled).length} providers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Controls */}
      <div className="flex gap-4 mb-6">
        <div>
          <Label className="text-sm font-medium mb-2 block">Time Window</Label>
          <div className="flex gap-2">
            {(['7d', '30d', '90d'] as const).map((window) => (
              <Button
                key={window}
                variant={usageWindow === window ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUsageWindow(window)}
              >
                {window}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium mb-2 block">Group By</Label>
          <div className="flex gap-2">
            {(['model', 'provider'] as const).map((group) => (
              <Button
                key={group}
                variant={groupBy === group ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGroupBy(group)}
              >
                {group.charAt(0).toUpperCase() + group.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Usage Table */}
      <Card>
        <CardHeader>
          <CardTitle>Usage by {groupBy}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Token usage and cost breakdown
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(groupedData).map(([key, data]) => (
              <div
                key={key}
                className="flex items-center justify-between p-4 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Cpu className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{key}</div>
                    <div className="text-sm text-muted-foreground">
                      {data.count} {data.count === 1 ? 'model' : 'models'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{data.tokens.toLocaleString()} tokens</div>
                  <div className="text-sm text-muted-foreground">
                    ${data.cost.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}

            {Object.keys(groupedData).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No usage data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Providers List */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Configured Providers</CardTitle>
          <p className="text-sm text-muted-foreground">
            AI model providers and their status
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {providers.map((provider) => (
              <div
                key={provider.type}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'h-10 w-10 rounded-lg flex items-center justify-center',
                    provider.enabled ? 'bg-green-500/10' : 'bg-gray-500/10'
                  )}>
                    <Cpu className={cn(
                      'h-5 w-5',
                      provider.enabled ? 'text-green-600' : 'text-gray-500'
                    )} />
                  </div>
                  <div>
                    <div className="font-medium">{provider.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {provider.models.length} models available
                    </div>
                  </div>
                </div>
                <Badge variant={provider.enabled ? 'default' : 'secondary'}>
                  {provider.enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}