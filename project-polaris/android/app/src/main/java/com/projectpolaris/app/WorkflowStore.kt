package com.projectpolaris.app

import android.content.Context
import android.util.Base64
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.room.Room
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import java.util.UUID

object TaskOptions {
    val priorities = listOf("None", "Low", "Normal", "High", "Urgent")
    val statuses = listOf("Inbox", "Next", "In progress", "Waiting", "Completed")
    val types = listOf("Action", "Call", "Email", "Errand", "Meeting", "Habit", "Decision", "Review", "Other")
    val efforts = listOf("Not set", "5 min", "15 min", "30 min", "1 hour", "2+ hours")
    val energies = listOf("Not set", "Low energy", "Normal energy", "Deep focus")
    val recurrences = listOf("None", "Daily", "Weekdays", "Weekly", "Monthly")
    val reminders = listOf("None", "At due time", "15 min before", "1 hour before", "1 day before")
    val privacy = listOf("Private", "Personal", "Shared later")
}

data class TaskForm(
    val title: String = "", val notes: String = "", val areaId: String? = null, val project: String = "",
    val priority: String = "Normal", val status: String = "Inbox", val type: String = "Action", val dueDate: String = "",
    val effort: String = "Not set", val energy: String = "Not set", val tags: List<String> = emptyList(),
    val recurrence: String = "None", val reminder: String = "None", val waitingOn: String = "", val location: String = "",
    val privacy: String = "Private", val checklist: List<String> = emptyList(),
)

data class WorkflowTask(
    val id: String, val title: String, val notes: String = "", val areaId: String? = null, val project: String = "",
    val priority: String = "Normal", val status: String = "Inbox", val type: String = "Action", val dueDate: String = "",
    val effort: String = "Not set", val energy: String = "Not set", val tags: List<String> = emptyList(),
    val recurrence: String = "None", val reminder: String = "None", val waitingOn: String = "", val location: String = "",
    val privacy: String = "Private", val checklist: List<String> = emptyList(), val completedChecklistIndexes: Set<Int> = emptySet(),
    val plannedForToday: Boolean = false, val completed: Boolean = false, val archived: Boolean = false,
    val createdAtMillis: Long = System.currentTimeMillis(),
) {
    fun toForm() = TaskForm(title, notes, areaId, project, priority, status, type, dueDate, effort, energy, tags, recurrence, reminder, waitingOn, location, privacy, checklist)
}

data class WorkflowArea(val id: String, val name: String)

data class WorkflowSnapshot(
    val onboarded: Boolean = false, val localeTag: String = "en", val darkTheme: Boolean = false,
    val tasks: List<WorkflowTask> = emptyList(), val areas: List<WorkflowArea> = emptyList(),
    val focusTaskId: String? = null, val focusEndsAtMillis: Long? = null,
)

class WorkflowStore(context: Context) {
    private val appContext = context.applicationContext
    private val legacyPreferences = appContext.getSharedPreferences("project_polaris_preview", Context.MODE_PRIVATE)
    private val database = Room.databaseBuilder(appContext, PolarisDatabase::class.java, "project-polaris.db").build()
    var snapshot by mutableStateOf(loadInitial())
        private set

    fun finishOnboarding() = update { it.copy(onboarded = true) }
    fun setLocale(tag: String) = update { it.copy(localeTag = tag) }
    fun setDarkTheme(enabled: Boolean) = update { it.copy(darkTheme = enabled) }

    fun addTask(form: TaskForm): String? {
        if (form.title.trim().isEmpty()) return null
        val id = UUID.randomUUID().toString()
        update { it.copy(tasks = listOf(form.toTask(id)) + it.tasks) }
        return id
    }

    fun updateTask(taskId: String, form: TaskForm) = update { state ->
        state.copy(tasks = state.tasks.map { task ->
            if (task.id == taskId && form.title.trim().isNotEmpty()) form.toTask(task.id, task.plannedForToday, task.archived, task.completedChecklistIndexes, task.createdAtMillis) else task
        })
    }

