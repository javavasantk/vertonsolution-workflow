"""FastAPI ownership layer for the Verton Workforce Hub Railway deployment.

It intentionally does not import the Node/OAuth runtime. The transitional
`/api/trpc` transport keeps the existing React httpBatchLink UI operational
while a REST client migration is completed; new integrations use `/api/v1`.
"""
from __future__ import annotations

import hashlib
import hmac
import json
import os
import re
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from io import BytesIO
from pathlib import Path
from typing import Any, Generator

import boto3
import httpx
import jwt
from docx import Document
from fastapi import Depends, FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from PyPDF2 import PdfReader
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

MAX_RESUME_BYTES = 5 * 1024 * 1024
COOKIE_NAME = "app_session_id"
ROLES = {"user", "admin", "recruiter", "hr_compliance", "account_manager", "delivery_manager", "project_manager", "finance", "consultant"}
RECRUITER_ROLES = {"admin", "recruiter"}
PROJECT_EDITOR_ROLES = {"admin", "account_manager", "delivery_manager", "project_manager"}
PERMISSION_GROUPS = [
    {"role": "admin", "label": "Administrator", "permissions": ["Full workspace visibility", "User roles", "Permission review", "Audit controls"]},
    {"role": "recruiter", "label": "Recruiter", "permissions": ["Talent pipeline", "New-hire tracking", "Assignment signals"]},
    {"role": "hr_compliance", "label": "HR & Compliance", "permissions": ["Readiness review", "Onboarding coordination", "Audit controls"]},
    {"role": "account_manager", "label": "Account Manager", "permissions": ["Client demand", "Talent submissions", "Delivery visibility"]},
    {"role": "delivery_manager", "label": "Delivery Manager", "permissions": ["Onboarding coordination", "Assignments", "Redeployment"]},
    {"role": "project_manager", "label": "Project Manager", "permissions": ["Delivery visibility", "Time approvals", "Assignment status"]},
    {"role": "finance", "label": "Finance", "permissions": ["Billing readiness", "Commercial fields", "Operational controls"]},
    {"role": "consultant", "label": "Consultant", "permissions": ["Personal profile", "Onboarding tasks", "Assignment visibility"]},
]

DATABASE_URL = os.getenv("DATABASE_URL", "").replace("mysql://", "mysql+pymysql://", 1)
JWT_SECRET = os.getenv("JWT_SECRET", "")
JWT_ISSUER = os.getenv("JWT_ISSUER", "verton-workforce-hub")
JWT_AUDIENCE = os.getenv("JWT_AUDIENCE", "verton-workforce-hub-web")
APP_ENV = os.getenv("APP_ENV", "development")
AI_BASE_URL = os.getenv("AI_BASE_URL", "").rstrip("/")
AI_API_KEY = os.getenv("AI_API_KEY", "")
AI_MODEL = os.getenv("AI_MODEL", "gpt-5-mini")
S3_BUCKET = os.getenv("S3_BUCKET", "")
S3_REGION = os.getenv("S3_REGION", "us-east-1")
S3_ENDPOINT = os.getenv("S3_ENDPOINT")
S3_ACCESS_KEY_ID = os.getenv("S3_ACCESS_KEY_ID", "")
S3_SECRET_ACCESS_KEY = os.getenv("S3_SECRET_ACCESS_KEY", "")

_session_factory: sessionmaker[Session] | None = None

def utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)

def db() -> Generator[Session, None, None]:
    global _session_factory
    if not DATABASE_URL:
        raise HTTPException(503, "Database is not configured")
    if _session_factory is None:
        _session_factory = sessionmaker(bind=create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=270, future=True), expire_on_commit=False, future=True)
    with _session_factory() as session:
        try:
            yield session
        except Exception:
            session.rollback()
            raise

def row(record: Any) -> dict[str, Any]:
    return dict(record._mapping) if hasattr(record, "_mapping") else dict(record)

