import { isBefore, parseISO } from 'date-fns'
import type { Task } from '@/lib/types'

export function isTaskOverdue(task: Task, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return task.status !== 'DONE' && task.dueDate !== null && isBefore(parseISO(task.dueDate), today)
}
