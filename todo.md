# Project Polaris — TODO

## Documentation deliverable
- [x] Create an end-to-end Python + SQL Project Polaris implementation prompt pack covering every platform capability
- [x] Audit the current Node.js/tRPC backend for production implementation gaps and create an end-to-end backend prompt pack

## Authentication enhancement
- [x] Implement secure password-reset request and completion flows with single-use expiring tokens
- [x] Add login UI paths for sign-in, forgot password, reset password, and configured Google login
- [x] Exercise the development-only demo account through /auth
- [x] Run a production-mode server and verify `/auth` does not render demo credentials or expose `auth.demoCredentials`
- [x] Restrict production password-reset URLs to configured trusted origins
- [x] Complete final authentication validation, including direct production-mode demo suppression in startup and UI

## Production domain
- [ ] Attach and validate the published Project Polaris deployment on https://projectpolaris.live
- [ ] Resolve the current public 404 returned by https://projectpolaris.live after domain attachment

## Static SEO and bot routes
- [x] Audit existing robots, sitemap, manifest, canonical metadata, and bot-facing response behavior
- [x] Add a compatible `/manifest.webmanifest` route and reference it consistently
- [x] Point static SEO, social, security, and bot metadata to the working production domain until projectpolaris.live routing is repaired
- [ ] Verify bot routes and representative route metadata locally and on the working production domain

## Foundation
- [x] Design tokens in index.css: violet #8b5cf6 / #c59dff, gold #d4af37, dark default + light variant
- [x] Google Fonts: Playfair Display, Inter, JetBrains Mono wired in client/index.html
- [x] Database schema: users(auth fields), subscriptions, payments, trials, backlog, certificates, courses
- [x] Seed catalog data (10 items) + squads + showcase + research + resources
- [x] Shared plan constants (Explorer / Builder / Builder Annual / Squad Pro)
- [x] Add a catalog_courses database table and seed the 10 catalog items for server-side catalog operations

## Layout & shared UI
- [x] Sticky glassmorphic navbar with Learn/Build/Community dropdown menus
- [x] Theme toggle (dark default, light variant)
- [x] Footer with 3 link columns + social icons
- [x] Section eyebrow/heading primitives
- [x] Scroll-to-top floating button

## Home page
- [x] Hero: Playfair headline with gradient word, dual CTAs, meta row, starfield backdrop
- [x] AeroForge hero widget: NACA airfoil canvas, profile toggles, Mach/AoA sliders, metric grid
- [x] "What's Happening Now" 3-card strip
- [x] Learning Ladder 4 numbered cards
- [x] Catalog Explorer with domain filter chips + 6 cards
- [x] Personalized Pathways 5 cards
- [x] 8-stage AeroForge interactive simulator section
- [x] Stats band (5 metrics)
- [x] Final CTA section

## Routes
- [x] / (home)
- [x] /courses — catalog, 10 items, format + domain + difficulty filters
- [x] /projects — build squads, initiatives with progress + build journey
- [x] /aeroforge — full simulation lab
- [x] /programs
- [x] /showcase
- [x] /research
- [x] /resources
- [x] /schools
- [x] /about
- [x] /portal — protected student workspace
- [x] /auth — sign in / sign up
- [x] /pricing — subscription upgrade page
- [x] /contact
- [x] /privacy
- [x] /terms
- [x] 404 fallback

## Authentication
- [x] Email/password sign-up with hashed passwords
- [x] Exercise email/password sign-in success and incorrect-password handling through the UI
- [x] Verify Google OAuth start, state protection, and callback error recovery; final consent success requires a real Google user
- [x] JWT httpOnly cookie session management (no localStorage)
- [x] /portal redirects unauthenticated users to /auth
- [x] Logout

## Subscriptions & Razorpay
- [x] Plan definitions: Explorer (free), Builder ₹499/mo, Builder Annual ₹4999/yr, Squad Pro ₹1499/mo
- [x] /pricing page with plan comparison + per-plan CTA buttons
- [x] Razorpay order creation endpoint
- [x] Razorpay checkout script integration on frontend
- [x] Payment signature verification
- [x] Razorpay webhook handler
- [x] Subscription records with period start/end + status
- [x] Access gating helper (requires Builder+ / Squad Pro)
- [x] Razorpay provider cancellation/suspension activation deferred by user pending credentials and recurring Plan IDs; secure end-of-cycle path is implemented and documented for post-activation validation
- [x] Razorpay grace-period acceptance validation deferred by user until provider credentials and subscription plans are activated
- [x] Payment history
- [x] Razorpay test/live credentials and real checkout, webhook, and cancellation acceptance test deferred by user

## AeroForge lab (/aeroforge)
- [x] 4 challenges: Transonic Airfoil, Rocket Stabilizer Fin, Supercritical Wing, Sounding Rocket Nosecone
- [x] Mach / AoA / Altitude sliders
- [x] Analytical flow solver computing CL, CD, L/D, true airspeed
- [x] Canvas contour + streamline visualization
- [x] Benchmark delta display
- [x] Save Trial gated behind auth + Builder+

## Student workspace (/portal)
- [x] Sprint backlog
- [x] Exercise a Builder+ user saving an AeroForge trial and verify it renders in /portal after reload
- [x] Subscription status + upgrade prompt
- [x] Derive certificate eligibility from a real engineering completion source: a saved qualifying AeroForge project trial
- [x] Exercise the qualifying AeroForge completion-to-certificate workflow and confirm the credential renders after a portal reload
- [x] Exercise a successful Squad Pro Co-Pilot request, persistence, and history reload

## Quality
- [x] Google OAuth configured by user; a final deployed-domain consent login remains a post-publish acceptance step
- [x] Re-run the configured Google OAuth start and protected callback validation before delivery
- [x] Document Razorpay provider activation, checkout, webhook, and cancellation testing as deferred at the user's request
- [x] Add an automated sign-in success and incorrect-password regression test that runs in pnpm test
- [x] Implement public inquiry submission for /contact and /schools, persist it to inquiries, and show loading/success/error feedback
- [x] Add real research detail views and replace placeholder read actions
- [x] Add real resource detail views and replace placeholder resource actions
- [x] Exercise the actual /contact form UI and verify loading, success, validation/error behavior, and persistence
- [x] Exercise the actual /schools form UI with a school inquiry and verify loading, success, validation/error behavior, and persistence
- [x] Re-validate /contact and /schools after both browser form flows complete
- [x] Vitest coverage for auth, subscription gating, Razorpay verification, solver
- [x] Responsive check at 375px and 1280px
- [x] Explicitly review the light-theme pricing and authentication surfaces for contrast, legibility, and component styling
