import { useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getErrorMessage, projectApi } from '@/lib/api'

const schema = z.object({
  name: z.string().trim().min(1, 'Project name is required').max(120, 'Keep the name under 120 characters'),
  description: z.string().max(2000, 'Description must be under 2000 characters').optional(),
})

type ProjectValues = z.infer<typeof schema>

export function ProjectDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient()
  const form = useForm<ProjectValues>({ resolver: zodResolver(schema), defaultValues: { name: '', description: '' } })
  const mutation = useMutation({
    mutationFn: projectApi.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project created.')
      form.reset()
      onOpenChange(false)
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Project could not be created.')),
  })

  useEffect(() => {
    if (!open) form.reset()
  }, [open, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="taskflow-dialog">
        <DialogHeader>
          <DialogTitle>Create a project</DialogTitle>
          <DialogDescription>Give your next piece of work a clear home.</DialogDescription>
        </DialogHeader>
        <form className="dialog-form" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
          <div className="field-group"><Label htmlFor="project-name">Project name</Label><Input id="project-name" autoFocus maxLength={120} placeholder="e.g. Website refresh" aria-invalid={Boolean(form.formState.errors.name)} {...form.register('name')} />{form.formState.errors.name && <span className="field-error">{form.formState.errors.name.message}</span>}</div>
          <div className="field-group"><Label htmlFor="project-description">Description <span className="optional-label">Optional</span></Label><Textarea id="project-description" rows={4} maxLength={2000} placeholder="What are you working toward?" {...form.register('description')} />{form.formState.errors.description && <span className="field-error">{form.formState.errors.description.message}</span>}</div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Creating…' : 'Create project'}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
