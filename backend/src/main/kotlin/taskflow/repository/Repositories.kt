package taskflow.repository

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.JpaSpecificationExecutor
import taskflow.model.*

interface UserRepository : JpaRepository<UserEntity, Long> {
    fun findByEmail(email: String): UserEntity?
    fun existsByEmail(email: String): Boolean
}

interface ProjectRepository : JpaRepository<ProjectEntity, Long> {
    fun findAllByOwnerId(ownerId: Long): List<ProjectEntity>
    fun findByIdAndOwnerId(id: Long, ownerId: Long): ProjectEntity?
}

interface TaskRepository : JpaRepository<TaskEntity, Long>, JpaSpecificationExecutor<TaskEntity> {
    fun findByIdAndProjectOwnerId(id: Long, ownerId: Long): TaskEntity?
    fun countByProjectIdAndStatus(projectId: Long, status: TaskStatus): Long
}
