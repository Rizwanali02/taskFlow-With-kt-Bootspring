import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Task, TaskPriority, TaskRequest, TaskStatus } from '@/lib/types'

const schema = z.object({
  title: z.string().trim().min(1, 'Task title is required').max(120, 'Keep the title under 120 characters'),
  description: z.string().max(4000, 'Description must be under 4000 characters').optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function TaskDialog({
  open,
  onOpenChange,
  task,
  isSaving,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: Task | null
  isSaving: boolean
  onSubmit: (request: TaskRequest) => void
}) {
  const [today] = useState(() => new Date().toISOString().slice(0, 10))
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '', status: 'TODO', priority: 'MEDIUM', dueDate: '', assigneeId: '' },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        title: task?.title || '',
        description: task?.description || '',
        status: task?.status || 'TODO',
        priority: task?.priority || 'MEDIUM',
        dueDate: task?.dueDate || '',
        assigneeId: task?.assignee ? String(task.assignee.id) : '',
      })
    }
  }, [open, task, form])

  const save = form.handleSubmit((values) => {
    const parsedAssignee = values.assigneeId?.trim() ? Number(values.assigneeId) : null
    onSubmit({
      title: values.title,
      description: values.description?.trim() || undefined,
      status: values.status as TaskStatus,
      priority: values.priority as TaskPriority,
      dueDate: values.dueDate || null,
      assigneeId: parsedAssignee && Number.isInteger(parsedAssignee) && parsedAssignee > 0 ? parsedAssignee : null,
    })
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="taskflow-dialog task-dialog-content">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit task' : 'Create a task'}</DialogTitle>
          <DialogDescription>{task ? 'Update the details and keep everyone in sync.' : 'Add a clear next step to this project.'}</DialogDescription>
        </DialogHeader>
        <form className="dialog-form" onSubmit={save}>
          <div className="field-group"><Label htmlFor="task-title">Task title</Label><Input id="task-title" autoFocus maxLength={120} placeholder="What needs to get done?" aria-invalid={Boolean(form.formState.errors.title)} {...form.register('title')} />{form.formState.errors.title && <span className="field-error">{form.formState.errors.title.message}</span>}</div>
          <div className="field-group"><Label htmlFor="task-description">Description <span className="optional-label">Optional</span></Label><Textarea id="task-description" rows={3} maxLength={4000} placeholder="Add a little context…" {...form.register('description')} /></div>
          <div className="form-two-column">
            <div className="field-group"><Label htmlFor="task-priority">Priority</Label><select id="task-priority" className="form-select" {...form.register('priority')}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option></select></div>
            <div className="field-group"><Label htmlFor="task-due-date">Due date</Label><Input id="task-due-date" type="date" min={!task ? today : undefined} {...form.register('dueDate')} /></div>
          </div>
          <div className="form-two-column">
            <div className="field-group"><Label htmlFor="task-status">Status</Label><select id="task-status" className="form-select" {...form.register('status')}><option value="TODO">To do</option><option value="IN_PROGRESS">In progress</option><option value="DONE">Done</option></select></div>
            <div className="field-group"><Label htmlFor="task-assignee">Assignee user ID <span className="optional-label">Optional</span></Label><Input id="task-assignee" type="number" min="1" step="1" placeholder="e.g. 1" {...form.register('assigneeId')} /><span className="field-hint">Enter a teammate’s user ID, or leave unassigned.</span></div>
          </div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : task ? 'Save changes' : 'Create task'}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
