import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router'
import {
  Settings,
  Plus,
  PanelLeftClose,
  PanelLeft,
  MessageSquare,
  Cpu,
  Network,
  Puzzle,
  Clock,
  Bot,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useSessions } from '@/hooks/useTauri'
import { formatRelativeTime } from '@/lib/utils'

interface NavItemProps {
  to: string
  icon: React.ReactNode
  label: string
  badge?: string
  collapsed?: boolean
}

function NavItem({ to, icon, label, badge, collapsed }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[14px] font-medium transition-colors',
          'hover:bg-black/5 dark:hover:bg-white/5 text-foreground/80',
          isActive
            ? 'bg-black/5 dark:bg-white/10 text-foreground'
            : '',
          collapsed && 'justify-center px-0'
        )
      }
    >
      {({ isActive }) => (
        <>
          <div className={cn(
            "flex shrink-0 items-center justify-center",
            isActive ? "text-foreground" : "text-muted-foreground"
          )}>
            {icon}
          </div>
          {!collapsed && (
            <>
              <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{label}</span>
              {badge && (
                <Badge variant="secondary" className="ml-auto shrink-0">
                  {badge}
                </Badge>
              )}
            </>
          )}
        </>
      )}
    </NavLink>
  )
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { sessions, createSession, isLoading } = useSessions()
  const location = useLocation()
  const navigate = useNavigate()

  const navItems = [
    { to: '/', icon: <MessageSquare className="h-[18px] w-[18px]" />, label: 'Chat' },
    { to: '/agents', icon: <Bot className="h-[18px] w-[18px]" />, label: 'Agents' },
    { to: '/channels', icon: <Network className="h-[18px] w-[18px]" />, label: 'Channels' },
    { to: '/models', icon: <Cpu className="h-[18px] w-[18px]" />, label: 'Models' },
    { to: '/tools', icon: <Puzzle className="h-[18px] w-[18px]" />, label: 'Tools' },
    { to: '/schedule', icon: <Clock className="h-[18px] w-[18px]" />, label: 'Schedule' },
    { to: '/settings', icon: <Settings className="h-[18px] w-[18px]" />, label: 'Settings' },
  ]

  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col border-r bg-[#eae8e1]/60 dark:bg-background transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header with toggle */}
      <div className={cn(
        "flex items-center p-2 h-12",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2 px-2 overflow-hidden">
            <span className="text-lg font-bold">🦀</span>
            <span className="text-sm font-semibold truncate whitespace-nowrap text-foreground/90">
              ZeroClaw
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <PanelLeft className="h-[18px] w-[18px]" />
          ) : (
            <PanelLeftClose className="h-[18px] w-[18px]" />
          )}
        </Button>
      </div>

      {/* New Session Button */}
      <nav className="flex flex-col px-2 gap-0.5">
        <button
          onClick={() => createSession('New Session')}
          disabled={isLoading}
          className={cn(
            'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[14px] font-medium transition-colors mb-2',
            'bg-black/5 dark:bg-accent shadow-none border border-transparent text-foreground',
            'hover:bg-black/10 dark:hover:bg-accent/80',
            collapsed && 'justify-center px-0',
            isLoading && 'opacity-50 cursor-not-allowed'
          )}
        >
          <div className="flex shrink-0 items-center justify-center text-foreground/80">
            <Plus className="h-[18px] w-[18px]" strokeWidth={2} />
          </div>
          {!collapsed && <span className="flex-1 text-left">New Session</span>}
        </button>

        {/* Navigation items */}
        {navItems.map((item) => (
          <NavItem
            key={item.to}
            {...item}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {/* Sessions list */}
      {!collapsed && sessions && sessions.length > 0 && (
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 mt-4 space-y-0.5 pb-2">
          <div className="px-2.5 pb-1 text-[11px] font-medium text-muted-foreground/60 tracking-tight">
            Recent Sessions
          </div>
          {sessions.slice(0, 10).map((session: unknown) => (
            <button
              key={(session as { id: string }).id}
              onClick={() => navigate(`/session/${(session as { id: string }).id}`)}
              className={cn(
                'w-full text-left rounded-lg px-2.5 py-1.5 text-[13px] transition-colors',
                'hover:bg-black/5 dark:hover:bg-white/5',
                location.pathname === `/session/${(session as { id: string }).id}`
                  ? 'bg-black/5 dark:bg-white/10 text-foreground font-medium'
                  : 'text-foreground/75'
              )}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate flex-1">
                  {(session as { name: string }).name}
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {formatRelativeTime((session as { updated_at: string }).updated_at)}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="p-2 mt-auto border-t">
        <div className="text-[10px] text-muted-foreground/60 text-center">
          ZeroClaw v0.3.1
        </div>
      </div>
    </aside>
  )
}
