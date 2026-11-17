package taskflow.service

import org.springframework.boot.CommandLineRunner
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import taskflow.model.*
import taskflow.repository.ProjectRepository
import taskflow.repository.TaskRepository
import taskflow.repository.UserRepository
import java.time.LocalDate

@Component
@ConditionalOnProperty(name = ["app.seed.enabled"], havingValue = "true")
class SampleDataSeeder(
    private val users: UserRepository,
    private val projects: ProjectRepository,
    private val tasks: TaskRepository,
    private val passwordEncoder: PasswordEncoder
) : CommandLineRunner {
    @Transactional
    override fun run(vararg args: String) {
        val user = users.findByEmail(SAMPLE_EMAIL) ?: users.save(UserEntity(
            name = "TaskFlow Demo",
            email = SAMPLE_EMAIL,
            password = passwordEncoder.encode(SAMPLE_PASSWORD)
        ))
        val project = projects.findAllByOwnerId(requireNotNull(user.id))
            .firstOrNull { it.name == SAMPLE_PROJECT_NAME }
            ?: projects.save(ProjectEntity(
                name = SAMPLE_PROJECT_NAME,
                description = "Sample project for exploring the task board",
                owner = user
            ))

        val sampleTasks = mapOf(
            TaskStatus.TODO to listOf(
                "Write launch checklist", "Confirm launch goals", "Prepare product screenshots",
                "Draft announcement email", "Review accessibility checklist", "Collect final approvals",
                "Prepare support FAQ", "Check mobile layout", "Schedule social posts", "Plan launch-day handoff"
            ),
            TaskStatus.IN_PROGRESS to listOf(
                "Review landing page", "Build pricing section", "Connect newsletter form",
                "Add analytics events", "Optimize hero images", "Write onboarding copy",
                "Test signup flow", "Update help center", "Check browser compatibility", "Prepare demo environment"
            ),
            TaskStatus.DONE to listOf(
                "Create project workspace", "Choose launch date", "Set up repository", "Agree on visual direction",
                "Create initial wireframes", "Define target audience", "Set up staging environment",
                "Review competitor sites", "Approve brand colors", "Create task board"
            )
        )
        val priorities = TaskPriority.values()
        val missingTasks = sampleTasks.flatMap { (status, titles) ->
            val existingCount = tasks.countByProjectIdAndStatus(requireNotNull(project.id), status).toInt()
            titles.drop(existingCount.coerceAtMost(titles.size)).mapIndexed { index, title ->
                val taskNumber = existingCount + index
                TaskEntity(
                    title = title,
                    description = "Demo task for the ${status.name.lowercase().replace('_', ' ')} column",
                    status = status,
                    priority = priorities[taskNumber % priorities.size],
                    dueDate = LocalDate.now().plusDays((taskNumber - 2).toLong()),
                    project = project
                )
            }
        }
        tasks.saveAll(missingTasks)
    }

    companion object {
        const val SAMPLE_PROJECT_NAME = "Website launch"
        const val SAMPLE_EMAIL = "demo@gmail.com"
        const val SAMPLE_PASSWORD = "12121212"
    }
}
