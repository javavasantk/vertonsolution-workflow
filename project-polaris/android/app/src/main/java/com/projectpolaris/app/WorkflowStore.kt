package com.projectpolaris.app

import android.content.Context
import android.util.Base64
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
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
    val title: String = "",
    val notes: String = "",
    val areaId: String? = null,
    val project: String = "",
    val priority: String = "Normal",
    val status: String = "Inbox",
    val type: String = "Action",
    val dueDate: String = "",
    val effort: String = "Not set",
    val energy: String = "Not set",
    val tags: List<String> = emptyList(),
    val recurrence: String = "None",
    val reminder: String = "None",
    val waitingOn: String = "",
    val location: String = "",
    val privacy: String = "Private",
    val checklist: List<String> = emptyList(),
)

data class WorkflowTask(
    val id: String,
    val title: String,
    val notes: String = "",
    val areaId: String? = null,
    val project: String = "",
    val priority: String = "Normal",
    val status: String = "Inbox",
    val type: String = "Action",
    val dueDate: String = "",
    val effort: String = "Not set",
    val energy: String = "Not set",
    val tags: List<String> = emptyList(),
    val recurrence: String = "None",
    val reminder: String = "None",
    val waitingOn: String = "",
    val location: String = "",
    val privacy: String = "Private",
    val checklist: List<String> = emptyList(),
    val plannedForToday: Boolean = false,
    val completed: Boolean = false,
) {
    fun toForm() = TaskForm(title, notes, areaId, project, priority, status, type, dueDate, effort, energy, tags, recurrence, reminder, waitingOn, location, privacy, checklist)
}

data class WorkflowArea(val id: String, val name: String)

data class WorkflowSnapshot(
    val onboarded: Boolean = false,
    val localeTag: String = "en",
    val darkTheme: Boolean = false,
    val tasks: List<WorkflowTask> = emptyList(),
    val areas: List<WorkflowArea> = emptyList(),
    val focusTaskId: String? = null,
    val focusEndsAtMillis: Long? = null,
)

class WorkflowStore(context: Context) {
    private val preferences = context.getSharedPreferences("project_polaris_preview", Context.MODE_PRIVATE)
    var snapshot by mutableStateOf(load())
        private set

    fun finishOnboarding() = update { it.copy(onboarded = true) }
    fun setLocale(tag: String) = update { it.copy(localeTag = tag) }
    fun setDarkTheme(enabled: Boolean) = update { it.copy(darkTheme = enabled) }

    fun addTask(form: TaskForm) {
        val clean = form.title.trim()
        if (clean.isEmpty()) return
        val task = form.toTask(UUID.randomUUID().toString())
        update { it.copy(tasks = listOf(task) + it.tasks) }
    }

    fun updateTask(taskId: String, form: TaskForm) = update { state ->
        state.copy(tasks = state.tasks.map { task ->
            if (task.id == taskId && form.title.trim().isNotEmpty()) form.toTask(task.id, task.plannedForToday) else task
        })
    }

    fun addArea(name: String) {
        val clean = name.trim()
        if (clean.isEmpty()) return
        val area = WorkflowArea(UUID.randomUUID().toString(), clean)
        update { it.copy(areas = it.areas + area) }
    }

    fun complete(taskId: String, complete: Boolean) = update { state ->
        state.copy(tasks = state.tasks.map { task ->
            if (task.id == taskId) task.copy(completed = complete, status = if (complete) "Completed" else "Inbox") else task
        })
    }

    fun togglePlan(taskId: String) = update { state ->
        state.copy(tasks = state.tasks.map { if (it.id == taskId) it.copy(plannedForToday = !it.plannedForToday) else it })
    }

    fun assignArea(taskId: String, areaId: String?) = update { state ->
        state.copy(tasks = state.tasks.map { if (it.id == taskId) it.copy(areaId = areaId) else it })
    }

    fun deleteTask(taskId: String) = update { state ->
        state.copy(tasks = state.tasks.filterNot { it.id == taskId })
    }

    fun startFocus(taskId: String, minutes: Int) = update {
        it.copy(focusTaskId = taskId, focusEndsAtMillis = System.currentTimeMillis() + minutes.coerceIn(5, 90) * 60_000L)
    }

    fun endFocus() = update { it.copy(focusTaskId = null, focusEndsAtMillis = null) }

    private fun TaskForm.toTask(id: String, planned: Boolean = false) = WorkflowTask(
        id = id,
        title = title.trim(), notes = notes.trim(), areaId = areaId, project = project.trim(),
        priority = priority, status = status, type = type, dueDate = dueDate.trim(), effort = effort,
        energy = energy, tags = tags.map { it.trim() }.filter { it.isNotEmpty() }.distinct(),
        recurrence = recurrence, reminder = reminder, waitingOn = waitingOn.trim(), location = location.trim(),
        privacy = privacy, checklist = checklist.map { it.trim() }.filter { it.isNotEmpty() },
        plannedForToday = planned, completed = status == "Completed",
    )

