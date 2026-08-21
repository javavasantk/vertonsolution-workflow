/**
 * Static editorial content for the Polaris portal. Kept in `shared/` so both
 * the marketing pages and any server-side procedure reference one source.
 */

export type CatalogType = "workshop" | "course" | "bootcamp" | "project";
export type Difficulty = "beginner" | "intermediate" | "advanced" | "all";

export const DOMAINS = [
  "Aerospace",
  "Astronomy",
  "Physics",
  "Engineering",
  "Programming & Data",
  "AI & Simulation",
] as const;

export type Domain = (typeof DOMAINS)[number];

export type CatalogItem = {
  slug: string;
  type: CatalogType;
  title: string;
  tagline: string;
  description: string;
  duration: string;
  difficulty: Difficulty;
  domains: Domain[];
  status: "open" | "upcoming" | "application" | "active";
  lead?: { name: string; affiliation: string };
  outcomes: string[];
  syllabus: { label: string; detail: string }[];
  ctaLabel: string;
  ctaHref: string;
  /** Minimum plan tier required to consume the full material. */
  requiredTier: 0 | 1 | 2;
  finalProject?: string;
  seats?: string;
  startsOn?: string;
  scheduleLabel?: string;
};

export const CATALOG: CatalogItem[] = [
  {
    slug: "rockets-propulsion-fundamentals",
    type: "workshop",
    title: "Fundamentals of Rockets & Propulsion Technology",
    tagline: "Thrust equations, specific impulse, and nozzle expansion dynamics.",
    description:
      "An interactive live masterclass exploring rocket propulsion from first principles: specific impulse, chamber pressure, nozzle exit velocity, and real aerospace defence pathways.",
    duration: "90 min",
    difficulty: "beginner",
    domains: ["Aerospace", "Physics", "Engineering"],
    status: "upcoming",
    lead: { name: "Prakhar Vishwakarma", affiliation: "Missile Man of MP" },
    outcomes: [
      "Understand rocket equation & delta-v fundamentals",
      "Calculate thrust coefficient & specific impulse (Isp)",
      "Size a converging-diverging nozzle for sea-level expansion",
      "Map defence and space research career pathways",
    ],
    syllabus: [
      {
        label: "01 · Propulsion first principles",
        detail:
          "Newton's third law applied to mass flow, momentum thrust versus pressure thrust.",
      },
      {
        label: "02 · The rocket equation",
        detail:
          "Tsiolkovsky derivation, mass fractions, and staging trade studies.",
      },
      {
        label: "03 · Nozzle design",
        detail:
          "Area ratio selection, over- and under-expansion, exit velocity computation.",
      },
      {
        label: "04 · Pitch & Win challenge",
        detail:
          "Students present a mission concept and defend their propulsion choices.",
      },
    ],
    ctaLabel: "Reserve Seat (Free)",
    ctaHref: "/auth",
    requiredTier: 0,
    scheduleLabel: "July 2 · 7:00 PM IST",
  },
  {
    slug: "journey-to-isro",
    type: "workshop",
    title: "From Dreams to Space Missions: A Journey to ISRO",
    tagline:
      "Post-launch satellite operations, orbit tracking, and space situational awareness.",
    description:
      "Ankit Gupta (Scientist 'SC' at ISRO Master Control Facility) takes students behind the scenes of satellite operations: orbit determination, collision avoidance, and station keeping.",
    duration: "90 min",
    difficulty: "beginner",
    domains: ["Aerospace", "Astronomy", "Engineering"],
    status: "open",
    lead: { name: "Ankit Gupta", affiliation: "Master Control Facility, ISRO" },
    outcomes: [
      "Learn what happens after a satellite reaches orbit",
      "Understand orbit determination, telemetry, and tracking (TT&C)",
      "Walk through a real collision avoidance manoeuvre decision",
      "See how station keeping budgets mission lifetime",
    ],
    syllabus: [
      {
        label: "01 · Inside a control facility",
        detail: "Ground segment architecture, antennas, and operator shifts.",
      },
      {
        label: "02 · Orbit determination",
        detail: "Ranging, doppler, and least-squares state estimation.",
      },
      {
        label: "03 · Conjunction assessment",
        detail: "Screening volumes, probability of collision, manoeuvre planning.",
      },
      {
        label: "04 · Station keeping",
        detail: "North-south and east-west corrections, fuel budgeting.",
      },
    ],
    ctaLabel: "Reserve Seat",
    ctaHref: "/auth",
    requiredTier: 0,
  },
  {
    slug: "mystery-celestial-objects",
    type: "workshop",
    title: "Mystery Celestial Objects: Stellar Evolution & Galaxies",
    tagline:
      "Nebulae, dying star remnants, galactic morphologies, and Build-a-Galaxy challenge.",
    description:
      "Vranda Gupta (Stellar Freaks) leads an interactive deep dive into galactic architectures, star life cycles, and planetary nebulae with hands-on rapid-fire quizzes.",
    duration: "90 min",
    difficulty: "beginner",
    domains: ["Astronomy", "Physics"],
    status: "open",
    lead: { name: "Vranda Gupta", affiliation: "Stellar Freaks" },
    outcomes: [
      "Classify spiral, elliptical, and irregular galactic morphologies",
      "Trace the stellar life cycle from nebulae to white dwarfs and black holes",
      "Read a Hertzsprung-Russell diagram confidently",
      "Build a plausible galaxy in the closing design challenge",
    ],
    syllabus: [
      {
        label: "01 · Star formation",
        detail: "Molecular clouds, Jeans instability, protostellar collapse.",
      },
      {
        label: "02 · Main sequence and beyond",
        detail: "Mass-luminosity relation, shell burning, degenerate remnants.",
      },
      {
        label: "03 · Galaxy zoo",
        detail: "Hubble sequence, mergers, active galactic nuclei.",
      },
      {
        label: "04 · Build-a-Galaxy",
        detail: "Teams assemble a self-consistent galaxy and defend it.",
      },
    ],
    ctaLabel: "Reserve Seat",
    ctaHref: "/auth",
    requiredTier: 0,
  },
  {
    slug: "orbital-mechanics-first-principles",
    type: "course",
    title: "Orbital Mechanics from First Principles",
    tagline: "From Kepler's laws to Hohmann transfer delta-v calculations.",
    description:
      "Go from basic gravitational physics to computing orbital insertion burns, Keplerian state vectors, and interplanetary transfer trajectories with Python exercises.",
    duration: "6 lessons · ~4 hours",
    difficulty: "intermediate",
    domains: ["Aerospace", "Physics", "Programming & Data"],
    status: "open",
    outcomes: [
      "Derive Kepler's 3 laws from Newton's universal gravitation",
      "Compute orbital velocity via vis-viva equation at perigee/apogee",
      "Convert between classical elements and Cartesian state vectors",
      "Budget a two-impulse Hohmann transfer end to end",
    ],
    syllabus: [
      { label: "Lesson 1 · Gravitation", detail: "Two-body problem and the conic solution." },
      { label: "Lesson 2 · Kepler's laws", detail: "Geometric and energy interpretations." },
      { label: "Lesson 3 · Vis-viva", detail: "Specific orbital energy and velocity at any radius." },
      { label: "Lesson 4 · State vectors", detail: "Element-to-vector conversion in Python." },
      { label: "Lesson 5 · Transfers", detail: "Hohmann, bi-elliptic, and plane changes." },
      { label: "Lesson 6 · Capstone", detail: "Build the delta-v calculator." },
    ],
    ctaLabel: "Start Learning",
    ctaHref: "/auth",
    requiredTier: 1,
    finalProject: "Hohmann Transfer Delta-V Calculator",
  },
  {
    slug: "airfoil-aerodynamics-cfd",
    type: "course",
    title: "Airfoil Aerodynamics & CFD Solvers",
    tagline: "Boundary layer separation, NACA profiles, and Navier-Stokes approximations.",
    description:
      "Understand how lift and wave drag are computed on lifting surfaces. Model NACA 4-digit airfoils, thin airfoil theory, and Prandtl-Glauert compressibility corrections.",
    duration: "8 lessons · ~5 hours",
    difficulty: "intermediate",
    domains: ["Aerospace", "Engineering", "Physics"],
    status: "open",
    outcomes: [
      "Understand circulation and the Kutta-Joukowski lift theorem",
      "Model NACA 4-digit camber lines and thickness distributions",
      "Apply Prandtl-Glauert scaling to compressible subsonic flow",
      "Interpret pressure contours and separation onset",
    ],
    syllabus: [
      { label: "Lesson 1 · Circulation", detail: "Vorticity, Kutta condition, and lift." },
      { label: "Lesson 2 · Thin airfoil theory", detail: "Lift slope and zero-lift angle." },
      { label: "Lesson 3 · Geometry", detail: "NACA 4-digit generation from digits." },
      { label: "Lesson 4 · Boundary layers", detail: "Laminar, turbulent, and transition." },
      { label: "Lesson 5 · Separation", detail: "Adverse pressure gradients and stall." },
      { label: "Lesson 6 · Compressibility", detail: "Prandtl-Glauert and critical Mach." },
      { label: "Lesson 7 · Wave drag", detail: "Shock formation and drag rise." },
      { label: "Lesson 8 · Capstone", detail: "Run and validate an AeroForge sweep." },
    ],
    ctaLabel: "Start Learning",
    ctaHref: "/auth",
    requiredTier: 1,
    finalProject: "Airfoil Polar Sweep in AeroForge",
  },
  {
    slug: "astronomical-data-fits",
    type: "course",
    title: "Astronomical Data & FITS Pipelines",
    tagline: "From raw sensor photons to calibrated stellar light curves and Messier catalogs.",
    description:
      "Learn how modern astronomers process telescope image data: bias subtraction, dark frame calibration, flat fielding, and aperture photometry.",
    duration: "5 lessons · ~3.5 hours",
    difficulty: "beginner",
    domains: ["Astronomy", "Programming & Data", "Physics"],
    status: "open",
    outcomes: [
      "Understand CCD sensor noise and signal-to-noise ratio (SNR)",
      "Process FITS astronomical headers and raw matrix arrays",
      "Run a full bias/dark/flat calibration chain",
      "Extract a light curve with aperture photometry",
    ],
    syllabus: [
      { label: "Lesson 1 · Detectors", detail: "CCD/CMOS physics, read noise, dark current." },
      { label: "Lesson 2 · FITS format", detail: "Headers, HDUs, and metadata hygiene." },
      { label: "Lesson 3 · Calibration", detail: "Master bias, dark, and flat construction." },
      { label: "Lesson 4 · Photometry", detail: "Apertures, annuli, and background estimation." },
      { label: "Lesson 5 · Capstone", detail: "Publish a variable-star light curve." },
    ],
    ctaLabel: "Start Learning",
    ctaHref: "/auth",
    requiredTier: 1,
    finalProject: "Variable Star Light Curve",
  },
  {
    slug: "aerospace-systems-bootcamp",
    type: "bootcamp",
    title: "Aerospace Systems & Flight Simulation Bootcamp",
    tagline: "6 weeks · Cohort · 25 seats · Mentored by practising aerospace engineers.",
    description:
      "An intensive team sprint building an end-to-end flight dynamics and aerodynamic simulation model. Work in a cohort of 25 ambitious peers with weekly code reviews.",
    duration: "6 weeks",
    difficulty: "advanced",
    domains: ["Aerospace", "Engineering", "AI & Simulation"],
    status: "application",
    outcomes: [
      "Build a 6-DOF aircraft performance and stability model",
      "Implement aerodynamic coefficient lookup matrices",
      "Validate against published flight test data",
      "Ship a documented, reviewed simulation repository",
    ],
    syllabus: [
      { label: "Week 1 · Reference frames", detail: "Body, wind, and inertial transformations." },
      { label: "Week 2 · Aerodynamic model", detail: "Coefficient build-up and interpolation." },
      { label: "Week 3 · Equations of motion", detail: "6-DOF integration and trim." },
      { label: "Week 4 · Stability", detail: "Static and dynamic modes, eigenvalue analysis." },
      { label: "Week 5 · Validation", detail: "Benchmarking against flight test datasets." },
      { label: "Week 6 · Demo day", detail: "Public defence of the simulation." },
    ],
    ctaLabel: "Apply to Cohort",
    ctaHref: "/pricing",
    requiredTier: 2,
    seats: "25 Seats · Application Required",
    startsOn: "Cohort Starts September 2026",
  },
  {
    slug: "rocket-avionics-bootcamp",
    type: "bootcamp",
    title: "Sounding Rocket Avionics & Telemetry Bootcamp",
    tagline: "4 weeks · Cohort · 20 seats · Sensor fusion, Kalman filtering & telemetry.",
    description:
      "Design, build, and simulate flight computer avionics for atmospheric sounding rockets. Combine barometric pressure, 9-axis IMUs, and real-time radio telemetry.",
    duration: "4 weeks",
    difficulty: "advanced",
    domains: ["Aerospace", "Engineering", "Programming & Data"],
    status: "application",
    outcomes: [
      "Implement sensor fusion with an Extended Kalman Filter (EKF)",
      "Detect apogee and trigger dual-deployment recovery events",
      "Design a telemetry packet protocol with checksums",
      "Bench-test the flight computer against recorded flight data",
    ],
    syllabus: [
      { label: "Week 1 · Sensors", detail: "Barometers, IMUs, calibration and bias." },
      { label: "Week 2 · Estimation", detail: "EKF formulation for altitude and attitude." },
      { label: "Week 3 · Event logic", detail: "Apogee detection and deployment safety." },
      { label: "Week 4 · Telemetry", detail: "Packet design, radio link budget, ground station." },
    ],
    ctaLabel: "Apply to Cohort",
    ctaHref: "/pricing",
    requiredTier: 2,
    seats: "20 Seats · Application Required",
    startsOn: "Cohort Starts October 2026",
  },
  {
    slug: "aeroforge-workstation",
    type: "project",
    title: "AeroForge AI Physics Workstation",
    tagline: "40+ numerical physics solvers across CFD, FEA, and orbital Keplerian dynamics.",
    description:
      "An open-source browser engineering workstation built by students. Run 2D/3D CFD flow solvers, supersonic wave drag, and N-body gravitational propagators.",
    duration: "Active Platform",
    difficulty: "all",
    domains: ["Aerospace", "AI & Simulation", "Programming & Data"],
    status: "active",
    outcomes: [
      "Simulate transonic shock delay and boundary layer separation",
      "Compute orbital Hohmann transfers and state vectors",
      "Contribute solver modules to the open repository",
      "Publish reproducible benchmark comparisons",
    ],
    syllabus: [
      { label: "Track A · Solver core", detail: "Numerical schemes and validation harness." },
      { label: "Track B · Visualisation", detail: "Canvas/WebGL contour and streamline rendering." },
      { label: "Track C · Benchmarks", detail: "Reference datasets and delta reporting." },
    ],
    ctaLabel: "Launch AeroForge Lab",
    ctaHref: "/aeroforge",
    requiredTier: 0,
  },
  {
    slug: "sky-atlas-registry",
    type: "project",
    title: "Sky Atlas Deep-Sky Observational Registry",
    tagline: "Open astronomical observation database and constellation guide.",
    description:
      "A student-maintained observation catalog tracking nebulae, star clusters, and variable stars from community night-sky observation sessions.",
    duration: "Active Platform",
    difficulty: "beginner",
    domains: ["Astronomy", "Programming & Data"],
    status: "active",
    outcomes: [
      "Maintain an open astronomical observation database",
      "Build an interactive Messier object browser",
      "Ingest and calibrate community observation logs",
      "Publish a printable seasonal star guide",
    ],
    syllabus: [
      { label: "Track A · Catalog", detail: "Schema design and cross-identification." },
      { label: "Track B · Ingest", detail: "Observation log parsing and validation." },
      { label: "Track C · Atlas UI", detail: "Sky map projection and object pages." },
    ],
    ctaLabel: "Explore Sky Atlas",
    ctaHref: "/projects",
    requiredTier: 0,
  },
];

