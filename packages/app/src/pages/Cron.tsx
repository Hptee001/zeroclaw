import { useEffect, useState } from 'react'
import { Plus, Clock, Play, Trash2, RefreshCw, Calendar, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'

interface CronJob {
  id: string
  name: string
  schedule: string
  command: string
  enabled: boolean
  lastRun?: string
  nextRun?: string
  status: 'success' | 'failed' | 'pending'
}

const schedulePresets = [
  { key: 'everyMinute', value: '* * * * *', label: 'Every minute' },
  { key: 'every5Min', value: '*/5 * * * *', label: 'Every 5 minutes' },
  { key: 'every15Min', value: '*/15 * * * *', label: 'Every 15 minutes' },
  { key: 'everyHour', value: '0 * * * *', label: 'Every hour' },
  { key: 'daily9am', value: '0 9 * * *', label: 'Daily at 9 AM' },
  { key: 'daily6pm', value: '0 18 * * *', label: 'Daily at 6 PM' },
  { key: 'weeklyMon', value: '0 9 * * 1', label: 'Weekly on Monday' },
  { key: 'monthly1st', value: '0 9 1 * *', label: 'Monthly on 1st' },
]

export function Cron() {
  const [loading, setLoading] = useState(false)
  const [cronJobs, setCronJobs] = useState<CronJob[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [jobToDelete, setJobToDelete] = useState<CronJob | null>(null)
  const [newJob, setNewJob] = useState<Partial<CronJob>>({
    name: '',
    schedule: '* * * * *',
    command: '',
    enabled: true,
  })

  useEffect(() => {
    // Mock data for demo
    setCronJobs([
      {
        id: '1',
        name: 'Daily Backup',
        schedule: '0 2 * * *',
        command: 'backup.sh',
        enabled: true,
        lastRun: new Date(Date.now() - 86400000).toISOString(),
        nextRun: new Date(Date.now() + 3600000).toISOString(),
        status: 'success',
      },
      {
        id: '2',
        name: 'Hourly Sync',
        schedule: '0 * * * *',
        command: 'sync-data.sh',
        enabled: true,
        lastRun: new Date(Date.now() - 3600000).toISOString(),
        nextRun: new Date(Date.now() + 1800000).toISOString(),
        status: 'success',
      },
    ])
  }, [])

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast.success('Cron jobs refreshed')
    }, 500)
  }

  const handleCreateJob = () => {
    if (!newJob.name || !newJob.command) {
      toast.error('Name and command are required')
      return
    }

    const job: CronJob = {
      id: Date.now().toString(),
      name: newJob.name!,
      schedule: newJob.schedule!,
      command: newJob.command!,
      enabled: newJob.enabled ?? true,
      status: 'pending',
    }

    setCronJobs((prev) => [...prev, job])
    toast.success('Cron job created')
    setShowAddDialog(false)
    setNewJob({ name: '', schedule: '* * * * *', command: '', enabled: true })
  }

  const handleDeleteJob = async () => {
    if (!jobToDelete) return

    setCronJobs((prev) => prev.filter((j) => j.id !== jobToDelete.id))
    toast.success('Cron job deleted')
    setJobToDelete(null)
  }

  const handleToggleJob = (jobId: string) => {
    setCronJobs((prev) =>
      prev.map((j) =>
        j.id === jobId ? { ...j, enabled: !j.enabled } : j
      )
    )
    toast.success('Cron job toggled')
  }

  const handleRunNow = (jobId: string) => {
    toast.success('Job started')
    setCronJobs((prev) =>
      prev.map((j) =>
        j.id === jobId ? { ...j, status: 'pending' as const } : j
      )
    )
    
    setTimeout(() => {
      setCronJobs((prev) =>
        prev.map((j) =>
          j.id === jobId ? { ...j, status: 'success' as const, lastRun: new Date().toISOString() } : j
        )
      )
      toast.success('Job completed')
    }, 2000)
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Schedule</h1>
          <p className="text-muted-foreground">
            Manage scheduled tasks and cron jobs
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Job
          </Button>
        </div>
      </div>

      {/* Cron Jobs Grid */}
      <div className="grid gap-6">
        {cronJobs.map((job) => (
          <Card key={job.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{job.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      {job.schedule}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      job.status === 'success'
                        ? 'default'
                        : job.status === 'failed'
                        ? 'secondary'
                        : 'secondary'
                    }
                  >
                    {job.status === 'success' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {job.status === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
                    {job.status === 'pending' && <AlertCircle className="h-3 w-3 mr-1" />}
                    {job.status}
                  </Badge>
                  <Switch
                    checked={job.enabled}
                    onCheckedChange={() => handleToggleJob(job.id)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setJobToDelete(job)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Last Run</div>
                  <div className="font-medium">
                    {job.lastRun ? new Date(job.lastRun).toLocaleString() : 'Never'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Next Run</div>
                  <div className="font-medium">
                    {job.nextRun ? new Date(job.nextRun).toLocaleString() : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Command</div>
                  <div className="font-medium font-mono text-sm">{job.command}</div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRunNow(job.id)}
                  disabled={!job.enabled}
                >
                  <Play className="h-3 w-3 mr-2" />
                  Run Now
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {cronJobs.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Cron Jobs Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first scheduled task
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Job
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Job Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Create Cron Job</CardTitle>
                  <CardDescription>
                    Set up a new scheduled task
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAddDialog(false)}
                >
                  <svg width="15" height="15" viewBox="0 0 15 15">
                    <path
                      d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0062 3.80708 12.0062 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0062 11.5571 12.0062 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
                      fill="currentColor"
                    />
                  </svg>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Job Name</Label>
                  <Input
                    id="name"
                    value={newJob.name}
                    onChange={(e) => setNewJob({ ...newJob, name: e.target.value })}
                    placeholder="Daily Backup"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="command">Command</Label>
                  <Input
                    id="command"
                    value={newJob.command}
                    onChange={(e) => setNewJob({ ...newJob, command: e.target.value })}
                    placeholder="backup.sh"
                    className="mt-1 font-mono"
                  />
                </div>

                <div>
                  <Label>Schedule Preset</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {schedulePresets.map((preset) => (
                      <Button
                        key={preset.key}
                        variant={newJob.schedule === preset.value ? 'default' : 'outline'}
                        size="sm"
                        className="justify-start"
                        onClick={() => setNewJob({ ...newJob, schedule: preset.value })}
                      >
                        <Clock className="h-3 w-3 mr-2" />
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="schedule">Custom Schedule (Cron Expression)</Label>
                  <Input
                    id="schedule"
                    value={newJob.schedule}
                    onChange={(e) => setNewJob({ ...newJob, schedule: e.target.value })}
                    placeholder="* * * * *"
                    className="mt-1 font-mono"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="enabled"
                    checked={newJob.enabled}
                    onCheckedChange={(checked) => setNewJob({ ...newJob, enabled: checked })}
                  />
                  <Label htmlFor="enabled">Enable job</Label>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateJob}>
                    Create Job
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!jobToDelete}
        title="Delete Cron Job"
        message={`Are you sure you want to delete "${jobToDelete?.name}"?`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleDeleteJob}
        onCancel={() => setJobToDelete(null)}
      />
    </div>
  )
}
