locals {
  service_name = "project-polaris-api-${var.environment}"
  labels = {
    application = "project-polaris"
    environment = var.environment
    managed_by  = "terraform"
  }
}

module "cloud_run" {
  source = "./modules/cloud-run"

  project_id                 = var.project_id
  region                     = var.region
  service_name               = local.service_name
  runtime_service_account_id = var.runtime_service_account_id
  image                      = var.backend_image
  min_instances              = var.min_instances
  max_instances              = var.max_instances
  labels                     = local.labels
}

module "monitoring" {
  source = "./modules/monitoring"

  project_id                    = var.project_id
  environment                   = var.environment
  cloud_run_service_name         = module.cloud_run.service_name
  notification_channel_names     = var.alert_notification_channels
  labels                         = local.labels
}
