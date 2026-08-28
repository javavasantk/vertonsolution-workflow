package com.projectpolaris.app

import android.Manifest
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
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
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val store = WorkflowStore(applicationContext)
        store.reconcileLocaleWithSystem()
        setContent {
            val state = store.snapshot
            PolarisTheme(state.darkTheme) {
                Surface(modifier = Modifier.fillMaxSize()) {
                    if (state.onboarded) {
                        WorkflowApp(store)
                    } else {
                        WelcomeScreen(state.localeTag, store::setLocale, store::finishOnboarding)
                    }
                }
            }
        }
    }
}

enum class AppTab { TODAY, INBOX, CALENDAR, FOCUS, SETTINGS, PRIVACY, POLARIS }

@Composable
private fun PolarisTheme(dark: Boolean, content: @Composable () -> Unit) {
    val light = androidx.compose.material3.lightColorScheme(
        primary = Color(0xFF10233F), onPrimary = Color.White, secondary = Color(0xFF62558D),
        surface = Color(0xFFF9FAFC), surfaceVariant = Color(0xFFEAF1F7), onSurfaceVariant = Color(0xFF3E4A55),
    )
    val darkScheme = androidx.compose.material3.darkColorScheme(
        primary = Color(0xFFC9E7FF), onPrimary = Color(0xFF10233F), secondary = Color(0xFFDCCBFF),
        surface = Color(0xFF101820), surfaceVariant = Color(0xFF202D38), onSurfaceVariant = Color(0xFFD2DEE9),
    )
    MaterialTheme(colorScheme = if (dark) darkScheme else light, content = content)
}

