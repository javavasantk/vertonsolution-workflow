package com.projectpolaris.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.Divider
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.projectpolaris.app.data.CourseEntity
import com.projectpolaris.app.data.TaskEntity
import com.projectpolaris.app.data.TaskStatus
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            val viewModel: PolarisViewModel = viewModel()
            val state by viewModel.uiState.collectAsStateWithLifecycle()
            PolarisTheme(darkTheme = state.darkTheme) {
                Surface(modifier = Modifier.fillMaxSize()) {
                    if (state.onboardingComplete) {
                        PolarisApp(state = state, viewModel = viewModel)
                    } else {
                        OnboardingScreen(
                            selectedLocale = state.localeTag,
                            onSelectLocale = viewModel::selectLanguage,
                            onFinish = viewModel::finishOnboarding,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun PolarisTheme(darkTheme: Boolean, content: @Composable () -> Unit) {
    val midnight = Color(0xFF10233F)
    val ice = Color(0xFFC9E7FF)
    val lilac = Color(0xFFDCCBFF)
    val lightScheme = androidx.compose.material3.lightColorScheme(
        primary = midnight,
        onPrimary = Color.White,
        secondary = Color(0xFF62558D),
        tertiary = Color(0xFF356986),
        surface = Color(0xFFF9FAFC),
        surfaceVariant = Color(0xFFEAF1F7),
        onSurfaceVariant = Color(0xFF3E4A55),
    )
    val darkScheme = androidx.compose.material3.darkColorScheme(
        primary = ice,
        onPrimary = Color(0xFF10233F),
        secondary = lilac,
        tertiary = ice,
        surface = Color(0xFF101820),
        surfaceVariant = Color(0xFF202D38),
        onSurfaceVariant = Color(0xFFD2DEE9),
    )
    MaterialTheme(colorScheme = if (darkTheme) darkScheme else lightScheme, content = content)
}

@Composable
private fun OnboardingScreen(
    selectedLocale: String,
    onSelectLocale: (String) -> Unit,
    onFinish: () -> Unit,
) {
    var showLanguagePicker by rememberSaveable { mutableStateOf(false) }
    val language = LanguageOption.previewLanguages.firstOrNull { it.tag == selectedLocale }
        ?: LanguageOption.previewLanguages.first()
    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp, Alignment.CenterVertically),
    ) {
        Text(stringResourceCompat(R.string.app_name), style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.secondary)
        Text(
            stringResourceCompat(R.string.welcome_title),
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.semantics { heading() },
        )
        Text(stringResourceCompat(R.string.welcome_body), style = MaterialTheme.typography.bodyLarge)
        ElevatedCard(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(stringResourceCompat(R.string.choose_language), style = MaterialTheme.typography.titleMedium)
                Text(stringResourceCompat(R.string.selected_language, language.nativeName), style = MaterialTheme.typography.bodyLarge)
                OutlinedButton(onClick = { showLanguagePicker = true }, modifier = Modifier.fillMaxWidth()) {
                    Text(stringResourceCompat(R.string.choose_language))
                }
                Text(stringResourceCompat(R.string.language_preview_notice), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
        Button(onClick = onFinish, modifier = Modifier.fillMaxWidth().height(52.dp)) { Text(stringResourceCompat(R.string.continue_label)) }
        TextButton(onClick = onFinish, modifier = Modifier.fillMaxWidth()) { Text(stringResourceCompat(R.string.skip_label)) }
    }
    if (showLanguagePicker) {
        LanguagePickerDialog(
            selectedTag = selectedLocale,
            onSelect = {
                onSelectLocale(it)
                showLanguagePicker = false
            },
            onDismiss = { showLanguagePicker = false },
        )
    }
}

@Composable
private fun PolarisApp(state: PolarisUiState, viewModel: PolarisViewModel) {
    var currentScreenName by rememberSaveable { mutableStateOf(PolarisScreen.TODAY.name) }
    val currentScreen = PolarisScreen.valueOf(currentScreenName)
    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()
    var showAddTask by rememberSaveable { mutableStateOf(false) }
    var showCoursePickerFor by remember { mutableStateOf<TaskEntity?>(null) }
    var showDeleteFor by remember { mutableStateOf<TaskEntity?>(null) }
    val taskCompletedMessage = stringResourceCompat(R.string.task_completed)
    val taskPlannedMessage = stringResourceCompat(R.string.task_planned)
    val taskAddedMessage = stringResourceCompat(R.string.task_added)
    val courseAssignedMessage = stringResourceCompat(R.string.course_assigned)
    val taskDeletedMessage = stringResourceCompat(R.string.task_deleted)

    Scaffold(
        topBar = { PolarisTopBar(currentScreen, { currentScreenName = PolarisScreen.PRIVACY.name }, { currentScreenName = PolarisScreen.ASSISTANT.name }) },
        bottomBar = { PolarisNavigation(currentScreen) { currentScreenName = it.name } },
        snackbarHost = { SnackbarHost(snackbarHostState) },
        floatingActionButton = {
            if (currentScreen == PolarisScreen.TODAY || currentScreen == PolarisScreen.INBOX) {
                Button(onClick = { showAddTask = true }) { Text(stringResourceCompat(R.string.add_task)) }
            }
        },
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            when (currentScreen) {
                PolarisScreen.TODAY -> TodayScreen(
                    state.tasks, state.courses,
                    onComplete = { task, complete -> viewModel.setTaskCompleted(task.id, complete); scope.launch { snackbarHostState.showSnackbar(taskCompletedMessage) } },
                    onPlan = { task -> viewModel.togglePlanForToday(task); scope.launch { snackbarHostState.showSnackbar(taskPlannedMessage) } },
                    onFocus = { task -> viewModel.startFocus(task.id); currentScreenName = PolarisScreen.FOCUS.name },
                    onCourse = { showCoursePickerFor = it },
                    onDelete = { showDeleteFor = it },
                )
                PolarisScreen.INBOX -> InboxScreen(
                    state.tasks, state.courses,
                    onComplete = { task, complete -> viewModel.setTaskCompleted(task.id, complete) },
                    onPlan = viewModel::togglePlanForToday,
                    onFocus = { task -> viewModel.startFocus(task.id); currentScreenName = PolarisScreen.FOCUS.name },
                    onCourse = { showCoursePickerFor = it },
                    onDelete = { showDeleteFor = it },
                )
                PolarisScreen.PLAN -> PlanScreen(state.tasks, state.courses, viewModel::togglePlanForToday) { task ->
                    viewModel.startFocus(task.id)
                    currentScreenName = PolarisScreen.FOCUS.name
                }
                PolarisScreen.FOCUS -> FocusScreen(
                    state.tasks.filter { it.status == TaskStatus.OPEN.name },
                    state.focus,
                    viewModel::startFocus,
                    viewModel::endFocus,
                    { currentScreenName = PolarisScreen.INBOX.name },
                )
                PolarisScreen.SETTINGS -> SettingsScreen(
                    state, viewModel,
                    { currentScreenName = PolarisScreen.PRIVACY.name },
                    { message -> scope.launch { snackbarHostState.showSnackbar(message) } },
                )
                PolarisScreen.PRIVACY -> PrivacyScreen { message -> scope.launch { snackbarHostState.showSnackbar(message) } }
                PolarisScreen.ASSISTANT -> AssistantPreviewScreen(
                    state.tasks.filter { it.status == TaskStatus.OPEN.name },
                    onAddFirstStep = { title ->
                        viewModel.addTask(title)
                        scope.launch { snackbarHostState.showSnackbar(taskAddedMessage) }
                    },
                )
            }
        }
    }
    if (showAddTask) {
        AddTaskDialog(state.courses, { showAddTask = false }) { title, courseId ->
            viewModel.addTask(title, courseId)
            showAddTask = false
            scope.launch { snackbarHostState.showSnackbar(taskAddedMessage) }
        }
    }
    showCoursePickerFor?.let { task ->
        CoursePickerDialog(state.courses, { showCoursePickerFor = null }) { courseId ->
            viewModel.setTaskCourse(task.id, courseId)
            showCoursePickerFor = null
            scope.launch { snackbarHostState.showSnackbar(courseAssignedMessage) }
        }
    }
    showDeleteFor?.let { task ->
        AlertDialog(
            onDismissRequest = { showDeleteFor = null },
            title = { Text(stringResourceCompat(R.string.delete_confirm_title)) },
            text = { Text(stringResourceCompat(R.string.delete_confirm_body)) },
            confirmButton = { Button(onClick = { viewModel.deleteTask(task.id); showDeleteFor = null; scope.launch { snackbarHostState.showSnackbar(taskDeletedMessage) } }) { Text(stringResourceCompat(R.string.delete_confirm_action)) } },
            dismissButton = { TextButton(onClick = { showDeleteFor = null }) { Text(stringResourceCompat(R.string.cancel)) } },
        )
    }
}

@OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
@Composable
private fun PolarisTopBar(screen: PolarisScreen, onOpenPrivacy: () -> Unit, onOpenAssistant: () -> Unit) {
    val title = when (screen) {
        PolarisScreen.TODAY -> stringResourceCompat(R.string.today)
        PolarisScreen.INBOX -> stringResourceCompat(R.string.inbox)
        PolarisScreen.PLAN -> stringResourceCompat(R.string.plan)
        PolarisScreen.FOCUS -> stringResourceCompat(R.string.focus)
        PolarisScreen.SETTINGS -> stringResourceCompat(R.string.settings)
        PolarisScreen.PRIVACY -> stringResourceCompat(R.string.privacy)
        PolarisScreen.ASSISTANT -> stringResourceCompat(R.string.assistant_title)
    }
    TopAppBar(
        title = { Text(title, modifier = Modifier.semantics { heading() }) },
        actions = {
            TextButton(onClick = onOpenAssistant) { Text(stringResourceCompat(R.string.assistant_title)) }
            TextButton(onClick = onOpenPrivacy) { Text(stringResourceCompat(R.string.privacy)) }
        },
    )
}

@Composable
private fun PolarisNavigation(current: PolarisScreen, onChange: (PolarisScreen) -> Unit) {
    val navigationDescription = stringResourceCompat(R.string.accessibility_navigation)
    val destinations = listOf(
        PolarisScreen.TODAY to stringResourceCompat(R.string.today),
        PolarisScreen.INBOX to stringResourceCompat(R.string.inbox),
        PolarisScreen.PLAN to stringResourceCompat(R.string.plan),
        PolarisScreen.FOCUS to stringResourceCompat(R.string.focus),
        PolarisScreen.SETTINGS to stringResourceCompat(R.string.settings),
    )
    NavigationBar(modifier = Modifier.semantics { contentDescription = navigationDescription }) {
        destinations.forEach { (destination, label) ->
            NavigationBarItem(
                selected = current == destination,
                onClick = { onChange(destination) },
                icon = { Box(modifier = Modifier.size(1.dp)) },
                label = { Text(label, maxLines = 1, overflow = TextOverflow.Ellipsis) },
            )
        }
    }
}

@Composable
private fun TodayScreen(
    tasks: List<TaskEntity>,
    courses: List<CourseEntity>,
    onComplete: (TaskEntity, Boolean) -> Unit,
    onPlan: (TaskEntity) -> Unit,
    onFocus: (TaskEntity) -> Unit,
    onCourse: (TaskEntity) -> Unit,
    onDelete: (TaskEntity) -> Unit,
) {
    val today = java.time.LocalDate.now().toEpochDay()
    val todayTasks = tasks.filter { it.status == TaskStatus.OPEN.name && it.plannedForEpochDay == today }
    LazyColumn(modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Spacer(Modifier.height(8.dp))
            Text(stringResourceCompat(R.string.preview_badge), style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.secondary)
            Text(stringResourceCompat(R.string.today), style = MaterialTheme.typography.headlineMedium, modifier = Modifier.semantics { heading() })
        }
        if (todayTasks.isEmpty()) item { EmptyState(stringResourceCompat(R.string.empty_today_title), stringResourceCompat(R.string.empty_today_body)) }
        else items(todayTasks, key = { it.id }) { task -> TaskCard(task, courses, onComplete, onPlan, onFocus, onCourse, onDelete) }
        item { Spacer(Modifier.height(90.dp)) }
    }
}

@Composable
private fun InboxScreen(
    tasks: List<TaskEntity>,
    courses: List<CourseEntity>,
    onComplete: (TaskEntity, Boolean) -> Unit,
    onPlan: (TaskEntity) -> Unit,
    onFocus: (TaskEntity) -> Unit,
    onCourse: (TaskEntity) -> Unit,
    onDelete: (TaskEntity) -> Unit,
) {
    LazyColumn(modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Spacer(Modifier.height(8.dp))
            Text(stringResourceCompat(R.string.inbox), style = MaterialTheme.typography.headlineMedium, modifier = Modifier.semantics { heading() })
            Text(stringResourceCompat(R.string.empty_inbox_body), style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        if (tasks.isEmpty()) item { EmptyState(stringResourceCompat(R.string.empty_inbox_title), stringResourceCompat(R.string.empty_inbox_body)) }
        else items(tasks, key = { it.id }) { task -> TaskCard(task, courses, onComplete, onPlan, onFocus, onCourse, onDelete) }
        item { Spacer(Modifier.height(90.dp)) }
    }
}

@Composable
private fun TaskCard(
    task: TaskEntity,
    courses: List<CourseEntity>,
    onComplete: (TaskEntity, Boolean) -> Unit,
    onPlan: (TaskEntity) -> Unit,
    onFocus: (TaskEntity) -> Unit,
    onCourse: (TaskEntity) -> Unit,
    onDelete: (TaskEntity) -> Unit,
) {
    val completed = task.status == TaskStatus.COMPLETED.name
    val course = courses.firstOrNull { it.id == task.courseId }
    val completionDescription = stringResourceCompat(R.string.accessibility_task_checkbox)
    Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(verticalAlignment = Alignment.Top) {
                Checkbox(
                    checked = completed,
                    onCheckedChange = { onComplete(task, it) },
                    modifier = Modifier.semantics { role = Role.Checkbox; contentDescription = completionDescription },
                )
                Spacer(Modifier.width(6.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(task.title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Medium)
                    Text(if (completed) stringResourceCompat(R.string.task_done) else stringResourceCompat(R.string.task_open), style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text(course?.name ?: stringResourceCompat(R.string.task_no_course), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            if (!completed) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(selected = task.plannedForEpochDay != null, onClick = { onPlan(task) }, label = { Text(if (task.plannedForEpochDay == null) stringResourceCompat(R.string.task_plan_today) else stringResourceCompat(R.string.task_remove_plan)) })
                    FilterChip(onClick = { onFocus(task) }, selected = false, label = { Text(stringResourceCompat(R.string.task_focus)) })
                }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                TextButton(onClick = { onCourse(task) }) { Text(stringResourceCompat(R.string.assign_course)) }
                TextButton(onClick = { onDelete(task) }) { Text(stringResourceCompat(R.string.task_delete)) }
            }
        }
    }
}

@Composable
private fun PlanScreen(tasks: List<TaskEntity>, courses: List<CourseEntity>, onTogglePlan: (TaskEntity) -> Unit, onFocus: (TaskEntity) -> Unit) {
    val today = java.time.LocalDate.now().toEpochDay()
    val planned = tasks.filter { it.status == TaskStatus.OPEN.name && it.plannedForEpochDay == today }
    val unplanned = tasks.filter { it.status == TaskStatus.OPEN.name && it.plannedForEpochDay == null }
    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Text(stringResourceCompat(R.string.plan_title), style = MaterialTheme.typography.headlineMedium, modifier = Modifier.semantics { heading() })
            Text(stringResourceCompat(R.string.plan_body), style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        item { Text(stringResourceCompat(R.string.plan_today_section), style = MaterialTheme.typography.titleLarge) }
        if (planned.isEmpty()) item { Text(stringResourceCompat(R.string.plan_empty)) }
        items(planned, key = { "plan-${it.id}" }) { task -> PlanItem(task, courses, stringResourceCompat(R.string.plan_remove), { onTogglePlan(task) }) { onFocus(task) } }
        item { Text(stringResourceCompat(R.string.plan_unplanned), style = MaterialTheme.typography.titleLarge) }
        if (unplanned.isEmpty()) item { Text(stringResourceCompat(R.string.empty_inbox_title)) }
        items(unplanned, key = { "unplanned-${it.id}" }) { task -> PlanItem(task, courses, stringResourceCompat(R.string.plan_add_to_today), { onTogglePlan(task) }) { onFocus(task) } }
        item { Spacer(Modifier.height(90.dp)) }
    }
}

@Composable
private fun PlanItem(task: TaskEntity, courses: List<CourseEntity>, actionLabel: String, onToggle: () -> Unit, onFocus: () -> Unit) {
    ElevatedCard(modifier = Modifier.fillMaxWidth()) {
        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f)) {
                Text(task.title, style = MaterialTheme.typography.titleMedium)
                Text(courses.firstOrNull { it.id == task.courseId }?.name ?: stringResourceCompat(R.string.task_no_course), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Column(horizontalAlignment = Alignment.End) {
                TextButton(onClick = onToggle) { Text(actionLabel) }
                TextButton(onClick = onFocus) { Text(stringResourceCompat(R.string.task_focus)) }
            }
        }
    }
}

@Composable
private fun FocusScreen(
    tasks: List<TaskEntity>,
    focus: FocusUiState,
    onStart: (String, Int) -> Unit,
    onEnd: () -> Unit,
    onOpenInbox: () -> Unit,
) {
    var selectedTaskId by rememberSaveable { mutableStateOf<String?>(null) }
    var now by remember { mutableStateOf(System.currentTimeMillis()) }
    LaunchedEffect(focus.isRunning, focus.endAtMillis) {
        while (focus.isRunning && (focus.endAtMillis ?: 0L) > now) {
            delay(1_000)
            now = System.currentTimeMillis()
        }
    }
    val activeTask = tasks.firstOrNull { it.id == focus.taskId }
    val selectedTask = tasks.firstOrNull { it.id == selectedTaskId }
    val seconds = if (focus.isRunning && focus.endAtMillis != null) ((focus.endAtMillis - now).coerceAtLeast(0L) / 1000L) else 0L
    val minutes = seconds / 60L
    val remainder = seconds % 60L
    Column(modifier = Modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text(stringResourceCompat(R.string.focus_title), style = MaterialTheme.typography.headlineMedium, modifier = Modifier.semantics { heading() })
        Text(stringResourceCompat(R.string.focus_body), style = MaterialTheme.typography.bodyLarge)
        if (focus.isRunning && activeTask != null) {
            ElevatedCard(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(activeTask.title, style = MaterialTheme.typography.titleLarge)
                    Text(stringResourceCompat(R.string.focus_remaining, minutes, remainder), style = MaterialTheme.typography.displaySmall, fontWeight = FontWeight.Bold)
                    OutlinedButton(onClick = onEnd, modifier = Modifier.fillMaxWidth().height(52.dp)) { Text(stringResourceCompat(R.string.focus_end)) }
                }
            }
        } else if (tasks.isEmpty()) {
            EmptyState(stringResourceCompat(R.string.focus_no_task), stringResourceCompat(R.string.empty_inbox_body), onOpenInbox)
        } else {
            Text(stringResourceCompat(R.string.focus_select_task), style = MaterialTheme.typography.titleMedium)
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.weight(1f)) {
                items(tasks, key = { it.id }) { task ->
                    FilterChip(selected = selectedTaskId == task.id, onClick = { selectedTaskId = task.id }, label = { Text(task.title, maxLines = 1, overflow = TextOverflow.Ellipsis) })
                }
            }
            Button(onClick = { selectedTask?.let { onStart(it.id, 25) } }, enabled = selectedTask != null, modifier = Modifier.fillMaxWidth().height(52.dp)) { Text(stringResourceCompat(R.string.focus_start_25)) }
            OutlinedButton(onClick = { selectedTask?.let { onStart(it.id, 10) } }, enabled = selectedTask != null, modifier = Modifier.fillMaxWidth().height(52.dp)) { Text(stringResourceCompat(R.string.focus_start_10)) }
        }
    }
}

@Composable
private fun SettingsScreen(state: PolarisUiState, viewModel: PolarisViewModel, onOpenPrivacy: () -> Unit, onNotice: (String) -> Unit) {
    var showLanguagePicker by rememberSaveable { mutableStateOf(false) }
    var showCourseDialog by rememberSaveable { mutableStateOf(false) }
    val languageName = viewModel.displayLanguageName(state.localeTag)
    val localeSavedMessage = stringResourceCompat(R.string.locale_selected)
    val courseAddedMessage = stringResourceCompat(R.string.course_added)
    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item { Text(stringResourceCompat(R.string.settings_title), style = MaterialTheme.typography.headlineMedium, modifier = Modifier.semantics { heading() }) }
        item {
            SettingsCard(stringResourceCompat(R.string.settings_language), stringResourceCompat(R.string.selected_language, languageName)) {
                OutlinedButton(onClick = { showLanguagePicker = true }, modifier = Modifier.fillMaxWidth()) { Text(stringResourceCompat(R.string.choose_language)) }
            }
        }
        item {
            SettingsCard(stringResourceCompat(R.string.settings_theme), "") {
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
                    Text(stringResourceCompat(R.string.settings_theme), modifier = Modifier.weight(1f))
                    Switch(checked = state.darkTheme, onCheckedChange = viewModel::setDarkTheme)
                }
            }
        }
        item {
            SettingsCard(stringResourceCompat(R.string.settings_courses), "") {
                OutlinedButton(onClick = { showCourseDialog = true }, modifier = Modifier.fillMaxWidth()) { Text(stringResourceCompat(R.string.settings_add_course)) }
                state.courses.forEach { Text(it.name, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.padding(top = 6.dp)) }
            }
        }
        item { SettingsCard(stringResourceCompat(R.string.settings_account), stringResourceCompat(R.string.settings_account_body)) { } }
        item { SettingsCard(stringResourceCompat(R.string.settings_notifications), stringResourceCompat(R.string.settings_notifications_body)) { } }
        item { OutlinedButton(onClick = onOpenPrivacy, modifier = Modifier.fillMaxWidth().height(52.dp)) { Text(stringResourceCompat(R.string.settings_privacy)) } }
        item { Spacer(Modifier.height(90.dp)) }
    }
    if (showLanguagePicker) {
        LanguagePickerDialog(state.localeTag, {
            viewModel.selectLanguage(it)
            showLanguagePicker = false
            onNotice(localeSavedMessage)
        }) { showLanguagePicker = false }
    }
    if (showCourseDialog) {
        AddCourseDialog({ showCourseDialog = false }) { name ->
            viewModel.addCourse(name)
            showCourseDialog = false
            onNotice(courseAddedMessage)
        }
    }
}

