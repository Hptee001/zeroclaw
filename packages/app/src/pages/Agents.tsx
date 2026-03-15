import { useEffect, useState } from 'react'
import { Plus, Settings, Trash2, RefreshCw, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useAgentsStore, type Agent } from '@/stores/agents'
import { useGatewayStore } from '@/stores/gateway'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function Agents() {
  const { agents, loading, error, fetchAgents, createAgent, deleteAgent } = useAgentsStore()
  const gatewayStatus = useGatewayStore((state) => state.status)
  const isGatewayRunning = gatewayStatus.state === 'running'

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null)
  const [newAgentName, setNewAgentName] = useState('')

  useEffect(() => {
    void fetchAgents()
  }, [fetchAgents])

  const handleRefresh = () => {
    void fetchAgents()
    toast.success('Agents refreshed')
  }

  const handleCreateAgent = async () => {
    if (!newAgentName.trim()) {
      toast.error('Agent name is required')
      return
    }

    try {
      await createAgent(newAgentName)
      toast.success(`Agent "${newAgentName}" created`)
      setNewAgentName('')
      setShowAddDialog(false)
      void fetchAgents()
    } catch (err) {
      toast.error('Failed to create agent')
    }
  }

  const handleDeleteAgent = async () => {
    if (!agentToDelete) return

    try {
      await deleteAgent(agentToDelete.id)
      toast.success(`Agent "${agentToDelete.name}" deleted`)
      setAgentToDelete(null)
      void fetchAgents()
    } catch (err) {
      toast.error('Failed to delete agent')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading agents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Agents</h1>
          <p className="text-muted-foreground">
            Manage your AI agents and their configurations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Agent
          </Button>
        </div>
      </div>

      {/* Gateway Status Warning */}
      {!isGatewayRunning && (
        <Card className="mb-8 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Bot className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                  Gateway Not Running
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Agents management requires the gateway to be running.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="mb-8 border-red-500 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <Bot className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-800 dark:text-red-200">Error</h3>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agents Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <Card
            key={agent.id}
            className={cn(
              'cursor-pointer transition-all hover:shadow-lg',
              activeAgentId === agent.id && 'ring-2 ring-primary'
            )}
            onClick={() => setActiveAgentId(agent.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                    <CardDescription>ID: {agent.id.slice(0, 8)}...</CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation()
                    setAgentToDelete(agent)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={agent.enabled ? 'default' : 'secondary'}>
                    {agent.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Channels</span>
                  <span className="font-medium">{agent.channels?.length || 0}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    // Navigate to agent settings
                  }}
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Configure
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {agents.length === 0 && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="pt-6 text-center py-12">
              <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Agents Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first agent to get started
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Agent
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Agent Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create New Agent</CardTitle>
              <CardDescription>
                Enter a name for your new agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Agent Name</Label>
                  <Input
                    id="name"
                    value={newAgentName}
                    onChange={(e) => setNewAgentName(e.target.value)}
                    placeholder="My Assistant"
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddDialog(false)
                      setNewAgentName('')
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateAgent}>
                    Create Agent
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!agentToDelete}
        title="Delete Agent"
        message={`Are you sure you want to delete agent "${agentToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleDeleteAgent}
        onCancel={() => setAgentToDelete(null)}
      />
    </div>
  )
}
