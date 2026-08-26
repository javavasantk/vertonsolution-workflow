"""Future FastAPI reference service for Verton Workforce Hub.

This module is intentionally not started by the deployed application. It documents
the Python API boundary for a future dedicated FastAPI runtime while the current
no-monthly-cost site continues to use its managed Node backend.
"""

from __future__ import annotations

import os
from enum import StrEnum
from typing import Any

import httpx
import jwt
from fastapi import Depends, FastAPI, Header, HTTPException, status
from pydantic import BaseModel, Field


class WorkforceRole(StrEnum):
    ADMIN = "admin"
    RECRUITER = "recruiter"
    HR_COMPLIANCE = "hr_compliance"
    ACCOUNT_MANAGER = "account_manager"
    DELIVERY_MANAGER = "delivery_manager"
    PROJECT_MANAGER = "project_manager"
    FINANCE = "finance"
    CONSULTANT = "consultant"


class AiTask(StrEnum):
    RECRUITER_SUMMARY = "recruiter_summary"
    ONBOARDING_GUIDANCE = "onboarding_guidance"
    ACCESS_REVIEW = "access_review"


class Principal(BaseModel):
    user_id: int
    role: WorkforceRole


class AiAssistRequest(BaseModel):
    task: AiTask
    context: str = Field(min_length=12, max_length=1600)


class AiAssistResponse(BaseModel):
    briefing: str
    task: AiTask
    model: str


class AccessSummaryResponse(BaseModel):
    reference_mode: bool = True
    permission_group_count: int = 8
    user_count: int = 0
    recent_role_change_count: int = 0


class EmployeeProfileResponse(BaseModel):
    reference_mode: bool = True
    user_id: int
    review_state: str = "not_started"
    notice: str = "The future adapter retrieves status metadata only; it does not store documents or decide eligibility."


class OnboardingTaskResponse(BaseModel):
    task: str
    completed: bool
    owner: str


class OnboardingResponse(BaseModel):
    reference_mode: bool = True
    user_id: int
    tasks: list[OnboardingTaskResponse] = []


class RecruiterProgressRecord(BaseModel):
    onboarding_stage: str
    progress_percent: int = Field(ge=0, le=100)
    manager_confirmed: bool
    assignment_state: str
    readiness_signal: str


class RecruiterProgressResponse(BaseModel):
    reference_mode: bool = True
    records: list[RecruiterProgressRecord] = []


SYSTEM_PROMPT = (
    "You are Verton Workforce Hub's operational writing assistant. Produce a short, "
    "practical briefing using only the supplied context. Do not make legal, immigration, "
    "or work-authorization eligibility decisions. Do not request documents or infer "
    "authorization status. Use clear headings: Summary, Human follow-up, Boundary."
)

TASK_INSTRUCTIONS: dict[AiTask, str] = {
    AiTask.RECRUITER_SUMMARY: (
        "Create a concise recruiter handoff summary from supplied onboarding and assignment "
        "signals. Prioritize human follow-up actions."
    ),
    AiTask.ONBOARDING_GUIDANCE: (
        "Create practical onboarding guidance for the signed-in employee based only on supplied "
        "task context. Suggest a human owner for each follow-up."
    ),
    AiTask.ACCESS_REVIEW: (
        "Create a concise administrator access-review briefing from supplied role and audit context. "
        "Identify governance follow-ups without changing or recommending automatic permissions."
    ),
}

app = FastAPI(title="Verton Workforce Hub FastAPI Reference", version="0.1.0")


def can_use_task(role: WorkforceRole, task: AiTask) -> bool:
    if task is AiTask.RECRUITER_SUMMARY:
        return role in {WorkforceRole.ADMIN, WorkforceRole.RECRUITER}
    if task is AiTask.ACCESS_REVIEW:
        return role is WorkforceRole.ADMIN
    return True


def require_administrator(principal: Principal) -> None:
    if principal.role is not WorkforceRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Administrator access required")


def require_recruiting_scope(principal: Principal) -> None:
    if principal.role not in {WorkforceRole.ADMIN, WorkforceRole.RECRUITER}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Recruiter or administrator access required")


def read_principal(authorization: str = Header(...)) -> Principal:
    """Verify a gateway-issued internal JWT; never trust browser-supplied role headers."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Bearer token required")

    secret = os.environ.get("FASTAPI_INTERNAL_JWT_SECRET")
    if not secret:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="FastAPI JWT validation is not configured")

    try:
        payload = jwt.decode(
            authorization.removeprefix("Bearer "),
            secret,
            algorithms=["HS256"],
            audience="verton-fastapi",
            issuer="verton-workforce-hub",
            options={"require": ["sub", "role", "aud", "iss", "exp"]},
        )
        return Principal(user_id=int(payload["sub"]), role=WorkforceRole(payload["role"]))
    except (jwt.PyJWTError, ValueError, KeyError) as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid internal access token") from error


async def call_managed_model(task: AiTask, context: str) -> tuple[str, str]:
    api_url = os.environ.get("BUILT_IN_FORGE_API_URL", "").rstrip("/")
    api_key = os.environ.get("BUILT_IN_FORGE_API_KEY")
    if not api_url or not api_key:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Managed AI service is not configured")

    model = os.environ.get("VERTON_AI_MODEL", "claude-haiku-4-5")
    payload: dict[str, Any] = {
        "model": model,
        "max_tokens": 500,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"{TASK_INSTRUCTIONS[task]}\n\nContext:\n{context}"},
        ],
    }
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                f"{api_url}/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json=payload,
            )
            response.raise_for_status()
    except httpx.HTTPError as error:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Managed AI service is unavailable") from error

    body = response.json()
    briefing = body.get("choices", [{}])[0].get("message", {}).get("content")
    if not isinstance(briefing, str) or not briefing.strip():
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Managed AI service returned no briefing")
    return briefing, str(body.get("model", model))


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "verton-fastapi-reference"}


@app.get("/api/access/summary", response_model=AccessSummaryResponse)
async def access_summary(principal: Principal = Depends(read_principal)) -> AccessSummaryResponse:
    require_administrator(principal)
    return AccessSummaryResponse()


@app.get("/api/profile/me", response_model=EmployeeProfileResponse)
async def employee_profile(principal: Principal = Depends(read_principal)) -> EmployeeProfileResponse:
    return EmployeeProfileResponse(user_id=principal.user_id)


@app.get("/api/onboarding/me", response_model=OnboardingResponse)
async def onboarding(principal: Principal = Depends(read_principal)) -> OnboardingResponse:
    return OnboardingResponse(user_id=principal.user_id)


@app.get("/api/recruiting/progress", response_model=RecruiterProgressResponse)
async def recruiter_progress(principal: Principal = Depends(read_principal)) -> RecruiterProgressResponse:
    require_recruiting_scope(principal)
    return RecruiterProgressResponse()


@app.post("/api/ai/assist", response_model=AiAssistResponse)
async def ai_assist(request: AiAssistRequest, principal: Principal = Depends(read_principal)) -> AiAssistResponse:
    if not can_use_task(principal.role, request.task):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="AI workspace unavailable for assigned role")

    briefing, model = await call_managed_model(request.task, request.context)
    return AiAssistResponse(briefing=briefing, task=request.task, model=model)