def present(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")
    if isinstance(value, dict): return {key: present(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)): return [present(item) for item in value]
    return value

def json_list(raw: str | None) -> list[Any]:
    try:
        value = json.loads(raw or "[]")
        return value if isinstance(value, list) else []
    except json.JSONDecodeError:
        return []

def safe_user(value: dict[str, Any] | None) -> dict[str, Any] | None:
    return present({key: item for key, item in value.items() if key not in {"passwordHash", "resetTokenHash", "resetTokenExpiresAt"}}) if value else None

def candidate(value: dict[str, Any]) -> dict[str, Any]:
    output = dict(value)
    output["skills"] = json_list(output.pop("skillsJson", "[]"))
    output["recentRoles"] = json_list(output.pop("recentRolesJson", "[]"))
    output["education"] = json_list(output.pop("educationJson", "[]"))
    output["recruiterNotes"] = json_list(output.pop("recruiterNotesJson", "[]"))
    return present(output)

def scrypt_verify(password: str, stored: str | None) -> bool:
    if not stored or ":" not in stored: return False
    salt, expected_hex = stored.split(":", 1)
    try:
        actual = hashlib.scrypt(password.encode(), salt=salt.encode(), n=16384, r=8, p=1, dklen=64)
        expected = bytes.fromhex(expected_hex)
    except (ValueError, TypeError):
        return False
    return len(actual) == len(expected) and hmac.compare_digest(actual, expected)

def scrypt_hash(password: str) -> str:
    salt = secrets.token_hex(16)
    return f"{salt}:{hashlib.scrypt(password.encode(), salt=salt.encode(), n=16384, r=8, p=1, dklen=64).hex()}"

def mint_token(user: dict[str, Any]) -> str:
    if not JWT_SECRET: raise HTTPException(503, "JWT authentication is not configured")
    issued = datetime.now(timezone.utc)
    return jwt.encode({"sub": str(user["id"]), "open_id": user["openId"], "role": user["role"], "is_demo": bool(user.get("isDemo")), "iss": JWT_ISSUER, "aud": JWT_AUDIENCE, "iat": issued, "exp": issued + timedelta(hours=8)}, JWT_SECRET, algorithm="HS256")

def token_from_request(request: Request) -> str | None:
    if request.cookies.get(COOKIE_NAME): return request.cookies[COOKIE_NAME]
    authorization = request.headers.get("authorization", "")
    return authorization[7:] if authorization.startswith("Bearer ") else None

def principal(request: Request, session: Session) -> dict[str, Any]:
    token = token_from_request(request)
    if not token or not JWT_SECRET: raise HTTPException(401, "Please login (10001)")
    try:
        user_id = int(jwt.decode(token, JWT_SECRET, algorithms=["HS256"], issuer=JWT_ISSUER, audience=JWT_AUDIENCE)["sub"])
    except (jwt.PyJWTError, KeyError, ValueError) as exc:
        raise HTTPException(401, "Please login (10001)") from exc
    record = session.execute(text("SELECT * FROM `users` WHERE `id`=:id LIMIT 1"), {"id": user_id}).mappings().first()
    if not record: raise HTTPException(401, "Please login (10001)")
    return row(record)

def require(user: dict[str, Any], roles: set[str]) -> None:
    if user.get("role") not in roles: raise HTTPException(403, "Your assigned role cannot access this workspace area.")

def required_string(value: Any, label: str, lower: int = 1, upper: int = 500) -> str:
    if not isinstance(value, str) or not lower <= len(value.strip()) <= upper: raise HTTPException(422, f"{label} is invalid")
    return value.strip()

def set_cookie(response: Response, token: str) -> None:
    response.set_cookie(COOKIE_NAME, token, httponly=True, secure=APP_ENV == "production", samesite="lax", path="/", max_age=8 * 60 * 60)

def storage() -> Any:
    if not all([S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY]): raise HTTPException(503, "Private resume storage is not configured")
    return boto3.client("s3", region_name=S3_REGION, endpoint_url=S3_ENDPOINT, aws_access_key_id=S3_ACCESS_KEY_ID, aws_secret_access_key=S3_SECRET_ACCESS_KEY)

async def model(messages: list[dict[str, str]], *, schema: dict[str, Any] | None = None, tokens: int = 500) -> tuple[str, str]:
    if not AI_BASE_URL or not AI_API_KEY: raise RuntimeError("AI is not configured")
    body: dict[str, Any] = {"model": AI_MODEL, "messages": messages, "max_completion_tokens" if AI_MODEL.startswith("gpt-") else "max_tokens": tokens}
    if schema: body["response_format"] = schema
    async with httpx.AsyncClient(timeout=25) as client:
        response = await client.post(f"{AI_BASE_URL}/chat/completions", headers={"Authorization": f"Bearer {AI_API_KEY}"}, json=body)
        response.raise_for_status()
    decoded = response.json(); content = decoded.get("choices", [{}])[0].get("message", {}).get("content")
    if not isinstance(content, str) or not content.strip(): raise RuntimeError("AI returned no content")
    return content, str(decoded.get("model", AI_MODEL))

app = FastAPI(title="Verton Workforce Hub API", version="1.0.0")
origins = [item.strip() for item in os.getenv("APP_ORIGINS", "").split(",") if item.strip()]
if origins: app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["GET", "POST", "PUT", "PATCH", "OPTIONS"], allow_headers=["Authorization", "Content-Type"])

@app.get("/health")
def health() -> dict[str, str]: return {"status": "ok", "service": "verton-workforce-hub-fastapi"}

@app.get("/ready")
def ready(session: Session = Depends(db)) -> dict[str, str]:
    session.execute(text("SELECT 1")); return {"status": "ready", "database": "connected"}

def summary(session: Session) -> dict[str, Any]:
    clients = [row(item) for item in session.execute(text("SELECT * FROM `client_accounts` ORDER BY `updatedAt` DESC")).mappings()]
    projects = [row(item) for item in session.execute(text("SELECT * FROM `client_projects` ORDER BY `updatedAt` DESC")).mappings()]
    demands = [row(item) for item in session.execute(text("SELECT * FROM `staffing_demands` ORDER BY `updatedAt` DESC")).mappings()]
    assignments = [row(item) for item in session.execute(text("SELECT * FROM `consultant_assignments` ORDER BY `updatedAt` DESC")).mappings()]
    timesheets = [row(item) for item in session.execute(text("SELECT * FROM `timesheet_entries` ORDER BY `updatedAt` DESC")).mappings()]
    activities = [row(item) for item in session.execute(text("SELECT * FROM `operational_activities` ORDER BY `occurredAt` DESC")).mappings()]
    for project in projects: project["technologyStack"] = json_list(project.pop("technologyStackJson", "[]"))
    for demand in demands: demand["skills"] = json_list(demand.pop("skillsJson", "[]"))
    return present({"clients": clients, "projects": projects, "demands": demands, "assignments": assignments, "timesheets": timesheets, "activities": activities})

