# Project Polaris — Python + SQL Implementation Prompt Pack

**Author:** Manus AI  
**Purpose:** Copy these prompts into a coding agent, one at a time, to rebuild the complete Project Polaris platform with a Python backend and a relational SQL database.

> **Recommended implementation baseline:** Use Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.x async, Alembic, PostgreSQL 16, Redis for short-lived state/rate limiting, and a React/Vite or server-rendered frontend. Use PostgreSQL in production and SQLite only for isolated unit tests. Keep secrets in environment variables, not source code.

## How to use this pack

Start with **Prompt 0** and retain its decisions as the project contract. Then execute Prompts 1–15 in order. Each prompt assumes the previous one is complete. Treat prompts as implementation specifications: request code, migrations, tests, and documentation—not a high-level explanation.

| Prompt | Capability | Primary output |
|---|---|---|
| 0 | Platform foundation | Repository architecture and non-negotiable rules |
| 1 | SQL schema and migrations | Alembic migrations and ORM models |
| 2 | Public content and routing | Route/content API and 16 public/product routes |
| 3 | Design system and UI shell | Dark/light glassmorphic design system |
| 4 | Authentication | Email/password, Google OAuth, signed cookies |
| 5 | Catalog, inquiries, and programs | Filtered learning catalog and contact flows |
| 6 | AeroForge mathematics and renderer | Deterministic reduced-order solver and airfoil view |
| 7 | AeroForge saved-trial access control | Builder-gated trial persistence |
| 8 | Subscription tiers and entitlements | Explorer/Builder/Annual/Squad Pro policy engine |
| 9 | Razorpay payments | Orders, verification, webhooks, cancellation readiness |
| 10 | Student workspace | Backlog, ledger, certificates, membership UI |
| 11 | Verified credential workflow | Trial-evidence completion and certificate issuance |
| 12 | Squad Pro AI Co-Pilot | Server-side gated chat and persistence |
| 13 | Security, observability, and admin controls | Auditability and production safeguards |
| 14 | Testing and acceptance | Unit, integration, browser, and visual coverage |
| 15 | Deployment and operating guide | Environment, migration, release, and handoff docs |

---

## Prompt 0 — Master build contract

```text
Build a production-ready aerospace learning and simulation platform named “Project Polaris.” The product includes a public marketing site, learning catalog, engineering projects, an interactive AeroForge simulator, protected student workspace, memberships, Razorpay-ready payments, Google OAuth, and a Squad Pro AI Co-Pilot.

Use this architecture:
- Backend: Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2 async, Alembic, PostgreSQL 16.
- Frontend: React + TypeScript + Vite + Tailwind, calling typed JSON APIs. A server-rendered frontend is acceptable only if it preserves all routes and interactions.
- Authentication: JWT or PASETO stored only in HttpOnly, Secure cookies. Do not use localStorage or sessionStorage for authentication tokens.
- Data: PostgreSQL is the source of truth. Store file bytes externally; store only file metadata/keys in SQL.
- Payments: Razorpay is the sole payment processor. Implement the integration behind environment variables and show a safe “payment configuration required” state when keys are absent.
- AI: Calls must originate from the Python server only. Never expose model/provider keys to the browser.

Implement every capability listed below. Use migrations, idempotent seeds, structured logging, tests, and a clear README. Avoid fake customer reviews, ratings, testimonials, fake certificates, or fabricated user-generated content. Do not create arbitrary certificates: a certificate must be traceable to a real verified completion event and saved engineering evidence.

Required product routes:
/ , /courses , /projects , /aeroforge , /programs , /showcase , /research , /resources , /schools , /about , /portal , /auth , /contact , /privacy , /terms , /pricing . Include a branded 404 fallback.

Required subscriptions:
- Explorer: free.
- Builder: ₹499/month.
- Builder Annual: ₹4,999/year.
- Squad Pro: ₹1,499/month.

Required visual direction:
- Dark default with optional light theme.
- Fonts: Playfair Display for display/headings, Inter for body, JetBrains Mono for measurements/code.
- Exact brand colors: #8b5cf6 and #c59dff violet; #d4af37 gold.
- Sticky glassmorphic navigation, dark data panels, refined editorial spacing, responsive mobile layout.

Before coding, return: (1) folder tree, (2) API map, (3) SQL entity relationship summary, (4) environment variable list, and (5) test plan. Then implement in small commits. Do not stop at stubs.
```

---

