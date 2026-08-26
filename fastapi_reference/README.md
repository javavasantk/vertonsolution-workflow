# Future FastAPI Service Reference

This folder is a **future migration reference**. It is not started by the deployed Workforce Hub application, which remains on the current managed Node backend to avoid a monthly runtime charge.

The reference service exposes a constrained FastAPI implementation of the AI-assistance boundary. It verifies a gateway-issued internal JWT, applies role checks before invoking the model, bounds supplied operational context to 1,600 characters, and explicitly disallows automated work-authorization eligibility decisions.

## Included API contract

| Endpoint | Purpose | Access boundary |
|---|---|---|
| `GET /health` | Basic service health response | Public service probe only |
| `GET /api/access/summary` | Administrator access-management boundary | Administrator-only JWT scope |
| `GET /api/profile/me` | Employee self-service readiness-profile boundary | JWT subject is the only profile target |
| `GET /api/onboarding/me` | Employee onboarding-task boundary | JWT subject is the only task target |
| `GET /api/recruiting/progress` | Recruiter onboarding and assignment-progress boundary | Recruiter or administrator JWT scope |
| `POST /api/ai/assist` | Recruiter handoff, onboarding, or access-review briefing | JWT-authenticated; task-level role enforcement |

## Local reference setup

Create a Python environment outside the project deployment flow, install the requirements, then run the service locally.

```bash
cd fastapi_reference
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
export FASTAPI_INTERNAL_JWT_SECRET='development-only-secret'
export BUILT_IN_FORGE_API_URL='https://...'
export BUILT_IN_FORGE_API_KEY='...'
uvicorn app.main:app --reload --port 8001
```

The production gateway must issue short-lived HS256 internal JWTs with the following claims: `sub`, `role`, `aud=verton-fastapi`, `iss=verton-workforce-hub`, and `exp`. Do **not** forward browser-supplied role headers to this service. The non-AI routes return `reference_mode: true` until their database adapters are connected in a dedicated FastAPI deployment; the response schemas and server-side role checks are the migration contract.

## Migration path

1. Provision a Python-capable runtime independently from the current no-monthly-cost deployment.
2. Put the FastAPI service behind the authenticated Workforce Hub gateway.
3. Issue signed, short-lived internal JWTs only after the existing login service has validated the user session.
4. Point the frontend’s AI client to the gateway proxy, not directly to FastAPI or the AI provider.
5. Move one protected API domain at a time and keep authorization parity tests for each route.

> The reference service is intentionally conservative: it handles operational writing assistance only, retains no document bytes, and does not make legal, immigration, or work-authorization eligibility decisions.