    fun addArea(name: String) {
        val clean = name.trim(); if (clean.isEmpty()) return
        update { it.copy(areas = it.areas + WorkflowArea(UUID.randomUUID().toString(), clean)) }
    }

    fun complete(taskId: String, complete: Boolean) = update { state ->
        val original = state.tasks.firstOrNull { it.id == taskId } ?: return@update state
        val updatedTasks = state.tasks.map { task -> if (task.id == taskId) task.copy(completed = complete, status = if (complete) "Completed" else "Inbox") else task }
        val repeated = if (complete && !original.completed && original.recurrence != "None") {
            val next = original.copy(id = UUID.randomUUID().toString(), status = "Inbox", completed = false, plannedForToday = false, completedChecklistIndexes = emptySet(), createdAtMillis = System.currentTimeMillis())
            listOf(next)
        } else emptyList()
        state.copy(tasks = repeated + updatedTasks)
    }

    fun togglePlan(taskId: String) = update { state -> state.copy(tasks = state.tasks.map { if (it.id == taskId) it.copy(plannedForToday = !it.plannedForToday) else it }) }
    fun assignArea(taskId: String, areaId: String?) = update { state -> state.copy(tasks = state.tasks.map { if (it.id == taskId) it.copy(areaId = areaId) else it }) }
    fun archiveTask(taskId: String, archived: Boolean = true) = update { state -> state.copy(tasks = state.tasks.map { if (it.id == taskId) it.copy(archived = archived, plannedForToday = if (archived) false else it.plannedForToday) else it }) }
    fun deleteTask(taskId: String) = update { state -> state.copy(tasks = state.tasks.filterNot { it.id == taskId }) }
    fun toggleChecklistItem(taskId: String, index: Int) = update { state ->
        state.copy(tasks = state.tasks.map { task -> if (task.id == taskId) task.copy(completedChecklistIndexes = task.completedChecklistIndexes.toggle(index)) else task })
    }
    fun scheduleReminder(context: Context, taskId: String): Boolean = snapshot.tasks.firstOrNull { it.id == taskId }?.let { scheduleTaskReminder(context, it) } ?: false

    fun startFocus(taskId: String, minutes: Int) = update { it.copy(focusTaskId = taskId, focusEndsAtMillis = System.currentTimeMillis() + minutes.coerceIn(5, 90) * 60_000L) }
    fun endFocus() = update { it.copy(focusTaskId = null, focusEndsAtMillis = null) }

