import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("homepage image alternative text", () => {
  it("gives each rendered shared homepage logo a descriptive alternative text", async () => {
    const root = process.cwd();
    const [logo, header, footer] = await Promise.all([
      readFile(path.resolve(root, "client/src/components/PolarisLogo.tsx"), "utf8"),
      readFile(path.resolve(root, "client/src/components/SiteHeader.tsx"), "utf8"),
      readFile(path.resolve(root, "client/src/components/SiteFooter.tsx"), "utf8"),
    ]);

    expect(logo).toContain('alt="Project Polaris logo"');
    expect(header).toContain("<PolarisLogo");
    expect(footer).toContain("<PolarisLogo");
  });
});