export const LEARNING_LADDER = [
  {
    index: "01",
    duration: "60–120 min",
    title: "Workshops",
    subtitle: "Learn in one sitting",
    description:
      "Expert-led masterclasses by ISRO scientists, defence researchers, and engineers with live interactive Q&A and pitch challenges.",
    href: "/courses?type=workshop",
    cta: "Explore Workshops",
  },
  {
    index: "02",
    duration: "2–7 hours",
    title: "Mini-Courses",
    subtitle: "Build a skill",
    description:
      "Structured self-paced modules with hands-on computational exercises, conceptual quizzes, and a working final mini-project.",
    href: "/courses?type=course",
    cta: "Explore Mini-Courses",
  },
  {
    index: "03",
    duration: "3–6 weeks",
    title: "Bootcamps",
    subtitle: "Go deep with a squad",
    description:
      "Intensive cohort sprints with weekly live mentor reviews, team assignments, and production-grade engineering systems.",
    href: "/courses?type=bootcamp",
    cta: "Explore Bootcamps",
  },
  {
    index: "04",
    duration: "2+ weeks",
    title: "Projects & Labs",
    subtitle: "Put it into practice",
    description:
      "Collaborative student build squads shipping open-source simulation tools, research digests, and physical prototypes.",
    href: "/projects",
    cta: "Explore Projects & Labs",
  },
];

