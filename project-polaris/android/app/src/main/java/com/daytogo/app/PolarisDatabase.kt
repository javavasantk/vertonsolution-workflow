package com.daytogo.app

import androidx.room.Dao
import androidx.room.Database
import androidx.room.Entity
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.RoomDatabase

@Entity(tableName = "workspace_state")
data class WorkspaceStateEntity(
    @PrimaryKey val id: Int = 1,
    val payload: String,
    val updatedAtMillis: Long,
)

@Entity(tableName = "sync_outbox")
data class SyncOutboxEntity(
    @PrimaryKey val operationId: String,
    val operationType: String,
    val entityType: String,
    val entityId: String,
    val createdAtMillis: Long,
    val retryCount: Int = 0,
    val status: String = "PENDING",
)

@Dao
interface WorkspaceStateDao {
    @Query("SELECT * FROM workspace_state WHERE id = 1")
    suspend fun read(): WorkspaceStateEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun write(state: WorkspaceStateEntity)
}

@Dao
interface SyncOutboxDao {
    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun enqueue(operation: SyncOutboxEntity)

    @Query("SELECT * FROM sync_outbox WHERE status = 'PENDING' ORDER BY createdAtMillis ASC")
    suspend fun pending(): List<SyncOutboxEntity>
}

@Database(entities = [WorkspaceStateEntity::class, SyncOutboxEntity::class], version = 1, exportSchema = true)
abstract class PolarisDatabase : RoomDatabase() {
    abstract fun workspaceStateDao(): WorkspaceStateDao
    abstract fun syncOutboxDao(): SyncOutboxDao
}