@Composable
private fun SettingsCard(title: String, body: String, content: @Composable () -> Unit) {
    ElevatedCard(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text(title, style = MaterialTheme.typography.titleMedium)
            if (body.isNotBlank()) Text(body, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            content()
        }
    }
}

@Composable
private fun PrivacyScreen(onNotice: (String) -> Unit) {
    val exportUnavailableMessage = stringResourceCompat(R.string.privacy_export_unavailable)
    val deleteUnavailableMessage = stringResourceCompat(R.string.privacy_delete_unavailable)
    Column(modifier = Modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text(stringResourceCompat(R.string.privacy_dashboard_title), style = MaterialTheme.typography.headlineMedium, modifier = Modifier.semantics { heading() })
        ElevatedCard(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(stringResourceCompat(R.string.on_device_only), style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.secondary)
                Text(stringResourceCompat(R.string.privacy_local_workspace))
                Divider()
                Text(stringResourceCompat(R.string.privacy_ai))
                Text(stringResourceCompat(R.string.privacy_analytics))
            }
        }
        OutlinedButton(onClick = { onNotice(exportUnavailableMessage) }, modifier = Modifier.fillMaxWidth().height(52.dp)) { Text(stringResourceCompat(R.string.privacy_export)) }
        OutlinedButton(onClick = { onNotice(deleteUnavailableMessage) }, modifier = Modifier.fillMaxWidth().height(52.dp)) { Text(stringResourceCompat(R.string.privacy_delete)) }
    }
}