export const PATHWAYS = [
  {
    statement: "I have 1–2 hours",
    meta: "60–90 min",
    title: "Try a Live Workshop",
    description:
      "Learn from practicing scientists in interactive sessions with real-world context.",
    href: "/courses?type=workshop",
  },
  {
    statement: "I want to master a specific skill",
    meta: "2–7 hours",
    title: "Take a Mini-Course",
    description:
      "Follow modular lessons with interactive calculations and build a working solver.",
    href: "/courses?type=course",
  },
  {
    statement: "I want an intensive cohort experience",
    meta: "3–6 weeks",
    title: "Join a Bootcamp",
    description:
      "Collaborate in a 25-seat sprint with weekly mentor reviews and code evaluations.",
    href: "/courses?type=bootcamp",
  },
  {
    statement: "I want to build a real engineering platform",
    meta: "Active Sprints",
    title: "Join a Build Squad",
    description:
      "Team up on open aerospace platforms, orbital solvers, or observation networks.",
    href: "/projects",
  },
  {
    statement: "I want to explore on my own",
    meta: "Self-Paced",
    title: "Browse Free Resources",
    description:
      "Free guides, mathematical primers, solver blueprints, and lecture notes.",
    href: "/resources",
  },
];

export const STATS = [
  {
    value: "40+",
    label: "Physics solvers",
    description: "CFD, FEA, orbital & propulsion suites.",
  },
  {
    value: "10+",
    label: "Active project squads",
    description: "Student teams building open systems.",
  },
  {
    value: "120+",
    label: "Community builders",
    description: "Curious students & mentors learning together.",
  },
  {
    value: "90+",
    label: "Aaj Ka Gyan posts",
    description: "Daily curated scientific inquiry drops.",
  },
  {
    value: "4",
    label: "Subscription tiers",
    description: "Explorer, Builder, Builder Annual, Squad Pro.",
  },
];

