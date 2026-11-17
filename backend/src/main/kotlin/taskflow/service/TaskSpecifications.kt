package taskflow.service

import org.springframework.data.jpa.domain.Specification
import taskflow.model.*
import java.time.LocalDate

object TaskSpecifications {
    fun forProject(projectId: Long, status: TaskStatus?, priority: TaskPriority?, assigneeId: Long?): Specification<TaskEntity> {
        return Specification { root, _, builder ->
            val predicates = mutableListOf(builder.equal(root.get<ProjectEntity>("project").get<Long>("id"), projectId))
            status?.let { predicates += builder.equal(root.get<TaskStatus>("status"), it) }
            priority?.let { predicates += builder.equal(root.get<TaskPriority>("priority"), it) }
            assigneeId?.let { predicates += builder.equal(root.get<UserEntity>("assignee").get<Long>("id"), it) }
            builder.and(*predicates.toTypedArray())
        }
    }
}

fun TaskEntity.isOverdue(today: LocalDate = LocalDate.now()) = status != TaskStatus.DONE && dueDate?.isBefore(today) == true