@Composable
private fun WelcomeScreen(localeTag: String, onLocale: (String) -> Unit, onFinish: () -> Unit) {
    var languageDialog by rememberSaveable { mutableStateOf(false) }
    val selected = previewLanguages.firstOrNull { it.tag == localeTag } ?: previewLanguages.first()
    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp, Alignment.CenterVertically),
    ) {
        Text(text = stringRes(R.string.app_name), style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.secondary)
        Text(text = stringRes(R.string.developed_by), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(text = stringRes(R.string.welcome_title), style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.SemiBold, modifier = Modifier.semantics { heading() })
        Text(text = stringRes(R.string.welcome_body), style = MaterialTheme.typography.bodyLarge)
        ElevatedCard(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(stringRes(R.string.choose_language), style = MaterialTheme.typography.titleMedium)
                Text(stringRes(R.string.selected_language, selected.nativeName))
                OutlinedButton(onClick = { languageDialog = true }, modifier = Modifier.fillMaxWidth()) { Text(stringRes(R.string.choose_language)) }
                Text(stringRes(R.string.language_preview_notice), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
        Button(onClick = onFinish, modifier = Modifier.fillMaxWidth().height(52.dp)) { Text(stringRes(R.string.continue_label)) }
        TextButton(onClick = onFinish, modifier = Modifier.fillMaxWidth()) { Text(stringRes(R.string.skip_label)) }
    }
    if (languageDialog) {
        LanguageDialog(localeTag, { onLocale(it); languageDialog = false }) { languageDialog = false }
    }
}

@Composable
private fun WorkflowApp(store: WorkflowStore) {
    var tabName by rememberSaveable { mutableStateOf(AppTab.TODAY.name) }
    val tab = AppTab.valueOf(tabName)
    val state = store.snapshot
    val snackbars = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()
    var addTask by rememberSaveable { mutableStateOf(false) }
    var taskForDetails by remember { mutableStateOf<WorkflowTask?>(null) }
    var taskForEdit by remember { mutableStateOf<WorkflowTask?>(null) }
    var taskForArea by remember { mutableStateOf<WorkflowTask?>(null) }
    var taskForDelete by remember { mutableStateOf<WorkflowTask?>(null) }
    val taskAdded = stringRes(R.string.task_added)
    val taskUpdated = stringRes(R.string.task_completed)
    val planUpdated = stringRes(R.string.task_planned)
    val areaUpdated = stringRes(R.string.area_updated)
    val taskDeleted = stringRes(R.string.task_deleted)
    val taskArchived = stringRes(R.string.task_archived)
    val taskRestored = stringRes(R.string.task_restored)
    val exportComplete = stringRes(R.string.export_complete)
    val exportCancelled = stringRes(R.string.export_cancelled)
    val context = LocalContext.current
    val exportLauncher = rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("application/json")) { uri ->
        if (uri == null) scope.launch { snackbars.showSnackbar(exportCancelled) }
        else runCatching { context.contentResolver.openOutputStream(uri)?.bufferedWriter()?.use { it.write(store.exportJson()) } }.onSuccess { scope.launch { snackbars.showSnackbar(exportComplete) } }.onFailure { scope.launch { snackbars.showSnackbar(exportCancelled) } }
    }
    val remindersEnabled = stringRes(R.string.reminders_enabled)
    val reminderDateRequired = stringRes(R.string.reminder_date_required)
    val remindersDenied = stringRes(R.string.reminders_denied)
    val reminderPermissionLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        scope.launch { snackbars.showSnackbar(if (granted) remindersEnabled else remindersDenied) }
    }
    val enableReminders: () -> Unit = {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && !notificationsAllowed(context)) reminderPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
        else { scope.launch { snackbars.showSnackbar(remindersEnabled) } }
        Unit
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbars) },
        topBar = { Header(tab, onPrivacy = { tabName = AppTab.PRIVACY.name }, onPolaris = { tabName = AppTab.POLARIS.name }) },
        bottomBar = { AppNavigation(tab) { tabName = it.name } },
        floatingActionButton = { if (tab == AppTab.TODAY || tab == AppTab.INBOX) Button(onClick = { addTask = true }) { Text(stringRes(R.string.add_task)) } },
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            when (tab) {
                AppTab.TODAY -> TodayScreen(state.tasks, state.areas,
                    onComplete = { task, value -> store.complete(task.id, value); scope.launch { snackbars.showSnackbar(taskUpdated) } },
                    onPlan = { task -> store.togglePlan(task.id); scope.launch { snackbars.showSnackbar(planUpdated) } },
                    onFocus = { task -> store.startFocus(task.id, 25); tabName = AppTab.FOCUS.name },
                    onArea = { taskForArea = it }, onDetails = { taskForDetails = it }, onEdit = { taskForEdit = it }, onArchive = { task -> store.archiveTask(task.id, !task.archived); scope.launch { snackbars.showSnackbar(if (task.archived) taskRestored else taskArchived) } }, onDelete = { taskForDelete = it })
                AppTab.INBOX -> InboxScreen(state.tasks, state.areas,
                    onComplete = { task, value -> store.complete(task.id, value) }, onPlan = { store.togglePlan(it.id) },
                    onFocus = { task -> store.startFocus(task.id, 25); tabName = AppTab.FOCUS.name },
                    onArea = { taskForArea = it }, onDetails = { taskForDetails = it }, onEdit = { taskForEdit = it }, onArchive = { task -> store.archiveTask(task.id, !task.archived); scope.launch { snackbars.showSnackbar(if (task.archived) taskRestored else taskArchived) } }, onDelete = { taskForDelete = it })
                AppTab.CALENDAR -> CalendarScreen(state.tasks, state.areas) { taskForDetails = it }
                AppTab.FOCUS -> FocusScreen(state.tasks.filterNot { it.completed }, state.focusTaskId, state.focusEndsAtMillis, store::startFocus, store::endFocus, { tabName = AppTab.INBOX.name })
                AppTab.SETTINGS -> SettingsScreen(store, { tabName = AppTab.PRIVACY.name }, { message -> scope.launch { snackbars.showSnackbar(message) } }, enableReminders)
                AppTab.PRIVACY -> PrivacyScreen(onNotice = { message -> scope.launch { snackbars.showSnackbar(message) } }, onExport = { exportLauncher.launch("project-polaris-local-export.json") })
                AppTab.POLARIS -> PolarisPreviewScreen(state.tasks.filterNot { it.completed }) { title ->
                    store.addTask(TaskForm(title = title, type = "Task", effort = "15 min"))
                    scope.launch { snackbars.showSnackbar(taskAdded) }
                }
            }
        }
    }
    if (addTask) {
        TaskDialog(state.areas, { addTask = false }) { form ->
            val createdId = store.addTask(form)
            if (createdId != null && form.reminder != "None" && !store.scheduleReminder(context, createdId)) scope.launch { snackbars.showSnackbar(reminderDateRequired) }
            addTask = false
            scope.launch { snackbars.showSnackbar(taskAdded) }
        }
    }
    taskForDetails?.let { task ->
        TaskDetailsDialog(task, state.areas, { taskForDetails = null }, onChecklistToggle = { index -> store.toggleChecklistItem(task.id, index) }, onEdit = { taskForDetails = null; taskForEdit = task })
    }
    taskForEdit?.let { task ->
        TaskDialog(state.areas, { taskForEdit = null }, initial = task.toForm()) { form ->
            store.updateTask(task.id, form)
            if (form.reminder != "None" && !store.scheduleReminder(context, task.id)) scope.launch { snackbars.showSnackbar(reminderDateRequired) }
            taskForEdit = null
            scope.launch { snackbars.showSnackbar(taskUpdated) }
        }
    }
    taskForArea?.let { task ->
        AreaPicker(state.areas, { taskForArea = null }) { areaId ->
            store.assignArea(task.id, areaId)
            taskForArea = null
            scope.launch { snackbars.showSnackbar(areaUpdated) }
        }
    }
    taskForDelete?.let { task ->
        AlertDialog(
            onDismissRequest = { taskForDelete = null }, title = { Text(stringRes(R.string.delete_title)) }, text = { Text(stringRes(R.string.delete_body)) },
            confirmButton = { Button(onClick = { store.deleteTask(task.id); taskForDelete = null; scope.launch { snackbars.showSnackbar(taskDeleted) } }) { Text(stringRes(R.string.delete_action)) } },
            dismissButton = { TextButton(onClick = { taskForDelete = null }) { Text(stringRes(R.string.cancel)) } },
        )
    }
}

