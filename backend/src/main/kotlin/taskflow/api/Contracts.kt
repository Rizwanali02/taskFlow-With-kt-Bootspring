package taskflow.api

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import taskflow.model.*
import java.time.Instant
import java.time.LocalDate

data class RegisterRequest(
    @field:NotBlank(message = "Name is required") @field:Size(max = 100, message = "Name must be at most 100 characters") val name: String,
    @field:NotBlank(message = "Email is required") @field:Email(message = "Email must be valid") val email: String,
    @field:NotBlank(message = "Password is required") @field:Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters") val password: String
)

data class LoginRequest(
    @field:NotBlank(message = "Email is required") @field:Email(message = "Email must be valid") val email: String,
    @field:NotBlank(message = "Password is required") val password: String
)

data class AuthResponse(val token: String, val user: UserDto)
data class UserDto(val id: Long, val name: String, val email: String, val createdAt: Instant)
data class ProjectRequest(
    @field:NotBlank(message = "Name is required") @field:Size(max = 120, message = "Name must be at most 120 characters") val name: String,
    @field:Size(max = 2000, message = "Description must be at most 2000 characters") val description: String? = null
)
data class ProjectDto(val id: Long, val name: String, val description: String?, val ownerId: Long, val createdAt: Instant)
data class TaskRequest(
    @field:NotBlank(message = "Title is required") @field:Size(max = 120, message = "Title must be at most 120 characters") val title: String,
    @field:Size(max = 4000, message = "Description must be at most 4000 characters") val description: String? = null,
    val status: TaskStatus = TaskStatus.TODO,
    val priority: TaskPriority = TaskPriority.MEDIUM,
    val dueDate: LocalDate? = null,
    val assigneeId: Long? = null
)
data class StatusRequest(val status: TaskStatus)
data class TaskDto(
    val id: Long, val title: String, val description: String?, val status: TaskStatus,
    val priority: TaskPriority, val dueDate: LocalDate?, val assignee: UserDto?,
    val projectId: Long, val createdAt: Instant, val updatedAt: Instant
)
data class ProjectSummaryDto(val countsByStatus: Map<TaskStatus, Long>, val overdueCount: Long)
data class ErrorResponse(val message: String, val errors: Map<String, String> = emptyMap(), val timestamp: Instant = Instant.now())

fun UserEntity.toDto() = UserDto(requireNotNull(id), name, email, createdAt)
fun ProjectEntity.toDto() = ProjectDto(requireNotNull(id), name, description, requireNotNull(owner.id), createdAt)
fun TaskEntity.toDto() = TaskDto(requireNotNull(id), title, description, status, priority, dueDate, assignee?.toDto(), requireNotNull(project.id), createdAt, updatedAt)
