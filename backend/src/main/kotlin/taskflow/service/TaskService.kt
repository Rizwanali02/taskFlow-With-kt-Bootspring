package taskflow.service

import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import taskflow.api.*
import taskflow.model.*
import taskflow.repository.ProjectRepository
import taskflow.repository.TaskRepository
import taskflow.repository.UserRepository
import java.time.LocalDate

@Service
class TaskService(
    private val tasks: TaskRepository,
    private val projects: ProjectRepository,
    private val users: UserRepository
) {
    @Transactional(readOnly = true)
    fun list(projectId: Long, email: String, status: TaskStatus?, priority: TaskPriority?, assigneeId: Long?, sortBy: String?, direction: String?, page: Int, size: Int): Page<TaskDto> {
        val project = ownedProject(projectId, email)
        val property = when (sortBy) {
            "dueDate" -> "dueDate"
            "priority" -> "priority"
            null, "" -> "createdAt"
            else -> throw ResponseStatusException(HttpStatus.BAD_REQUEST, "sortBy must be dueDate or priority")
        }
        val sortDirection = if (direction.equals("desc", true)) Sort.Direction.DESC else Sort.Direction.ASC
        return tasks.findAll(TaskSpecifications.forProject(requireNotNull(project.id), status, priority, assigneeId), PageRequest.of(page, size.coerceAtMost(100), Sort.by(sortDirection, property)))
            .map { it.toDto() }
    }

    @Transactional
    fun create(projectId: Long, email: String, request: TaskRequest): TaskDto {
        val project = ownedProject(projectId, email)
        if (request.dueDate?.isBefore(LocalDate.now()) == true) fieldError("dueDate", "Due date cannot be in the past")
        val task = TaskEntity(
            title = request.title.trim(), description = request.description?.trim(), status = request.status,
            priority = request.priority, dueDate = request.dueDate, assignee = request.assigneeId?.let(::assignee), project = project
        )
        return tasks.save(task).toDto()
    }

    @Transactional
    fun update(taskId: Long, email: String, request: TaskRequest): TaskDto {
        val task = ownedTask(taskId, email)
        if (request.dueDate?.isBefore(LocalDate.now()) == true) fieldError("dueDate", "Due date cannot be in the past")
        task.title = request.title.trim()
        task.description = request.description?.trim()
        task.status = request.status
        task.priority = request.priority
        task.dueDate = request.dueDate
        task.assignee = request.assigneeId?.let(::assignee)
        task.updatedAt = java.time.Instant.now()
        return tasks.save(task).toDto()
    }

    @Transactional
    fun changeStatus(taskId: Long, email: String, status: TaskStatus): TaskDto {
        val task = ownedTask(taskId, email)
        task.status = status
        task.updatedAt = java.time.Instant.now()
        return tasks.save(task).toDto()
    }

    fun delete(taskId: Long, email: String) { tasks.delete(ownedTask(taskId, email)) }

    @Transactional(readOnly = true)
    fun summary(projectId: Long, email: String): ProjectSummaryDto {
        val project = ownedProject(projectId, email)
        val all = tasks.findAll(TaskSpecifications.forProject(requireNotNull(project.id), null, null, null))
        return ProjectSummaryDto(TaskStatus.entries.associateWith { status -> all.count { it.status == status }.toLong() }, all.count { it.isOverdue() }.toLong())
    }

    private fun ownedProject(id: Long, email: String) = projects.findByIdAndOwnerId(id, userId(email))
        ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found")

    private fun ownedTask(id: Long, email: String) = tasks.findByIdAndProjectOwnerId(id, userId(email))
        ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found")

    private fun userId(email: String) = users.findByEmail(email)?.id
        ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found")

    private fun assignee(id: Long) = users.findById(id).orElseThrow { ResponseStatusException(HttpStatus.BAD_REQUEST, "Assignee not found") }

    private fun fieldError(field: String, message: String): Nothing = throw FieldValidationException(mapOf(field to message))
}
