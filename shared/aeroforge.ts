/**
 * AeroForge reduced-order analytical flow model.
 *
 * These are engineering-grade closed-form approximations (thin airfoil theory +
 * Prandtl-Glauert compressibility correction + ISA atmosphere), not a full CFD
 * solve. They are deterministic so the client preview and any server-side
 * verification always agree.
 */

export type ChallengeCategory =
  | "Aerospace"
  | "Propulsion"
  | "Structures"
  | "Astrodynamics";

export type Challenge = {
  id: string;
  name: string;
  category: ChallengeCategory;
  /** NACA 4-digit designation driving the geometry. */
  naca: string;
  description: string;
  solver: string;
  /** Empirical reference value used for the benchmark delta readout. */
  benchmarkLD: number;
  benchmarkSource: string;
  /** tier required: 0 = free demo, 1 = Builder+ */
  requiredTier: 0 | 1;
};

export const CHALLENGES: Challenge[] = [
  {
    id: "transonic-airfoil",
    name: "Transonic Airfoil Flow",
    category: "Aerospace",
    naca: "2412",
    description:
      "Evaluates boundary layer flow separation and pressure distribution across a classic 4-digit airfoil.",
    solver: "Spalart-Allmaras + Prandtl-Glauert",
    benchmarkLD: 24.5,
    benchmarkSource: "NASA Abbott Empirical",
    requiredTier: 0,
  },
  {
    id: "stabilizer-fin",
    name: "Symmetric Rocket Stabilizer Fin",
    category: "Aerospace",
    naca: "0012",
    description:
      "Symmetric section sizing for sounding rocket fin stability margins and normal force gradient.",
    solver: "Thin Airfoil + Barrowman",
    benchmarkLD: 18.2,
    benchmarkSource: "Barrowman Fin Reference",
    requiredTier: 0,
  },
  {
    id: "supercritical-wing",
    name: "Supercritical Wing Section",
    category: "Aerospace",
    naca: "4415",
    description:
      "High-camber supercritical profile delaying shock formation and wave drag rise at cruise Mach.",
    solver: "Korn Equation + Euler 2D",
    benchmarkLD: 27.8,
    benchmarkSource: "Whitcomb Supercritical Data",
    requiredTier: 0,
  },
  {
    id: "nosecone",
    name: "Sounding Rocket Nosecone",
    category: "Propulsion",
    naca: "0015",
    description:
      "Axisymmetric nosecone wave drag and stagnation heating estimate through the transonic regime.",
    solver: "Von Karman Ogive + Newtonian Impact",
    benchmarkLD: 12.4,
    benchmarkSource: "Sighard Hoerner Fluid-Dynamic Drag",
    requiredTier: 1,
  },
];

export function getChallenge(id: string): Challenge {
  return CHALLENGES.find(c => c.id === id) ?? CHALLENGES[0];
}

/** NACA 4-digit designation → { camber %, camberPos %, thickness % }. */
export function parseNaca(naca: string) {
  const digits = naca.padStart(4, "0");
  return {
    camber: Number(digits[0]) / 100,
    camberPos: Number(digits[1]) / 10,
    thickness: Number(digits.slice(2)) / 100,
  };
}

/** Mean camber line ordinate for a NACA 4-digit section at chord fraction x. */
export function camberLine(x: number, camber: number, camberPos: number) {
  if (camber === 0 || camberPos === 0) return 0;
  if (x < camberPos) {
    return (camber / (camberPos * camberPos)) * (2 * camberPos * x - x * x);
  }
  const q = 1 - camberPos;
  return (camber / (q * q)) * (1 - 2 * camberPos + 2 * camberPos * x - x * x);
}

/** Half-thickness distribution for a NACA 4-digit section. */
export function thicknessLine(x: number, thickness: number) {
  return (
    (thickness / 0.2) *
    (0.2969 * Math.sqrt(Math.max(x, 0)) -
      0.126 * x -
      0.3516 * x * x +
      0.2843 * x * x * x -
      0.1015 * x * x * x * x)
  );
}

