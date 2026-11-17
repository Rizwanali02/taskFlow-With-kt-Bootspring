package taskflow.model

import jakarta.persistence.*
import java.time.Instant
import java.time.LocalDate

@Entity
@Table(name = "users")
class UserEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) var id: Long? = null,
    @Column(nullable = false) var name: String = "",
    @Column(nullable = false, unique = true) var email: String = "",
    @Column(nullable = false) var password: String = "",
    @Column(nullable = false, updatable = false) var createdAt: Instant = Instant.now()
)

@Entity
@Table(name = "projects")
class ProjectEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) var id: Long? = null,
    @Column(nullable = false, length = 120) var name: String = "",
    @Column(length = 2000) var description: String? = null,
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "owner_id") var owner: UserEntity = UserEntity(),
    @Column(nullable = false, updatable = false) var createdAt: Instant = Instant.now()
)

enum class TaskStatus { TODO, IN_PROGRESS, DONE }
enum class TaskPriority { LOW, MEDIUM, HIGH }

@Entity
@Table(name = "tasks")
class TaskEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) var id: Long? = null,
    @Column(nullable = false, length = 120) var title: String = "",
    @Column(length = 4000) var description: String? = null,
    @Enumerated(EnumType.STRING) @Column(nullable = false) var status: TaskStatus = TaskStatus.TODO,
    @Enumerated(EnumType.STRING) @Column(nullable = false) var priority: TaskPriority = TaskPriority.MEDIUM,
    var dueDate: LocalDate? = null,
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "assignee_id") var assignee: UserEntity? = null,
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "project_id") var project: ProjectEntity = ProjectEntity(),
    @Column(nullable = false, updatable = false) var createdAt: Instant = Instant.now(),
    @Column(nullable = false) var updatedAt: Instant = Instant.now()
)
