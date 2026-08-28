package com.daytogo.app

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.work.CoroutineWorker
import androidx.work.Data
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.concurrent.TimeUnit

private const val REMINDER_CHANNEL_ID = "polaris_task_reminders"

class ReminderWorker(appContext: Context, params: WorkerParameters) : CoroutineWorker(appContext, params) {
    override suspend fun doWork(): Result {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && ContextCompat.checkSelfPermission(applicationContext, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return Result.success()
        val hour = LocalDateTime.now().hour
        if (hour < 8 || hour >= 21) return Result.success()
        createChannel(applicationContext)
        val notification = NotificationCompat.Builder(applicationContext, REMINDER_CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_popup_reminder)
            .setContentTitle(applicationContext.getString(R.string.reminder_notification_title))
            .setContentText(applicationContext.getString(R.string.reminder_notification_body))
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)
            .build()
        runCatching { NotificationManagerCompat.from(applicationContext).notify(inputData.getString("task_id")?.hashCode() ?: 0, notification) }
        return Result.success()
    }

    private fun createChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(REMINDER_CHANNEL_ID, context.getString(R.string.reminder_channel_name), NotificationManager.IMPORTANCE_DEFAULT).apply {
                description = context.getString(R.string.reminder_channel_description)
            }
            context.getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
    }
}

fun notificationsAllowed(context: Context): Boolean = Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU || ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED

fun scheduleTaskReminder(context: Context, task: WorkflowTask): Boolean {
    if (task.reminder == "None") return false
    val due = runCatching { LocalDateTime.parse(task.dueDate.trim(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")) }.getOrNull() ?: return false
    val minutesBefore = when (task.reminder) { "At due time" -> 0L; "15 min before" -> 15L; "1 hour before" -> 60L; "1 day before" -> 1_440L; else -> return false }
    val scheduledMillis = due.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli() - TimeUnit.MINUTES.toMillis(minutesBefore)
    val delay = scheduledMillis - System.currentTimeMillis()
    if (delay <= 0L) return false
    val request = OneTimeWorkRequestBuilder<ReminderWorker>().setInitialDelay(delay, TimeUnit.MILLISECONDS).setInputData(Data.Builder().putString("task_id", task.id).build()).build()
    WorkManager.getInstance(context).enqueueUniqueWork("daytodo-reminder-${task.id}", ExistingWorkPolicy.REPLACE, request)
    return true
}

fun scheduleReminderTest(context: Context) {
    val request = OneTimeWorkRequestBuilder<ReminderWorker>().setInitialDelay(30, TimeUnit.SECONDS).setInputData(Data.Builder().putString("task_id", "test").build()).build()
    WorkManager.getInstance(context).enqueueUniqueWork("daytodo-reminder-test", ExistingWorkPolicy.REPLACE, request)
}