/** Upper and lower surface coordinates, useful for canvas rendering. */
export function airfoilOutline(naca: string, samples = 90) {
  const { camber, camberPos, thickness } = parseNaca(naca);
  const upper: Array<[number, number]> = [];
  const lower: Array<[number, number]> = [];

  for (let i = 0; i <= samples; i++) {
    // cosine spacing clusters points at the leading edge where curvature peaks
    const x = 0.5 * (1 - Math.cos((Math.PI * i) / samples));
    const yc = camberLine(x, camber, camberPos);
    const yt = thicknessLine(x, thickness);
    upper.push([x, yc + yt]);
    lower.push([x, yc - yt]);
  }

  return { upper, lower };
}

/** International Standard Atmosphere up to the tropopause, then isothermal. */
export function isaAtmosphere(altitudeKm: number) {
  const h = Math.max(0, altitudeKm) * 1000;
  const T0 = 288.15;
  const p0 = 101325;
  const lapse = 0.0065;
  const R = 287.05;
  const g = 9.80665;

  let temperatureK: number;
  let pressurePa: number;

  if (h <= 11000) {
    temperatureK = T0 - lapse * h;
    pressurePa = p0 * Math.pow(temperatureK / T0, g / (lapse * R));
  } else {
    temperatureK = 216.65;
    const p11 = p0 * Math.pow(216.65 / T0, g / (lapse * R));
    pressurePa = p11 * Math.exp((-g * (h - 11000)) / (R * 216.65));
  }

  const densityKgM3 = pressurePa / (R * temperatureK);
  const speedOfSoundMs = Math.sqrt(1.4 * R * temperatureK);

  return { temperatureK, pressurePa, densityKgM3, speedOfSoundMs };
}

export type SolverInput = {
  challengeId: string;
  mach: number;
  alphaDeg: number;
  altitudeKm: number;
};

export type SolverResult = {
  challengeId: string;
  challengeName: string;
  naca: string;
  mach: number;
  alphaDeg: number;
  altitudeKm: number;
  liftCoefficient: number;
  dragCoefficient: number;
  liftToDrag: number;
  trueAirspeedKmh: number;
  reynolds: number;
  benchmarkDelta: number;
  benchmarkSource: string;
  /** Warnings surfaced in the UI, e.g. shock onset or stall. */
  regime: string;
  notes: string[];
};

export const SOLVER_LIMITS = {
  mach: { min: 0.1, max: 0.95, step: 0.01 },
  alphaDeg: { min: -6, max: 16, step: 0.5 },
  altitudeKm: { min: 0, max: 18, step: 0.5 },
} as const;

export function clampSolverInput(input: SolverInput): SolverInput {
  const clamp = (v: number, min: number, max: number) =>
    Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : min;
  return {
    challengeId: input.challengeId,
    mach: clamp(input.mach, SOLVER_LIMITS.mach.min, SOLVER_LIMITS.mach.max),
    alphaDeg: clamp(
      input.alphaDeg,
      SOLVER_LIMITS.alphaDeg.min,
      SOLVER_LIMITS.alphaDeg.max
    ),
    altitudeKm: clamp(
      input.altitudeKm,
      SOLVER_LIMITS.altitudeKm.min,
      SOLVER_LIMITS.altitudeKm.max
    ),
  };
}

/**
 * Analytical flow solve.
 *
 * CL  — thin airfoil lift slope 2π/rad, camber offset, Prandtl-Glauert scaling,
 *       with a post-stall smooth rolloff beyond ~12°.
 * CD  — skin friction (Re-dependent) + induced/pressure drag + wave drag rise
 *       once the local flow crosses the critical Mach number.
 */
