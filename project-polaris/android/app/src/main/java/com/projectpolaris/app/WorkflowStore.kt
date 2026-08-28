package com.projectpolaris.app

import android.content.Context
import android.util.Base64
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import java.util.UUID

data class WorkflowTask(
    val id: String,
    val title: String,
    val areaId: String?,
    val plannedForToday: Boolean,
    val completed: Boolean,
)

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

    fun addTask(title: String, areaId: String?) {
        val clean = title.trim()
        if (clean.isEmpty()) return
        val task = WorkflowTask(UUID.randomUUID().toString(), clean, areaId, plannedForToday = false, completed = false)
        update { it.copy(tasks = listOf(task) + it.tasks) }
    }

    fun addArea(name: String) {
        val clean = name.trim()
        if (clean.isEmpty()) return
        val area = WorkflowArea(UUID.randomUUID().toString(), clean)
        update { it.copy(areas = it.areas + area) }
    }

    fun complete(taskId: String, complete: Boolean) = update { state ->
        state.copy(tasks = state.tasks.map { if (it.id == taskId) it.copy(completed = complete) else it })
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
            .putString("tasks", state.tasks.joinToString("\n") { task -> listOf(task.id, encode(task.title), task.areaId ?: "", task.plannedForToday, task.completed).joinToString("|") })
            .putString("areas", state.areas.joinToString("\n") { area -> "${area.id}|${encode(area.name)}" })
            .apply {
                if (state.focusTaskId == null || state.focusEndsAtMillis == null) {
                    remove("focus_task").remove("focus_end")
                } else {
                    putString("focus_task", state.focusTaskId).putLong("focus_end", state.focusEndsAtMillis)
                }
            }
            .apply()
    }

    private fun decodeTasks(value: String): List<WorkflowTask> = value.lineSequence().mapNotNull { row ->
        val fields = row.split("|")
        if (fields.size != 5) null else runCatching {
            WorkflowTask(fields[0], decode(fields[1]), fields[2].ifBlank { null }, fields[3].toBooleanStrict(), fields[4].toBooleanStrict())
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
    PreviewLanguage("en", "English", "English"),
    PreviewLanguage("hi", "हिन्दी", "Hindi"),
    PreviewLanguage("ta", "தமிழ்", "Tamil"),
    PreviewLanguage("te", "తెలుగు", "Telugu"),
    PreviewLanguage("bn", "বাংলা", "Bengali"),
    PreviewLanguage("ur", "اردو", "Urdu"),
    PreviewLanguage("ar", "العربية", "Arabic"),
    PreviewLanguage("es-419", "Español (Latinoamérica)", "Spanish (Latin America)"),
    PreviewLanguage("pt-BR", "Português (Brasil)", "Portuguese (Brazil)"),
    PreviewLanguage("fr", "Français", "French"),
    PreviewLanguage("id", "Bahasa Indonesia", "Indonesian"),
    PreviewLanguage("ja", "日本語", "Japanese"),
    PreviewLanguage("zh-Hans", "简体中文", "Simplified Chinese"),
)
