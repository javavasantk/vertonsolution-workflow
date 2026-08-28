variable "project_id" {
  description = "Google Cloud project ID for this isolated environment."
  type        = string
}

variable "environment" {
  description = "Deployment environment label."
  type        = string
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}

variable "region" {
  description = "Google Cloud region selected under the approved data residency plan."
  type        = string
}

variable "backend_image" {
  description = "Immutable Artifact Registry image digest for the backend."
  type        = string
}

variable "runtime_service_account_id" {
  description = "Short service-account ID for the Cloud Run runtime."
  type        = string
  default     = "polaris-api-runtime"
}

variable "min_instances" {
  description = "Reviewed minimum Cloud Run instances for the environment."
  type        = number
  default     = 0
}

variable "max_instances" {
  description = "Reviewed maximum Cloud Run instances for the environment."
  type        = number
  default     = 5
}

variable "alert_notification_channels" {
  description = "Pre-provisioned monitoring notification-channel resource names."
  type        = list(string)
  default     = []
}