export type Initiative = {
  id: string;
  domain: string;
  title: string;
  description: string;
  level: string;
  duration: string;
  progress: number;
  members: string;
  flagship?: boolean;
  journey: string[];
  ships: string[];
  stack: string;
};

export const INITIATIVES: Initiative[] = [
  {
    id: "aeroforge",
    domain: "Aerospace & CFD",
    title: "AeroForge AI Simulation Workstation",
    description:
      "Browser-based engineering research workstation with 40+ physics solvers across CFD aerodynamics, structural FEA, and orbital mechanics.",
    level: "Intermediate / Advanced",
    duration: "4–6 weeks",
    progress: 88,
    members: "4 / 5 members",
    flagship: true,
    journey: ["Understand", "Model", "Implement", "Validate", "Ship"],
    ships: [
      "Working Simulation",
      "GitHub Repository",
      "Technical Report",
      "Showcase Page",
      "Mentor Review",
    ],
    stack: "Python · TypeScript · WebGL · Physics",
  },
  {
    id: "sky-atlas",
    domain: "Astronomy",
    title: "Sky Atlas Deep-Sky Registry",
    description:
      "An open, student-maintained deep-sky catalog and constellation mapping database with observations recorded across community stargazing nights.",
    level: "Beginner / Intermediate",
    duration: "3–4 weeks",
    progress: 75,
    members: "3 / 5 members",
    journey: ["Catalog", "Ingest", "Calibrate", "Map", "Publish"],
    ships: ["Celestial Database", "FITS Viewer", "Observation Log", "Star Guide"],
    stack: "FITS · Astronomy Data · React",
  },
  {
    id: "research-digest",
    domain: "Technical Research",
    title: "Polaris Peer-Reviewed Research Digest",
    description:
      "A recurring student-written and peer-reviewed technical digest that summarizes and verifies recent space science and propulsion research papers.",
    level: "All Skill Levels",
    duration: "Recurring Bi-Weekly",
    progress: 90,
    members: "5 / 6 members",
    journey: ["Survey", "Hypothesize", "Verify", "Peer Review", "Release"],
    ships: ["PDF Digest", "Technical Summary", "Citation Index", "Community AMA"],
    stack: "LaTeX · Peer Review · Literature Survey",
  },
  {
    id: "school-lab-kit",
    domain: "K-12 Outreach",
    title: "School Laboratory & Telemetry Kit",
    description:
      "A ready-to-run interactive laboratory curriculum, stomp rocket telemetry kit, and telescope workshop modules for middle and high schools.",
    level: "Beginner",
    duration: "2 weeks",
    progress: 65,
    members: "3 / 4 members",
    journey: ["Scope", "Build Kit", "Test in Schools", "Refine", "Deploy"],
    ships: [
      "Curriculum Modules",
      "Hardware Specs",
      "Facilitator Guide",
      "Student Worksheets",
    ],
    stack: "Optics · Rocket Telemetry · Lab Curriculum",
  },
];