def save_candidate(session: Session, user_id: int, profile: dict[str, Any], upload: dict[str, Any] | None = None) -> dict[str, Any]:
    email = str(profile.get("email", "")).strip().lower() or None
    params = {"userId": user_id, "candidateName": str(profile.get("candidateName") or "Candidate pending review")[:255], "email": email, "phone": str(profile.get("phone") or "")[:96] or None, "location": str(profile.get("location") or "")[:255] or None, "professionalSummary": str(profile.get("professionalSummary") or "") or None, "yearsExperience": str(profile.get("yearsExperience") or "")[:96] or None, "skillsJson": json.dumps(profile.get("skills", [])[:20]), "recentRolesJson": json.dumps(profile.get("recentRoles", [])[:20]), "educationJson": json.dumps(profile.get("education", [])[:20]), "recruiterNotesJson": json.dumps(profile.get("recruiterNotes", [])[:20]), "confidence": profile.get("confidence") if profile.get("confidence") in {"high", "medium", "low"} else "low"}
    existing = session.execute(text("SELECT `id` FROM `candidate_profiles` WHERE `email`=:email LIMIT 1"), {"email": email}).mappings().first() if email else None
    if existing:
        candidate_id = row(existing)["id"]
        session.execute(text("UPDATE `candidate_profiles` SET `candidateName`=:candidateName,`phone`=:phone,`location`=:location,`professionalSummary`=:professionalSummary,`yearsExperience`=:yearsExperience,`skillsJson`=:skillsJson,`recentRolesJson`=:recentRolesJson,`educationJson`=:educationJson,`recruiterNotesJson`=:recruiterNotesJson,`confidence`=:confidence WHERE `id`=:id"), {**params, "id": candidate_id})
    else:
        session.execute(text("INSERT INTO `candidate_profiles` (`createdByUserId`,`candidateName`,`email`,`phone`,`location`,`professionalSummary`,`yearsExperience`,`skillsJson`,`recentRolesJson`,`educationJson`,`recruiterNotesJson`,`confidence`,`reviewState`) VALUES (:userId,:candidateName,:email,:phone,:location,:professionalSummary,:yearsExperience,:skillsJson,:recentRolesJson,:educationJson,:recruiterNotesJson,:confidence,'pending_human_review')"), params)
        candidate_id = int(session.execute(text("SELECT LAST_INSERT_ID()")).scalar_one())
    if upload: session.execute(text("INSERT INTO `resume_uploads` (`candidateProfileId`,`uploadedByUserId`,`fileKey`,`originalFileName`,`mimeType`,`fileSize`) VALUES (:candidateId,:userId,:fileKey,:originalFileName,:mimeType,:fileSize)"), {"candidateId": candidate_id, "userId": user_id, **upload})
    session.commit()
    return candidate(row(session.execute(text("SELECT * FROM `candidate_profiles` WHERE `id`=:id"), {"id": candidate_id}).mappings().one()))

RESUME_RESPONSE_SCHEMA = {"type": "json_schema", "json_schema": {"name": "recruiter_resume_parse", "strict": True, "schema": {"type": "object", "additionalProperties": False, "properties": {"candidateName": {"type": "string"}, "email": {"type": "string"}, "phone": {"type": "string"}, "location": {"type": "string"}, "professionalSummary": {"type": "string"}, "yearsExperience": {"type": "string"}, "skills": {"type": "array", "items": {"type": "string"}}, "recentRoles": {"type": "array", "items": {"type": "object", "additionalProperties": False, "properties": {"title": {"type": "string"}, "company": {"type": "string"}, "period": {"type": "string"}}, "required": ["title", "company", "period"]}}, "education": {"type": "array", "items": {"type": "string"}}, "recruiterNotes": {"type": "array", "items": {"type": "string"}}, "confidence": {"type": "string", "enum": ["high", "medium", "low"]}}, "required": ["candidateName", "email", "phone", "location", "professionalSummary", "yearsExperience", "skills", "recentRoles", "education", "recruiterNotes", "confidence"]}}}

def unavailable_profile() -> dict[str, Any]:
    return {"candidateName": "", "email": "", "phone": "", "location": "", "professionalSummary": "Resume extraction is temporarily unavailable. Continue with a human review of the supplied text.", "yearsExperience": "", "skills": [], "recentRoles": [], "education": [], "recruiterNotes": ["No automated candidate decision has been made.", "Review the original resume before updating the candidate record."], "confidence": "low"}

async def parse_resume(text_value: str) -> dict[str, Any]:
    try:
        content, model_id = await model([
            {"role": "system", "content": "Extract only recruiter-visible facts from the supplied resume into strict JSON. Do not infer work authorization, immigration status, protected characteristics, eligibility, salary, fit, ranking, or a hiring recommendation. Use blank fields for unknown information. recruiterNotes must be factual human follow-ups, not decisions."},
            {"role": "user", "content": f"Extract recruiter-visible profile details from this resume:\n\n{text_value}"},
        ], schema=RESUME_RESPONSE_SCHEMA, tokens=900)
        profile = json.loads(content)
        if not isinstance(profile, dict): raise ValueError("Profile was not an object")
        return {"profile": profile, "model": model_id, "unavailable": False}
    except Exception:
        return {"profile": unavailable_profile(), "model": "unavailable", "unavailable": True}