    fun exportJson(): String = buildString {
        append("{\n  \"format\": \"project-polaris-local-export-v1\",\n  \"exportedAtMillis\": ").append(System.currentTimeMillis()).append(",\n  \"areas\": [")
        append(snapshot.areas.joinToString(",") { "{\"id\":\"${json(it.id)}\",\"name\":\"${json(it.name)}\"}" })
        append("],\n  \"tasks\": [")
        append(snapshot.tasks.joinToString(",\n") { task -> "{\"id\":\"${json(task.id)}\",\"title\":\"${json(task.title)}\",\"notes\":\"${json(task.notes)}\",\"areaId\":${task.areaId?.let { "\"${json(it)}\"" } ?: "null"},\"project\":\"${json(task.project)}\",\"priority\":\"${json(task.priority)}\",\"status\":\"${json(task.status)}\",\"type\":\"${json(task.type)}\",\"dueDate\":\"${json(task.dueDate)}\",\"effort\":\"${json(task.effort)}\",\"energy\":\"${json(task.energy)}\",\"tags\":[${task.tags.joinToString(",") { "\"${json(it)}\"" }}],\"recurrence\":\"${json(task.recurrence)}\",\"reminder\":\"${json(task.reminder)}\",\"waitingOn\":\"${json(task.waitingOn)}\",\"location\":\"${json(task.location)}\",\"privacy\":\"${json(task.privacy)}\",\"checklist\":[${task.checklist.joinToString(",") { "\"${json(it)}\"" }}],\"completed\":${task.completed},\"archived\":${task.archived}}" })
        append("]\n}")
    }

    private fun TaskForm.toTask(id: String, planned: Boolean = false, archived: Boolean = false, checked: Set<Int> = emptySet(), createdAt: Long = System.currentTimeMillis()) = WorkflowTask(
        id = id, title = title.trim(), notes = notes.trim(), areaId = areaId, project = project.trim(), priority = priority,
        status = status, type = type, dueDate = dueDate.trim(), effort = effort, energy = energy,
        tags = tags.map { it.trim() }.filter { it.isNotEmpty() }.distinct(), recurrence = recurrence, reminder = reminder,
        waitingOn = waitingOn.trim(), location = location.trim(), privacy = privacy,
        checklist = checklist.map { it.trim() }.filter { it.isNotEmpty() }, completedChecklistIndexes = checked,
        plannedForToday = planned, completed = status == "Completed", archived = archived, createdAtMillis = createdAt,
    )

    private fun update(transform: (WorkflowSnapshot) -> WorkflowSnapshot) {
        snapshot = transform(snapshot)
        persist(snapshot)
    }

    private fun loadInitial(): WorkflowSnapshot = runBlocking(Dispatchers.IO) {
        database.workspaceStateDao().read()?.let { decodeSnapshot(it.payload) } ?: loadLegacy().also { persistToRoom(it) }
    }

    private fun loadLegacy(): WorkflowSnapshot = WorkflowSnapshot(
        onboarded = legacyPreferences.getBoolean("onboarded", false), localeTag = legacyPreferences.getString("locale", "en") ?: "en",
        darkTheme = legacyPreferences.getBoolean("dark", false), tasks = decodeLegacyTasks(legacyPreferences.getString("tasks", "") ?: ""),
        areas = decodeAreas(legacyPreferences.getString("areas", "") ?: ""), focusTaskId = legacyPreferences.getString("focus_task", null),
        focusEndsAtMillis = legacyPreferences.getLong("focus_end", 0L).takeIf { it > System.currentTimeMillis() },
    )

    private fun persist(state: WorkflowSnapshot) {
        legacyPreferences.edit().putBoolean("onboarded", state.onboarded).putString("locale", state.localeTag).putBoolean("dark", state.darkTheme).putString("tasks", state.tasks.joinToString("\n") { it.encodeRow() }).putString("areas", state.areas.joinToString("\n") { "${it.id}|${encode(it.name)}" }).apply {
            if (state.focusTaskId == null || state.focusEndsAtMillis == null) remove("focus_task").remove("focus_end") else putString("focus_task", state.focusTaskId).putLong("focus_end", state.focusEndsAtMillis)
        }.apply()
        runBlocking(Dispatchers.IO) { persistToRoom(state) }
    }

    private suspend fun persistToRoom(state: WorkflowSnapshot) {
        database.workspaceStateDao().write(WorkspaceStateEntity(payload = encodeSnapshot(state), updatedAtMillis = System.currentTimeMillis()))
    }

    private fun encodeSnapshot(state: WorkflowSnapshot): String = listOf(
        state.onboarded.toString(), encode(state.localeTag), state.darkTheme.toString(), state.focusTaskId ?: "", state.focusEndsAtMillis?.toString() ?: "",
        state.tasks.joinToString("\n") { it.encodeRow() }, state.areas.joinToString("\n") { "${it.id}|${encode(it.name)}" },
    ).joinToString("~") { encode(it) }

    private fun decodeSnapshot(payload: String): WorkflowSnapshot = runCatching {
        val fields = payload.split("~").map(::decode); require(fields.size == 7)
        WorkflowSnapshot(fields[0].toBooleanStrict(), fields[1], fields[2].toBooleanStrict(), decodeTasks(fields[5]), decodeAreas(fields[6]), fields[3].ifBlank { null }, fields[4].toLongOrNull()?.takeIf { it > System.currentTimeMillis() })
    }.getOrElse { loadLegacy() }

    private fun WorkflowTask.encodeRow(): String = listOf(id, encode(title), encode(notes), areaId ?: "", encode(project), priority, status, type, encode(dueDate), effort, energy, encode(tags.joinToString("\u001E")), recurrence, reminder, encode(waitingOn), encode(location), privacy, encode(checklist.joinToString("\u001E")), completedChecklistIndexes.joinToString(","), plannedForToday, completed, archived, createdAtMillis).joinToString("|")

    private fun decodeTasks(value: String): List<WorkflowTask> = value.lineSequence().mapNotNull { row ->
        val fields = row.split("|"); if (fields.size != 23) null else runCatching { WorkflowTask(fields[0], decode(fields[1]), decode(fields[2]), fields[3].ifBlank { null }, decode(fields[4]), fields[5], fields[6], fields[7], decode(fields[8]), fields[9], fields[10], decode(fields[11]).split("\u001E").filter { it.isNotBlank() }, fields[12], fields[13], decode(fields[14]), decode(fields[15]), fields[16], decode(fields[17]).split("\u001E").filter { it.isNotBlank() }, fields[18].split(",").mapNotNull { it.toIntOrNull() }.toSet(), fields[19].toBooleanStrict(), fields[20].toBooleanStrict(), fields[21].toBooleanStrict(), fields[22].toLong()) }.getOrNull()
    }.toList()

    private fun decodeLegacyTasks(value: String): List<WorkflowTask> = value.lineSequence().mapNotNull { row ->
        val fields = row.split("|"); runCatching { when (fields.size) {
            5 -> WorkflowTask(fields[0], decode(fields[1]), areaId = fields[2].ifBlank { null }, plannedForToday = fields[3].toBooleanStrict(), completed = fields[4].toBooleanStrict())
            20 -> WorkflowTask(fields[0], decode(fields[1]), decode(fields[2]), fields[3].ifBlank { null }, decode(fields[4]), fields[5], fields[6], fields[7], decode(fields[8]), fields[9], fields[10], decode(fields[11]).split("\u001E").filter { it.isNotBlank() }, fields[12], fields[13], decode(fields[14]), decode(fields[15]), fields[16], decode(fields[17]).split("\u001E").filter { it.isNotBlank() }, plannedForToday = fields[18].toBooleanStrict(), completed = fields[19].toBooleanStrict())
            else -> null
        } }.getOrNull()
    }.toList()

    private fun decodeAreas(value: String): List<WorkflowArea> = value.lineSequence().mapNotNull { row ->
        val fields = row.split("|"); if (fields.size != 2) null else runCatching { WorkflowArea(fields[0], decode(fields[1])) }.getOrNull()
    }.toList()

    private fun Set<Int>.toggle(value: Int): Set<Int> = if (contains(value)) minus(value) else plus(value)
    private fun json(value: String): String = value.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r")
    private fun encode(value: String): String = Base64.encodeToString(value.toByteArray(Charsets.UTF_8), Base64.NO_WRAP)
    private fun decode(value: String): String = String(Base64.decode(value, Base64.NO_WRAP), Charsets.UTF_8)
}

data class PreviewLanguage(val tag: String, val nativeName: String, val englishName: String)
val previewLanguages = listOf(
    PreviewLanguage("en", "English", "English"), PreviewLanguage("hi", "हिन्दी", "Hindi"), PreviewLanguage("ta", "தமிழ்", "Tamil"), PreviewLanguage("te", "తెలుగు", "Telugu"), PreviewLanguage("bn", "বাংলা", "Bengali"), PreviewLanguage("ur", "اردو", "Urdu"), PreviewLanguage("ar", "العربية", "Arabic"), PreviewLanguage("es-419", "Español (Latinoamérica)", "Spanish (Latin America)"), PreviewLanguage("pt-BR", "Português (Brasil)", "Portuguese (Brazil)"), PreviewLanguage("fr", "Français", "French"), PreviewLanguage("id", "Bahasa Indonesia", "Indonesian"), PreviewLanguage("ja", "日本語", "Japanese"), PreviewLanguage("zh-Hans", "简体中文", "Simplified Chinese"),
)
