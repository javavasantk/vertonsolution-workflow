import type { Express } from "express";

const PUBLIC_ORIGIN = "https://projectpolaris.live";
const PUBLIC_PATHS = [
  ["/", "weekly", "1.0"],
  ["/courses", "weekly", "0.9"],
  ["/aeroforge", "weekly", "0.9"],
  ["/projects", "weekly", "0.8"],
  ["/programs", "monthly", "0.8"],
  ["/showcase", "weekly", "0.7"],
  ["/research", "monthly", "0.7"],
  ["/resources", "weekly", "0.7"],
  ["/schools", "monthly", "0.7"],
  ["/about", "yearly", "0.5"],
  ["/contact", "yearly", "0.5"],
  ["/pricing", "monthly", "0.6"],
  ["/privacy", "yearly", "0.2"],
  ["/terms", "yearly", "0.2"],
] as const;

export const SEO_ROBOTS = `User-agent: *
Allow: /
Disallow: /portal
Disallow: /auth
Disallow: /api/

Sitemap: ${PUBLIC_ORIGIN}/sitemap.xml
`;

export const SEO_SITEMAP = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PUBLIC_PATHS.map(([path, changefreq, priority]) => `  <url><loc>${PUBLIC_ORIGIN}${path}</loc><lastmod>2026-08-21</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`).join("\n")}
</urlset>`;

export const SEO_MANIFEST = {
  name: "Project Polaris — Experiential Learning Platform",
  short_name: "Project Polaris",
  description: "Hands-on aerospace learning, engineering projects, and the AeroForge simulation lab.",
  start_url: "/",
  display: "browser",
  background_color: "#08070d",
  theme_color: "#8b5cf6",
  lang: "en",
};

export function registerSeoRoutes(app: Express) {
  app.get("/robots.txt", (_req, res) => res.type("text/plain").send(SEO_ROBOTS));
  app.get("/sitemap.xml", (_req, res) => res.type("application/xml").send(SEO_SITEMAP));
  app.get("/manifest.webmanifest", (_req, res) => res.type("application/manifest+json").json(SEO_MANIFEST));
  app.get("/llms.txt", (_req, res) => res.type("text/plain").send(`# Project Polaris\n\nProject Polaris is an experiential science and engineering learning platform focused on aerospace education, hands-on projects, and the AeroForge simulation laboratory.\n\nPublic content: ${PUBLIC_ORIGIN}/courses, ${PUBLIC_ORIGIN}/aeroforge, ${PUBLIC_ORIGIN}/projects, ${PUBLIC_ORIGIN}/programs, ${PUBLIC_ORIGIN}/research, and ${PUBLIC_ORIGIN}/resources.\n\nRespect robots.txt and do not bypass authentication, payment, or learner-workspace access controls.\n`));
  app.get("/.well-known/security.txt", (_req, res) => res.type("text/plain").send(`Contact: ${PUBLIC_ORIGIN}/contact\nPreferred-Languages: en\nPolicy: ${PUBLIC_ORIGIN}/privacy\n`));
}
