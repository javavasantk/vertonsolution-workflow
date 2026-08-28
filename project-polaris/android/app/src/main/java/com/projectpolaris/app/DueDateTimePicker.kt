package com.projectpolaris.app

import android.app.DatePickerDialog
import android.app.TimePickerDialog
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.util.Calendar

private val dueFormat: DateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")

fun parseDueDate(value: String): LocalDateTime? = runCatching { LocalDateTime.parse(value, dueFormat) }.getOrNull()
fun formatDueDate(value: LocalDateTime): String = value.format(dueFormat)

@Composable
fun DueDateTimePicker(value: String, onValueChange: (String) -> Unit) {
    val context = androidx.compose.ui.platform.LocalContext.current
    val selected = remember(value) { parseDueDate(value) }
    val seed = selected ?: LocalDateTime.now().withSecond(0).withNano(0)
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(stringRes(R.string.due_date_time), style = androidx.compose.material3.MaterialTheme.typography.labelLarge)
        Text(if (value.isBlank()) stringRes(R.string.no_due_date_time) else value)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedButton(onClick = {
                DatePickerDialog(context, { _, year, month, day ->
                    TimePickerDialog(context, { _, hour, minute ->
                        onValueChange(formatDueDate(LocalDateTime.of(year, month + 1, day, hour, minute)))
                    }, seed.hour, seed.minute, android.text.format.DateFormat.is24HourFormat(context)).show()
                }, seed.year, seed.monthValue - 1, seed.dayOfMonth).show()
            }) { Text(stringRes(R.string.choose_due_date_time)) }
            if (value.isNotBlank()) OutlinedButton(onClick = { onValueChange("") }) { Text(stringRes(R.string.clear_due_date_time)) }
        }
    }
}
