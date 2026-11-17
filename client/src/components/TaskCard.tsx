import { format, parseISO } from 'date-fns'
import { CalendarDays, Check, MoreHorizontal, Pencil, Trash2, UserRound } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { Task, TaskStatus } from '@/lib/types'
import { isTaskOverdue } from '@/lib/task-utils'
import { cn } from '@/lib/utils'

const statusLabels: Record<TaskStatus, string> = { TODO: 'To do', IN_PROGRESS: 'In progress', DONE: 'Done' }
const nextStatus: Record<TaskStatus, TaskStatus> = { TODO: 'IN_PROGRESS', IN_PROGRESS: 'DONE', DONE: 'TODO' }

export function TaskCard({ task, onEdit, onDelete, onStatusChange }: {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onStatusChange: (task: Task, status: TaskStatus) => void
}) {
  const overdue = isTaskOverdue(task)
  const assigneeInitials = task.assignee?.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()

  return (
    <Card className={cn('task-card', overdue && 'task-card-overdue', task.status === 'DONE' && 'task-card-done')}>
      <CardContent className="task-card-content">
        <div className="task-card-topline">
          <Badge variant="secondary" className={cn('priority-badge', `priority-${task.priority.toLowerCase()}`)}><span />{task.priority.toLowerCase()}</Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" className="task-more-button" aria-label={`Options for ${task.title}`}><MoreHorizontal size={18} /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => onEdit(task)}><Pencil size={15} /> Edit task</DropdownMenuItem><DropdownMenuItem className="delete-menu-item" onSelect={() => onDelete(task)}><Trash2 size={15} /> Delete task</DropdownMenuItem></DropdownMenuContent>
          </DropdownMenu>
        </div>
        <button className="task-card-title-button" onClick={() => onEdit(task)}><h3 className={cn(task.status === 'DONE' && 'task-title-completed')}>{task.title}</h3></button>
        {task.description && <p className="task-card-description">{task.description}</p>}
        <div className="task-card-footer">
          <div className={cn('task-due-date', overdue && 'due-date-overdue')}>
            {task.dueDate ? <><CalendarDays size={15} /><span>{format(parseISO(task.dueDate), 'MMM d')}{overdue && <strong> · Overdue</strong>}</span></> : <span className="no-due-date">No due date</span>}
          </div>
          {task.assignee ? <div className="task-assignee" title={task.assignee.name}><Avatar className="assignee-avatar"><AvatarFallback>{assigneeInitials}</AvatarFallback></Avatar><span>{task.assignee.name.split(' ')[0]}</span></div> : <span className="task-unassigned"><UserRound size={14} /> Unassigned</span>}
        </div>
        <div className="task-card-bottom">
          <label className="status-control-label" htmlFor={`status-${task.id}`}>Move to</label>
          <select id={`status-${task.id}`} className="task-status-select" value={task.status} aria-label={`Status for ${task.title}`} onChange={(event) => onStatusChange(task, event.target.value as TaskStatus)}>
            {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          {task.status === 'DONE' && <span className="completed-mark"><Check size={13} /> Complete</span>}
          {task.status !== 'DONE' && <button className="quick-complete" onClick={() => onStatusChange(task, nextStatus[task.status])}>Mark done <Check size={13} /></button>}
        </div>
      </CardContent>
    </Card>
  )
}
