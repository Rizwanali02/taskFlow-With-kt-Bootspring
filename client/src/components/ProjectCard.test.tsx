import { describe, expect, it } from '@jest/globals'
import '@testing-library/jest-dom/jest-globals'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ProjectCard } from '@/components/ProjectCard'
import type { Project } from '@/lib/types'

const project: Project = {
  id: 14,
  name: 'Website launch',
  description: 'Prepare the new site for release.',
  ownerId: 4,
  createdAt: '2026-10-10T09:00:00Z',
}

describe('ProjectCard', () => {
  it('shows project details and links to its board', () => {
    render(<MemoryRouter><ProjectCard project={project} /></MemoryRouter>)

    expect(screen.getByRole('heading', { name: 'Website launch' })).toBeInTheDocument()
    expect(screen.getByText('Prepare the new site for release.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open Website launch' })).toHaveAttribute('href', '/projects/14')
  })
})