@Composable
private fun Header(tab: AppTab, onPrivacy: () -> Unit, onPolaris: () -> Unit) {
    val title = when (tab) {
        AppTab.TODAY -> stringRes(R.string.today); AppTab.INBOX -> stringRes(R.string.inbox); AppTab.CALENDAR -> stringRes(R.string.calendar)
        AppTab.FOCUS -> stringRes(R.string.focus); AppTab.SETTINGS -> stringRes(R.string.settings); AppTab.PRIVACY -> stringRes(R.string.privacy); AppTab.POLARIS -> stringRes(R.string.assistant_title)
    }
    Row(modifier = Modifier.fillMaxWidth().padding(start = 20.dp, end = 8.dp, top = 12.dp, bottom = 4.dp), verticalAlignment = Alignment.CenterVertically) {
        Text(title, style = MaterialTheme.typography.headlineSmall, modifier = Modifier.weight(1f).semantics { heading() })
        TextButton(onClick = onPolaris) { Text(stringRes(R.string.assistant_title_short)) }
        TextButton(onClick = onPrivacy) { Text(stringRes(R.string.privacy)) }
    }
}

@Composable
private fun AppNavigation(current: AppTab, onSelect: (AppTab) -> Unit) {
    val items = listOf(AppTab.TODAY to stringRes(R.string.today), AppTab.INBOX to stringRes(R.string.inbox), AppTab.CALENDAR to stringRes(R.string.calendar), AppTab.FOCUS to stringRes(R.string.focus), AppTab.SETTINGS to stringRes(R.string.settings))
    NavigationBar {
        items.forEach { (target, label) ->
            NavigationBarItem(selected = current == target, onClick = { onSelect(target) }, icon = { Box(Modifier.size(1.dp)) }, label = { Text(label, maxLines = 1, overflow = TextOverflow.Ellipsis) })
        }
    }
}

@Composable
private fun TodayScreen(tasks: List<WorkflowTask>, areas: List<WorkflowArea>, onComplete: (WorkflowTask, Boolean) -> Unit, onPlan: (WorkflowTask) -> Unit, onFocus: (WorkflowTask) -> Unit, onArea: (WorkflowTask) -> Unit, onDetails: (WorkflowTask) -> Unit, onEdit: (WorkflowTask) -> Unit, onArchive: (WorkflowTask) -> Unit, onDelete: (WorkflowTask) -> Unit) {
    val today = tasks.filter { it.plannedForToday && !it.completed }
    LazyColumn(modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item { Spacer(Modifier.height(6.dp)); Text(stringRes(R.string.preview_badge), style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.secondary); Text(stringRes(R.string.today), style = MaterialTheme.typography.headlineMedium, modifier = Modifier.semantics { heading() }) }
        if (today.isEmpty()) item { EmptyCard(stringRes(R.string.empty_today_title), stringRes(R.string.empty_today_body)) }
        else items(today, key = { it.id }) { TaskCard(it, areas, onComplete, onPlan, onFocus, onArea, onDetails, onEdit, onArchive, onDelete) }
        item { Spacer(Modifier.height(88.dp)) }
    }
}

@Composable
private fun InboxScreen(tasks: List<WorkflowTask>, areas: List<WorkflowArea>, onComplete: (WorkflowTask, Boolean) -> Unit, onPlan: (WorkflowTask) -> Unit, onFocus: (WorkflowTask) -> Unit, onArea: (WorkflowTask) -> Unit, onDetails: (WorkflowTask) -> Unit, onEdit: (WorkflowTask) -> Unit, onArchive: (WorkflowTask) -> Unit, onDelete: (WorkflowTask) -> Unit) {
    var query by rememberSaveable { mutableStateOf("") }
    var view by rememberSaveable { mutableStateOf("Active") }
    val visible = tasks.filter { task ->
        val area = areas.firstOrNull { it.id == task.areaId }?.name.orEmpty()
        val text = listOf(task.title, task.notes, task.project, area, task.tags.joinToString(" "), task.waitingOn, task.location).joinToString(" ")
        val matches = query.isBlank() || text.contains(query, ignoreCase = true)
        matches && when (view) {
            "Active" -> !task.archived && !task.completed
            "Waiting" -> !task.archived && task.status == "Waiting"
            "Completed" -> !task.archived && task.completed
            "Archived" -> task.archived
            else -> !task.archived
        }
    }
    LazyColumn(modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Spacer(Modifier.height(6.dp)); Text(stringRes(R.string.inbox), style = MaterialTheme.typography.headlineMedium, modifier = Modifier.semantics { heading() })
            OutlinedTextField(query, { query = it }, Modifier.fillMaxWidth().padding(top = 8.dp), label = { Text(stringRes(R.string.search_tasks)) }, placeholder = { Text(stringRes(R.string.search_tasks_hint)) }, singleLine = true)
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.padding(top = 8.dp)) {
                FilterChip(view == "Active", { view = "Active" }, label = { Text(stringRes(R.string.view_active)) })
                FilterChip(view == "Waiting", { view = "Waiting" }, label = { Text(stringRes(R.string.view_waiting)) })
                FilterChip(view == "Completed", { view = "Completed" }, label = { Text(stringRes(R.string.view_completed)) })
            }
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                FilterChip(view == "All", { view = "All" }, label = { Text(stringRes(R.string.view_all)) })
                FilterChip(view == "Archived", { view = "Archived" }, label = { Text(stringRes(R.string.view_archived)) })
            }
        }
        if (visible.isEmpty() && tasks.isEmpty()) item { EmptyCard(stringRes(R.string.empty_inbox_title), stringRes(R.string.empty_inbox_body)) }
        else if (visible.isEmpty()) item { EmptyCard(stringRes(R.string.no_search_results), stringRes(R.string.search_tasks_hint)) }
        else items(visible, key = { it.id }) { TaskCard(it, areas, onComplete, onPlan, onFocus, onArea, onDetails, onEdit, onArchive, onDelete) }
        item { Spacer(Modifier.height(88.dp)) }
    }
}

