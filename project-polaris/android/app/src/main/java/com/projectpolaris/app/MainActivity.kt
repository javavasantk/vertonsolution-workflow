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
        setContent {
            val store = remember { WorkflowStore(applicationContext) }
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

enum class AppTab { TODAY, INBOX, PLAN, FOCUS, SETTINGS, PRIVACY, POLARIS }

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
    var taskForArea by remember { mutableStateOf<WorkflowTask?>(null) }
    var taskForDelete by remember { mutableStateOf<WorkflowTask?>(null) }
    val taskAdded = stringRes(R.string.task_added)
    val taskUpdated = stringRes(R.string.task_completed)
    val planUpdated = stringRes(R.string.task_planned)
    val areaUpdated = stringRes(R.string.area_updated)
    val taskDeleted = stringRes(R.string.task_deleted)

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
                    onArea = { taskForArea = it }, onDelete = { taskForDelete = it })
                AppTab.INBOX -> InboxScreen(state.tasks, state.areas,
                    onComplete = { task, value -> store.complete(task.id, value) }, onPlan = { store.togglePlan(it.id) },
                    onFocus = { task -> store.startFocus(task.id, 25); tabName = AppTab.FOCUS.name },
                    onArea = { taskForArea = it }, onDelete = { taskForDelete = it })
                AppTab.PLAN -> PlanScreen(state.tasks, state.areas, onToggle = { store.togglePlan(it.id) }, onFocus = { task -> store.startFocus(task.id, 25); tabName = AppTab.FOCUS.name })
                AppTab.FOCUS -> FocusScreen(state.tasks.filterNot { it.completed }, state.focusTaskId, state.focusEndsAtMillis, store::startFocus, store::endFocus, { tabName = AppTab.INBOX.name })
                AppTab.SETTINGS -> SettingsScreen(store, { tabName = AppTab.PRIVACY.name }, { message -> scope.launch { snackbars.showSnackbar(message) } })
                AppTab.PRIVACY -> PrivacyScreen { message -> scope.launch { snackbars.showSnackbar(message) } }
                AppTab.POLARIS -> PolarisPreviewScreen(state.tasks.filterNot { it.completed }) { title ->
                    store.addTask(title, null)
                    scope.launch { snackbars.showSnackbar(taskAdded) }
                }
            }
        }
    }
    if (addTask) {
        TaskDialog(state.areas, { addTask = false }) { title, areaId ->
            store.addTask(title, areaId)
            addTask = false
            scope.launch { snackbars.showSnackbar(taskAdded) }
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
        AppTab.TODAY -> stringRes(R.string.today); AppTab.INBOX -> stringRes(R.string.inbox); AppTab.PLAN -> stringRes(R.string.plan)
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
    val items = listOf(AppTab.TODAY to stringRes(R.string.today), AppTab.INBOX to stringRes(R.string.inbox), AppTab.PLAN to stringRes(R.string.plan), AppTab.FOCUS to stringRes(R.string.focus), AppTab.SETTINGS to stringRes(R.string.settings))
    NavigationBar {
        items.forEach { (target, label) ->
            NavigationBarItem(selected = current == target, onClick = { onSelect(target) }, icon = { Box(Modifier.size(1.dp)) }, label = { Text(label, maxLines = 1, overflow = TextOverflow.Ellipsis) })
        }
    }
}

@Composable
private fun TodayScreen(tasks: List<WorkflowTask>, areas: List<WorkflowArea>, onComplete: (WorkflowTask, Boolean) -> Unit, onPlan: (WorkflowTask) -> Unit, onFocus: (WorkflowTask) -> Unit, onArea: (WorkflowTask) -> Unit, onDelete: (WorkflowTask) -> Unit) {
    val today = tasks.filter { it.plannedForToday && !it.completed }
    LazyColumn(modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item { Spacer(Modifier.height(6.dp)); Text(stringRes(R.string.preview_badge), style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.secondary); Text(stringRes(R.string.today), style = MaterialTheme.typography.headlineMedium, modifier = Modifier.semantics { heading() }) }
        if (today.isEmpty()) item { EmptyCard(stringRes(R.string.empty_today_title), stringRes(R.string.empty_today_body)) }
        else items(today, key = { it.id }) { TaskCard(it, areas, onComplete, onPlan, onFocus, onArea, onDelete) }
        item { Spacer(Modifier.height(88.dp)) }
    }
}

@Composable
private fun InboxScreen(tasks: List<WorkflowTask>, areas: List<WorkflowArea>, onComplete: (WorkflowTask, Boolean) -> Unit, onPlan: (WorkflowTask) -> Unit, onFocus: (WorkflowTask) -> Unit, onArea: (WorkflowTask) -> Unit, onDelete: (WorkflowTask) -> Unit) {
    LazyColumn(modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item { Spacer(Modifier.height(6.dp)); Text(stringRes(R.string.inbox), style = MaterialTheme.typography.headlineMedium, modifier = Modifier.semantics { heading() }); Text(stringRes(R.string.empty_inbox_body), color = MaterialTheme.colorScheme.onSurfaceVariant) }
        if (tasks.isEmpty()) item { EmptyCard(stringRes(R.string.empty_inbox_title), stringRes(R.string.empty_inbox_body)) }
        else items(tasks, key = { it.id }) { TaskCard(it, areas, onComplete, onPlan, onFocus, onArea, onDelete) }
        item { Spacer(Modifier.height(88.dp)) }
    }
}

@Composable
private fun TaskCard(task: WorkflowTask, areas: List<WorkflowArea>, onComplete: (WorkflowTask, Boolean) -> Unit, onPlan: (WorkflowTask) -> Unit, onFocus: (WorkflowTask) -> Unit, onArea: (WorkflowTask) -> Unit, onDelete: (WorkflowTask) -> Unit) {
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
                }
            }
            if (!task.completed) Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(selected = task.plannedForToday, onClick = { onPlan(task) }, label = { Text(if (task.plannedForToday) stringRes(R.string.task_remove_plan) else stringRes(R.string.task_plan_today)) })
                FilterChip(selected = false, onClick = { onFocus(task) }, label = { Text(stringRes(R.string.task_focus)) })
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                TextButton(onClick = { onArea(task) }) { Text(stringRes(R.string.assign_area)) }
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
private fun SettingsScreen(store: WorkflowStore, onPrivacy: () -> Unit, onNotice: (String) -> Unit) {
    var languages by rememberSaveable { mutableStateOf(false) }
    var areas by rememberSaveable { mutableStateOf(false) }
    val state = store.snapshot
    val selectedLanguage = previewLanguages.firstOrNull { it.tag == state.localeTag }?.nativeName ?: state.localeTag
    val languageSaved = stringRes(R.string.language_saved)
    val areaSaved = stringRes(R.string.area_added)
    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item { Text(stringRes(R.string.settings_title), style = MaterialTheme.typography.headlineMedium, modifier = Modifier.semantics { heading() }) }
        item { SettingCard(stringRes(R.string.settings_language), stringRes(R.string.selected_language, selectedLanguage)) { OutlinedButton(onClick = { languages = true }, modifier = Modifier.fillMaxWidth()) { Text(stringRes(R.string.choose_language)) } } }
        item { SettingCard(stringRes(R.string.settings_theme), "") { Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) { Text(stringRes(R.string.settings_theme), Modifier.weight(1f)); Switch(state.darkTheme, store::setDarkTheme) } } }
        item { SettingCard(stringRes(R.string.areas_title), "") { OutlinedButton(onClick = { areas = true }, modifier = Modifier.fillMaxWidth()) { Text(stringRes(R.string.add_area)) }; state.areas.forEach { Text(it.name, Modifier.padding(top = 6.dp)) } } }
        item { SettingCard(stringRes(R.string.settings_backup), stringRes(R.string.settings_backup_body)) { } }
        item { SettingCard(stringRes(R.string.settings_reminders), stringRes(R.string.settings_reminders_body)) { } }
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
private fun PrivacyScreen(onNotice: (String) -> Unit) {
    val exportMessage = stringRes(R.string.privacy_export_unavailable)
    val deleteMessage = stringRes(R.string.privacy_delete_unavailable)
    Column(modifier = Modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text(stringRes(R.string.privacy_title), style = MaterialTheme.typography.headlineMedium, modifier = Modifier.semantics { heading() })
        ElevatedCard(Modifier.fillMaxWidth()) { Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) { Text(stringRes(R.string.device_only), style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.secondary); Text(stringRes(R.string.privacy_local)); Text(stringRes(R.string.privacy_ai)); Text(stringRes(R.string.privacy_analytics)) } }
        OutlinedButton(onClick = { onNotice(exportMessage) }, modifier = Modifier.fillMaxWidth().height(52.dp)) { Text(stringRes(R.string.privacy_export)) }
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
private fun TaskDialog(areas: List<WorkflowArea>, onDismiss: () -> Unit, onSave: (String, String?) -> Unit) {
    var title by rememberSaveable { mutableStateOf("") }; var areaId by rememberSaveable { mutableStateOf<String?>(null) }
    AlertDialog(onDismissRequest = onDismiss, title = { Text(stringRes(R.string.add_task)) }, text = {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            OutlinedTextField(title, { title = it }, Modifier.fillMaxWidth(), label = { Text(stringRes(R.string.task_label)) }, placeholder = { Text(stringRes(R.string.task_hint)) })
            areas.forEach { area -> FilterChip(selected = areaId == area.id, onClick = { areaId = if (areaId == area.id) null else area.id }, label = { Text(area.name) }) }
        }
    }, confirmButton = { Button(onClick = { onSave(title, areaId) }, enabled = title.trim().isNotEmpty()) { Text(stringRes(R.string.save_task)) } }, dismissButton = { TextButton(onClick = onDismiss) { Text(stringRes(R.string.cancel)) } })
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
private fun stringRes(id: Int, vararg args: Any): String = androidx.compose.ui.res.stringResource(id, *args)
