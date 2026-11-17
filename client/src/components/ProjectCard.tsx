import { formatDistanceToNow } from 'date-fns'
import { ArrowUpRight, FolderKanban } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import type { Project } from '@/lib/types'

const colors = ['lavender', 'peach', 'mint', 'blue']

export function ProjectCard({ project, index = 0 }: { project: Project; index?: number }) {
  return (
    <Link to={`/projects/${project.id}`} className="project-card-link" aria-label={`Open ${project.name}`}>
      <Card className="project-card">
        <CardContent className="project-card-content">
          <div className={`project-card-icon ${colors[index % colors.length]}`}><FolderKanban size={20} /></div>
          <span className="project-card-arrow"><ArrowUpRight size={17} /></span>
          <div className="project-card-copy">
            <h3>{project.name}</h3>
            <p>{project.description || 'A space for your next great idea.'}</p>
          </div>
          <div className="project-card-footer"><span className="project-card-status"><span /> Active</span><span>Created {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}</span></div>
        </CardContent>
      </Card>
    </Link>
  )
}