@Composable
private fun TaskCard(task: WorkflowTask, areas: List<WorkflowArea>, onComplete: (WorkflowTask, Boolean) -> Unit, onPlan: (WorkflowTask) -> Unit, onFocus: (WorkflowTask) -> Unit, onArea: (WorkflowTask) -> Unit, onDetails: (WorkflowTask) -> Unit, onEdit: (WorkflowTask) -> Unit, onArchive: (WorkflowTask) -> Unit, onDelete: (WorkflowTask) -> Unit) {
    val areaName = areas.firstOrNull { it.id == task.areaId }?.name ?: stringRes(R.string.task_no_area)
    Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(verticalAlignment = Alignment.Top) {
                Checkbox(checked = task.completed, onCheckedChange = { onComplete(task, it) })
                Spacer(Modifier.width(6.dp))
                Column(Modifier.weight(1f)) {
                    Text(task.title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Medium)
                    Text(if (task.completed) stringRes(R.string.task_done) else stringRes(R.string.task_open), style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text(areaName, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text(stringRes(R.string.filter_summary, task.type, task.priority), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    if (task.dueDate.isNotBlank()) Text(stringRes(R.string.filter_detail, stringRes(R.string.due_date), task.dueDate), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    if (task.tags.isNotEmpty()) Text(stringRes(R.string.filter_detail, stringRes(R.string.tags), task.tags.joinToString(", ")), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            if (!task.completed) Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(selected = task.plannedForToday, onClick = { onPlan(task) }, label = { Text(if (task.plannedForToday) stringRes(R.string.task_remove_plan) else stringRes(R.string.task_plan_today)) })
                FilterChip(selected = false, onClick = { onFocus(task) }, label = { Text(stringRes(R.string.task_focus)) })
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                TextButton(onClick = { onDetails(task) }) { Text(stringRes(R.string.task_details)) }
                TextButton(onClick = { onArea(task) }) { Text(stringRes(R.string.assign_area)) }
                TextButton(onClick = { onEdit(task) }) { Text(stringRes(R.string.edit_task)) }
                TextButton(onClick = { onArchive(task) }) { Text(if (task.archived) stringRes(R.string.restore_task) else stringRes(R.string.archive_task)) }
                TextButton(onClick = { onDelete(task) }) { Text(stringRes(R.string.task_delete)) }
            }
        }
    }
}

@Composable
private fun PlanScreen(tasks: List<WorkflowTask>, areas: List<WorkflowArea>, onToggle: (WorkflowTask) -> Unit, onFocus: (WorkflowTask) -> Unit) {
    val planned = tasks.filter { it.plannedForToday && !it.completed }
    val pending = tasks.filter { !it.plannedForToday && !it.completed }
    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item { Text(stringRes(R.string.plan_title), style = MaterialTheme.typography.headlineMedium, modifier = Modifier.semantics { heading() }); Text(stringRes(R.string.plan_body), color = MaterialTheme.colorScheme.onSurfaceVariant) }
        item { Text(stringRes(R.string.planned_today), style = MaterialTheme.typography.titleLarge) }
        if (planned.isEmpty()) item { Text(stringRes(R.string.plan_empty)) }
        items(planned, key = { it.id }) { PlanCard(it, areas, stringRes(R.string.remove), { onToggle(it) }) { onFocus(it) } }
        item { Text(stringRes(R.string.not_planned), style = MaterialTheme.typography.titleLarge) }
        if (pending.isEmpty()) item { Text(stringRes(R.string.empty_inbox_title)) }
        items(pending, key = { it.id }) { PlanCard(it, areas, stringRes(R.string.add_to_today), { onToggle(it) }) { onFocus(it) } }
        item { Spacer(Modifier.height(88.dp)) }
    }
}

@Composable
private fun PlanCard(task: WorkflowTask, areas: List<WorkflowArea>, action: String, onAction: () -> Unit, onFocus: () -> Unit) {
    ElevatedCard(modifier = Modifier.fillMaxWidth()) {
        Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(task.title, style = MaterialTheme.typography.titleMedium)
                Text(areas.firstOrNull { it.id == task.areaId }?.name ?: stringRes(R.string.task_no_area), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Column(horizontalAlignment = Alignment.End) {
                TextButton(onClick = onAction) { Text(action) }
                TextButton(onClick = onFocus) { Text(stringRes(R.string.task_focus)) }
            }
        }
    }
}

@Composable
private fun FocusScreen(tasks: List<WorkflowTask>, focusTaskId: String?, focusEndsAtMillis: Long?, onStart: (String, Int) -> Unit, onEnd: () -> Unit, onInbox: () -> Unit) {
    var selectedTaskId by rememberSaveable { mutableStateOf<String?>(null) }
    var now by remember { mutableStateOf(System.currentTimeMillis()) }
    LaunchedEffect(focusEndsAtMillis) { while (focusEndsAtMillis != null && focusEndsAtMillis > now) { delay(1000); now = System.currentTimeMillis() } }
    val activeTask = tasks.firstOrNull { it.id == focusTaskId }
    val selected = tasks.firstOrNull { it.id == selectedTaskId }
    val seconds = ((focusEndsAtMillis ?: now) - now).coerceAtLeast(0L) / 1000
    Column(modifier = Modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text(stringRes(R.string.focus_title), style = MaterialTheme.typography.headlineMedium, modifier = Modifier.semantics { heading() })
        Text(stringRes(R.string.focus_body))
        if (activeTask != null && focusEndsAtMillis != null && focusEndsAtMillis > now) {
            ElevatedCard(Modifier.fillMaxWidth()) {
                Column(Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(activeTask.title, style = MaterialTheme.typography.titleLarge)
                    Text(stringRes(R.string.focus_remaining, seconds / 60, seconds % 60), style = MaterialTheme.typography.displaySmall, fontWeight = FontWeight.Bold)
                    OutlinedButton(onClick = onEnd, modifier = Modifier.fillMaxWidth().height(52.dp)) { Text(stringRes(R.string.focus_end)) }
                }
            }
        } else if (tasks.isEmpty()) {
            EmptyCard(stringRes(R.string.focus_no_task), stringRes(R.string.empty_inbox_body), onInbox)
        } else {
            Text(stringRes(R.string.focus_choose_task), style = MaterialTheme.typography.titleMedium)
            LazyColumn(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(tasks, key = { it.id }) { task -> FilterChip(selected = selectedTaskId == task.id, onClick = { selectedTaskId = task.id }, label = { Text(task.title, maxLines = 1, overflow = TextOverflow.Ellipsis) }) }
            }
            Button(onClick = { selected?.let { onStart(it.id, 25) } }, enabled = selected != null, modifier = Modifier.fillMaxWidth().height(52.dp)) { Text(stringRes(R.string.focus_start_25)) }
            OutlinedButton(onClick = { selected?.let { onStart(it.id, 10) } }, enabled = selected != null, modifier = Modifier.fillMaxWidth().height(52.dp)) { Text(stringRes(R.string.focus_start_10)) }
        }
    }
}

@Composable
private fun SettingsScreen(store: WorkflowStore, onPrivacy: () -> Unit, onNotice: (String) -> Unit, onEnableReminders: () -> Unit) {
    var languages by rememberSaveable { mutableStateOf(false) }
    var areas by rememberSaveable { mutableStateOf(false) }
    val state = store.snapshot
    val selectedLanguage = previewLanguages.firstOrNull { it.tag == state.localeTag }?.nativeName ?: state.localeTag
    val languageSaved = stringRes(R.string.language_saved)
    val areaSaved = stringRes(R.string.area_added)
    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Text(stringRes(R.string.settings_title), style = MaterialTheme.typography.headlineMedium, modifier = Modifier.semantics { heading() })
            Text(stringRes(R.string.developed_by), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        item { SettingCard(stringRes(R.string.settings_language), stringRes(R.string.selected_language, selectedLanguage)) { OutlinedButton(onClick = { languages = true }, modifier = Modifier.fillMaxWidth()) { Text(stringRes(R.string.choose_language)) } } }
        item { SettingCard(stringRes(R.string.settings_theme), "") { Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) { Text(stringRes(R.string.settings_theme), Modifier.weight(1f)); Switch(state.darkTheme, store::setDarkTheme) } } }
        item { SettingCard(stringRes(R.string.areas_title), "") { OutlinedButton(onClick = { areas = true }, modifier = Modifier.fillMaxWidth()) { Text(stringRes(R.string.add_area)) }; state.areas.forEach { Text(it.name, Modifier.padding(top = 6.dp)) } } }
        item { SettingCard(stringRes(R.string.sync_beta), stringRes(R.string.sync_beta_body)) { } }
        item { SettingCard(stringRes(R.string.settings_reminders), stringRes(R.string.reminders_permission_body)) { OutlinedButton(onClick = onEnableReminders, modifier = Modifier.fillMaxWidth()) { Text(stringRes(R.string.enable_reminders)) } } }
        item { OutlinedButton(onClick = onPrivacy, modifier = Modifier.fillMaxWidth().height(52.dp)) { Text(stringRes(R.string.settings_privacy)) } }
    }
    if (languages) LanguageDialog(state.localeTag, { store.setLocale(it); languages = false; onNotice(languageSaved) }) { languages = false }
    if (areas) AreaDialog({ areas = false }) { name -> store.addArea(name); areas = false; onNotice(areaSaved) }
}

@Composable
private fun SettingCard(title: String, body: String, content: @Composable () -> Unit) {
    ElevatedCard(Modifier.fillMaxWidth()) { Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) { Text(title, style = MaterialTheme.typography.titleMedium); if (body.isNotBlank()) Text(body, color = MaterialTheme.colorScheme.onSurfaceVariant); content() } }
}

@Composable
private fun PrivacyScreen(onNotice: (String) -> Unit, onExport: () -> Unit) {
    val exportMessage = stringRes(R.string.privacy_export_unavailable)
    val deleteMessage = stringRes(R.string.privacy_delete_unavailable)
    Column(modifier = Modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text(stringRes(R.string.privacy_title), style = MaterialTheme.typography.headlineMedium, modifier = Modifier.semantics { heading() })
        ElevatedCard(Modifier.fillMaxWidth()) { Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) { Text(stringRes(R.string.device_only), style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.secondary); Text(stringRes(R.string.privacy_local)); Text(stringRes(R.string.privacy_ai)); Text(stringRes(R.string.privacy_analytics)) } }
        OutlinedButton(onClick = onExport, modifier = Modifier.fillMaxWidth().height(52.dp)) { Text(stringRes(R.string.export_local_data)) }
        OutlinedButton(onClick = { onNotice(deleteMessage) }, modifier = Modifier.fillMaxWidth().height(52.dp)) { Text(stringRes(R.string.privacy_delete)) }
    }
}