## Prompt 1 — SQL schema, migrations, and seed content

```text
Create the SQLAlchemy ORM models and Alembic migrations for Project Polaris. Use PostgreSQL types, UTC timestamps, proper indexes, unique constraints, check constraints, and server-side defaults. Write an idempotent Python seed command for the ten catalog entries and all static public content metadata.

Create these tables with these minimum fields:

1. users
   - id BIGINT PK, public_id UUID unique, email CITEXT unique nullable, password_hash nullable, display_name, avatar_url nullable, role enum(user, admin), plan_id enum(explorer, builder, builder_annual, squad_pro), oauth_provider nullable, oauth_subject nullable, created_at, updated_at, last_signed_in_at.
   - Add a unique constraint for (oauth_provider, oauth_subject) when both exist.

2. catalog_courses
   - id, slug unique, title, summary, type enum(workshop, mini_course, bootcamp, project), domain, format, difficulty, duration_label, required_tier smallint, content_json JSONB, published boolean, sort_order, timestamps.

3. subscriptions
   - id, user_id indexed, plan_id, status enum(created, active, cancelled, expired, failed), amount_paise, currency, billing_cycle enum(none, monthly, yearly), razorpay_order_id unique nullable, razorpay_payment_id nullable, razorpay_subscription_id nullable, current_period_start, current_period_end, cancel_scheduled_at nullable, created_at, updated_at.

4. payments
   - id, user_id, subscription_id, plan_id, razorpay_order_id indexed, razorpay_payment_id unique nullable, razorpay_signature nullable, amount_paise, currency, status enum(created, paid, failed, refunded), method nullable, provider_payload JSONB nullable, timestamps.

5. aeroforge_trials
   - id, user_id indexed, challenge_id, challenge_name, label nullable, mach numeric, alpha_deg numeric, altitude_km numeric, lift_coefficient numeric, drag_coefficient numeric, lift_to_drag numeric, true_airspeed_kmh numeric, reynolds numeric nullable, benchmark_delta numeric nullable, created_at.

6. backlog_items
   - id, user_id indexed, title, squad nullable, status enum(todo, in_progress, review, done), priority enum(low, medium, high), due_at nullable, created_at, updated_at.

7. enrollments
   - id, user_id indexed, catalog_slug, catalog_title, catalog_type, progress_percent integer check 0–100, completion_trial_id nullable, created_at, updated_at.

8. certificates
   - id, user_id indexed, title, program_type, source_trial_id nullable for backward compatibility but mandatory for all new issuances, credential_code unique, verified boolean, issued_at.

9. copilot_messages
   - id, user_id indexed, role enum(user, assistant), content text, created_at.

10. inquiries
    - id, kind enum(contact, school), name, email, organisation nullable, topic nullable, message text, created_at.

Return the migration files, ORM models, repository functions, seed fixture shape, and a command such as `python -m app.seed`. Include tests proving that the seed is idempotent and catalog slugs are unique.
```

---

## Prompt 2 — Public routes, content APIs, and navigation

```text
Implement the public Project Polaris site and APIs. Build the following routes, each with an accessible title, responsive layout, clear navigation escape route, loading state where needed, and a branded 404 page:

/               Home landing page
/courses        Catalog with exactly 10 seeded learning items and domain/format/difficulty filters
/projects       Build squads and project initiatives
/aeroforge      Full simulator lab
/programs       Cohorts and structured pathways
/showcase       Artifact/project showcase
/research       Research digest with readable detail panels
/resources      Guides and reusable technical resources
/schools        School partnership page with inquiry form
/about          Mission, team, and values
/auth           Authentication page
/portal         Protected student workspace
/contact        General inquiry form
/privacy        Privacy policy
/terms          Terms
/pricing        Membership plans and payment state

Create FastAPI endpoints for public catalog listing with validated query filters. Use cursor or offset pagination even if the initial dataset is small. Create POST /api/inquiries with Pydantic validation, rate limiting, persistence to inquiries, and safe generic success/error messages. Do not expose internal database errors.

For public content, use authored editorial data. Do not invent student testimonials, reviews, ratings, or claimed outcomes. Build content cards from structured data so the same catalog items power both the home preview and /courses.
```

---

## Prompt 3 — Design system, app shell, and responsive visual behavior

