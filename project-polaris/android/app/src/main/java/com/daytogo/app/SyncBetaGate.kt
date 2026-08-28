package com.daytogo.app

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.syncBetaDataStore by preferencesDataStore(name = "daytodo_sync_beta")
private val syncBetaRequestedKey = booleanPreferencesKey("sync_beta_requested")

/**
 * Cloud sync remains disabled until the separately reviewed identity, authorization,
 * conflict, privacy, and staging controls are connected. This object deliberately has
 * no network client, credential, or activation path in the phone preview.
 */
class SyncBetaGate(private val context: Context) {
    val userRequested: Flow<Boolean> = context.syncBetaDataStore.data.map { preferences -> preferences[syncBetaRequestedKey] ?: false }
    val isEnabled: Boolean get() = false
    val disabledReason: String = "Secure backup and sync are not available in this preview."
}
