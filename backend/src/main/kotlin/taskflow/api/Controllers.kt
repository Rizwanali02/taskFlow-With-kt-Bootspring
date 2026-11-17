package taskflow.api

import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.http.HttpStatus
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*
import taskflow.model.TaskPriority
import taskflow.model.TaskStatus
import taskflow.service.AuthService
import taskflow.service.ProjectService
import taskflow.service.TaskService

@RestController
@RequestMapping("/api/auth")
class AuthController(private val auth: AuthService) {
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    fun register(@Valid @RequestBody request: RegisterRequest) = auth.register(request)

    @PostMapping("/login")
    fun login(@Valid @RequestBody request: LoginRequest) = auth.login(request)
}

@RestController
@RequestMapping("/api/projects")
class ProjectController(private val projects: ProjectService, private val tasks: TaskService) {
    @GetMapping
    fun list(authentication: Authentication) = projects.list(authentication.name)

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(authentication: Authentication, @Valid @RequestBody request: ProjectRequest) = projects.create(authentication.name, request)

    @GetMapping("/{projectId}/tasks")
    fun listTasks(
        authentication: Authentication,
        @PathVariable projectId: Long,
        @RequestParam(required = false) status: TaskStatus?,
        @RequestParam(required = false) priority: TaskPriority?,
        @RequestParam(required = false) assignee: Long?,
        @RequestParam(required = false) sortBy: String?,
        @RequestParam(defaultValue = "asc") direction: String,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): Page<TaskDto> = tasks.list(projectId, authentication.name, status, priority, assignee, sortBy, direction, page, size)

    @PostMapping("/{projectId}/tasks")
    @ResponseStatus(HttpStatus.CREATED)
    fun createTask(authentication: Authentication, @PathVariable projectId: Long, @Valid @RequestBody request: TaskRequest) =
        tasks.create(projectId, authentication.name, request)

    @GetMapping("/{projectId}/summary")
    fun summary(authentication: Authentication, @PathVariable projectId: Long) = tasks.summary(projectId, authentication.name)
}

@RestController
@RequestMapping("/api/tasks")
class TaskController(private val tasks: TaskService) {
    @PutMapping("/{taskId}")
    fun update(authentication: Authentication, @PathVariable taskId: Long, @Valid @RequestBody request: TaskRequest) =
        tasks.update(taskId, authentication.name, request)

    @PatchMapping("/{taskId}/status")
    fun changeStatus(authentication: Authentication, @PathVariable taskId: Long, @Valid @RequestBody request: StatusRequest) =
        tasks.changeStatus(taskId, authentication.name, request.status)

    @DeleteMapping("/{taskId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(authentication: Authentication, @PathVariable taskId: Long) = tasks.delete(taskId, authentication.name)
}