```text
Implement the Project Polaris design system in the frontend.

Requirements:
- Load Playfair Display, Inter, and JetBrains Mono.
- Implement CSS variables/tokens for dark and light themes. Dark must be default. The exact key brand colors are #8b5cf6, #c59dff, and #d4af37.
- Build a sticky, glassmorphic site header with Learn, Build, and Community dropdowns; a mobile menu; theme toggle; authentication-aware Workspace/Join links; and keyboard navigation.
- Build a multi-column footer with Explore, Organization, Legal & Policies columns.
- Include a scroll-to-top control and preserve focus visibility.
- Design desktop at 1280px and mobile at 375px. Avoid horizontal scrolling, clipped controls, unreadable contrast, or desktop-only interaction.

Home page sections must include:
1. Starfield/aurora hero with editorial headline, two CTAs, and activity metadata.
2. Embedded AeroForge hero widget with NACA airfoil canvas, profile toggle, Mach/AoA sliders, and metric tiles.
3. “What’s Happening Now” strip.
4. Learning Ladder cards.
5. Catalog Explorer preview with filter chips.
6. Personalized Pathways.
7. Eight-stage AeroForge experience section.
8. Stats band and final CTA.

Use reduced-motion media queries. Animate only transform/opacity; use short, interruptible transitions. Provide screenshots or browser tests in both themes at desktop and mobile widths.
```

---

## Prompt 4 — Authentication with email/password and configured Google OAuth

```text
Implement Project Polaris authentication using Python FastAPI, PostgreSQL, and secure HttpOnly cookies.

Email/password:
- POST /api/auth/signup accepts display_name, email, password; validates inputs; hashes passwords with Argon2id or bcrypt; rejects duplicate identities; creates a user with Explorer plan; and issues a signed HttpOnly cookie.
- POST /api/auth/signin validates credentials in constant-time appropriate code paths and returns the same generic error for missing user or wrong password.
- POST /api/auth/logout clears the cookie with production-safe attributes.
- GET /api/auth/me returns a minimal safe user profile, never password hashes or provider tokens.

Google OAuth:
- Implement GET /api/auth/google/start and GET /api/auth/google/callback using Authorization Code flow with PKCE and a cryptographically random state nonce.
- Store state in a short-lived HttpOnly, SameSite=Lax cookie. Validate and clear it on callback.
- Link users by immutable provider subject; safely handle a collision where an existing email belongs to a password account.
- Use environment variables GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI.
- On any OAuth error, redirect to /auth with safe user-facing recovery text; never expose raw provider error details.

Protection:
- Add a reusable FastAPI dependency `current_user` that verifies the signed cookie and fetches current user entitlements from SQL.
- Make /portal and all user data endpoints protected. The frontend must redirect unauthenticated /portal visitors to /auth?next=/portal.
- Do not store authentication in localStorage.

Write unit and integration tests for signup, successful sign-in, incorrect-password rejection, logout, protected redirect, OAuth start state cookie, invalid callback state, and configured callback error recovery. Document the post-publish action: register the final production callback URL and complete a real consent login.
```

---

## Prompt 5 — Learning catalog, pathways, projects, and inquiries

```text
Build the learning-content and inquiry capabilities for Project Polaris.

Implement:
- A catalog endpoint backed by catalog_courses with validated filters for domain, format/type, difficulty, and required tier.
- Exactly 10 seed records distributed across workshops, mini-courses, bootcamps, and project/lab formats.
- Personalized Pathways rendered from structured content, not duplicated markup.
- Build squads/projects with progress, stages, technical tags, and meaningful empty states if no live user membership data exists.
- Research and resource reader panels that expand real authored content rather than showing placeholder buttons.
- /contact and /schools forms that validate name, email, organization/topic where appropriate, and message length. Persist inquiries to SQL.

Add anti-spam controls: rate limiting by IP, request body size limits, honeypot or invisible field validation, and server-side field validation. Create tests for valid inquiry persistence and invalid payload rejection. Build all UI states: idle, submit pending, success, validation error, and network error.
```

---

## Prompt 6 — AeroForge deterministic solver and canvas visualization

