import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("FastAPI reference runtime boundary", () => {
  it("keeps FastAPI as a non-live migration artifact while Node/tRPC remains the active runtime", async () => {
    const [reference, packageJson] = await Promise.all([
      readFile(new URL("../fastapi_reference/app/main.py", import.meta.url), "utf8"),
      readFile(new URL("../package.json", import.meta.url), "utf8"),
    ]);

    expect(reference).toContain("intentionally not started by the deployed application");
    expect(reference).toContain("future dedicated FastAPI runtime");
    expect(packageJson).toContain('"start": "NODE_ENV=production node dist/index.js"');
    expect(packageJson).toContain('"test:fastapi-reference"');
  });
});