export const OPEN_SQUADS = [
  {
    domain: "Aerospace",
    level: "Intermediate",
    stack: "TypeScript · WebGL · Navier-Stokes",
    sprint: "Compressible shock wave & transonic drag rise modeling",
    builders: "4 / 5 builders",
  },
  {
    domain: "Astrodynamics",
    level: "Advanced",
    stack: "Python · Astrodynamics · RK4",
    sprint: "N-Body gravitational perturbation & J2 zonal harmonics",
    builders: "2 / 4 builders",
  },
  {
    domain: "Astronomy",
    level: "Beginner",
    stack: "FITS · React · Astronomy Data",
    sprint: "Messier 42 photometer spectral calibration pipeline",
    builders: "3 / 5 builders",
  },
  {
    domain: "Hardware & Data",
    level: "Intermediate",
    stack: "C++ · ESP32 · Kalman Filter",
    sprint: "Barometric altitude sensor fusion & apogee detection",
    builders: "3 / 4 builders",
  },
];

export const SHOWCASE = [
  {
    type: "software",
    squad: "Core Engineering Squad",
    title: "AeroForge AI Simulation Workstation",
    description:
      "Browser-based engineering research workstation with 40+ physics solvers across CFD aerodynamics, structural FEA, and orbital mechanics.",
    metrics: ["40+ solvers", "MIT licensed", "4 contributors"],
  },
  {
    type: "software",
    squad: "Astrophysics Squad",
    title: "Sky Atlas Deep-Sky Registry",
    description:
      "An open, student-maintained deep-sky catalog and constellation mapping database with observations recorded across community stargazing nights.",
    metrics: ["312 objects", "FITS viewer", "3 contributors"],
  },
  {
    type: "research",
    squad: "Research Department",
    title: "Bi-Weekly Peer-Reviewed Digest",
    description:
      "A recurring student-written and peer-reviewed technical digest that summarizes and verifies recent space science and propulsion research papers.",
    metrics: ["18 issues", "Peer reviewed", "6 authors"],
  },
  {
    type: "outreach",
    squad: "Outreach Team",
    title: "School Laboratory & Telemetry Kit",
    description:
      "A ready-to-run interactive laboratory curriculum, stomp rocket telemetry kit, and telescope workshop modules for middle and high schools.",
    metrics: ["9 schools", "Grades 6–12", "Open curriculum"],
  },
];

