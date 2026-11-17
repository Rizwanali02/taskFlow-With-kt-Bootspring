import axios, { AxiosError } from 'axios'
import type {
  ApiErrorResponse,
  AuthResponse,
  Page,
  Project,
  ProjectRequest,
  ProjectSummary,
  Task,
  TaskPriority,
  TaskRequest,
  TaskStatus,
  User,
} from '@/lib/types'

const TOKEN_KEY = 'taskflow_token'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  timeout: 12000,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response?.status === 401 && localStorage.getItem(TOKEN_KEY)) {
      window.dispatchEvent(new Event('taskflow:unauthorized'))
    }
    return Promise.reject(error)
  },
)

export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.') {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const response = error.response?.data
    if (response?.errors) return Object.values(response.errors).join(' ')
    return response?.message || error.message || fallback
  }
  return error instanceof Error ? error.message : fallback
}

export const authApi = {
  login: async (email: string, password: string) =>
    (await apiClient.post<AuthResponse>('/auth/login', { email, password })).data,
  register: async (name: string, email: string, password: string) =>
    (await apiClient.post<AuthResponse>('/auth/register', { name, email, password })).data,
}

export const projectApi = {
  list: async () => (await apiClient.get<Project[]>('/projects')).data,
  create: async (request: ProjectRequest) =>
    (await apiClient.post<Project>('/projects', request)).data,
  summary: async (projectId: number) =>
    (await apiClient.get<ProjectSummary>(`/projects/${projectId}/summary`)).data,
}

export interface TaskFilters {
  priority?: TaskPriority | 'ALL'
  assignee?: number | 'ALL'
  sortDirection: 'asc' | 'desc'
  page: number
}

export const taskApi = {
  list: async (projectId: number, filters: TaskFilters) => {
    const params: Record<string, string | number> = {
      sortBy: 'dueDate',
      direction: filters.sortDirection,
      page: filters.page,
      size: 100,
    }
    if (filters.priority && filters.priority !== 'ALL') params.priority = filters.priority
    if (filters.assignee && filters.assignee !== 'ALL') params.assignee = filters.assignee
    return (await apiClient.get<Page<Task>>(`/projects/${projectId}/tasks`, { params })).data
  },
  create: async (projectId: number, request: TaskRequest) =>
    (await apiClient.post<Task>(`/projects/${projectId}/tasks`, request)).data,
  update: async (taskId: number, request: TaskRequest) =>
    (await apiClient.put<Task>(`/tasks/${taskId}`, request)).data,
  changeStatus: async (taskId: number, status: TaskStatus) =>
    (await apiClient.patch<Task>(`/tasks/${taskId}/status`, { status })).data,
  delete: async (taskId: number) => apiClient.delete(`/tasks/${taskId}`),
}

export const userApi = {
  current: (): User | null => {
    const value = localStorage.getItem('taskflow_user')
    if (!value) return null
    try {
      return JSON.parse(value) as User
    } catch {
      return null
    }
  },
}
