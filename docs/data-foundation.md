# Workforce Hub Data Foundation

## Database technology

Workforce Hub uses a **MySQL-compatible TiDB relational database** through **Drizzle ORM**. The backend is TypeScript on Express with tRPC procedures; the future FastAPI reference service uses the same API and authorization boundaries but is not the live runtime.

## Database-backed demonstration records

The idempotent `scripts/seed-demo-data.mjs` script creates clearly labeled internal **Demo** records for recruiter candidates, client accounts, client projects, staffing demand, consultant assignments, timesheet entries, onboarding progress, administrative readiness metadata, and operational activity. The `demoKey` fields on operational tables support safe repeatable seeds. Candidate profiles include `· Demo` in their names and use `demo.verton.local` email addresses.

The protected `portal.demoSummary` procedure exposes client, project, staffing demand, assignment, timesheet, and activity summaries to authenticated workspace users. Recruiter candidate search and onboarding progress use protected database procedures. Financial values remain client-side masked unless a Finance role is active.

## Representative UI data still retained intentionally

Some presentation-only visualizations—such as the recruiting-funnel bar chart, onboarding persona selector, and non-actionable chart labels—remain client-side representative display data. They do not represent customer activity, user reviews, or production records. They exist solely to demonstrate the visual workflow until live operating records are entered.

## Privacy boundaries

Raw resume text is not stored in relational tables. Original resume files are held in protected object storage and linked only through authorized metadata. Work-authorization documents are not stored in this demo workflow, and the platform does not make employment, eligibility, legal, or authorization decisions.
