import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, FolderPlus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ProjectCard } from '@/components/ProjectCard'
import { ProjectDialog } from '@/components/ProjectDialog'
import { useAuth } from '@/context/useAuth'
import { projectApi } from '@/lib/api'

export function ProjectsPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const { user } = useAuth()
  const { data: projects = [], isLoading, isError, refetch } = useQuery({ queryKey: ['projects'], queryFn: projectApi.list })
  const [hour] = useState(() => new Date().getHours())
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="projects-page">
      <section className="welcome-banner">
        <div className="welcome-copy">
          <div className="welcome-eyebrow"><Sparkles size={14} /> YOUR SPACE TO MAKE PROGRESS</div>
          <h1>{greeting}, {user?.name.split(' ')[0]}<span>.</span></h1>
          <p>Keep the big picture in view, and the next step close at hand.</p>
        </div>
        <div className="welcome-art" aria-hidden="true"><div className="art-circle art-circle-back" /><div className="art-circle art-circle-front"><FolderPlus size={30} /></div><span className="art-spark spark-a">✦</span><span className="art-spark spark-b">✧</span></div>
        <div className="welcome-banner-line" />
      </section>

      <section className="projects-section">
        <div className="section-heading-row">
          <div><span className="eyebrow">WORKSPACE</span><h2>Your projects <span className="project-total">{projects.length}</span></h2><p>Everything you’re moving forward.</p></div>
          <Button className="create-project-button" onClick={() => setDialogOpen(true)}><FolderPlus size={17} /> New project</Button>
        </div>

        {isLoading ? <div className="project-grid">{[0, 1, 2].map((item) => <Skeleton key={item} className="project-card-skeleton" />)}</div> : null}

        {isError && <div className="state-panel state-error"><div className="state-icon">!</div><h3>Couldn’t load your projects</h3><p>Check your connection and try again.</p><Button variant="outline" onClick={() => void refetch()}>Try again</Button></div>}

        {!isLoading && !isError && projects.length > 0 && <div className="project-grid">{projects.map((project, index) => <ProjectCard key={project.id} project={project} index={index} />)}</div>}

        {!isLoading && !isError && projects.length === 0 && (
          <div className="empty-projects">
            <div className="empty-project-art"><FolderPlus size={28} /></div>
            <span className="eyebrow">A FRESH START</span>
            <h3>Your first project starts here</h3>
            <p>Create a project to bring tasks, deadlines, and ideas together in one place.</p>
            <Button onClick={() => setDialogOpen(true)}>Create your first project <ArrowRight size={16} /></Button>
          </div>
        )}
      </section>
      <ProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