@Composable
private fun PolarisPreviewScreen(tasks: List<WorkflowTask>, onAdd: (String) -> Unit) {
    var selectedId by rememberSaveable { mutableStateOf<String?>(null) }
    val task = tasks.firstOrNull { it.id == selectedId }
    val stepOne = stringRes(R.string.assistant_step_one)
    Column(modifier = Modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Text(stringRes(R.string.assistant_title), style = MaterialTheme.typography.headlineMedium, modifier = Modifier.semantics { heading() })
        Text(stringRes(R.string.assistant_body))
        if (tasks.isEmpty()) EmptyCard(stringRes(R.string.assistant_no_task), stringRes(R.string.empty_inbox_body))
        else {
            Text(stringRes(R.string.assistant_choose_task), style = MaterialTheme.typography.titleMedium)
            LazyColumn(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) { items(tasks, key = { it.id }) { item -> FilterChip(selected = selectedId == item.id, onClick = { selectedId = item.id }, label = { Text(item.title, maxLines = 1, overflow = TextOverflow.Ellipsis) }) } }
            if (task != null) {
                ElevatedCard(Modifier.fillMaxWidth()) { Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) { Text(task.title, style = MaterialTheme.typography.titleMedium); Text(stepOne); Text(stringRes(R.string.assistant_step_two)); Text(stringRes(R.string.assistant_step_three)) } }
                Button(onClick = { onAdd("${task.title} — $stepOne") }, modifier = Modifier.fillMaxWidth().height(52.dp)) { Text(stringRes(R.string.assistant_add_step)) }
                OutlinedButton(onClick = { selectedId = null }, modifier = Modifier.fillMaxWidth().height(52.dp)) { Text(stringRes(R.string.assistant_keep)) }
            }
        }
    }
}