def assistant_lookup(session: Session, role: str, prompt: str) -> dict[str, Any]:
    lower = prompt.lower(); terms = [term for term in re.split(r"[^a-z0-9+#.]+", lower) if len(term) >= 3 and term not in {"candidate", "profile", "resume", "show", "find", "with", "skill", "skills", "experience", "project", "delivery", "status", "client", "assignment"}]
    if role in RECRUITER_ROLES and re.search(r"candidate|resume|profile|skill|experience", lower):
        records = [candidate(row(item)) for item in session.execute(text("SELECT * FROM `candidate_profiles` ORDER BY `updatedAt` DESC LIMIT 12")).mappings()]
        records = [item for item in records if not terms or any(term in f"{item['candidateName']} {item.get('location') or ''} {' '.join(item['skills'])}".lower() for term in terms)][:5]
        context = "\n".join(f"Candidate: {item['candidateName']}; location: {item.get('location') or 'not stated'}; experience: {item.get('yearsExperience') or 'not stated'}; skills: {', '.join(item['skills']) or 'not stated'}; review: {item['reviewState']}." for item in records) or "No matching recruiter-visible candidate profiles were found."
        return {"kind": "candidate", "records": records, "context": context}
    if role in {"admin", "recruiter", "account_manager", "delivery_manager", "project_manager"} and re.search(r"project|delivery|status|client|assignment", lower):
        records = [present(row(item)) for item in session.execute(text("SELECT * FROM `client_projects` ORDER BY `updatedAt` DESC LIMIT 12")).mappings()]
        records = [item for item in records if not terms or any(term in f"{item['name']} {item['deliveryStatus']} {item.get('projectManagerName') or ''}".lower() for term in terms)][:5]
        context = "\n".join(f"Project: {item['name']}; delivery status: {item['deliveryStatus']}; project manager: {item.get('projectManagerName') or 'not assigned'}." for item in records) or "No matching project-status records were found."
        return {"kind": "project", "records": records, "context": context}
    return {"kind": "none", "records": [], "context": "No database lookup applies to this question. Provide workflow guidance only."}

