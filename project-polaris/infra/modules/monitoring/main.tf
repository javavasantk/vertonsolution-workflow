variable "project_id" { type = string }
variable "environment" { type = string }
variable "cloud_run_service_name" { type = string }
variable "notification_channel_names" { type = list(string) }
variable "labels" { type = map(string) }

locals {
  filters = {
    request_count = "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"${var.cloud_run_service_name}\""
    request_error = "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"${var.cloud_run_service_name}\" AND metric.label.response_code_class=\"5xx\""
  }
}

resource "google_monitoring_alert_policy" "api_errors" {
  display_name = "Project Polaris ${var.environment}: elevated API errors"
  project      = var.project_id
  combiner     = "OR"
  notification_channels = var.notification_channel_names

  conditions {
    display_name = "Cloud Run 5xx response count"
    condition_threshold {
      filter          = local.filters.request_error
      comparison      = "COMPARISON_GT"
      threshold_value = 5
      duration        = "300s"

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_RATE"
      }
    }
  }

  documentation {
    content   = "Use the Project Polaris API incident runbook. Do not paste user content, tokens, prompts, or export URLs into an incident."
    mime_type = "text/markdown"
  }
}

resource "google_monitoring_alert_policy" "api_unavailable" {
  display_name = "Project Polaris ${var.environment}: Cloud Run request absence"
  project      = var.project_id
  combiner     = "OR"
  notification_channels = var.notification_channel_names

  conditions {
    display_name = "No observed request traffic to readiness endpoint"
    condition_absent {
      filter   = local.filters.request_count
      duration = "900s"
      aggregations {
        alignment_period = "60s"
      }
    }
  }

  documentation {
    content   = "Check Cloud Run revision health and safe readiness diagnostics. Preserve local-first client behavior while investigating."
    mime_type = "text/markdown"
  }
}
