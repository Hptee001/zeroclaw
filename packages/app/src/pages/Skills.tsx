import { useEffect, useState } from 'react'
import { Search, Puzzle, Package, Plus, Key, RefreshCw, FolderOpen, Globe, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

interface Skill {
  id: string
  name: string
  description: string
  enabled: boolean
  isBundled: boolean
  source?: string
  author?: string
  version?: string
}

export function Skills() {
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [skills, setSkills] = useState<Skill[]>([])
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)

  useEffect(() => {
    // Mock data for demo
    setSkills([
      {
        id: '1',
        name: 'Web Search',
        description: 'Search the web for information',
        enabled: true,
        isBundled: true,
        source: 'openclaw-bundled',
        author: 'ZeroClaw',
        version: '1.0.0',
      },
      {
        id: '2',
        name: 'File Manager',
        description: 'Read and write files',
        enabled: true,
        isBundled: true,
        source: 'openclaw-bundled',
        author: 'ZeroClaw',
        version: '1.0.0',
      },
      {
        id: '3',
        name: 'Shell Executor',
        description: 'Execute shell commands',
        enabled: false,
        isBundled: true,
        source: 'openclaw-bundled',
        author: 'ZeroClaw',
        version: '1.0.0',
      },
    ])
  }, [])

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast.success('Skills refreshed')
    }, 500)
  }

  const handleToggleSkill = (skillId: string) => {
    setSkills((prev) =>
      prev.map((s) =>
        s.id === skillId ? { ...s, enabled: !s.enabled } : s
      )
    )
    toast.success('Skill toggled')
  }

  const filteredSkills = skills.filter(
    (skill) =>
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Skills</h1>
          <p className="text-muted-foreground">
            Browse and manage AI skills
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Install Skill
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Skills Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredSkills.map((skill) => (
          <Card key={skill.id} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Puzzle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{skill.name}</CardTitle>
                    <CardDescription>v{skill.version}</CardDescription>
                  </div>
                </div>
                {skill.isBundled && (
                  <Badge variant="secondary">
                    <Package className="h-3 w-3 mr-1" />
                    Bundled
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {skill.description}
              </p>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {skill.source?.includes('openclaw') ? (
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Key className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {skill.author}
                  </span>
                </div>
                <Switch
                  checked={skill.enabled}
                  onCheckedChange={() => handleToggleSkill(skill.id)}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setSelectedSkill(skill)}
                >
                  Details
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(skill.name)
                    toast.success('Skill name copied')
                  }}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredSkills.length === 0 && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="pt-6 text-center py-12">
              <Puzzle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Skills Found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? 'Try a different search term' : 'Install your first skill to get started'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Skill Detail Dialog */}
      {selectedSkill && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Puzzle className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{selectedSkill.name}</CardTitle>
                    <CardDescription>Version {selectedSkill.version}</CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedSkill(null)}
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
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-muted-foreground">{selectedSkill.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Author</h4>
                    <p className="text-muted-foreground">{selectedSkill.author}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Source</h4>
                    <p className="text-muted-foreground capitalize">
                      {selectedSkill.source?.replace('openclaw-', '') || 'Unknown'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={selectedSkill.enabled}
                      onCheckedChange={() => {
                        handleToggleSkill(selectedSkill.id)
                        setSelectedSkill({ ...selectedSkill, enabled: !selectedSkill.enabled })
                      }}
                    />
                    <div>
                      <div className="font-medium">Enable Skill</div>
                      <div className="text-sm text-muted-foreground">
                        Toggle to enable or disable this skill
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setSelectedSkill(null)}>
                    Close
                  </Button>
                  <Button>
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Open Folder
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
