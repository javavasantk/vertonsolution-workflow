# Project Polaris Homepage Performance and SEO Audit

**Audit target:** `https://projectpolaris.live/`  
**Audit date:** 21 August 2026  
**Scope:** live request timing, browser resource observations, homepage metadata, social tags, structured data, and Lighthouse availability.

## Executive assessment

The homepage has a **strong on-page SEO foundation**. It exposes a single H1, canonical URL, index/follow robots instruction, focused aerospace and STEM keywords, page description, Open Graph tags, Twitter tags, manifest, and valid JSON-LD covering the organization, website, and page. The main current risk is **performance consistency**, not missing SEO markup: live document delivery was slow in the sampled requests, and the single main JavaScript resource remains substantial.

An exact Lighthouse score could not be produced in this environment. Three distinct Lighthouse attempts failed because Chromium either reported no paint or crashed, and Google PageSpeed Insights returned an HTTP 429 quota error. I therefore do **not** assign an invented score. The verified manual SEO readiness is high, but the platform score should be checked from the project SEO panel after the next cache/analyzer refresh.

## Live request timing sample

The following table is the unthrottled network sample collected from three live `curl` requests. Values include the current sandbox-to-edge path, so they are useful for identifying variance but should not be treated as a representative user geography benchmark.

| Request | DNS | TLS complete | Time to first byte | Total transfer | HTML bytes | Status |
|---|---:|---:|---:|---:|---:|---:|
| Run 1 | 12 ms | 2.35 s | 6.91 s | 19.63 s | 371,505 | 200 |
| Run 2 | 11 ms | 4.03 s | 5.28 s | 20.47 s | 371,505 | 200 |
| Run 3 | 36 ms | 11.01 s | 14.49 s | 28.60 s | 371,505 | 200 |

The response headers reported `Cache-Control: no-cache, no-store, must-revalidate` for the HTML document. The browser navigation sample measured a 1.90 s time to first byte, 10.20 s DOM content loaded, 10.21 s load, and 371,505 decoded HTML bytes. These results indicate that **TTFB and document work warrant attention before fine-tuning lower-impact SEO signals**.

## Browser resource observations

| Resource class | Observed behavior | SEO and UX implication |
|---|---|---|
| Main JavaScript | 190,062 transferred bytes; 709,231 decoded bytes in the live browser entry | Primary opportunity for faster interactive and paint timing; split infrequently used page modules and defer non-critical experiences. |
| Main CSS | 156,957 decoded bytes | Reasonable for a rich visual site, but unused-style reduction can still lower render work. |
| Web fonts | Several font files requested for Playfair Display, Inter, and JetBrains Mono | Preconnect is present. Limit variants/weights to the ones used above the fold and consider font-display fallback behavior. |
| Authentication fetch | 548 ms in the sample | Avoid allowing a non-critical auth check to delay visible homepage content. |
| Homepage images | Both shared logo images were complete at 160 × 159 px and have descriptive alternative text in the latest rendered application build | Meets the accessibility requirement; monitor the hosting edge until the latest image attributes are consistently served. |

## Homepage metadata inventory

| Category | Current property/value | Assessment |
|---|---|---|
| Title | `Project Polaris — Experiential Learning Platform` | Clear brand/title pairing. |
| Description | `Hands-on aerospace learning, engineering projects, and the AeroForge simulation laboratory.` | Concise and relevant. |
| Keywords | Aerospace education, aerospace engineering courses, science learning platform, computational physics, engineering projects | Focused and non-stuffed. |
| Canonical | `https://projectpolaris.live/` | Correct primary-domain canonical. |
| Robots | `index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1` | Appropriate for the public homepage. |
| Open Graph | Type, site name, title, description, URL, locale, image, and image alt are present | Complete baseline. |
| Twitter | Card, title, description, and image are present | Complete baseline. |
| Manifest/favicon | `manifest.webmanifest` and SVG favicon are linked | Present. |
| JSON-LD | `EducationalOrganization`, `WebSite`, and `WebPage` entities are present | Strong semantic baseline. |

> The Open Graph image is currently a small Project Polaris logo file. It is technically valid, but a dedicated **1200 × 630 branded social image** would provide a more compelling preview in social feeds.

## Lighthouse availability

The audit attempted Lighthouse using a dedicated Chromium process, then again with a dedicated headless configuration, and finally through the existing browser debug port. Those runs failed with `NO_FCP` or `TARGET_CRASHED`. Google PageSpeed Insights was also queried but returned `429 RESOURCE_EXHAUSTED` because the available quota was zero. The exact Lighthouse Performance and SEO scores are therefore **unavailable**, not failed scores.

## Prioritized recommendations

| Priority | Recommendation | Expected benefit |
|---|---|---|
| P0 | Investigate live document TTFB and the `no-store` HTML policy with the hosting layer. | Reduces inconsistent first render and page load time. |
| P1 | Split the 1 MB uncompressed client bundle; lazily load below-the-fold catalog/simulator experiences where possible. | Improves LCP, TBT, and mobile performance. |
| P1 | Create and use a dedicated 1200 × 630 Open Graph/Twitter image. | Improves social preview quality and share CTR. |
| P2 | Consolidate non-essential font weights and defer non-critical font loading. | Lowers render-blocking and network work. |
| P2 | Refresh the platform SEO cache and verify that live `robots.txt` points to `https://projectpolaris.live/sitemap.xml`. | Ensures crawler discovery matches the primary canonical domain. |

## Verification sources

The metadata values above were inspected in the live browser DOM at [Project Polaris](https://projectpolaris.live/). Live request timing and response headers were collected from the same public URL. Structured data and routing behavior were also checked against the published site configuration and current project source.

The latest live crawler-route check confirms that `https://projectpolaris.live/sitemap.xml` lists only `projectpolaris.live` URLs and that `https://projectpolaris.live/manifest.webmanifest` is current. The canonical `robots.txt` cache key still advertises the prior sitemap, but a cache-busted request to the same deployed endpoint returns the correct `https://projectpolaris.live/sitemap.xml` policy. This proves the deployed application is correct; revalidate the canonical bot-facing URL after the four-hour hosting cache expires or receives a purge.
