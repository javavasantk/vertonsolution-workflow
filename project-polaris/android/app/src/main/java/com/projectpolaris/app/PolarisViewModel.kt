package com.projectpolaris.app

import android.app.Application
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.projectpolaris.app.data.CourseEntity
import com.projectpolaris.app.data.PolarisDatabase
import com.projectpolaris.app.data.PolarisRepository
import com.projectpolaris.app.data.TaskEntity
import com.projectpolaris.app.data.TaskStatus
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.util.Locale

private val Application.polarisPreferences: DataStore<Preferences> by preferencesDataStore(name = "polaris_preferences")

private object PreferenceKeys {
    val onboardingComplete = booleanPreferencesKey("onboarding_complete")
    val localeTag = stringPreferencesKey("locale_tag")
    val darkTheme = booleanPreferencesKey("dark_theme")
    val focusTaskId = stringPreferencesKey("focus_task_id")
    val focusEndsAt = longPreferencesKey("focus_ends_at")
    val focusRunning = booleanPreferencesKey("focus_running")
}

enum class PolarisScreen {
    TODAY,
    INBOX,
    PLAN,
    FOCUS,
    SETTINGS,
    PRIVACY,
    ASSISTANT,
}

data class LanguageOption(
    val tag: String,
    val nativeName: String,
    val englishName: String,
) {
    companion object {
        val previewLanguages = listOf(
            LanguageOption("en", "English", "English"),
            LanguageOption("hi", "हिन्दी", "Hindi"),
            LanguageOption("ta", "தமிழ்", "Tamil"),
            LanguageOption("te", "తెలుగు", "Telugu"),
            LanguageOption("bn", "বাংলা", "Bengali"),
            LanguageOption("ur", "اردو", "Urdu"),
            LanguageOption("ar", "العربية", "Arabic"),
            LanguageOption("es-419", "Español (Latinoamérica)", "Spanish (Latin America)"),
            LanguageOption("pt-BR", "Português (Brasil)", "Portuguese (Brazil)"),
            LanguageOption("fr", "Français", "French"),
            LanguageOption("id", "Bahasa Indonesia", "Indonesian"),
            LanguageOption("ja", "日本語", "Japanese"),
            LanguageOption("zh-Hans", "简体中文", "Simplified Chinese"),
        )
    }
}

data class FocusUiState(
    val taskId: String? = null,
    val endAtMillis: Long? = null,
    val isRunning: Boolean = false,
    val nowMillis: Long = System.currentTimeMillis(),
) {
    val secondsRemaining: Long
        get() = if (isRunning && endAtMillis != null) {
            ((endAtMillis - nowMillis).coerceAtLeast(0L) / 1000L)
        } else {
            0L
        }
}

data class PolarisUiState(
    val onboardingComplete: Boolean = false,
    val localeTag: String = "en",
    val darkTheme: Boolean = false,
    val tasks: List<TaskEntity> = emptyList(),
    val courses: List<CourseEntity> = emptyList(),
    val focus: FocusUiState = FocusUiState(),
)

class PolarisViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = PolarisRepository(PolarisDatabase.create(application))
    private var ticker: Job? = null

    private val preferences = application.polarisPreferences.data.map { prefs ->
        PreferenceState(
            onboardingComplete = prefs[PreferenceKeys.onboardingComplete] ?: false,
            localeTag = prefs[PreferenceKeys.localeTag] ?: "en",
            darkTheme = prefs[PreferenceKeys.darkTheme] ?: false,
            focusTaskId = prefs[PreferenceKeys.focusTaskId],
            focusEndsAt = prefs[PreferenceKeys.focusEndsAt],
            focusRunning = prefs[PreferenceKeys.focusRunning] ?: false,
        )
    }

    val uiState: StateFlow<PolarisUiState> = combine(
        repository.tasks,
        repository.courses,
        preferences,
    ) { tasks, courses, prefs ->
        PolarisUiState(
            onboardingComplete = prefs.onboardingComplete,
            localeTag = prefs.localeTag,
            darkTheme = prefs.darkTheme,
            tasks = tasks,
            courses = courses,
            focus = FocusUiState(
                taskId = prefs.focusTaskId,
                endAtMillis = prefs.focusEndsAt,
                isRunning = prefs.focusRunning && (prefs.focusEndsAt ?: 0L) > System.currentTimeMillis(),
            ),
        )
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), PolarisUiState())

    init {
        startTicker()
    }

    fun finishOnboarding() = viewModelScope.launch {
        getApplication<Application>().polarisPreferences.edit { it[PreferenceKeys.onboardingComplete] = true }
    }

    fun selectLanguage(tag: String) = viewModelScope.launch {
        getApplication<Application>().polarisPreferences.edit { it[PreferenceKeys.localeTag] = tag }
    }

    fun setDarkTheme(enabled: Boolean) = viewModelScope.launch {
        getApplication<Application>().polarisPreferences.edit { it[PreferenceKeys.darkTheme] = enabled }
    }

    fun addTask(title: String, courseId: String? = null) = viewModelScope.launch {
        repository.addTask(title = title, courseId = courseId)
    }

    fun addCourse(name: String) = viewModelScope.launch {
        repository.addCourse(name)
    }

    fun setTaskCompleted(taskId: String, completed: Boolean) = viewModelScope.launch {
        repository.setTaskCompleted(taskId, completed)
    }

    fun togglePlanForToday(task: TaskEntity) = viewModelScope.launch {
        repository.setTaskPlannedForToday(task.id, task.plannedForEpochDay == null)
    }

    fun setTaskCourse(taskId: String, courseId: String?) = viewModelScope.launch {
        repository.setTaskCourse(taskId, courseId)
    }

    fun deleteTask(taskId: String) = viewModelScope.launch {
        repository.deleteTask(taskId)
    }

    fun startFocus(taskId: String, minutes: Int = 25) = viewModelScope.launch {
        val durationMinutes = minutes.coerceIn(5, 90)
        getApplication<Application>().polarisPreferences.edit { prefs ->
            prefs[PreferenceKeys.focusTaskId] = taskId
            prefs[PreferenceKeys.focusEndsAt] = System.currentTimeMillis() + durationMinutes * 60_000L
            prefs[PreferenceKeys.focusRunning] = true
        }
    }

    fun endFocus() = viewModelScope.launch {
        getApplication<Application>().polarisPreferences.edit { prefs ->
            prefs.remove(PreferenceKeys.focusTaskId)
            prefs.remove(PreferenceKeys.focusEndsAt)
            prefs[PreferenceKeys.focusRunning] = false
        }
    }

    fun displayLanguageName(tag: String): String = LanguageOption.previewLanguages
        .firstOrNull { it.tag == tag }
        ?.nativeName
        ?: tag

    fun locale(): Locale = Locale.forLanguageTag(uiState.value.localeTag)

    private fun startTicker() {
        ticker?.cancel()
        ticker = viewModelScope.launch {
            while (true) {
                delay(1_000)
            }
        }
    }
}

private data class PreferenceState(
    val onboardingComplete: Boolean,
    val localeTag: String,
    val darkTheme: Boolean,
    val focusTaskId: String?,
    val focusEndsAt: Long?,
    val focusRunning: Boolean,
)