@Composable
private fun TaskDialog(areas: List<WorkflowArea>, onDismiss: () -> Unit, initial: TaskForm = TaskForm(), onSave: (TaskForm) -> Unit) {
    var title by rememberSaveable(initial.title) { mutableStateOf(initial.title) }
    var notes by rememberSaveable(initial.notes) { mutableStateOf(initial.notes) }
    var areaId by rememberSaveable(initial.areaId) { mutableStateOf(initial.areaId) }
    var project by rememberSaveable(initial.project) { mutableStateOf(initial.project) }
    var priority by rememberSaveable(initial.priority) { mutableStateOf(initial.priority) }
    var status by rememberSaveable(initial.status) { mutableStateOf(initial.status) }
    var type by rememberSaveable(initial.type) { mutableStateOf(initial.type) }
    var dueDate by rememberSaveable(initial.dueDate) { mutableStateOf(initial.dueDate) }
    var effort by rememberSaveable(initial.effort) { mutableStateOf(initial.effort) }
    var energy by rememberSaveable(initial.energy) { mutableStateOf(initial.energy) }
    var tagsText by rememberSaveable(initial.tags) { mutableStateOf(initial.tags.joinToString(", ")) }
    var recurrence by rememberSaveable(initial.recurrence) { mutableStateOf(initial.recurrence) }
    var reminder by rememberSaveable(initial.reminder) { mutableStateOf(initial.reminder) }
    var waitingOn by rememberSaveable(initial.waitingOn) { mutableStateOf(initial.waitingOn) }
    var location by rememberSaveable(initial.location) { mutableStateOf(initial.location) }
    var privacy by rememberSaveable(initial.privacy) { mutableStateOf(initial.privacy) }
    var checklistText by rememberSaveable(initial.checklist) { mutableStateOf(initial.checklist.joinToString(", ")) }
    var showMore by rememberSaveable { mutableStateOf(initial.title.isNotBlank()) }
    val editing = initial.title.isNotBlank()

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (editing) stringRes(R.string.edit_task) else stringRes(R.string.add_task)) },
        text = {
            LazyColumn(modifier = Modifier.height(440.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                item { OutlinedTextField(title, { title = it }, Modifier.fillMaxWidth(), label = { Text(stringRes(R.string.task_label)) }, placeholder = { Text(stringRes(R.string.task_hint)) }) }
                item {
                    Text(stringRes(R.string.task_area), style = MaterialTheme.typography.labelLarge)
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        FilterChip(selected = areaId == null, onClick = { areaId = null }, label = { Text(stringRes(R.string.task_no_area)) })
                        areas.take(3).forEach { area -> FilterChip(selected = areaId == area.id, onClick = { areaId = area.id }, label = { Text(area.name, maxLines = 1, overflow = TextOverflow.Ellipsis) }) }
                    }
                }
                item { ChoiceSection(stringRes(R.string.priority), priority, TaskOptions.priorities) { priority = it } }
                item { TextButton(onClick = { showMore = !showMore }) { Text(if (showMore) stringRes(R.string.fewer_options) else stringRes(R.string.more_options)) } }
                if (showMore) {
                    item { OutlinedTextField(notes, { notes = it }, Modifier.fillMaxWidth(), label = { Text(stringRes(R.string.notes)) }, placeholder = { Text(stringRes(R.string.notes_hint)) }, minLines = 2) }
                    item { OutlinedTextField(project, { project = it }, Modifier.fillMaxWidth(), label = { Text(stringRes(R.string.project)) }, placeholder = { Text(stringRes(R.string.project_hint)) }) }
                    item { ChoiceSection(stringRes(R.string.status), status, TaskOptions.statuses) { status = it } }
                    item { ActivityCategoryPicker(type) { type = it } }
                    item { DueDateTimePicker(dueDate) { dueDate = it } }
                    item { ChoiceSection(stringRes(R.string.effort), effort, TaskOptions.efforts) { effort = it } }
                    item { ChoiceSection(stringRes(R.string.energy), energy, TaskOptions.energies) { energy = it } }
                    item { OutlinedTextField(tagsText, { tagsText = it }, Modifier.fillMaxWidth(), label = { Text(stringRes(R.string.tags)) }, placeholder = { Text(stringRes(R.string.tags_hint)) }) }
                    item { ChoiceSection(stringRes(R.string.recurrence), recurrence, TaskOptions.recurrences) { recurrence = it } }
                    item { ChoiceSection(stringRes(R.string.reminder), reminder, TaskOptions.reminders) { reminder = it }; if (reminder != "None") Text(stringRes(R.string.reminder_preview_notice), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }
                    item { OutlinedTextField(waitingOn, { waitingOn = it }, Modifier.fillMaxWidth(), label = { Text(stringRes(R.string.waiting_on)) }, placeholder = { Text(stringRes(R.string.waiting_on_hint)) }) }
                    item { OutlinedTextField(location, { location = it }, Modifier.fillMaxWidth(), label = { Text(stringRes(R.string.location)) }, placeholder = { Text(stringRes(R.string.location_hint)) }) }
                    item { ChoiceSection(stringRes(R.string.privacy_label), privacy, TaskOptions.privacy) { privacy = it } }
                    item { OutlinedTextField(checklistText, { checklistText = it }, Modifier.fillMaxWidth(), label = { Text(stringRes(R.string.checklist)) }, placeholder = { Text(stringRes(R.string.checklist_hint)) }) }
                }
            }
        },
        confirmButton = {
            Button(onClick = {
                onSave(TaskForm(title, notes, areaId, project, priority, status, type, dueDate, effort, energy, tagsText.split(",").map { it.trim() }.filter { it.isNotEmpty() }, recurrence, reminder, waitingOn, location, privacy, checklistText.split(",").map { it.trim() }.filter { it.isNotEmpty() }))
            }, enabled = title.trim().isNotEmpty()) { Text(if (editing) stringRes(R.string.save_changes) else stringRes(R.string.save_task)) }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text(stringRes(R.string.cancel)) } },
    )
}