```text
Implement the AeroForge simulation domain in Python and TypeScript/JavaScript. It is an educational reduced-order solver, not CFD or certification analysis. Display that limitation in the product.

Challenges:
1. Transonic Airfoil Flow — NACA 2412.
2. Symmetric Rocket Stabilizer Fin — NACA 0012.
3. Supercritical Wing Section — NACA 4415.
4. Sounding Rocket Nosecone — NACA 0015.

Inputs:
- Mach number.
- Angle of attack in degrees.
- Altitude in kilometers.

Outputs:
- Lift coefficient CL.
- Drag coefficient CD.
- L/D ratio.
- True airspeed in km/h.
- Reynolds number.
- Benchmark delta against an explicitly labeled empirical reference value.

Requirements:
- Use a deterministic reduced-order approach with thin-airfoil behavior, compressibility correction, atmospheric density/speed-of-sound approximation, and challenge-specific drag modifiers.
- Clamp all inputs to credible educational ranges and reject non-finite values.
- Implement the same core calculation in Python as the authoritative API/domain service. If the browser performs preview calculations, it must match the server contract and server values win on persistence.
- Render NACA four-digit geometry on a canvas/SVG with pressure/streamline-inspired contours. Ensure it works without WebGL.
- Build an eight-stage instructional simulation sequence around setup, flow condition, analysis, validation, and iteration.

Write deterministic tests for nominal behavior, finite values, AoA sensitivity, all four challenges, invalid input rejection, and repeatability. Do not claim that results are high-fidelity CFD or flight-certification output.
```

---

## Prompt 7 — Saved AeroForge trials and Builder access gate

```text
Add authenticated saving and retrieval of AeroForge trials.

Create endpoints:
- POST /api/aeroforge/trials: protected; requires Builder, Builder Annual, or Squad Pro; validates challenge/input; runs the authoritative Python solver; stores inputs and calculated outputs in aeroforge_trials; returns the immutable saved trial.
- GET /api/aeroforge/trials: protected; returns only the signed-in user’s trials, newest first.
- GET /api/aeroforge/trials/{id}: protected; enforce ownership.

Define an entitlement helper with capabilities such as `save_trial`, `advanced_lab`, `verified_certificate`, and `ai_copilot`. Explorer must receive a 403 with a clear upgrade code/message when attempting to save. The frontend should show an upgrade CTA rather than a broken Save button.

In the /portal ledger, display actual saved trials with challenge, conditions, L/D, benchmark delta, saved time, and an empty state. Verify end to end that a Builder+ user can save a trial and see it after a full page reload. Verify an Explorer cannot save one.
```

---

## Prompt 8 — Subscription plans and entitlement policy

```text
Implement Project Polaris membership definitions in a single Python module and use it for API authorization and UI serialization.

Exact plans:
- Explorer: free.
- Builder: ₹499/month.
- Builder Annual: ₹4,999/year.
- Squad Pro: ₹1,499/month.

Required policy:
- Explorer: public catalog, community access, baseline demo, no trial saving, no verified certificates, no AI Co-Pilot.
- Builder / Builder Annual: full AeroForge lab, unlimited saved simulation trials, verified certificate eligibility when the evidence workflow is satisfied.
- Squad Pro: all Builder Annual access plus Squad Pro workspace collaboration and AI Co-Pilot.

Implement a pure entitlement function and test every plan/capability combination. Never trust plan identifiers sent by the browser. Every protected server endpoint must resolve entitlement from the current SQL user/subscription state.

Create GET /api/subscription/me with subscription status, current period, cancellation-scheduled state, and payment history. Build a /pricing plan comparison with active-plan state, safe upgrade CTA, cancellation UI, and a configuration-required state if Razorpay environment variables are absent.
```

---

## Prompt 9 — Razorpay orders, verification, webhooks, subscriptions, and cancellation

```text
Implement Razorpay as the sole payment provider for Project Polaris. Do not use Stripe or any substitute.

Environment variables:
- RAZORPAY_KEY_ID
- RAZORPAY_KEY_SECRET
- RAZORPAY_WEBHOOK_SECRET
- RAZORPAY_BUILDER_PLAN_ID
- RAZORPAY_BUILDER_ANNUAL_PLAN_ID
- RAZORPAY_SQUAD_PRO_PLAN_ID

Build two modes:
1. Configuration-required mode when payment credentials/Plan IDs are missing. The UI must not pretend payment is available. Explain that configuration is required, and do not create order attempts.
2. Active mode when configuration exists.

Active mode requirements:
- Create a server-side Razorpay Order for one-time membership checkout or a Razorpay Subscription for recurring billing. For recurring products, map internal plan IDs to server-owned Razorpay Plan IDs; never receive a Razorpay Plan ID from the client.
- Persist a created subscriptions row and a created payments row before Checkout opens.
- Return only Razorpay Key ID, order/subscription ID, amount, currency, plan display name, and safe prefills to the frontend.
- On Checkout success, POST payment/order/signature to the server. Verify the HMAC SHA-256 signature server-side. Only then activate entitlement and set period timestamps.
- Register a raw-body FastAPI webhook endpoint. Verify x-razorpay-signature with the webhook secret before parsing or mutating records. Handle payment.captured, payment.failed, subscription.activated, subscription.charged, subscription.cancelled, and equivalent events idempotently.
- Keep an immutable payment audit payload in SQL.
- Cancel recurring subscriptions using Razorpay’s subscription cancellation API with end-of-cycle behavior. Keep local access active through current_period_end, set cancel_scheduled_at, and downgrade only when the period actually ends or the provider cancellation event confirms expiration.

Write tests for configuration-required mode, HMAC payment verification, webhook verification, idempotent payment activation, failed payment handling, entitlement changes, cancellation scheduling, and grace-period logic. Before production, run a test-mode checkout, webhook delivery, end-of-cycle cancellation, and renewal/cancellation acceptance test using Razorpay’s current API contract. [1]
```

