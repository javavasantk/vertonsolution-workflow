import {
  CHALLENGES,
  formatReynolds,
  getChallenge,
  solveFlow,
  type SolverInput,
  SOLVER_LIMITS,
} from "@shared/aeroforge";
import { Activity, ArrowUpRight, ChevronRight, Cpu, FlaskConical, LockKeyhole, Play, Save, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { AirfoilCanvas } from "./AirfoilCanvas";

const STAGES = ["Problem", "Geometry", "Conditions", "Solve", "Streamlines", "Save", "Benchmark", "Artifact"];

type AeroForgeSimulatorProps = {
  compact?: boolean;
  onSave?: (input: SolverInput) => void;
};

export function AeroForgeSimulator({ compact = false, onSave }: AeroForgeSimulatorProps) {
  const [stage, setStage] = useState(0);
  const [input, setInput] = useState<SolverInput>({
    challengeId: "transonic-airfoil",
    mach: compact ? 0.42 : 0.35,
    alphaDeg: compact ? 3.5 : 4,
    altitudeKm: 5,
  });
  const [hasRun, setHasRun] = useState(false);
  const result = useMemo(() => solveFlow(input), [input]);
  const challenge = getChallenge(input.challengeId);

  const change = <K extends keyof SolverInput>(key: K, value: SolverInput[K]) => {
    setInput(current => ({ ...current, [key]: value }));
  };

  if (compact) {
    return (
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#11101b] p-3 shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#d4af37]" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span className="ml-2 font-mono text-[0.55rem] tracking-[0.04em] text-violet-300">AeroForge://transonic-cfd</span>
          </div>
          <span className="inline-flex items-center gap-1 font-mono text-[0.5rem] uppercase tracking-[0.08em] text-emerald-300"><span className="pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-300" />Solver active</span>
        </div>
        <div className="relative mt-3 h-36 overflow-hidden rounded-lg border border-white/10">
          <AirfoilCanvas challengeId={input.challengeId} mach={input.mach} alphaDeg={input.alphaDeg} compact />
          <span className="absolute left-2 top-2 rounded bg-black/35 px-1.5 py-1 font-mono text-[0.5rem] text-white/70">NACA {challenge.naca} | α = {input.alphaDeg.toFixed(1)}°</span>
          <span className="absolute bottom-2 right-2 rounded bg-black/40 px-1.5 py-1 font-mono text-[0.5rem] text-[#f3d879]">L/D Ratio: {result.liftToDrag.toFixed(1)}</span>
        </div>
        <div className="mt-3 grid grid-cols-[0.9fr_1.15fr_1.15fr] gap-2">
          <div>
            <p className="font-mono text-[0.48rem] uppercase tracking-[0.08em] text-white/45">Airfoil profile</p>
            <div className="mt-1 flex gap-1">
              {CHALLENGES.slice(0, 3).map(candidate => (
                <button key={candidate.id} type="button" onClick={() => change("challengeId", candidate.id)} className={`rounded px-1.5 py-1 font-mono text-[0.5rem] ${candidate.id === input.challengeId ? "bg-violet-400 text-[#0c0a12]" : "bg-white/7 text-white/55 hover:bg-white/12"}`}>
                  {candidate.naca}
                </button>
              ))}
            </div>
          </div>
          <MiniRange label="Mach speed" value={`M ${input.mach.toFixed(2)}`} min={SOLVER_LIMITS.mach.min} max={SOLVER_LIMITS.mach.max} step={SOLVER_LIMITS.mach.step} current={input.mach} onChange={v => change("mach", v)} />
          <MiniRange label="Angle (α)" value={`${input.alphaDeg.toFixed(1)}°`} min={SOLVER_LIMITS.alphaDeg.min} max={SOLVER_LIMITS.alphaDeg.max} step={SOLVER_LIMITS.alphaDeg.step} current={input.alphaDeg} onChange={v => change("alphaDeg", v)} gold />
        </div>
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          <MiniMetric label="Lift (CL)" value={result.liftCoefficient.toFixed(3)} />
          <MiniMetric label="Drag (CD)" value={result.dragCoefficient.toFixed(4)} violet />
          <MiniMetric label="Reynolds" value={formatReynolds(result.reynolds)} />
          <MiniMetric label="Solvers" value="40+" green />
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-2.5">
          <span className="font-mono text-[0.48rem] leading-4 text-white/40">{challenge.solver}</span>
          <Link href="/aeroforge" className="press rounded-full bg-white/90 px-2.5 py-1.5 font-mono text-[0.54rem] font-semibold text-[#11101b] hover:bg-white">Open AeroForge Lab <span>→</span></Link>
        </div>
      </div>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-4 shadow-2xl shadow-primary/5 sm:p-6 lg:p-8">
      <div className="absolute inset-x-0 top-0 h-24 bg-[image:var(--grad-brand-soft)] opacity-70" />
      <div className="relative flex flex-col gap-5 border-b border-border pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow">Interactive demonstration // 8-stage simulator</span>
            <span className="rounded-full bg-success/10 px-2 py-1 font-mono text-[0.55rem] uppercase tracking-[0.1em] text-success">Reduced-order flow model</span>
          </div>
          <h3 className="mt-3 font-display text-3xl font-bold tracking-[-0.03em] text-foreground sm:text-4xl">See AeroForge in Action</h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Experience the full digital thread: configure physical parameters, execute reduced-order physics solvers, and inspect live pressure contours.</p>
        </div>
        <Link href="/aeroforge" className="press inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-primary/45 bg-primary/10 px-4 py-2.5 font-mono text-[0.68rem] font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground">
          Launch Full Lab <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="no-scrollbar relative -mx-1 mt-5 flex gap-1 overflow-x-auto px-1 pb-1">
        {STAGES.map((label, index) => (
          <button key={label} type="button" onClick={() => setStage(index)} className={`press shrink-0 rounded-lg px-3 py-2 font-mono text-[0.6rem] transition-colors ${stage === index ? "bg-primary text-primary-foreground" : "border border-border bg-secondary/45 text-muted-foreground hover:bg-primary/10 hover:text-foreground"}`}>
            <span className="mr-1.5 opacity-70">{index + 1}</span>{label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[0.88fr_1.12fr]">
        <div className="space-y-5">
          <div>
            <p className="font-mono text-[0.61rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground"><span className="text-primary">1.</span> Choose engineering challenge</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {CHALLENGES.map(candidate => (
                <button key={candidate.id} type="button" onClick={() => change("challengeId", candidate.id)} className={`press rounded-xl border p-3 text-left transition-colors ${candidate.id === input.challengeId ? "border-primary/60 bg-primary/10 shadow-lg shadow-primary/5" : "border-border bg-secondary/30 hover:border-primary/35 hover:bg-primary/5"}`}>
                  <span className="font-mono text-[0.55rem] uppercase tracking-[0.1em] text-primary">{candidate.category}</span>
                  <span className="mt-1 block text-sm font-semibold leading-5 text-foreground">{candidate.name}</span>
                  {candidate.requiredTier > 0 && <span className="mt-2 inline-flex items-center gap-1 font-mono text-[0.55rem] text-gold"><LockKeyhole className="h-2.5 w-2.5" /> Builder+</span>}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">{challenge.description}</p>
          </div>

          <div className="rounded-2xl border border-border bg-secondary/35 p-4">
            <p className="font-mono text-[0.61rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground"><span className="text-primary">2 & 3.</span> Physical parameters & geometry</p>
            <div className="mt-4 space-y-4">
              <ParameterRange label="Mach Number (M)" value={`${input.mach.toFixed(2)} M`} min={SOLVER_LIMITS.mach.min} max={SOLVER_LIMITS.mach.max} step={SOLVER_LIMITS.mach.step} current={input.mach} onChange={v => change("mach", v)} />
              <ParameterRange label="Angle of Attack (α)" value={`${input.alphaDeg.toFixed(1)}°`} min={SOLVER_LIMITS.alphaDeg.min} max={SOLVER_LIMITS.alphaDeg.max} step={SOLVER_LIMITS.alphaDeg.step} current={input.alphaDeg} onChange={v => change("alphaDeg", v)} color="gold" />
              <ParameterRange label="Altitude (h)" value={`${input.altitudeKm.toFixed(1)} km`} min={SOLVER_LIMITS.altitudeKm.min} max={SOLVER_LIMITS.altitudeKm.max} step={SOLVER_LIMITS.altitudeKm.step} current={input.altitudeKm} onChange={v => change("altitudeKm", v)} color="cyan" />
            </div>
            <button type="button" onClick={() => { setHasRun(true); setStage(3); }} className="press mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[image:var(--grad-brand)] px-4 py-3 font-mono text-[0.68rem] font-semibold text-[#090710] shadow-lg shadow-primary/15 hover:brightness-110">
              <Play className="h-3.5 w-3.5 fill-current" /> Execute Analytical Flow Solver
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-secondary/35 p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-3">
            <span className="inline-flex items-center gap-2 font-mono text-[0.62rem] font-medium text-foreground"><Activity className="h-3.5 w-3.5 text-success" /> NACA {result.naca} Flow Field Contours</span>
            <span className="font-mono text-[0.53rem] text-muted-foreground">Streamline Grid: 120 × 80</span>
          </div>
          <div className="relative h-[230px] overflow-hidden rounded-xl border border-primary/15 bg-[#100e19] sm:h-[270px]">
            <AirfoilCanvas challengeId={input.challengeId} mach={input.mach} alphaDeg={input.alphaDeg} />
            {!hasRun && <div className="absolute inset-0 flex items-center justify-center bg-[#100e19]/25"><span className="rounded-full border border-white/15 bg-black/35 px-3 py-2 font-mono text-[0.58rem] text-white/65">Configure parameters, then execute the solver</span></div>}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <ResultMetric label="Lift (CL)" value={result.liftCoefficient.toFixed(4)} tone="violet" />
            <ResultMetric label="Drag (CD)" value={result.dragCoefficient.toFixed(5)} tone="primary" />
            <ResultMetric label="L/D efficiency" value={result.liftToDrag.toFixed(2)} tone="cyan" />
            <ResultMetric label="True airspeed" value={`${result.trueAirspeedKmh.toFixed(0)} km/h`} tone="gold" />
          </div>
          <div className="mt-3 flex flex-col gap-3 rounded-xl border border-primary/15 bg-primary/8 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="font-mono text-[0.58rem] font-medium text-foreground">{result.benchmarkSource} Benchmark Delta: <span className={Math.abs(result.benchmarkDelta) < 15 ? "text-success" : "text-gold"}>{result.benchmarkDelta > 0 ? "+" : ""}{result.benchmarkDelta.toFixed(1)}%</span></p>
                <p className="mt-0.5 text-[0.68rem] text-muted-foreground">{result.regime}</p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button type="button" onClick={() => onSave?.(input)} className="press inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 font-mono text-[0.6rem] text-foreground transition-colors hover:border-primary/50 hover:bg-primary/10"><Save className="h-3 w-3" /> Save Trial</button>
              <Link href="/aeroforge" className="press inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 font-mono text-[0.6rem] font-semibold text-primary-foreground hover:brightness-110">Open Lab <ChevronRight className="h-3 w-3" /></Link>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-black/10 px-3 py-2">
            <Cpu className="h-3.5 w-3.5 text-primary" />
            <span className="font-mono text-[0.55rem] text-muted-foreground">Re = {formatReynolds(result.reynolds)} · {challenge.solver} · {result.notes[0] ?? "Attached flow conditions within model limits."}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniRange({ label, value, min, max, step, current, onChange, gold = false }: { label: string; value: string; min: number; max: number; step: number; current: number; onChange: (value: number) => void; gold?: boolean }) {
  return <div><p className="font-mono text-[0.48rem] uppercase tracking-[0.07em] text-white/45">{label} <span className={gold ? "text-[#f3d879]" : "text-violet-300"}>{value}</span></p><input aria-label={label} className={`polaris-range mt-2 ${gold ? "accent-[#d4af37]" : "accent-[#c59dff]"}`} type="range" min={min} max={max} step={step} value={current} onChange={e => onChange(Number(e.target.value))} /></div>;
}

function MiniMetric({ label, value, violet = false, green = false }: { label: string; value: string; violet?: boolean; green?: boolean }) {
  return <div className="rounded-md bg-white/5 px-1.5 py-2 text-center"><p className="font-mono text-[0.43rem] uppercase tracking-[0.06em] text-white/40">{label}</p><p className={`mt-1 font-mono text-[0.64rem] font-semibold ${green ? "text-emerald-300" : violet ? "text-violet-300" : "text-white/85"}`}>{value}</p></div>;
}

function ParameterRange({ label, value, min, max, step, current, onChange, color = "violet" }: { label: string; value: string; min: number; max: number; step: number; current: number; onChange: (value: number) => void; color?: "violet" | "gold" | "cyan" }) {
  const className = color === "gold" ? "accent-[#d4af37]" : color === "cyan" ? "accent-cyan-400" : "accent-primary";
  const textClass = color === "gold" ? "text-gold" : color === "cyan" ? "text-cyan-400" : "text-primary";
  return <label className="block"><span className="flex items-center justify-between gap-3 font-mono text-[0.61rem] text-muted-foreground"><span>{label}</span><span className={textClass}>{value}</span></span><input className={`polaris-range mt-2.5 ${className}`} type="range" min={min} max={max} step={step} value={current} onChange={e => onChange(Number(e.target.value))} /></label>;
}

function ResultMetric({ label, value, tone }: { label: string; value: string; tone: "violet" | "primary" | "cyan" | "gold" }) {
  const colors = { violet: "text-violet-300", primary: "text-primary", cyan: "text-cyan-300", gold: "text-gold" };
  return <div className="rounded-lg border border-border bg-card/60 px-2 py-3 text-center"><p className="font-mono text-[0.48rem] uppercase tracking-[0.08em] text-muted-foreground">{label}</p><p className={`mt-1 font-mono text-sm font-semibold ${colors[tone]}`}>{value}</p></div>;
}
