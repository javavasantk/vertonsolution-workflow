#!/usr/bin/env bash
set -euo pipefail

: "${GOOGLE_CLOUD_PROJECT:?Set GOOGLE_CLOUD_PROJECT through protected CI configuration.}"
: "${GOOGLE_CLOUD_REGION:?Set GOOGLE_CLOUD_REGION through protected CI configuration.}"
: "${BACKEND_IMAGE_DIGEST:?Set BACKEND_IMAGE_DIGEST to an immutable Artifact Registry digest.}"

if [[ "${POLARIS_DEPLOY_ENVIRONMENT:-}" != "staging" ]]; then
  echo "This script only supports staging. Production promotion requires its protected workflow."
  exit 2
fi

if [[ -n "${GOOGLE_APPLICATION_CREDENTIALS:-}" ]]; then
  echo "Long-lived local service-account key files are not accepted by this deployment entry point."
  exit 2
fi

cd "$(dirname "$0")/../infra"
terraform init
terraform plan \
  -var="project_id=${GOOGLE_CLOUD_PROJECT}" \
  -var="environment=staging" \
  -var="region=${GOOGLE_CLOUD_REGION}" \
  -var="backend_image=${BACKEND_IMAGE_DIGEST}"

echo "Review the Terraform plan in protected CI before apply."
echo "Run synthetic health/auth/assistant/privacy smoke tests after approved deployment."
