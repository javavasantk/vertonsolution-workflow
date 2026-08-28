package com.projectpolaris.app

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp

@Composable
fun TaskDetailsDialog(
    task: WorkflowTask,
    areas: List<WorkflowArea>,
    onDismiss: () -> Unit,
    onChecklistToggle: (Int) -> Unit,
    onEdit: () -> Unit,
) {
    val areaName = areas.firstOrNull { it.id == task.areaId }?.name ?: stringRes(R.string.task_no_area)
    val visibleDetails = listOf(
        stringRes(R.string.task_area) to areaName,
        stringRes(R.string.project) to task.project,
        stringRes(R.string.priority) to optionLabel(task.priority),
        stringRes(R.string.status) to optionLabel(task.status),
        stringRes(R.string.task_type) to optionLabel(task.type),
        stringRes(R.string.due_date) to task.dueDate,
        stringRes(R.string.effort) to optionLabel(task.effort),
        stringRes(R.string.energy) to optionLabel(task.energy),
        stringRes(R.string.tags) to task.tags.joinToString(", "),
        stringRes(R.string.recurrence) to optionLabel(task.recurrence),
        stringRes(R.string.reminder) to optionLabel(task.reminder),
        stringRes(R.string.waiting_on) to task.waitingOn,
        stringRes(R.string.location) to task.location,
        stringRes(R.string.privacy_label) to optionLabel(task.privacy),
    ).filter { it.second.isNotBlank() && it.second != stringRes(R.string.option_none) && it.second != stringRes(R.string.option_not_set) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(task.title, modifier = Modifier.semantics { heading() }) },
        text = {
            LazyColumn(modifier = Modifier.height(420.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                if (task.notes.isNotBlank()) item {
                    Text(stringRes(R.string.notes), style = MaterialTheme.typography.labelLarge)
                    Text(task.notes)
                }
                visibleDetails.forEach { (label, value) -> item {
                    Text(label, style = MaterialTheme.typography.labelLarge)
                    Text(value)
                } }
                if (task.checklist.isNotEmpty()) {
                    item { Text(stringRes(R.string.checklist), style = MaterialTheme.typography.labelLarge) }
                    items(task.checklist.size) { index ->
                        FilterChip(
                            selected = index in task.completedChecklistIndexes,
                            onClick = { onChecklistToggle(index) },
                            label = { Text(task.checklist[index]) },
                            modifier = Modifier.fillMaxWidth(),
                        )
                    }
                }
            }
        },
        confirmButton = { TextButton(onClick = onEdit) { Text(stringRes(R.string.edit_task)) } },
        dismissButton = { TextButton(onClick = onDismiss) { Text(stringRes(R.string.close)) } },
    )
}