@Composable
private fun ChoiceSection(label: String, selected: String, options: List<String>, onSelect: (String) -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(label, style = MaterialTheme.typography.labelLarge)
        options.chunked(3).forEach { row ->
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                row.forEach { option -> FilterChip(selected = option == selected, onClick = { onSelect(option) }, label = { Text(optionLabel(option), maxLines = 1, overflow = TextOverflow.Ellipsis) }) }
            }
        }
    }
}

@Composable
fun optionLabel(value: String): String = when (value) {
    "None" -> stringRes(R.string.option_none); "Low" -> stringRes(R.string.option_low); "Normal" -> stringRes(R.string.option_normal); "High" -> stringRes(R.string.option_high); "Urgent" -> stringRes(R.string.option_urgent)
    "Inbox" -> stringRes(R.string.option_inbox); "Next" -> stringRes(R.string.option_next); "In progress" -> stringRes(R.string.option_in_progress); "Waiting" -> stringRes(R.string.option_waiting); "Completed" -> stringRes(R.string.option_completed)
    "Action" -> stringRes(R.string.option_action); "Call" -> stringRes(R.string.option_call); "Email" -> stringRes(R.string.option_email); "Errand" -> stringRes(R.string.option_errand); "Meeting" -> stringRes(R.string.option_meeting); "Habit" -> stringRes(R.string.option_habit); "Decision" -> stringRes(R.string.option_decision); "Review" -> stringRes(R.string.option_review); "Other" -> stringRes(R.string.option_other)
    "Not set" -> stringRes(R.string.option_not_set); "5 min" -> stringRes(R.string.option_5_min); "15 min" -> stringRes(R.string.option_15_min); "30 min" -> stringRes(R.string.option_30_min); "1 hour" -> stringRes(R.string.option_1_hour); "2+ hours" -> stringRes(R.string.option_2_hours)
    "Low energy" -> stringRes(R.string.option_low_energy); "Normal energy" -> stringRes(R.string.option_normal_energy); "Deep focus" -> stringRes(R.string.option_deep_focus)
    "Daily" -> stringRes(R.string.option_daily); "Weekdays" -> stringRes(R.string.option_weekdays); "Weekly" -> stringRes(R.string.option_weekly); "Monthly" -> stringRes(R.string.option_monthly)
    "At due time" -> stringRes(R.string.option_at_due); "15 min before" -> stringRes(R.string.option_15_before); "1 hour before" -> stringRes(R.string.option_1_hour_before); "1 day before" -> stringRes(R.string.option_1_day_before)
    "Private" -> stringRes(R.string.option_private); "Personal" -> stringRes(R.string.option_personal); "Shared later" -> stringRes(R.string.option_shared_later)
    else -> value
}

