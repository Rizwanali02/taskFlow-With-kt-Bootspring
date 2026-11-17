package taskflow.service

import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import taskflow.api.*
import taskflow.model.ProjectEntity
import taskflow.repository.ProjectRepository
import taskflow.repository.UserRepository

@Service
class ProjectService(private val projects: ProjectRepository, private val users: UserRepository) {
    fun list(email: String) = projects.findAllByOwnerId(currentUserId(email)).map { it.toDto() }

    fun create(email: String, request: ProjectRequest): ProjectDto {
        val owner = users.findByEmail(email) ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found")
        return projects.save(ProjectEntity(name = request.name.trim(), description = request.description?.trim(), owner = owner)).toDto()
    }

    fun ownedProject(id: Long, email: String) = projects.findByIdAndOwnerId(id, currentUserId(email))
        ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found")

    private fun currentUserId(email: String) = users.findByEmail(email)?.id
        ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found")
}