async def operation(name: str, data: dict[str, Any], request: Request, response: Response, session: Session) -> Any:
    """Existing portal actions, all enforced server-side by the FastAPI service."""
    def actor() -> dict[str, Any]: return principal(request, session)
    if name == "auth.me": return safe_user(actor()) if token_from_request(request) else None
    if name == "auth.demoLogin":
        email = required_string(data.get("email"), "email", 5, 320).lower(); password = required_string(data.get("password"), "password", 12, 128)
        record = session.execute(text("SELECT * FROM `users` WHERE LOWER(`email`)=:email LIMIT 1"), {"email": email}).mappings().first(); user = row(record) if record else None
        if not user or not user.get("isDemo") or not scrypt_verify(password, user.get("passwordHash")): raise HTTPException(401, "Demo email or password is incorrect.")
        session.execute(text("UPDATE `users` SET `lastSignedIn`=:now WHERE `id`=:id"), {"now": utcnow(), "id": user["id"]}); session.commit(); set_cookie(response, mint_token(user)); return safe_user(user)
    if name == "auth.logout": response.delete_cookie(COOKIE_NAME, path="/"); return {"success": True}
    if name == "auth.requestDemoPasswordReset":
        email = required_string(data.get("email"), "email", 5, 320).lower(); record = session.execute(text("SELECT * FROM `users` WHERE LOWER(`email`)=:email LIMIT 1"), {"email": email}).mappings().first(); user = row(record) if record else None; reset_token = None
        if user and user.get("isDemo"):
            reset_token = secrets.token_urlsafe(32); session.execute(text("UPDATE `users` SET `resetTokenHash`=:hash,`resetTokenExpiresAt`=:expiry WHERE `id`=:id"), {"hash": hashlib.sha256(reset_token.encode()).hexdigest(), "expiry": utcnow() + timedelta(minutes=15), "id": user["id"]}); session.commit()
        return {"success": True, "resetToken": reset_token, "expiresInMinutes": 15 if reset_token else None, "message": "A one-time demonstration reset code is ready." if reset_token else "If this is a demo account, a reset instruction is available."}
    if name == "auth.resetDemoPassword":
        reset_token = required_string(data.get("token"), "token", 24, 128); password = required_string(data.get("password"), "password", 12, 128); record = session.execute(text("SELECT * FROM `users` WHERE `resetTokenHash`=:hash LIMIT 1"), {"hash": hashlib.sha256(reset_token.encode()).hexdigest()}).mappings().first(); user = row(record) if record else None
        if not user or not user.get("isDemo") or not user.get("resetTokenExpiresAt") or user["resetTokenExpiresAt"] < utcnow(): raise HTTPException(400, "This demonstration reset code is invalid or has expired.")
        session.execute(text("UPDATE `users` SET `passwordHash`=:password,`resetTokenHash`=NULL,`resetTokenExpiresAt`=NULL WHERE `id`=:id"), {"password": scrypt_hash(password), "id": user["id"]}); session.commit(); return {"success": True}
    if name.startswith("access."):
        user = actor(); require(user, {"admin"})
        if name == "access.permissionGroups": return PERMISSION_GROUPS
        if name == "access.listUsers":
            query = "SELECT `id`,`name`,`email`,`role`,`lastSignedIn` FROM `users`" + (" WHERE `isDemo`=1" if user.get("isDemo") else "") + " ORDER BY `lastSignedIn` DESC"; return present([row(item) for item in session.execute(text(query)).mappings()])
        if name == "access.roleChangeHistory":
            if user.get("isDemo"): return []
            query = "SELECT changes.`id`,changes.`previousRole`,changes.`nextRole`,changes.`createdAt`,target.`name` AS targetName,target.`email` AS targetEmail,actor.`name` AS changedByName FROM `access_role_changes` changes JOIN `users` target ON target.`id`=changes.`userId` JOIN `users` actor ON actor.`id`=changes.`changedByUserId` ORDER BY changes.`createdAt` DESC"; return present([row(item) for item in session.execute(text(query)).mappings()])
        if name == "access.assignRole":
            target_id, next_role = data.get("userId"), data.get("role")
            if user.get("isDemo"): raise HTTPException(403, "Demonstration accounts cannot change workspace roles.")
            if not isinstance(target_id, int) or target_id < 1 or next_role not in ROLES: raise HTTPException(422, "User and role are required")
            if target_id == user["id"] and next_role != "admin": raise HTTPException(400, "Administrators cannot remove their own administrator access")
            existing = session.execute(text("SELECT `role` FROM `users` WHERE `id`=:id LIMIT 1"), {"id": target_id}).mappings().first()
            if not existing: raise HTTPException(404, "User account was not found")
            previous_role = row(existing)["role"]
            if previous_role != next_role:
                session.execute(text("UPDATE `users` SET `role`=:role WHERE `id`=:id"), {"role": next_role, "id": target_id}); session.execute(text("INSERT INTO `access_role_changes` (`userId`,`changedByUserId`,`previousRole`,`nextRole`) VALUES (:userId,:changedBy,:previousRole,:nextRole)"), {"userId": target_id, "changedBy": user["id"], "previousRole": previous_role, "nextRole": next_role}); session.commit()
            return {"success": True}
    if name == "profile.mine":
        user = actor(); item = session.execute(text("SELECT * FROM `employee_profiles` WHERE `userId`=:userId LIMIT 1"), {"userId": user["id"]}).mappings().first(); return present(row(item)) if item else None
    if name == "profile.requestReview":
        user = actor(); employment = required_string(data.get("employmentType"), "employmentType", 2, 96); note = required_string(data.get("statusNote"), "statusNote", 8, 500); existing = session.execute(text("SELECT `id` FROM `employee_profiles` WHERE `userId`=:id LIMIT 1"), {"id": user["id"]}).mappings().first()
        if existing: session.execute(text("UPDATE `employee_profiles` SET `employmentType`=:employment,`statusNote`=:note,`workAuthorizationStatus`='details_requested',`updatedByUserId`=:id WHERE `userId`=:id"), {"employment": employment, "note": note, "id": user["id"]})
        else: session.execute(text("INSERT INTO `employee_profiles` (`userId`,`employmentType`,`statusNote`,`workAuthorizationStatus`,`updatedByUserId`) VALUES (:id,:employment,:note,'details_requested',:id)"), {"id": user["id"], "employment": employment, "note": note})
        session.commit(); return {"success": True, "reviewState": "details_requested"}
    if name == "portal.demoSummary": actor(); return summary(session)
    if name == "portal.updateProject":
        user = actor(); require(user, PROJECT_EDITOR_ROLES); project_id = data.get("projectId"); project_name = required_string(data.get("name"), "name", 2, 255); delivery = data.get("deliveryStatus"); manager = required_string(data.get("projectManagerName", ""), "projectManagerName", 0, 255)
        if not isinstance(project_id, int) or delivery not in {"planned", "active", "at_risk", "closing"}: raise HTTPException(422, "Project update is invalid")
        if not session.execute(text("SELECT `id` FROM `client_projects` WHERE `id`=:id"), {"id": project_id}).mappings().first(): raise HTTPException(404, "Project record was not found")
        session.execute(text("UPDATE `client_projects` SET `name`=:name,`deliveryStatus`=:status,`projectManagerName`=:manager WHERE `id`=:id"), {"name": project_name, "status": delivery, "manager": manager or None, "id": project_id}); session.execute(text("INSERT INTO `operational_activities` (`demoKey`,`entityType`,`title`,`detail`,`activityState`) VALUES (:key,'project',:title,:detail,:state)"), {"key": f"project-update-{project_id}-{int(datetime.now().timestamp()*1000)}", "title": f"Project status updated: {project_name}", "detail": f"Updated by authorized user {user['id']}", "state": "attention" if delivery == "at_risk" else "complete"}); session.commit(); return present(row(session.execute(text("SELECT * FROM `client_projects` WHERE `id`=:id"), {"id": project_id}).mappings().one()))
    if name.startswith("recruiting."):
        user = actor(); require(user, RECRUITER_ROLES)
        if name == "recruiting.newHireProgress":
            query = "SELECT users.`id` AS userId,users.`name`,users.`email`,users.`role`,onboarding.`onboardingStage`,onboarding.`progressPercent`,onboarding.`managerConfirmed`,onboarding.`projectName`,onboarding.`assignmentState`,onboarding.`updatedAt`,profiles.`workAuthorizationStatus` AS readinessStatus FROM `users` users LEFT JOIN `onboarding_assignments` onboarding ON onboarding.`userId`=users.`id` LEFT JOIN `employee_profiles` profiles ON profiles.`userId`=users.`id` WHERE users.`role` IN ('user','consultant') ORDER BY onboarding.`updatedAt` DESC"; return present([row(item) for item in session.execute(text(query)).mappings()])
        if name == "recruiting.listCandidates": return [candidate(row(item)) for item in session.execute(text("SELECT * FROM `candidate_profiles` ORDER BY `updatedAt` DESC")).mappings()]
        if name == "recruiting.updateCandidate":
            candidate_id = data.get("candidateId"); candidate_name = required_string(data.get("candidateName"), "candidateName", 2, 255); location = required_string(data.get("location", ""), "location", 0, 180); experience = required_string(data.get("yearsExperience", ""), "yearsExperience", 0, 64); skills = data.get("skills")
            if not isinstance(candidate_id, int) or not isinstance(skills, list) or len(skills) > 20 or any(not isinstance(item, str) or not 1 <= len(item.strip()) <= 64 for item in skills): raise HTTPException(422, "Candidate update is invalid")
            if not session.execute(text("SELECT `id` FROM `candidate_profiles` WHERE `id`=:id"), {"id": candidate_id}).mappings().first(): raise HTTPException(404, "Candidate profile was not found")
            session.execute(text("UPDATE `candidate_profiles` SET `candidateName`=:name,`location`=:location,`yearsExperience`=:experience,`skillsJson`=:skills WHERE `id`=:id"), {"name": candidate_name, "location": location or None, "experience": experience or None, "skills": json.dumps([item.strip() for item in skills]), "id": candidate_id}); session.execute(text("INSERT INTO `operational_activities` (`demoKey`,`entityType`,`title`,`detail`,`activityState`) VALUES (:key,'candidate',:title,:detail,'complete')"), {"key": f"candidate-update-{candidate_id}-{int(datetime.now().timestamp()*1000)}", "title": f"Candidate profile updated: {candidate_name}", "detail": f"Updated by recruiter/admin user {user['id']}"}); session.commit(); return candidate(row(session.execute(text("SELECT * FROM `candidate_profiles` WHERE `id`=:id"), {"id": candidate_id}).mappings().one()))
        if name == "recruiting.parseResume":
            extracted = required_string(data.get("resumeText"), "resumeText", 80, 12000); parsed = await parse_resume(extracted); return {**parsed, "candidate": None if parsed["unavailable"] else save_candidate(session, user["id"], parsed["profile"])}
        if name == "recruiting.prepareResumeUpload":
            filename = required_string(data.get("fileName"), "fileName", 5, 255); mime_type, file_size = data.get("mimeType"), data.get("fileSize"); allowed = {"application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
            if mime_type not in allowed or not isinstance(file_size, int) or not 0 < file_size <= MAX_RESUME_BYTES or (mime_type == "application/pdf" and not filename.lower().endswith(".pdf")) or (mime_type.endswith("document") and not filename.lower().endswith(".docx")): raise HTTPException(422, "Only PDF or DOCX resumes up to 5 MB are accepted")
            session_id = str(uuid.uuid4()); file_key = f"recruiter-resumes/{user['id']}/{session_id}-{re.sub(r'[^A-Za-z0-9._-]', '_', filename)}"; expires = utcnow() + timedelta(minutes=10); session.execute(text("INSERT INTO `resume_upload_sessions` (`id`,`userId`,`fileKey`,`originalFileName`,`mimeType`,`fileSize`,`expiresAt`) VALUES (:id,:userId,:fileKey,:fileName,:mimeType,:fileSize,:expiresAt)"), {"id": session_id, "userId": user["id"], "fileKey": file_key, "fileName": filename, "mimeType": mime_type, "fileSize": file_size, "expiresAt": expires}); session.commit(); return {"sessionId": session_id, "uploadPath": f"/api/recruiter/resume-upload/{session_id}", "expiresAt": present(expires)}
        if name == "recruiting.completeResumeUpload": return await complete_resume_upload(required_string(data.get("sessionId"), "sessionId", 36, 36), user, session)
    if name == "ai.assist":
        user = actor(); task = data.get("task"); context = required_string(data.get("context"), "context", 12, 1600); instructions = {"recruiter_summary": "Create a concise recruiter handoff summary from supplied onboarding and assignment signals. Prioritize human follow-up actions.", "onboarding_guidance": "Create practical onboarding guidance for the signed-in employee based only on supplied task context. Suggest a human owner for each follow-up.", "access_review": "Create a concise administrator access-review briefing from supplied role and audit context. Identify governance follow-ups without changing or recommending automatic permissions."}
        if task not in instructions or (task == "recruiter_summary" and user["role"] not in RECRUITER_ROLES) or (task == "access_review" and user["role"] != "admin"): raise HTTPException(403, "This AI workspace is not available for your assigned role.")
        try: briefing, model_id = await model([{"role": "system", "content": "You are Verton Workforce Hub's operational writing assistant. Produce a short briefing using only supplied context. Do not make legal, immigration, work-authorization eligibility, or hiring decisions. Do not request documents or infer authorization status. Use headings: Summary, Human follow-up, Boundary."}, {"role": "user", "content": f"{instructions[task]}\n\nContext:\n{context}"}]); return {"briefing": briefing, "task": task, "model": model_id, "unavailable": False}
        except Exception: return {"briefing": "Summary\nAI assistance is temporarily unavailable.\n\nHuman follow-up\nContinue this workflow with the designated human owner.\n\nBoundary\nNo automated eligibility or authorization decision has been made.", "task": task, "model": "unavailable", "unavailable": True}
    if name == "ai.workspaceAssistant":
        user = actor(); page = required_string(data.get("page"), "page", 2, 64); prompt = required_string(data.get("prompt"), "prompt", 4, 600); lookup = assistant_lookup(session, user["role"], prompt)
        try: reply, model_id = await model([{"role": "system", "content": "You are Verton Workforce Hub's concise workspace assistant. Use only the signed-in user's role, page, prompt, and supplied scoped database context. Do not invent records, request documents, make hiring decisions, make legal or immigration conclusions, determine work authorization, assess eligibility, or grant permissions."}, {"role": "user", "content": f"Assigned role: {user['role']}\nCurrent workspace page: {page}\nQuestion: {prompt}\nStructured database context:\n{lookup['context']}"}]); return {"reply": reply, "model": model_id, "unavailable": False, "lookupKind": lookup["kind"], "records": lookup["records"]}
        except Exception: return {"reply": "AI assistance is temporarily unavailable. Continue with the designated human owner for this workflow; no automated decision has been made.", "model": "unavailable", "unavailable": True, "lookupKind": lookup["kind"], "records": lookup["records"]}
    raise HTTPException(404, f"Unsupported API procedure: {name}")

@app.put("/api/recruiter/resume-upload/{session_id}")
async def upload_resume(session_id: str, request: Request, session: Session = Depends(db)) -> dict[str, bool]:
    user = principal(request, session); require(user, RECRUITER_ROLES)
    record = session.execute(text("SELECT * FROM `resume_upload_sessions` WHERE `id`=:id AND `userId`=:userId LIMIT 1"), {"id": session_id, "userId": user["id"]}).mappings().first(); upload = row(record) if record else None
    if not upload or upload.get("completedAt") or upload["expiresAt"] < utcnow(): raise HTTPException(400, "This upload session is invalid, expired, or already completed.")
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_RESUME_BYTES: raise HTTPException(413, "Resume exceeds the 5 MB limit")
    data = await request.body()
    if len(data) != upload["fileSize"] or len(data) > MAX_RESUME_BYTES: raise HTTPException(400, "The uploaded file size does not match the approved upload request.")
    storage().put_object(Bucket=S3_BUCKET, Key=upload["fileKey"], Body=data, ContentType=upload["mimeType"], ServerSideEncryption="AES256")
    return {"success": True}

def extract_resume(filename: str, mime_type: str, data: bytes) -> str:
    try:
        if mime_type == "application/pdf": return "\n".join(page.extract_text() or "" for page in PdfReader(BytesIO(data)).pages).strip()
        if mime_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document": return "\n".join(item.text for item in Document(BytesIO(data)).paragraphs).strip()
    except Exception as exc:
        raise HTTPException(400, "The resume could not be read. Upload a readable PDF or DOCX file.") from exc
    raise HTTPException(400, "Unsupported resume type")

async def complete_resume_upload(session_id: str, user: dict[str, Any], session: Session) -> dict[str, Any]:
    record = session.execute(text("SELECT * FROM `resume_upload_sessions` WHERE `id`=:id AND `userId`=:userId LIMIT 1"), {"id": session_id, "userId": user["id"]}).mappings().first(); upload = row(record) if record else None
    if not upload or upload.get("completedAt") or upload["expiresAt"] < utcnow(): raise HTTPException(400, "This upload session is invalid, expired, or already completed.")
    try: data = storage().get_object(Bucket=S3_BUCKET, Key=upload["fileKey"])["Body"].read()
    except Exception as exc: raise HTTPException(400, "The resume upload could not be retrieved. Upload the file again.") from exc
    if len(data) != upload["fileSize"]: raise HTTPException(400, "The uploaded file size does not match the approved upload request.")
    extracted = extract_resume(upload["originalFileName"], upload["mimeType"], data)
    if len(extracted) < 80: raise HTTPException(400, "The resume does not contain enough readable text for a human-reviewed extraction.")
    parsed = await parse_resume(extracted[:12000]); candidate_record = None if parsed["unavailable"] else save_candidate(session, user["id"], parsed["profile"], {"fileKey": upload["fileKey"], "originalFileName": upload["originalFileName"], "mimeType": upload["mimeType"], "fileSize": len(data)})
    session.execute(text("UPDATE `resume_upload_sessions` SET `completedAt`=:completed WHERE `id`=:id"), {"completed": utcnow(), "id": session_id}); session.commit()
    return {**parsed, "candidate": candidate_record, "fileName": upload["originalFileName"]}

def rest_response(response: Response, value: Any) -> Any:
    """Small helper retained for clear REST route implementations."""
    return value

@app.get("/api/v1/auth/me")
async def rest_me(request: Request, response: Response, session: Session = Depends(db)) -> Any:
    return rest_response(response, await operation("auth.me", {}, request, response, session))

@app.post("/api/v1/auth/login")
async def rest_login(data: dict[str, Any], request: Request, response: Response, session: Session = Depends(db)) -> Any:
    return rest_response(response, await operation("auth.demoLogin", data, request, response, session))

@app.post("/api/v1/auth/logout")
async def rest_logout(request: Request, response: Response, session: Session = Depends(db)) -> Any:
    return rest_response(response, await operation("auth.logout", {}, request, response, session))

@app.post("/api/v1/auth/password-reset/request")
async def rest_reset_request(data: dict[str, Any], request: Request, response: Response, session: Session = Depends(db)) -> Any:
    return rest_response(response, await operation("auth.requestDemoPasswordReset", data, request, response, session))

@app.post("/api/v1/auth/password-reset/confirm")
async def rest_reset_confirm(data: dict[str, Any], request: Request, response: Response, session: Session = Depends(db)) -> Any:
    return rest_response(response, await operation("auth.resetDemoPassword", data, request, response, session))

@app.get("/api/v1/admin/users")
async def rest_users(request: Request, response: Response, session: Session = Depends(db)) -> Any:
    return rest_response(response, await operation("access.listUsers", {}, request, response, session))

@app.get("/api/v1/admin/permission-groups")
async def rest_permission_groups(request: Request, response: Response, session: Session = Depends(db)) -> Any:
    return rest_response(response, await operation("access.permissionGroups", {}, request, response, session))

@app.get("/api/v1/admin/role-history")
async def rest_role_history(request: Request, response: Response, session: Session = Depends(db)) -> Any:
    return rest_response(response, await operation("access.roleChangeHistory", {}, request, response, session))

@app.post("/api/v1/admin/roles")
async def rest_roles(data: dict[str, Any], request: Request, response: Response, session: Session = Depends(db)) -> Any:
    return rest_response(response, await operation("access.assignRole", data, request, response, session))

@app.get("/api/v1/profile/me")
async def rest_profile(request: Request, response: Response, session: Session = Depends(db)) -> Any:
    return rest_response(response, await operation("profile.mine", {}, request, response, session))

@app.put("/api/v1/profile/me")
async def rest_profile_update(data: dict[str, Any], request: Request, response: Response, session: Session = Depends(db)) -> Any:
    return rest_response(response, await operation("profile.requestReview", data, request, response, session))

@app.get("/api/v1/portal/summary")
async def rest_summary(request: Request, response: Response, session: Session = Depends(db)) -> Any:
    return rest_response(response, await operation("portal.demoSummary", {}, request, response, session))

@app.patch("/api/v1/portal/projects/{project_id}")
async def rest_project(project_id: int, data: dict[str, Any], request: Request, response: Response, session: Session = Depends(db)) -> Any:
    return rest_response(response, await operation("portal.updateProject", {**data, "projectId": project_id}, request, response, session))

@app.get("/api/v1/recruiting/new-hires")
async def rest_new_hires(request: Request, response: Response, session: Session = Depends(db)) -> Any:
    return rest_response(response, await operation("recruiting.newHireProgress", {}, request, response, session))

@app.get("/api/v1/recruiting/candidates")
async def rest_candidates(request: Request, response: Response, session: Session = Depends(db)) -> Any:
    return rest_response(response, await operation("recruiting.listCandidates", {}, request, response, session))

@app.patch("/api/v1/recruiting/candidates/{candidate_id}")
async def rest_candidate(candidate_id: int, data: dict[str, Any], request: Request, response: Response, session: Session = Depends(db)) -> Any:
    return rest_response(response, await operation("recruiting.updateCandidate", {**data, "candidateId": candidate_id}, request, response, session))

@app.post("/api/v1/recruiting/parse")
async def rest_parse(data: dict[str, Any], request: Request, response: Response, session: Session = Depends(db)) -> Any:
    return rest_response(response, await operation("recruiting.parseResume", data, request, response, session))

@app.post("/api/v1/recruiting/resume-uploads")
async def rest_prepare_upload(data: dict[str, Any], request: Request, response: Response, session: Session = Depends(db)) -> Any:
    return rest_response(response, await operation("recruiting.prepareResumeUpload", data, request, response, session))

@app.post("/api/v1/recruiting/resume-uploads/{session_id}/complete")
async def rest_complete_upload(session_id: str, request: Request, response: Response, session: Session = Depends(db)) -> Any:
    return rest_response(response, await operation("recruiting.completeResumeUpload", {"sessionId": session_id}, request, response, session))

@app.post("/api/v1/ai/assist")
async def rest_assist(data: dict[str, Any], request: Request, response: Response, session: Session = Depends(db)) -> Any:
    return rest_response(response, await operation("ai.assist", data, request, response, session))

@app.post("/api/v1/ai/workspace-assistant")
async def rest_workspace_assistant(data: dict[str, Any], request: Request, response: Response, session: Session = Depends(db)) -> Any:
    return rest_response(response, await operation("ai.workspaceAssistant", data, request, response, session))

def trpc_error(exc: Exception) -> dict[str, Any]:
    if isinstance(exc, HTTPException):
        code = "UNAUTHORIZED" if exc.status_code == 401 else "FORBIDDEN" if exc.status_code == 403 else "BAD_REQUEST"
        return {"error": {"json": {"message": str(exc.detail), "code": -32000, "data": {"code": code, "httpStatus": exc.status_code}}}}
    return {"error": {"json": {"message": "The request could not be completed.", "code": -32603, "data": {"code": "INTERNAL_SERVER_ERROR", "httpStatus": 500}}}}

@app.api_route("/api/trpc/{procedures:path}", methods=["GET", "POST"])
async def trpc_compat(procedures: str, request: Request, session: Session = Depends(db)) -> Response:
    """Compatibility envelope for React's current SuperJSON httpBatchLink client."""
    try:
        raw = request.query_params.get("input") if request.method == "GET" else ((await request.body()).decode() or "{}")
        inputs = json.loads(raw or "{}")
    except json.JSONDecodeError:
        return JSONResponse(trpc_error(HTTPException(400, "Malformed procedure input")), status_code=400)
    temporary = Response(); outputs: list[dict[str, Any]] = []
    for index, procedure in enumerate(procedures.split(",")):
        envelope = inputs.get(str(index), {}) if isinstance(inputs, dict) and str(index) in inputs else inputs
        body = envelope.get("json", envelope) if isinstance(envelope, dict) else {}
        try: outputs.append({"result": {"data": {"json": await operation(procedure, body if isinstance(body, dict) else {}, request, temporary, session)}}})
        except Exception as exc: outputs.append(trpc_error(exc))
    payload: Any = outputs if request.query_params.get("batch") == "1" or len(outputs) > 1 else outputs[0]
    final = JSONResponse(payload)
    for key, value in temporary.headers.items():
        if key.lower() == "set-cookie": final.headers.append(key, value)
    return final

# Railway's image builds the React application into this directory. API routes
# are registered above, so the final SPA fallback cannot bypass authorization.
STATIC_DIR = Path(os.getenv("STATIC_DIR", "/app/dist/public"))
if STATIC_DIR.exists():
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    async def single_page_app(path: str) -> FileResponse:
        requested = (STATIC_DIR / path).resolve()
        if path and requested.is_file() and STATIC_DIR.resolve() in requested.parents:
            return FileResponse(requested)
        return FileResponse(STATIC_DIR / "index.html")
