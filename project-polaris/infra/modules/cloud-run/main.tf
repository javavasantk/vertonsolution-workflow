variable "project_id" { type = string }
variable "region" { type = string }
variable "service_name" { type = string }
variable "runtime_service_account_id" { type = string }
variable "image" { type = string }
variable "min_instances" { type = number }
variable "max_instances" { type = number }
variable "labels" { type = map(string) }

resource "google_service_account" "runtime" {
  project      = var.project_id
  account_id   = var.runtime_service_account_id
  display_name = "Project Polaris Cloud Run runtime"
}

resource "google_cloud_run_v2_service" "api" {
  name     = var.service_name
  project  = var.project_id
  location = var.region
  labels   = var.labels

  template {
    service_account = google_service_account.runtime.email
    timeout         = "60s"
    max_instance_request_concurrency = 40

    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }

    containers {
      image = var.image

      ports {
        container_port = 3000
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      env {
        name  = "NODE_ENV"
        value = var.labels["environment"] == "production" ? "production" : "staging"
      }
      env {
        name  = "POLARIS_ASSISTANT_ENABLED"
        value = "false"
      }
      env {
        name  = "POLARIS_ANALYTICS_ENABLED"
        value = "false"
      }
    }
  }

  lifecycle {
    precondition {
      condition     = var.max_instances >= var.min_instances
      error_message = "max_instances must be at least min_instances."
    }
  }
}

output "service_name" {
  value = google_cloud_run_v2_service.api.name
}

output "runtime_service_account_email" {
  value = google_service_account.runtime.email
}