@Composable
private fun AssistantPreviewScreen(tasks: List<TaskEntity>, onAddFirstStep: (String) -> Unit) {
    var selectedTaskId by rememberSaveable { mutableStateOf<String?>(null) }
    val selectedTask = tasks.firstOrNull { it.id == selectedTaskId }
    val firstStep = stringResourceCompat(R.string.assistant_step_one)
    val secondStep = stringResourceCompat(R.string.assistant_step_two)
    val thirdStep = stringResourceCompat(R.string.assistant_step_three)
    Column(modifier = Modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Text(stringResourceCompat(R.string.assistant_preview_title), style = MaterialTheme.typography.headlineMedium, modifier = Modifier.semantics { heading() })
        Text(stringResourceCompat(R.string.assistant_preview_body))
        if (tasks.isEmpty()) EmptyState(stringResourceCompat(R.string.assistant_no_task), stringResourceCompat(R.string.empty_inbox_body))
        else {
            Text(stringResourceCompat(R.string.assistant_choose_task), style = MaterialTheme.typography.titleMedium)
            LazyColumn(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(tasks, key = { it.id }) { task -> FilterChip(selected = selectedTaskId == task.id, onClick = { selectedTaskId = task.id }, label = { Text(task.title, maxLines = 1, overflow = TextOverflow.Ellipsis) }) }
            }
            if (selectedTask != null) {
                ElevatedCard(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(selectedTask.title, style = MaterialTheme.typography.titleMedium)
                        Text(firstStep)
                        Text(secondStep)
                        Text(thirdStep)
                    }
                }
                Button(onClick = { onAddFirstStep("${selectedTask.title}: $firstStep") }, modifier = Modifier.fillMaxWidth().height(52.dp)) { Text(stringResourceCompat(R.string.assistant_confirm_first_step)) }
                OutlinedButton(onClick = { selectedTaskId = null }, modifier = Modifier.fillMaxWidth().height(52.dp)) { Text(stringResourceCompat(R.string.assistant_reject_draft)) }
            }
        }
    }
}

