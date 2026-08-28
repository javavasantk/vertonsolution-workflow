package com.daytogo.app

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle

@Composable
fun CalendarScreen(tasks: List<WorkflowTask>, areas: List<WorkflowArea>, onOpen: (WorkflowTask) -> Unit) {
    var mode by rememberSaveable { mutableStateOf("Day") }
    var anchorIso by rememberSaveable { mutableStateOf(LocalDate.now().toString()) }
    val anchor = runCatching { LocalDate.parse(anchorIso) }.getOrDefault(LocalDate.now())
    val dates = calendarDates(anchor, mode)
    val title = when (mode) {
        "Week" -> "${dates.first().format(DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM))} – ${dates.last().format(DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM))}"
        "Month" -> anchor.format(DateTimeFormatter.ofPattern("LLLL uuuu"))
        else -> anchor.format(DateTimeFormatter.ofLocalizedDate(FormatStyle.FULL))
    }
    val step = when (mode) { "Month" -> 1L; "Week" -> 7L; else -> 1L }
    val newAnchor = { amount: Long -> anchorIso = if (mode == "Month") anchor.plusMonths(amount).toString() else anchor.plusDays(amount * step).toString() }
    val tasksByDate = tasks.filterNot { it.archived }.mapNotNull { task -> parseDueDate(task.dueDate)?.toLocalDate()?.let { it to task } }.groupBy({ it.first }, { it.second })

    LazyColumn(modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Spacer(Modifier.height(6.dp))
            Text(stringRes(R.string.calendar), style = MaterialTheme.typography.headlineMedium, modifier = Modifier.semantics { heading() })
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.padding(top = 8.dp)) {
                listOf("Day" to R.string.calendar_day, "Week" to R.string.calendar_week, "Month" to R.string.calendar_month).forEach { (value, label) -> FilterChip(selected = mode == value, onClick = { mode = value }, label = { Text(stringRes(label)) }) }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(top = 8.dp)) {
                TextButton(onClick = { newAnchor(-1L) }) { Text(stringRes(R.string.calendar_previous)) }
                Text(title, modifier = Modifier.weight(1f).padding(top = 12.dp), style = MaterialTheme.typography.titleMedium)
                TextButton(onClick = { newAnchor(1L) }) { Text(stringRes(R.string.calendar_next)) }
            }
        }
        items(dates, key = { it.toString() }) { date ->
            val dueTasks = tasksByDate[date].orEmpty().sortedBy { parseDueDate(it.dueDate) }
            ElevatedCard(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(date.format(DateTimeFormatter.ofLocalizedDate(FormatStyle.FULL)), style = MaterialTheme.typography.titleMedium)
                    if (dueTasks.isEmpty()) Text(stringRes(R.string.calendar_no_tasks), color = MaterialTheme.colorScheme.onSurfaceVariant)
                    else dueTasks.forEach { task ->
                        TextButton(onClick = { onOpen(task) }, modifier = Modifier.fillMaxWidth()) {
                            Column(Modifier.fillMaxWidth()) {
                                Text(task.title, style = MaterialTheme.typography.bodyLarge)
                                val time = parseDueDate(task.dueDate)?.format(DateTimeFormatter.ofPattern("HH:mm")) ?: task.dueDate
                                val area = areas.firstOrNull { it.id == task.areaId }?.name
                                Text(listOfNotNull(stringRes(R.string.calendar_due_at, time), area, optionLabel(task.type)).joinToString(" · "), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    }
                }
            }
        }
        item { Spacer(Modifier.height(88.dp)) }
    }
}

private fun calendarDates(anchor: LocalDate, mode: String): List<LocalDate> = when (mode) {
    "Week" -> {
        val start = anchor.minusDays((anchor.dayOfWeek.value - DayOfWeek.MONDAY.value).toLong())
        (0L..6L).map { start.plusDays(it) }
    }
    "Month" -> {
        val start = anchor.withDayOfMonth(1)
        (0 until start.lengthOfMonth()).map { start.plusDays(it.toLong()) }
    }
    else -> listOf(anchor)
}
