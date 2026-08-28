package com.projectpolaris.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    PolarisFoundationScreen()
                }
            }
        }
    }
}

@Composable
private fun PolarisFoundationScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp),
    ) {
        Text(
            text = stringResource(R.string.assistant_title),
            style = MaterialTheme.typography.headlineMedium,
            modifier = Modifier.semantics { heading() },
        )
        AssistantDisclosureCard()
        PrivacyDashboardCard()
    }
}

@Composable
private fun AssistantDisclosureCard() {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text(
            text = stringResource(R.string.assistant_disclosure_title),
            style = MaterialTheme.typography.titleLarge,
            modifier = Modifier.semantics { heading() },
        )
        Text(text = stringResource(R.string.assistant_disclosure_before_send))
        OutlinedButton(
            onClick = {},
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(stringResource(R.string.assistant_not_now))
        }
        Button(
            onClick = {},
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(stringResource(R.string.assistant_continue))
        }
    }
}

@Composable
private fun PrivacyDashboardCard() {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(
            text = stringResource(R.string.privacy_dashboard_title),
            style = MaterialTheme.typography.titleLarge,
            modifier = Modifier.semantics { heading() },
        )
        Text(stringResource(R.string.privacy_local_workspace))
        Text(stringResource(R.string.privacy_ai))
        Text(stringResource(R.string.privacy_analytics))
        OutlinedButton(onClick = {}, modifier = Modifier.fillMaxWidth()) {
            Text(stringResource(R.string.privacy_export))
        }
        OutlinedButton(onClick = {}, modifier = Modifier.fillMaxWidth()) {
            Text(stringResource(R.string.privacy_delete))
        }
    }
}