@Composable
private fun AddTaskDialog(courses: List<CourseEntity>, onDismiss: () -> Unit, onSave: (String, String?) -> Unit) {
    var title by rememberSaveable { mutableStateOf("") }
    var courseId by rememberSaveable { mutableStateOf<String?>(null) }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(stringResourceCompat(R.string.add_task)) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(value = title, onValueChange = { title = it }, modifier = Modifier.fillMaxWidth(), label = { Text(stringResourceCompat(R.string.task_title_label)) }, placeholder = { Text(stringResourceCompat(R.string.task_title_hint)) })
                if (courses.isNotEmpty()) {
                    Text(stringResourceCompat(R.string.task_course), style = MaterialTheme.typography.labelLarge)
                    courses.forEach { course -> FilterChip(selected = courseId == course.id, onClick = { courseId = if (courseId == course.id) null else course.id }, label = { Text(course.name) }) }
                }
            }
        },
        confirmButton = { Button(onClick = { onSave(title, courseId) }, enabled = title.trim().isNotEmpty()) { Text(stringResourceCompat(R.string.save_task)) } },
        dismissButton = { TextButton(onClick = onDismiss) { Text(stringResourceCompat(R.string.cancel)) } },
    )
}

@Composable
private fun AddCourseDialog(onDismiss: () -> Unit, onSave: (String) -> Unit) {
    var name by rememberSaveable { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(stringResourceCompat(R.string.settings_add_course)) },
        text = { OutlinedTextField(value = name, onValueChange = { name = it }, modifier = Modifier.fillMaxWidth(), label = { Text(stringResourceCompat(R.string.course_name_label)) }, placeholder = { Text(stringResourceCompat(R.string.course_name_hint)) }) },
        confirmButton = { Button(onClick = { onSave(name) }, enabled = name.trim().isNotEmpty()) { Text(stringResourceCompat(R.string.save_course)) } },
        dismissButton = { TextButton(onClick = onDismiss) { Text(stringResourceCompat(R.string.cancel)) } },
    )
}