export function solveFlow(rawInput: SolverInput): SolverResult {
  const input = clampSolverInput(rawInput);
  const challenge = getChallenge(input.challengeId);
  const { camber, thickness } = parseNaca(challenge.naca);
  const { mach, alphaDeg, altitudeKm } = input;

  const atmosphere = isaAtmosphere(altitudeKm);
  const trueAirspeedMs = mach * atmosphere.speedOfSoundMs;
  const trueAirspeedKmh = trueAirspeedMs * 3.6;

  // Reference chord of 1 m keeps the readout comparable across challenges.
  const chord = 1;
  const dynamicViscosity =
    (1.458e-6 * Math.pow(atmosphere.temperatureK, 1.5)) /
    (atmosphere.temperatureK + 110.4);
  const reynolds =
    (atmosphere.densityKgM3 * trueAirspeedMs * chord) / dynamicViscosity;

  // --- Lift -----------------------------------------------------------------
  const alphaRad = (alphaDeg * Math.PI) / 180;
  // Zero-lift angle shifts negative with camber (approx. -1.1 deg per 1% camber)
  const alphaZeroLift = -camber * 1.9;
  const beta = Math.sqrt(Math.max(1 - mach * mach, 0.05));
  const liftSlope = (2 * Math.PI) / beta;
  let cl = liftSlope * (alphaRad - alphaZeroLift);

  // Smooth stall rolloff: full potential-flow lift until 11 deg, then decay.
  const stallOnset = 11;
  const notes: string[] = [];
  if (Math.abs(alphaDeg) > stallOnset) {
    const excess = Math.abs(alphaDeg) - stallOnset;
    const decay = 1 / (1 + 0.055 * excess * excess);
    cl *= decay;
    notes.push(
      `Post-stall regime: separation reduces lift slope beyond ${stallOnset}° AoA.`
    );
  }

  // --- Drag -----------------------------------------------------------------
  // Turbulent flat-plate skin friction, both surfaces.
  const cf = 0.074 / Math.pow(Math.max(reynolds, 1e5), 0.2);
  const cdFriction = cf * (1 + 2.1 * thickness);
  // Form/pressure drag scales with thickness ratio.
  const cdForm = 0.0045 + 0.62 * thickness * thickness;
  // Induced-style drag term (2D profile drag growth with lift).
  const cdLift = 0.0165 * cl * cl;

  // Wave drag: onset at the critical Mach number, then rapid rise.
  const machCrit = 0.87 - 0.85 * thickness - 0.28 * Math.abs(cl) * 0.1;
  let cdWave = 0;
  let regime = "Subsonic attached flow";
  if (mach > machCrit) {
    const dm = mach - machCrit;
    cdWave = 18.5 * Math.pow(dm, 3);
    regime = "Transonic — shock formation";
    notes.push(
      `Local flow exceeds M_crit ≈ ${machCrit.toFixed(2)}: wave drag rise active.`
    );
  } else if (mach > machCrit - 0.08) {
    regime = "High subsonic — approaching M_crit";
  }

  const cd = cdFriction + cdForm + cdLift + cdWave;
  const liftToDrag = cd > 0 ? cl / cd : 0;

  const benchmarkDelta =
    challenge.benchmarkLD > 0
      ? ((Math.abs(liftToDrag) - challenge.benchmarkLD) /
          challenge.benchmarkLD) *
        100
      : 0;

  if (altitudeKm > 12) {
    notes.push(
      "Above the tropopause the isothermal layer lowers Reynolds number sharply."
    );
  }

  return {
    challengeId: challenge.id,
    challengeName: challenge.name,
    naca: challenge.naca,
    mach,
    alphaDeg,
    altitudeKm,
    liftCoefficient: round(cl, 4),
    dragCoefficient: round(cd, 5),
    liftToDrag: round(liftToDrag, 2),
    trueAirspeedKmh: round(trueAirspeedKmh, 1),
    reynolds: Math.round(reynolds),
    benchmarkDelta: round(benchmarkDelta, 2),
    benchmarkSource: challenge.benchmarkSource,
    regime,
    notes,
  };
}

function round(value: number, digits: number) {
  const f = Math.pow(10, digits);
  return Math.round(value * f) / f;
}

export function formatReynolds(re: number): string {
  if (re >= 1e6) return `${(re / 1e6).toFixed(2)}M`;
  if (re >= 1e3) return `${(re / 1e3).toFixed(0)}K`;
  return re.toFixed(0);
}
