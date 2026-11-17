import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Bell, CheckSquare2, ChevronRight, FolderKanban, LogOut, Menu, Plus, Search, Settings, X } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/context/useAuth'
import { projectApi } from '@/lib/api'
import { ProjectDialog } from '@/components/ProjectDialog'
import { cn } from '@/lib/utils'

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [projectDialogOpen, setProjectDialogOpen] = useState(false)
  const { user, logout } = useAuth()
  const { data: projects = [], isLoading } = useQuery({ queryKey: ['projects'], queryFn: projectApi.list })
  const location = useLocation()
  const navigate = useNavigate()
  const selectedProjectId = Number(location.pathname.split('/')[2])
  const closeMobile = () => setMobileOpen(false)
  const initials = user?.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'TF'

  return (
    <div className="app-shell">
      {mobileOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={closeMobile} />}
      <aside className={cn('sidebar', mobileOpen && 'sidebar-open')}>
        <div className="sidebar-brand-row">
          <Link to="/projects" className="brand-lockup" onClick={closeMobile}>
            <span className="brand-mark"><CheckSquare2 size={19} strokeWidth={2.5} /></span>
            <span>taskflow<span className="brand-period">.</span></span>
          </Link>
          <Button variant="ghost" size="icon" className="mobile-close" onClick={closeMobile} aria-label="Close menu"><X /></Button>
        </div>

        <div className="workspace-switcher">
          <div className="workspace-icon">{initials}</div>
          <div className="workspace-copy"><strong>My workspace</strong><span>Personal plan</span></div>
          <ChevronRight size={16} className="muted-icon" />
        </div>

        <div className="sidebar-section-label">Workspace</div>
        <nav className="main-nav">
          <NavLink to="/projects" end className={({ isActive }) => cn('nav-item', isActive && 'nav-item-active')} onClick={closeMobile}>
            <FolderKanban size={17} /> <span>All projects</span><span className="nav-count">{projects.length}</span>
          </NavLink>
        </nav>

        <div className="sidebar-project-heading">
          <span className="sidebar-section-label">Your projects</span>
          <Button variant="ghost" size="icon-xs" aria-label="Create project" onClick={() => setProjectDialogOpen(true)}><Plus size={15} /></Button>
        </div>
        <nav className="project-nav">
          {isLoading ? <><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-4/5" /></> : projects.map((project) => (
            <button key={project.id} className={cn('project-nav-item', selectedProjectId === project.id && 'project-nav-active')} onClick={() => { navigate(`/projects/${project.id}`); closeMobile() }}>
              <span className="project-dot" /> <span className="project-nav-name">{project.name}</span>
            </button>
          ))}
          {!isLoading && projects.length === 0 && <p className="sidebar-empty">Your projects will show here</p>}
        </nav>

        <div className="sidebar-bottom">
          {/* <div className="sidebar-help-card">
            <div className="help-icon"><Search size={15} /></div>
            <strong>Find your focus</strong>
            <span>Small steps make big things happen.</span>
          </div> */}
          {/* <button className="sidebar-setting"><Settings size={16} /> Settings</button> */}
          <div className="sidebar-user">
            <Avatar className="user-avatar"><AvatarFallback>{initials}</AvatarFallback></Avatar>
            <div className="user-copy"><strong>{user?.name}</strong><span>{user?.email}</span></div>
            <Button variant="ghost" size="icon-sm" aria-label="Log out" onClick={logout}><LogOut size={16} /></Button>
          </div>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="topbar-leading">
            <Button variant="ghost" size="icon" className="mobile-menu" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu /></Button>
            <div className="breadcrumb"><span>Workspace</span><ChevronRight size={14} /><strong>{location.pathname.includes('/projects/') ? 'Project board' : 'Overview'}</strong></div>
          </div>
          <div className="topbar-actions">
            <span className="today-label">A little progress each day</span>
            <Button variant="ghost" size="icon" aria-label="Notifications"><Bell size={18} /></Button>
            <Avatar className="topbar-avatar"><AvatarFallback>{initials}</AvatarFallback></Avatar>
          </div>
        </header>
        <main className="page-content"><Outlet /></main>
      </div>
      <ProjectDialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen} />
    </div>
  )
}