@Composable
private fun AreaDialog(onDismiss: () -> Unit, onSave: (String) -> Unit) {
    var name by rememberSaveable { mutableStateOf("") }
    AlertDialog(onDismissRequest = onDismiss, title = { Text(stringRes(R.string.add_area)) }, text = { OutlinedTextField(name, { name = it }, Modifier.fillMaxWidth(), label = { Text(stringRes(R.string.area_name)) }, placeholder = { Text(stringRes(R.string.area_hint)) }) }, confirmButton = { Button(onClick = { onSave(name) }, enabled = name.trim().isNotEmpty()) { Text(stringRes(R.string.save_area)) } }, dismissButton = { TextButton(onClick = onDismiss) { Text(stringRes(R.string.cancel)) } })
}

@Composable
private fun AreaPicker(areas: List<WorkflowArea>, onDismiss: () -> Unit, onChoose: (String?) -> Unit) {
    AlertDialog(onDismissRequest = onDismiss, title = { Text(stringRes(R.string.choose_area)) }, text = { Column { TextButton(onClick = { onChoose(null) }, modifier = Modifier.fillMaxWidth()) { Text(stringRes(R.string.task_no_area)) }; areas.forEach { area -> TextButton(onClick = { onChoose(area.id) }, modifier = Modifier.fillMaxWidth()) { Text(area.name) } } } }, confirmButton = {}, dismissButton = { TextButton(onClick = onDismiss) { Text(stringRes(R.string.cancel)) } })
}

@Composable
private fun LanguageDialog(selectedTag: String, onSelect: (String) -> Unit, onDismiss: () -> Unit) {
    var query by rememberSaveable { mutableStateOf("") }
    val choices = previewLanguages.filter { it.nativeName.contains(query, true) || it.englishName.contains(query, true) || it.tag.contains(query, true) }
    AlertDialog(onDismissRequest = onDismiss, title = { Text(stringRes(R.string.choose_language)) }, text = { Column(verticalArrangement = Arrangement.spacedBy(8.dp)) { OutlinedTextField(query, { query = it }, Modifier.fillMaxWidth(), label = { Text(stringRes(R.string.language_search)) }); LazyColumn(Modifier.height(280.dp)) { items(choices, key = { it.tag }) { language -> TextButton(onClick = { onSelect(language.tag) }, modifier = Modifier.fillMaxWidth()) { Column(Modifier.fillMaxWidth()) { Text(language.nativeName, fontWeight = if (language.tag == selectedTag) FontWeight.Bold else FontWeight.Normal); Text(language.englishName, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant) } } } } } }, confirmButton = {}, dismissButton = { TextButton(onClick = onDismiss) { Text(stringRes(R.string.cancel)) } })
}

@Composable
private fun EmptyCard(title: String, body: String, action: (() -> Unit)? = null) {
    ElevatedCard(Modifier.fillMaxWidth()) { Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) { Text(title, style = MaterialTheme.typography.titleLarge); Text(body, color = MaterialTheme.colorScheme.onSurfaceVariant); if (action != null) OutlinedButton(onClick = action) { Text(stringRes(R.string.inbox)) } } }
}

@Composable
fun stringRes(id: Int, vararg args: Any): String = androidx.compose.ui.res.stringResource(id, *args)
