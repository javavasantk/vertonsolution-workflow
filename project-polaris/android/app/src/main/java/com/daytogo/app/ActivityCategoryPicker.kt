package com.daytogo.app

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp

@Composable
fun ActivityCategoryPicker(selected: String, onSelect: (String) -> Unit) {
    var open by rememberSaveable { mutableStateOf(false) }
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(stringRes(R.string.activity_category), style = MaterialTheme.typography.labelLarge)
        OutlinedButton(onClick = { open = true }, modifier = Modifier.fillMaxWidth()) { Text(optionLabel(selected), maxLines = 1, overflow = TextOverflow.Ellipsis) }
    }
    if (open) ActivityCategoryDialog(selected, { category -> onSelect(category); open = false }, { open = false })
}

@Composable
private fun ActivityCategoryDialog(selected: String, onSelect: (String) -> Unit, onDismiss: () -> Unit) {
    var search by rememberSaveable { mutableStateOf("") }
    val categories = TaskOptions.types.filter { it.contains(search, ignoreCase = true) }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(stringRes(R.string.choose_activity_category)) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(search, { search = it }, modifier = Modifier.fillMaxWidth(), label = { Text(stringRes(R.string.category_search)) }, singleLine = true)
                LazyColumn(modifier = Modifier.height(330.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    items(categories, key = { it }) { category ->
                        FilterChip(selected = category == selected, onClick = { onSelect(category) }, label = { Text(optionLabel(category)) }, modifier = Modifier.fillMaxWidth().padding(vertical = 1.dp))
                    }
                }
            }
        },
        confirmButton = {},
        dismissButton = { TextButton(onClick = onDismiss) { Text(stringRes(R.string.cancel)) } },
    )
}