export const RESEARCH = [
  {
    title: "Transonic Airfoil Flow & Supercritical Shock Delay",
    authors: "Research Department & AeroForge CFD Squad",
    abstract:
      "A comparative analysis of Prandtl-Glauert compressibility corrections versus full 2D Euler equations for predicting wave drag rise on transonic wing sections.",
    tags: ["Aerodynamics", "CFD", "Verification"],
    issue: "Digest 18",
  },
  {
    title: "J2 Zonal Harmonic Perturbations in Low Earth Orbit",
    authors: "Astrodynamics Squad",
    abstract:
      "Quantifying nodal regression and apsidal rotation for sun-synchronous mission design, benchmarked against published two-line element propagation.",
    tags: ["Astrodynamics", "Orbit Determination"],
    issue: "Digest 17",
  },
  {
    title: "Extended Kalman Filtering for Sounding Rocket Apogee Detection",
    authors: "Hardware & Data Squad",
    abstract:
      "Sensor fusion of barometric and inertial measurements to reduce apogee detection latency, validated against recorded amateur rocketry flight logs.",
    tags: ["Avionics", "Estimation", "Hardware"],
    issue: "Digest 16",
  },
  {
    title: "Aperture Photometry Pipelines for Community Telescope Networks",
    authors: "Astrophysics Squad",
    abstract:
      "A reproducible calibration chain converting raw community CCD frames into publishable variable-star light curves with quantified uncertainty.",
    tags: ["Astronomy", "Data Pipelines"],
    issue: "Digest 15",
  },
];

