import express from "express";
import { createServer } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { registerSeoRoutes } from "./seoRoutes";

let server: ReturnType<typeof createServer> | undefined;

async function get(route: string) {
  const app = express();
  registerSeoRoutes(app);
  server = createServer(app);
  await new Promise<void>(resolve => server?.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not bind to a numeric port");
  return fetch(`http://127.0.0.1:${address.port}${route}`);
}

afterEach(async () => {
  if (server) await new Promise<void>(resolve => server?.close(() => resolve()));
  server = undefined;
});

describe("explicit crawler routes", () => {
  it("serves robots and sitemap before SPA fallback middleware", async () => {
    const robots = await get("/robots.txt");
    expect(robots.status).toBe(200);
    expect(await robots.text()).toContain("Sitemap: https://projectpolaris.live/sitemap.xml");
    const sitemap = await get("/sitemap.xml");
    expect(sitemap.headers.get("content-type")).toContain("application/xml");
    expect(await sitemap.text()).toContain("https://projectpolaris.live/aeroforge");
  });

  it("serves the manifest and security policy with bot-friendly content types", async () => {
    const manifest = await get("/manifest.webmanifest");
    expect(manifest.headers.get("content-type")).toContain("application/manifest+json");
    expect(await manifest.json()).toMatchObject({ short_name: "Project Polaris" });
    const security = await get("/.well-known/security.txt");
    expect(await security.text()).toContain("Contact: https://projectpolaris.live/contact");
  });
});