@Composable
private fun CoursePickerDialog(courses: List<CourseEntity>, onDismiss: () -> Unit, onChoose: (String?) -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(stringResourceCompat(R.string.choose_course)) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                TextButton(onClick = { onChoose(null) }, modifier = Modifier.fillMaxWidth()) { Text(stringResourceCompat(R.string.task_no_course)) }
                courses.forEach { course -> TextButton(onClick = { onChoose(course.id) }, modifier = Modifier.fillMaxWidth()) { Text(course.name) } }
            }
        },
        confirmButton = {},
        dismissButton = { TextButton(onClick = onDismiss) { Text(stringResourceCompat(R.string.cancel)) } },
    )
}

@Composable
private fun LanguagePickerDialog(selectedTag: String, onSelect: (String) -> Unit, onDismiss: () -> Unit) {
    var query by rememberSaveable { mutableStateOf("") }
    val languages = remember(query) { LanguageOption.previewLanguages.filter { it.nativeName.contains(query, ignoreCase = true) || it.englishName.contains(query, ignoreCase = true) || it.tag.contains(query, ignoreCase = true) } }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(stringResourceCompat(R.string.choose_language)) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = query, onValueChange = { query = it }, modifier = Modifier.fillMaxWidth(), label = { Text(stringResourceCompat(R.string.language_search_hint)) }, singleLine = true)
                LazyColumn(modifier = Modifier.height(300.dp)) {
                    items(languages, key = { it.tag }) { language ->
                        TextButton(onClick = { onSelect(language.tag) }, modifier = Modifier.fillMaxWidth()) {
                            Column(modifier = Modifier.fillMaxWidth()) {
                                Text(language.nativeName, fontWeight = if (language.tag == selectedTag) FontWeight.Bold else FontWeight.Normal)
                                Text(language.englishName, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {},
        dismissButton = { TextButton(onClick = onDismiss) { Text(stringResourceCompat(R.string.cancel)) } },
    )
}

@Composable
private fun EmptyState(title: String, body: String, action: (() -> Unit)? = null) {
    ElevatedCard(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(title, style = MaterialTheme.typography.titleLarge)
            Text(body, color = MaterialTheme.colorScheme.onSurfaceVariant)
            if (action != null) OutlinedButton(onClick = action) { Text(stringResourceCompat(R.string.inbox)) }
        }
    }
}

@Composable
private fun stringResourceCompat(id: Int, vararg formatArgs: Any): String = androidx.compose.ui.res.stringResource(id, *formatArgs)