---

## Prompt 10 — Protected student workspace

```text
Build /portal as a protected student workspace. If the user is not authenticated, redirect to /auth?next=/portal.

Implement a responsive workspace layout with a collapsible mobile sidebar and these sections:

1. Mission Control
   - Open backlog count, saved-trial count, certificate count, current access level, and membership state.

2. Sprint Backlog
   - CRUD-lite: create a task; list own tasks; move status among todo, in_progress, review, done; set low/medium/high priority; display empty state.
   - Never allow one user to read or mutate another user’s task.

3. AeroForge Ledger
   - Show the signed-in user’s stored trials only. Use actual persisted records, no demo trial rows.

4. Membership
   - Show active plan, current period, cancellation-scheduled status, payment history, and a /pricing link.

5. Verified Certificates
   - Show only real issued certificate records and verification codes. Use a truthful empty state when none exist.

6. AI Co-Pilot
   - Show Squad Pro chat when permitted. For other plans, show a clear, non-deceptive locked feature panel with a pricing CTA.

Use typed Python API response models and test authorization on every endpoint.
```

---

## Prompt 11 — Verified completion and certificate evidence chain

```text
Implement a credential workflow in which certificates are issued only from real engineering evidence.

Rules:
- An admin/reviewer may record an eligible completion only by selecting a user-owned saved AeroForge trial and a catalog/program item.
- Validate that the selected trial exists, belongs to the selected user, has finite, positive numerical outputs such as drag coefficient and L/D, and is stored in the SQL ledger.
- Create or update an enrollment record to progress_percent = 100 and persist completion_trial_id.
- Certificate issuance must require the 100% enrollment and completion_trial_id. Re-fetch the trial, verify ownership and qualifying outputs, then create the certificate.
- Derive certificate title and program type from catalog_courses, not arbitrary admin text.
- Store source_trial_id and a unique credential_code in certificates.
- Enforce idempotency: do not issue duplicate certificates for the same evidence trial and catalog completion.

Create an admin-only reviewer API and an admin UI or documented internal workflow. Build a public certificate verification endpoint that can verify credential_code without exposing private student data beyond a minimal verification response.

Write end-to-end tests: saved trial → reviewer marks completion → certificate is issued → /portal renders it after reload. Also test rejection for another user’s trial, non-existent trial, invalid outputs, incomplete enrollment, and duplicate issuance.
```

---

## Prompt 12 — Squad Pro AI Co-Pilot

```text
Implement the Polaris AI Co-Pilot as a server-side-only feature for Squad Pro users.

Requirements:
- POST /api/copilot/messages accepts a bounded prompt, checks the current SQL entitlement, stores the user message, calls the configured server-side model provider, stores the assistant reply, and returns the reply.
- GET /api/copilot/messages returns only the signed-in user’s most recent conversation history.
- Explorer, Builder, and Builder Annual must receive a 403 before any model call is attempted.
- Persist messages in copilot_messages with user_id, role, content, and created_at.
- Apply input length limits, per-user rate limits, timeouts, structured logs, and a generic retry-safe error response.
- Use a concise system prompt: “You are Polaris AI Co-Pilot, a careful aerospace education assistant. State assumptions. Distinguish educational reduced-order approximations from certification-grade analysis. Do not invent experimental results, citations, or safety-critical advice.”
- Render assistant markdown safely; do not inject raw HTML.
- Do not use an LLM to fabricate certificate evidence, reviews, testimonials, or financial/payment decisions.

Write tests proving that Explorer is blocked without a model call and that a Squad Pro conversation is persisted and appears after reload. Use a fake model adapter in tests; do not make paid model calls in unit tests.
```