export const RESOURCES = [
  {
    title: "Understanding Hohmann Transfers & The Vis-Viva Equation",
    domains: ["Astrodynamics", "Physics"],
    description:
      "Learn how spacecraft transition between circular planetary orbits using two-impulse tangential burns. Understand orbital energy conservation and calculate delta-v budgets from first principles.",
    kind: "Primer",
  },
  {
    title: "NACA 4-Digit Airfoil Geometry Cheat Sheet",
    domains: ["Aerospace", "Engineering"],
    description:
      "The camber line and thickness distribution equations behind every 4-digit section, with worked coordinates for 2412, 0012, and 4415.",
    kind: "Cheat Sheet",
  },
  {
    title: "Reading a Hertzsprung-Russell Diagram",
    domains: ["Astronomy", "Physics"],
    description:
      "A visual walkthrough of stellar classification, luminosity classes, and how to place a star on the main sequence from observed colour and magnitude.",
    kind: "Guide",
  },
  {
    title: "International Standard Atmosphere Reference Tables",
    domains: ["Aerospace", "Physics"],
    description:
      "Temperature, pressure, density, and speed of sound from sea level to 20 km, with the lapse-rate equations used by the AeroForge solver.",
    kind: "Reference",
  },
  {
    title: "Solver Blueprint: Building a 6-DOF Flight Model",
    domains: ["Aerospace", "Programming & Data"],
    description:
      "The architecture, state vector layout, and integration scheme we use in the Aerospace Systems bootcamp, written as an implementable specification.",
    kind: "Blueprint",
  },
  {
    title: "Python for Numerical Physics: A Fast Start",
    domains: ["Programming & Data", "Physics"],
    description:
      "NumPy array thinking, vectorised integrators, and plotting conventions for students moving from spreadsheets to real numerical work.",
    kind: "Primer",
  },
];

export const TEAM = [
  {
    role: "Founder",
    description:
      "Leading the core vision, community ecosystem, and student-led initiatives across Project Polaris.",
  },
  {
    role: "Founding Member",
    description:
      "Co-founding partner driving foundational community outreach, youth engagement, and curriculum design.",
  },
  {
    role: "Content Head",
    description:
      "Directing educational content curation, daily Aaj Ka Gyan series, and community scientific publications.",
  },
  {
    role: "Research Head",
    description:
      "Spearheading student research programs, simulation frameworks, and technical development pipelines.",
  },
  {
    role: "Operations Head",
    description:
      "Overseeing logistics, workshop execution, volunteer coordination, and cohort operations.",
  },
  {
    role: "Research Volunteer",
    description:
      "Supporting physics simulation verification, literature surveys, and student research digests.",
  },
];

export const CORE_VALUES = [
  {
    title: "Curiosity",
    detail:
      "We encourage questioning, deep exploration, and continuous inquiry beyond textbook bounds.",
  },
  {
    title: "Innovation",
    detail:
      "We embrace bold creativity and seek better, computational ways to solve engineering problems.",
  },
  {
    title: "Applied learning",
    detail:
      "Real learning happens when knowledge is immediately applied to build and test real systems.",
  },
  {
    title: "Accessibility",
    detail:
      "Industry-relevant tools and research opportunities should be universally open to all students.",
  },
  {
    title: "Collaboration",
    detail:
      "Breakthroughs happen when diverse, passionate student minds work together in agile sprint cohorts.",
  },
  {
    title: "Rigour",
    detail:
      "We continuously refine, test, simulate, and verify everything we build to high engineering standards.",
  },
  {
    title: "Integrity",
    detail:
      "We value honesty, rigorous scientific verification, academic ethics, and transparency.",
  },
  {
    title: "Resilience",
    detail:
      "We view obstacles as learning moments and encourage fearless experimentation.",
  },
  {
    title: "Student ownership",
    detail:
      "We put students in the driver's seat to lead projects, departments, and public masterclasses.",
  },
];

export const SCHOOL_FORMATS = [
  {
    title: "Hands-on Engineering Workshop",
    duration: "60–120 minutes",
    description:
      "A practical workshop run by our team and expert guests, built around aerodynamics, rocketry, or space telemetry.",
  },
  {
    title: "Multi-Day Experiential Camp",
    duration: "3–5 days",
    description:
      "A sprint across term breaks, ending with functional hardware prototypes, aerodynamic simulations, and a live presentation.",
  },
  {
    title: "Space Club Incubation",
    duration: "Ongoing",
    description:
      "We assist in launching and mentoring a student-led space club with open activity calendars, software access, and mentor check-ins.",
  },
  {
    title: "Practitioner Guest Lecture",
    duration: "60 minutes",
    description:
      "Direct technical interactive lecture for middle and high schools with aerospace researchers and industry engineers.",
  },
];

export const SCHOOL_PROCESS = [
  {
    step: "01",
    title: "Request",
    detail:
      "Submit your school details, target student group size, and preferred topics.",
  },
  {
    step: "02",
    title: "Curriculum Alignment",
    detail:
      "A short sync with our educators to align with your school's academic timetable.",
  },
  {
    step: "03",
    title: "Logistics & Materials",
    detail:
      "We share laboratory kits, software requirements, and session blueprints.",
  },
  {
    step: "04",
    title: "Delivery & Verification",
    detail:
      "We facilitate the workshop with student mentors and provide verified certificates.",
  },
];

