# Project Polaris — TODO

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
- [ ] Implement real Razorpay subscription cancellation/suspension using razorpaySubscriptionId and synchronise the provider response
- [ ] Preserve paid access until currentPeriodEnd after cancellation and cover the grace-period policy with regression tests
- [x] Payment history
- [ ] Add Razorpay test/live credentials and execute a final real checkout, verification, and webhook acceptance test

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
- [ ] Perform final production-domain Google consent login after the deployed callback URL is registered in Google Cloud
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
