import { useEffect, useState } from 'react'
import { Plus, RefreshCw, Trash2, ExternalLink, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Channel types supported by ZeroClaw
export type ChannelType = 
  | 'telegram' 
  | 'discord' 
  | 'slack'
  | 'matrix'
  | 'lark'
  | 'feishu'
  | 'dingtalk'
  | 'wecom'
  | 'qq'

export interface Channel {
  id: string
  type: ChannelType
  name: string
  enabled: boolean
  status: 'connected' | 'disconnected' | 'error'
  config?: Record<string, unknown>
}

// Channel metadata
const CHANNEL_META: Record<ChannelType, { name: string; icon: string; color: string }> = {
  telegram: { name: 'Telegram', icon: '✈️', color: 'bg-blue-500' },
  discord: { name: 'Discord', icon: '🎮', color: 'bg-indigo-500' },
  slack: { name: 'Slack', icon: '💬', color: 'bg-purple-500' },
  matrix: { name: 'Matrix', icon: '🏛️', color: 'bg-gray-500' },
  lark: { name: 'Lark', icon: '🐦', color: 'bg-blue-400' },
  feishu: { name: 'Feishu', icon: '📱', color: 'bg-blue-400' },
  dingtalk: { name: 'DingTalk', icon: '🔔', color: 'bg-blue-600' },
  wecom: { name: 'WeCom', icon: '💼', color: 'bg-green-500' },
  qq: { name: 'QQ', icon: '🐧', color: 'bg-yellow-500' },
}

interface ChannelsState {
  channels: Channel[]
  error: string | null
  fetchChannels: () => Promise<void>
  addChannel: (type: ChannelType, config: Record<string, unknown>) => Promise<void>
  deleteChannel: (id: string) => Promise<void>
  updateChannel: (id: string, updates: Partial<Channel>) => Promise<void>
}

// Simple store for demo (should use Zustand in production)
let channelsStore: ChannelsState | null = null

export function useChannelsStore() {
  if (!channelsStore) {
    channelsStore = createChannelsStore()
  }
  return channelsStore
}

function createChannelsStore(): ChannelsState {
  const [state, setState] = useState<{
    channels: Channel[]
    error: string | null
  }>({
    channels: [],
    error: null,
  })

  return {
    get channels() { return state.channels },
    get error() { return state.error },

    fetchChannels: async () => {
      // TODO: Implement actual API call
      setTimeout(() => {
        setState({ 
          channels: [
            {
              id: '1',
              type: 'telegram',
              name: 'My Telegram Bot',
              enabled: true,
              status: 'connected',
            },
          ],
          error: null,
        })
      }, 500)
    },

    addChannel: async (type: ChannelType, _config: Record<string, unknown>) => {
      // TODO: Implement actual API call
      toast.success(`Channel ${CHANNEL_META[type].name} added`)
    },

    deleteChannel: async (_id: string) => {
      // TODO: Implement actual API call
      toast.success('Channel deleted')
    },

    updateChannel: async (_id: string, _updates: Partial<Channel>) => {
      // TODO: Implement actual API call
      toast.success('Channel updated')
    },
  }
}

export function Channels() {
  const { channels, error, fetchChannels, deleteChannel } = useChannelsStore()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedType, setSelectedType] = useState<ChannelType | null>(null)
  const [channelToDelete, setChannelToDelete] = useState<Channel | null>(null)

  useEffect(() => {
    void fetchChannels()
  }, [fetchChannels])

  const handleRefresh = () => {
    void fetchChannels()
    toast.success('Channels refreshed')
  }

  const handleDeleteChannel = async () => {
    if (!channelToDelete) return

    try {
      await deleteChannel(channelToDelete.id)
      setChannelToDelete(null)
      void fetchChannels()
    } catch (err) {
      toast.error('Failed to delete channel')
    }
  }

  const availableChannels = (Object.keys(CHANNEL_META) as ChannelType[]).filter(
    (type) => !channels.some((c) => c.type === type)
  )

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Channels</h1>
          <p className="text-muted-foreground">
            Connect your messaging platforms
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Channel
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="mb-8 border-red-500 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Channels Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {channels.map((channel) => {
          const meta = CHANNEL_META[channel.type]
          return (
            <Card key={channel.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'h-10 w-10 rounded-lg flex items-center justify-center text-2xl',
                      meta.color
                    )}>
                      {meta.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{channel.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{meta.name}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setChannelToDelete(channel)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={channel.enabled ? 'default' : 'secondary'}>
                      {channel.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Connection</span>
                    <span className={cn(
                      'font-medium',
                      channel.status === 'connected' && 'text-green-600',
                      channel.status === 'error' && 'text-red-600'
                    )}>
                      {channel.status}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Configure
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {channels.length === 0 && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="pt-6 text-center py-12">
              <div className="text-6xl mb-4">📱</div>
              <h3 className="text-lg font-semibold mb-2">No Channels Yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your first messaging channel to get started
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Channel
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Channel Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Add Channel</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Select a messaging platform to connect
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAddDialog(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {availableChannels.map((type) => {
                  const meta = CHANNEL_META[type]
                  return (
                    <Card
                      key={type}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => {
                        setSelectedType(type)
                      }}
                    >
                      <CardContent className="pt-6 text-center">
                        <div className={cn(
                          'h-16 w-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-3',
                          meta.color
                        )}>
                          {meta.icon}
                        </div>
                        <h3 className="font-semibold">{meta.name}</h3>
                      </CardContent>
                    </Card>
                  )
                })}

                {availableChannels.length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <p className="text-muted-foreground">
                      All available channels have been added
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Channel Configuration Modal */}
      {selectedType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Configure {CHANNEL_META[selectedType].name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Configuration form for {CHANNEL_META[selectedType].name} would go here.
              </p>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setSelectedType(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    toast.success(`${CHANNEL_META[selectedType].name} channel added`)
                    setSelectedType(null)
                    setShowAddDialog(false)
                    void fetchChannels()
                  }}
                >
                  Add Channel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!channelToDelete}
        title="Delete Channel"
        message={`Are you sure you want to delete "${channelToDelete?.name}"?`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleDeleteChannel}
        onCancel={() => setChannelToDelete(null)}
      />
    </div>
  )
}
