# Verified Workforce Hub Inventory Notes

The implemented portal uses a MySQL-compatible TiDB database through Drizzle ORM. Its persisted entities cover users and role/session metadata, employee readiness workflow status, onboarding assignments, role-change audit events, candidate profiles and restricted resume-upload references, demo clients, projects, staffing demand, consultant assignments, time entries, and operational activities.

The current API surface includes public and demo credential access, administrator user and role controls, employee self-service readiness updates, database-backed portal summaries and authorized project updates, recruiter candidate management and resume parsing/upload completion, bounded AI briefing tasks, and a role-scoped workspace assistant. Resume parsing writes a candidate profile only when structured AI extraction is available; unavailable AI returns a human-review fallback instead.

All work-authorization operations remain status-based and human-reviewed. The application deliberately avoids storing authorization document bytes in the database, avoids automatic eligibility decisions, and restricts candidate/project updates and assistant lookup responses by the authenticated user role.
