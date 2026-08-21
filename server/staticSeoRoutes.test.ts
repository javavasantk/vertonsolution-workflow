import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const publicDir = path.resolve(process.cwd(), "client/public");

describe("static SEO and bot routes", () => {
  it("publishes robots directives that protect private routes and advertise the sitemap", async () => {
    const robots = await readFile(path.join(publicDir, "robots.txt"), "utf8");
    expect(robots).toContain("Disallow: /portal");
    expect(robots).toContain("Disallow: /auth");
    expect(robots).toContain("Sitemap: https://projectpolaris.live/sitemap.xml");
  });

  it("publishes a sitemap that includes public catalog and simulation routes but excludes private routes", async () => {
    const sitemap = await readFile(path.join(publicDir, "sitemap.xml"), "utf8");
    expect(sitemap).toContain("https://projectpolaris.live/courses");
    expect(sitemap).toContain("https://projectpolaris.live/aeroforge");
    expect(sitemap).not.toContain("/portal");
    expect(sitemap).not.toContain("/auth");
  });

  it("publishes the standard webmanifest endpoint referenced by the document head", async () => {
    const manifest = await readFile(path.join(publicDir, "manifest.webmanifest"), "utf8");
    expect(JSON.parse(manifest)).toMatchObject({ name: expect.stringContaining("Project Polaris"), theme_color: "#8b5cf6" });
  });
});
