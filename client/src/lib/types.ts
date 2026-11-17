export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH'

export interface User {
  id: number
  name: string
  email: string
  createdAt: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface Project {
  id: number
  name: string
  description: string | null
  ownerId: number
  createdAt: string
}

export interface ProjectRequest {
  name: string
  description?: string
}

export interface Task {
  id: number
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  dueDate: string | null
  assignee: User | null
  projectId: number
  createdAt: string
  updatedAt: string
}

export interface TaskRequest {
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  dueDate: string | null
  assigneeId: number | null
}

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface ProjectSummary {
  countsByStatus: Record<TaskStatus, number>
  overdueCount: number
}

export interface ApiErrorResponse {
  message: string
  errors?: Record<string, string>
  timestamp?: string
}
