import { describe, expect, it } from "vitest";
import { getRouteMetadata } from "./RouteSeo";

describe("route SEO metadata", () => {
  it("marks private and missing routes as non-indexable", () => {
    expect(getRouteMetadata("/portal").indexable).toBe(false);
    expect(getRouteMetadata("/auth").indexable).toBe(false);
    expect(getRouteMetadata("/not-a-real-route").indexable).toBe(false);
  });

  it("provides unique indexable metadata for public learning routes", () => {
    const courses = getRouteMetadata("/courses");
    expect(courses.indexable).not.toBe(false);
    expect(courses.title).toContain("Courses");
    expect(courses.description).toContain("aerospace");
  });
});