export const SCHOOL_FAQ = [
  {
    question: "Is there a cost for schools?",
    answer:
      "Single community workshops and introductory talks are supported through our open outreach initiative. Multi-day experiential camps have transparent subsidised kit costs.",
  },
  {
    question: "What facilities do we need?",
    answer:
      "A standard AV-enabled classroom or lab. For computational simulation workshops, standard student laptops or a computer lab are sufficient.",
  },
  {
    question: "Which grades do you support?",
    answer:
      "Grades 6 through 12. We customize curriculum depth from observational astronomy to advanced numerical physics.",
  },
  {
    question: "Do you deliver sessions remotely?",
    answer:
      "Yes. We deliver live virtual interactive workshops across all regions and in-person sessions with partner schools.",
  },
];

export const PROGRAMS = [
  {
    title: "Fundamentals of Rockets & Space Technology",
    status: "Completed",
    cohort: "Session 01",
    description:
      "Our first session introduced students to the fundamentals of rockets and space technology. Participants explored how rockets work, along with insights from the mentor's own journey and projects. The session also included an interactive Q&A and a Pitch and Win Challenge, where students shared what they had learned to make space science approachable beyond the classroom.",
    highlights: [
      "Rocket propulsion principles, specific impulse & thrust curves",
      "Mentor's aerospace journey, defence projects & propulsion research",
      "Interactive Q&A and Pitch & Win student challenge",
    ],
  },
  {
    title: "Satellite Operations Masterclass",
    status: "Completed",
    cohort: "Session 02",
    description:
      "An ISRO Master Control Facility scientist walked students through the realities of operating a satellite after launch: how orbits are determined from ground station measurements, how conjunction warnings are assessed, and how station-keeping fuel budgets ultimately decide mission lifetime.",
    highlights: [
      "Ground segment architecture and operator workflows",
      "Orbit determination from ranging and doppler data",
      "Collision avoidance decision-making in practice",
    ],
  },
  {
    title: "Aerospace Systems & Flight Simulation Bootcamp",
    status: "Applications open",
    cohort: "Cohort 03 · September 2026",
    description:
      "A six-week mentored cohort in which teams of students build an end-to-end 6-DOF flight dynamics model, validate it against published flight test data, and defend the result publicly on demo day. Weekly mentor code reviews are included for Squad Pro members.",
    highlights: [
      "25 seats, application required",
      "Weekly live mentor code review",
      "Public demo day with practitioner panel",
    ],
  },
  {
    title: "Sounding Rocket Avionics & Telemetry Bootcamp",
    status: "Applications open",
    cohort: "Cohort 04 · October 2026",
    description:
      "Four weeks of avionics engineering: sensor fusion with an extended Kalman filter, apogee detection logic with deployment safety interlocks, and a full telemetry packet protocol tested against recorded flight data.",
    highlights: [
      "20 seats, application required",
      "Bench validation against real flight logs",
      "Ground station software included",
    ],
  },
];

export const HAPPENING_NOW = [
  {
    badge: "Live Workshop",
    icon: "rocket",
    meta: "90 min",
    title: "Fundamentals of Rockets & Propulsion Technology",
    tagline: "Thrust equations, specific impulse, and nozzle expansion dynamics.",
    detail: "With Prakhar Vishwakarma (Missile Man of MP)",
    footnote: "July 2 · 7:00 PM IST",
    cta: "Reserve Seat",
    href: "/courses?type=workshop",
  },
  {
    badge: "Mini Course",
    icon: "graduation",
    meta: "6 lessons · ~4 hours",
    title: "Orbital Mechanics from First Principles",
    tagline: "From Kepler's laws to Hohmann transfer delta-v calculations.",
    detail: "Final Project: Hohmann Transfer Delta-V Calculator",
    footnote: "Intermediate",
    cta: "Start Course",
    href: "/courses?type=course",
  },
  {
    badge: "Bootcamp",
    icon: "zap",
    meta: "6 weeks",
    title: "Aerospace Systems & Flight Simulation Bootcamp",
    tagline: "6 weeks · Cohort · 25 seats · Mentored by practising engineers.",
    detail: "25 Seats · Application Required",
    footnote: "Cohort Starts September 2026",
    cta: "Apply",
    href: "/pricing",
  },
];

export const SOCIAL_LINKS = {
  whatsapp: "https://chat.whatsapp.com/FdbxPikc9aGLxiHu0gWqIX",
  instagram: "https://www.instagram.com/project_polaris_",
  linkedin:
    "https://www.linkedin.com/company/nova-next-gen-of-vision-and-astronomy/",
  github: "https://github.com/blaze505050/project-polaris",
};
