import { describe, expect, it } from "vitest";
import { CHALLENGES, solveFlow } from "./aeroforge";

describe("AeroForge reduced-order solver", () => {
  it("returns finite physically ordered metrics for a nominal transonic trial", () => {
    const result = solveFlow({ challengeId: "transonic-airfoil", mach: 0.62, alphaDeg: 4, altitudeKm: 5 });
    expect(result.liftCoefficient).toBeGreaterThan(0);
    expect(result.dragCoefficient).toBeGreaterThan(0);
    expect(result.liftToDrag).toBeGreaterThan(0);
    expect(result.trueAirspeedKmh).toBeGreaterThan(0);
    expect(Number.isFinite(result.reynolds)).toBe(true);
  });

  it("changes lift prediction when angle of attack changes", () => {
    const lowAlpha = solveFlow({ challengeId: "transonic-airfoil", mach: 0.62, alphaDeg: 1, altitudeKm: 5 });
    const highAlpha = solveFlow({ challengeId: "transonic-airfoil", mach: 0.62, alphaDeg: 7, altitudeKm: 5 });
    expect(highAlpha.liftCoefficient).toBeGreaterThan(lowAlpha.liftCoefficient);
  });

  it("supports all four published laboratory challenges", () => {
    expect(CHALLENGES).toHaveLength(4);
    for (const challenge of CHALLENGES) {
      const result = solveFlow({ challengeId: challenge.id, mach: challenge.defaults.mach, alphaDeg: challenge.defaults.alphaDeg, altitudeKm: challenge.defaults.altitudeKm });
      expect(result.challengeName).toBe(challenge.name);
      expect(result.dragCoefficient).toBeGreaterThan(0);
    }
  });
});