---

## Prompt 13 — Security, admin controls, and observability

```text
Harden Project Polaris for production.

Implement:
- Environment-based configuration with startup validation. Fail fast if production cookie/JWT/DB configuration is missing.
- CORS allowlist, trusted proxy configuration, secure cookie behavior, CSRF protection for cookie-authenticated mutating routes, CSP/security headers, request body limits, and rate limiting for auth, inquiries, payment webhooks, and AI endpoints.
- Password hashing with Argon2id or bcrypt and sensible password policy.
- Structured JSON logging with request ID, user ID where available, route, latency, and outcome. Never log passwords, tokens, OAuth codes, payment signatures, or raw secrets.
- Audit log entries for payment state changes, certificate issuance, admin reviewer actions, and plan changes.
- Admin authorization dependency based on users.role = admin.
- Ownership checks on every workspace resource.
- Health endpoint and readiness endpoint.

Create an internal admin workflow for reviewing saved trials and issuing certificates through the evidence chain. Do not implement unbounded background loops; use a real scheduled job system or provider webhooks for expiry/reconciliation.
```

---

## Prompt 14 — Automated tests and acceptance suite

```text
Create a comprehensive test suite for Project Polaris.

Unit tests:
- Password hashing and sign-in success/failure.
- JWT/cookie issuance and logout clearing.
- Google OAuth state generation, state validation, invalid callback handling.
- Plan-entitlement matrix.
- Razorpay order/signature and webhook HMAC checks.
- AeroForge solver finite values, parameter sensitivity, and all challenges.
- Certificate evidence-chain rules.

Integration tests:
- Signup/signin/protected portal flow.
- Inquiry validation and persistence.
- Builder saves trial and sees it in portal; Explorer cannot save.
- Squad Pro Co-Pilot persists a mocked model response; other tiers are blocked.
- Evidence-backed completion yields a certificate; duplicate or cross-user evidence is rejected.
- Payment events are idempotent and cancellation retains access through current period.

Browser/visual tests:
- Public routes at 1280px and 375px.
- Dark and light themes, including home, pricing, and auth.
- Navbar dropdowns, mobile menu, theme toggle, catalog filters, AeroForge controls, pricing configuration-required state, contact/school forms, protected redirect, workspace task creation.

Run tests in CI with PostgreSQL service containers. Produce a short verification report listing test totals, pages reviewed, deferred external steps, and any non-blocking bundle-size warnings.
```

---

## Prompt 15 — Deployment, operations, and handoff

```text
Prepare Project Polaris for production deployment.

Deliver:
- Dockerfile or platform build configuration for Python/FastAPI and frontend assets.
- Alembic migration command and safe deployment order: backup, migrate, deploy, health check, smoke test.
- Environment variable template with descriptions but no values.
- Production callback URLs for Google OAuth and post-publish instructions to register them in Google Cloud.
- Razorpay activation runbook: add test keys, webhook secret, and recurring Plan IDs; run test checkout; verify webhook; test end-of-period cancellation; review payment/subscription records; only then switch to live keys.
- Database backup/restore notes.
- Observability dashboard recommendations for auth failures, webhook failures, checkout verification failures, rate limits, simulation saves, and AI errors.
- README with local setup, migrations, seed, tests, and release steps.

Do not claim that live payment or Google consent testing occurred unless credentials and a real browser consent return were actually completed. Clearly separate implemented code from post-deployment acceptance checks.
```

---

## Final acceptance prompt

```text
Audit the completed Project Polaris application against the original specification. Produce a table with: requirement, implementation location, automated test, browser/visual validation, status, and remaining external acceptance step.

Do not mark an item complete merely because a UI shell exists. Verify persistence, authorization, error behavior, and reload behavior for all user-specific data. Mark Razorpay live behavior as deferred unless real test credentials, plan IDs, payment verification, webhook delivery, and cancellation/grace-period checks have actually been performed. Mark Google OAuth production consent as deferred unless the deployed callback URL has been registered and a real consent return succeeds.
```

## References

[1] [Razorpay, “Cancel a Subscription”](https://razorpay.com/docs/api/payments/subscriptions/cancel-subscription/)
