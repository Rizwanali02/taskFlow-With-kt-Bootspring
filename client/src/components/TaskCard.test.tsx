import { describe, expect, it, jest } from '@jest/globals'
import '@testing-library/jest-dom/jest-globals'
import { render, screen } from '@testing-library/react'
import { TaskCard } from '@/components/TaskCard'
import type { Task } from '@/lib/types'

const task: Task = {
  id: 3,
  title: 'Prepare launch notes',
  description: 'Collect decisions from the team.',
  status: 'TODO',
  priority: 'HIGH',
  dueDate: '2000-01-01',
  assignee: null,
  projectId: 14,
  createdAt: '2026-01-01T09:00:00Z',
  updatedAt: '2026-01-01T09:00:00Z',
}

describe('TaskCard', () => {
  it('shows task priority, description, and overdue state', () => {
    render(<TaskCard task={task} onEdit={jest.fn()} onDelete={jest.fn()} onStatusChange={jest.fn()} />)

    expect(screen.getByRole('heading', { name: 'Prepare launch notes' })).toBeInTheDocument()
    expect(screen.getByText('high')).toBeInTheDocument()
    expect(screen.getByText('Collect decisions from the team.')).toBeInTheDocument()
    expect(screen.getByText(/Overdue/)).toBeInTheDocument()
  })
})