    private fun update(transform: (WorkflowSnapshot) -> WorkflowSnapshot) {
        snapshot = transform(snapshot)
        persist(snapshot)
    }

    private fun load(): WorkflowSnapshot = WorkflowSnapshot(
        onboarded = preferences.getBoolean("onboarded", false),
        localeTag = preferences.getString("locale", "en") ?: "en",
        darkTheme = preferences.getBoolean("dark", false),
        tasks = decodeTasks(preferences.getString("tasks", "") ?: ""),
        areas = decodeAreas(preferences.getString("areas", "") ?: ""),
        focusTaskId = preferences.getString("focus_task", null),
        focusEndsAtMillis = preferences.getLong("focus_end", 0L).takeIf { it > System.currentTimeMillis() },
    )

    private fun persist(state: WorkflowSnapshot) {
        preferences.edit()
            .putBoolean("onboarded", state.onboarded)
            .putString("locale", state.localeTag)
            .putBoolean("dark", state.darkTheme)
            .putString("tasks", state.tasks.joinToString("\n") { task -> task.encodeRow() })
            .putString("areas", state.areas.joinToString("\n") { area -> "${area.id}|${encode(area.name)}" })
            .apply {
                if (state.focusTaskId == null || state.focusEndsAtMillis == null) remove("focus_task").remove("focus_end")
                else putString("focus_task", state.focusTaskId).putLong("focus_end", state.focusEndsAtMillis)
            }
            .apply()
    }

    private fun WorkflowTask.encodeRow(): String = listOf(
        id, encode(title), encode(notes), areaId ?: "", encode(project), priority, status, type, encode(dueDate), effort,
        energy, encode(tags.joinToString("\u001E")), recurrence, reminder, encode(waitingOn), encode(location), privacy,
        encode(checklist.joinToString("\u001E")), plannedForToday, completed,
    ).joinToString("|")

    private fun decodeTasks(value: String): List<WorkflowTask> = value.lineSequence().mapNotNull { row ->
        val fields = row.split("|")
        runCatching {
            when (fields.size) {
                5 -> WorkflowTask(fields[0], decode(fields[1]), areaId = fields[2].ifBlank { null }, plannedForToday = fields[3].toBooleanStrict(), completed = fields[4].toBooleanStrict())
                20 -> WorkflowTask(
                    id = fields[0], title = decode(fields[1]), notes = decode(fields[2]), areaId = fields[3].ifBlank { null }, project = decode(fields[4]),
                    priority = fields[5], status = fields[6], type = fields[7], dueDate = decode(fields[8]), effort = fields[9], energy = fields[10],
                    tags = decode(fields[11]).split("\u001E").filter { it.isNotBlank() }, recurrence = fields[12], reminder = fields[13],
                    waitingOn = decode(fields[14]), location = decode(fields[15]), privacy = fields[16], checklist = decode(fields[17]).split("\u001E").filter { it.isNotBlank() },
                    plannedForToday = fields[18].toBooleanStrict(), completed = fields[19].toBooleanStrict(),
                )
                else -> null
            }
        }.getOrNull()
    }.toList()

    private fun decodeAreas(value: String): List<WorkflowArea> = value.lineSequence().mapNotNull { row ->
        val fields = row.split("|")
        if (fields.size != 2) null else runCatching { WorkflowArea(fields[0], decode(fields[1])) }.getOrNull()
    }.toList()

    private fun encode(value: String): String = Base64.encodeToString(value.toByteArray(Charsets.UTF_8), Base64.NO_WRAP)
    private fun decode(value: String): String = String(Base64.decode(value, Base64.NO_WRAP), Charsets.UTF_8)
}

data class PreviewLanguage(val tag: String, val nativeName: String, val englishName: String)

val previewLanguages = listOf(
    PreviewLanguage("en", "English", "English"), PreviewLanguage("hi", "हिन्दी", "Hindi"), PreviewLanguage("ta", "தமிழ்", "Tamil"),
    PreviewLanguage("te", "తెలుగు", "Telugu"), PreviewLanguage("bn", "বাংলা", "Bengali"), PreviewLanguage("ur", "اردو", "Urdu"),
    PreviewLanguage("ar", "العربية", "Arabic"), PreviewLanguage("es-419", "Español (Latinoamérica)", "Spanish (Latin America)"),
    PreviewLanguage("pt-BR", "Português (Brasil)", "Portuguese (Brazil)"), PreviewLanguage("fr", "Français", "French"),
    PreviewLanguage("id", "Bahasa Indonesia", "Indonesian"), PreviewLanguage("ja", "日本語", "Japanese"), PreviewLanguage("zh-Hans", "简体中文", "Simplified Chinese"),
)
