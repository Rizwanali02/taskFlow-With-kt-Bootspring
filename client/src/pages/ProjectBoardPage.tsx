import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowUpDown, CalendarClock, CheckCircle2, CircleDashed, CircleDot, ListFilter, Plus, RefreshCw, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { TaskCard } from '@/components/TaskCard'
import { TaskDialog } from '@/components/TaskDialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/context/useAuth'
import { getErrorMessage, projectApi, taskApi } from '@/lib/api'
import type { TaskFilters } from '@/lib/api'
import type { Project, Task, TaskPriority, TaskRequest, TaskStatus, User } from '@/lib/types'

const lanes: { status: TaskStatus; label: string; icon: typeof CircleDashed; color: string }[] = [
  { status: 'TODO', label: 'To do', icon: CircleDashed, color: 'lane-todo' },
  { status: 'IN_PROGRESS', label: 'In progress', icon: CircleDot, color: 'lane-progress' },
  { status: 'DONE', label: 'Done', icon: CheckCircle2, color: 'lane-done' },
]

const emptyFilters: TaskFilters = { priority: 'ALL', assignee: 'ALL', sortDirection: 'asc', page: 0 }

export function ProjectBoardPage() {
  const { projectId: rawProjectId } = useParams()
  const projectId = Number(rawProjectId)
  const [filters, setFilters] = useState<TaskFilters>(emptyFilters)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const validId = Number.isInteger(projectId) && projectId > 0

  const projectsQuery = useQuery({ queryKey: ['projects'], queryFn: projectApi.list, enabled: validId })
  const project: Project | undefined = projectsQuery.data?.find((item) => item.id === projectId)
  const tasksQuery = useQuery({
    queryKey: ['tasks', projectId, filters],
    queryFn: () => taskApi.list(projectId, filters),
    enabled: validId,
  })
  const assigneeQuery = useQuery({
    queryKey: ['task-assignees', projectId],
    queryFn: () => taskApi.list(projectId, { ...emptyFilters, page: 0 }),
    enabled: validId,
  })
  const summaryQuery = useQuery({ queryKey: ['summary', projectId], queryFn: () => projectApi.summary(projectId), enabled: validId })
  const allTasks = tasksQuery.data?.content || []

  const assignees = useMemo(() => {
    const unique = new Map<number, User>()
    if (user) unique.set(user.id, user)
    for (const task of assigneeQuery.data?.content || []) {
      if (task.assignee) unique.set(task.assignee.id, task.assignee)
    }
    return [...unique.values()]
  }, [assigneeQuery.data, user])

  const refreshBoard = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] }),
      queryClient.invalidateQueries({ queryKey: ['summary', projectId] }),
      queryClient.invalidateQueries({ queryKey: ['task-assignees', projectId] }),
    ])
  }

  const createMutation = useMutation({
    mutationFn: (request: TaskRequest) => taskApi.create(projectId, request),
    onSuccess: async () => { await refreshBoard(); setDialogOpen(false); toast.success('Task added to the project.') },
    onError: (error) => toast.error(getErrorMessage(error, 'Task could not be created.')),
  })
  const updateMutation = useMutation({
    mutationFn: ({ taskId, request }: { taskId: number; request: TaskRequest }) => taskApi.update(taskId, request),
    onSuccess: async () => { await refreshBoard(); setDialogOpen(false); setEditingTask(null); toast.success('Task updated.') },
    onError: (error) => toast.error(getErrorMessage(error, 'Task could not be updated.')),
  })
  const statusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: number; status: TaskStatus }) => taskApi.changeStatus(taskId, status),
    onSuccess: async () => { await refreshBoard(); toast.success('Task status updated.') },
    onError: (error) => toast.error(getErrorMessage(error, 'Status could not be updated.')),
  })
  const deleteMutation = useMutation({
    mutationFn: (taskId: number) => taskApi.delete(taskId),
    onSuccess: async () => { await refreshBoard(); toast.success('Task deleted.') },
    onError: (error) => toast.error(getErrorMessage(error, 'Task could not be deleted.')),
  })

  if (!validId) return <Navigate to="/projects" replace />

  const isLoading = projectsQuery.isLoading || tasksQuery.isLoading || summaryQuery.isLoading
  const isProjectMissing = projectsQuery.isSuccess && !project
  if (isProjectMissing) return <Navigate to="/projects" replace />

  const openCreate = () => { setEditingTask(null); setDialogOpen(true) }
  const openEdit = (task: Task) => { setEditingTask(task); setDialogOpen(true) }
  const submitTask = (request: TaskRequest) => {
    if (editingTask) updateMutation.mutate({ taskId: editingTask.id, request })
    else createMutation.mutate(request)
  }
  const saving = createMutation.isPending || updateMutation.isPending
  const filtered = filters.priority !== 'ALL' || filters.assignee !== 'ALL'

  return (
    <div className="board-page">
      <div className="board-back-row"><Link to="/projects" className="back-link"><ArrowLeft size={16} /> All projects</Link><span className="board-breadcrumb-separator">/</span><span>{project?.name || 'Project board'}</span></div>

      <section className="board-heading">
        <div className="board-title-group">
          <div className="board-title-icon"><Sparkles size={19} /></div>
          <div><span className="eyebrow">PROJECT BOARD</span><h1>{project?.name || <Skeleton className="h-8 w-64" />}</h1><p>{project?.description || 'A clear view of what’s next, what’s moving, and what’s done.'}</p></div>
        </div>
        <Button className="create-task-button" onClick={openCreate}><Plus size={17} /> Add task</Button>
      </section>

      <section className="summary-strip" aria-label="Project summary">
        <div className="summary-intro"><div className="summary-icon"><CalendarClock size={17} /></div><div><strong>Project pulse</strong><span>Progress at a glance</span></div></div>
        {summaryQuery.isLoading ? <div className="summary-loading"><Skeleton className="h-10 w-24" /><Skeleton className="h-10 w-24" /><Skeleton className="h-10 w-24" /></div> : summaryQuery.isError ? <button className="summary-retry" onClick={() => void summaryQuery.refetch()}><RefreshCw size={14} /> Retry summary</button> : <div className="summary-metrics">
          <div className="summary-metric"><span className="metric-dot metric-todo" /><span>To do</span><strong>{summaryQuery.data?.countsByStatus.TODO ?? 0}</strong></div>
          <div className="summary-metric"><span className="metric-dot metric-progress" /><span>In progress</span><strong>{summaryQuery.data?.countsByStatus.IN_PROGRESS ?? 0}</strong></div>
          <div className="summary-metric"><span className="metric-dot metric-done" /><span>Done</span><strong>{summaryQuery.data?.countsByStatus.DONE ?? 0}</strong></div>
          <div className="overdue-metric"><CalendarClock size={16} /><span>Overdue</span><strong>{summaryQuery.data?.overdueCount ?? 0}</strong></div>
        </div>}
      </section>

      <section className="board-toolbar">
        <div className="board-toolbar-title"><ListFilter size={17} /><strong>Tasks</strong><span>{tasksQuery.data?.totalElements ?? 0}</span></div>
        <div className="board-filters">
          <label className="filter-control"><span>Priority</span><select aria-label="Filter by priority" value={filters.priority} onChange={(event) => setFilters((current) => ({ ...current, page: 0, priority: event.target.value as TaskPriority | 'ALL' }))}><option value="ALL">All priorities</option><option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option></select></label>
          <label className="filter-control"><span>Assignee</span><select aria-label="Filter by assignee" value={filters.assignee} onChange={(event) => setFilters((current) => ({ ...current, page: 0, assignee: event.target.value === 'ALL' ? 'ALL' : Number(event.target.value) }))}><option value="ALL">Everyone</option>{assignees.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>
          <label className="sort-control"><span>Due date</span><button aria-label={`Sort due date ${filters.sortDirection === 'asc' ? 'ascending' : 'descending'}`} onClick={() => setFilters((current) => ({ ...current, page: 0, sortDirection: current.sortDirection === 'asc' ? 'desc' : 'asc' }))}><ArrowUpDown size={15} /> {filters.sortDirection === 'asc' ? 'Soonest' : 'Latest'}</button></label>
        </div>
      </section>
      {assigneeQuery.isLoading && <p className="filter-state">Loading assignee options…</p>}
      {assigneeQuery.isError && <p className="filter-state filter-state-error">Assignee options couldn’t load. You can still use the priority filter.</p>}

      {isLoading && <div className="board-grid">{lanes.map((lane) => <div className="board-lane" key={lane.status}><Skeleton className="h-10 w-full" /><Skeleton className="h-44 w-full" /><Skeleton className="h-36 w-full" /></div>)}</div>}
      {!isLoading && (tasksQuery.isError || projectsQuery.isError) && <div className="state-panel state-error"><div className="state-icon">!</div><h3>Couldn’t load this project</h3><p>Check that the backend is running, then try again.</p><Button variant="outline" onClick={() => { void tasksQuery.refetch(); void projectsQuery.refetch(); void summaryQuery.refetch() }}><RefreshCw size={15} /> Try again</Button></div>}

      {!isLoading && !tasksQuery.isError && !projectsQuery.isError && allTasks.length === 0 && !filtered && (
        <div className="board-empty"><div className="empty-project-art"><CircleDashed size={28} /></div><span className="eyebrow">FIRST THINGS FIRST</span><h3>This board is ready for your first task</h3><p>Start with one clear next step. You can add a due date and an owner as you go.</p><Button onClick={openCreate}><Plus size={16} /> Add your first task</Button></div>
      )}
      {!isLoading && !tasksQuery.isError && !projectsQuery.isError && allTasks.length === 0 && filtered && (
        <div className="board-empty board-filter-empty"><div className="empty-project-art"><ListFilter size={26} /></div><h3>No tasks match these filters</h3><p>Try changing the priority or assignee filter.</p><Button variant="outline" onClick={() => setFilters(emptyFilters)}>Clear filters</Button></div>
      )}

      {!isLoading && !tasksQuery.isError && !projectsQuery.isError && allTasks.length > 0 && <div className="board-grid">
        {lanes.map((lane) => {
          const Icon = lane.icon
          const tasks = allTasks.filter((task) => task.status === lane.status)
          return <section key={lane.status} className={`board-lane ${lane.color}`} aria-labelledby={`lane-${lane.status}`}>
            <div className="lane-header"><div className="lane-title"><span className="lane-icon"><Icon size={17} /></span><h2 id={`lane-${lane.status}`}>{lane.label}</h2><span className="lane-count">{tasks.length}</span></div><button className="lane-add-button" aria-label={`Add task to ${lane.label}`} onClick={() => { setEditingTask(null); setDialogOpen(true) }}><Plus size={17} /></button></div>
            <div className="lane-cards">{tasks.map((task) => <TaskCard key={task.id} task={task} onEdit={openEdit} onDelete={(item) => { if (window.confirm(`Delete “${item.title}”?`)) deleteMutation.mutate(item.id) }} onStatusChange={(item, status) => statusMutation.mutate({ taskId: item.id, status })} />)}</div>
            {tasks.length === 0 && <button className="lane-empty-add" onClick={openCreate}><Plus size={16} /> Add a task</button>}
          </section>
        })}
      </div>}

      {!isLoading && !tasksQuery.isError && (tasksQuery.data?.totalPages || 0) > 1 && <div className="pagination-row"><span>Page {filters.page + 1} of {tasksQuery.data?.totalPages}</span><div><Button size="sm" variant="outline" disabled={filters.page === 0} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}>Previous</Button><Button size="sm" variant="outline" disabled={filters.page + 1 >= (tasksQuery.data?.totalPages || 0)} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}>Next</Button></div></div>}

      <TaskDialog open={dialogOpen} onOpenChange={setDialogOpen} task={editingTask} isSaving={saving} onSubmit={submitTask} />
    </div>
  )
}
