package com.projectpolaris.app.data

import android.content.Context
import androidx.room.Dao
import androidx.room.Database
import androidx.room.Entity
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.PrimaryKey
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.Transaction
import kotlinx.coroutines.flow.Flow
import java.util.UUID

@Entity(tableName = "courses")
data class CourseEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val name: String,
    val createdAtEpochMillis: Long = System.currentTimeMillis(),
)

@Entity(tableName = "tasks")
data class TaskEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val title: String,
    val notes: String = "",
    val courseId: String? = null,
    val dueAtEpochMillis: Long? = null,
    val plannedForEpochDay: Long? = null,
    val effortMinutes: Int = 25,
    val status: String = TaskStatus.OPEN.name,
    val createdAtEpochMillis: Long = System.currentTimeMillis(),
    val updatedAtEpochMillis: Long = System.currentTimeMillis(),
)

enum class TaskStatus {
    OPEN,
    COMPLETED,
}

@Dao
interface CourseDao {
    @Query("SELECT * FROM courses ORDER BY name COLLATE NOCASE")
    fun observeAll(): Flow<List<CourseEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(course: CourseEntity)
}

@Dao
interface TaskDao {
    @Query(
        "SELECT * FROM tasks " +
            "ORDER BY CASE WHEN status = 'OPEN' THEN 0 ELSE 1 END, " +
            "CASE WHEN plannedForEpochDay IS NULL THEN 1 ELSE 0 END, " +
            "plannedForEpochDay ASC, updatedAtEpochMillis DESC",
    )
    fun observeAll(): Flow<List<TaskEntity>>

    @Query("SELECT * FROM tasks WHERE id = :taskId LIMIT 1")
    suspend fun get(taskId: String): TaskEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(task: TaskEntity)

    @Query("UPDATE tasks SET status = :status, updatedAtEpochMillis = :updatedAt WHERE id = :taskId")
    suspend fun updateStatus(taskId: String, status: String, updatedAt: Long)

    @Query("UPDATE tasks SET plannedForEpochDay = :epochDay, updatedAtEpochMillis = :updatedAt WHERE id = :taskId")
    suspend fun updatePlan(taskId: String, epochDay: Long?, updatedAt: Long)

    @Query("UPDATE tasks SET courseId = :courseId, updatedAtEpochMillis = :updatedAt WHERE id = :taskId")
    suspend fun updateCourse(taskId: String, courseId: String?, updatedAt: Long)

    @Query("DELETE FROM tasks WHERE id = :taskId")
    suspend fun delete(taskId: String)
}

@Database(
    entities = [CourseEntity::class, TaskEntity::class],
    version = 1,
    exportSchema = true,
)
abstract class PolarisDatabase : RoomDatabase() {
    abstract fun courseDao(): CourseDao
    abstract fun taskDao(): TaskDao

    companion object {
        fun create(context: Context): PolarisDatabase = Room.databaseBuilder(
            context.applicationContext,
            PolarisDatabase::class.java,
            "project-polaris.db",
        ).fallbackToDestructiveMigrationOnDowngrade().build()
    }
}

class PolarisRepository(private val database: PolarisDatabase) {
    val courses: Flow<List<CourseEntity>> = database.courseDao().observeAll()
    val tasks: Flow<List<TaskEntity>> = database.taskDao().observeAll()

    suspend fun addTask(
        title: String,
        notes: String = "",
        courseId: String? = null,
        effortMinutes: Int = 25,
    ) {
        val cleanedTitle = title.trim()
        require(cleanedTitle.isNotEmpty())
        database.taskDao().insert(
            TaskEntity(
                title = cleanedTitle,
                notes = notes.trim(),
                courseId = courseId,
                effortMinutes = effortMinutes.coerceIn(5, 480),
            ),
        )
    }

    suspend fun addCourse(name: String) {
        val cleanedName = name.trim()
        require(cleanedName.isNotEmpty())
        database.courseDao().insert(CourseEntity(name = cleanedName))
    }

    suspend fun setTaskCompleted(taskId: String, completed: Boolean) {
        database.taskDao().updateStatus(
            taskId,
            if (completed) TaskStatus.COMPLETED.name else TaskStatus.OPEN.name,
            System.currentTimeMillis(),
        )
    }

    suspend fun setTaskPlannedForToday(taskId: String, planned: Boolean) {
        val today = java.time.LocalDate.now().toEpochDay()
        database.taskDao().updatePlan(taskId, if (planned) today else null, System.currentTimeMillis())
    }

    suspend fun setTaskCourse(taskId: String, courseId: String?) {
        database.taskDao().updateCourse(taskId, courseId, System.currentTimeMillis())
    }

    suspend fun deleteTask(taskId: String) {
        database.taskDao().delete(taskId)
    }
}
