import { Link } from "wouter";

const LOGO_URL = "/manus-storage/polaris-logo_2dfeefcd.png";

type PolarisLogoProps = {
  compact?: boolean;
  inverse?: boolean;
  className?: string;
};

export function PolarisLogo({
  compact = false,
  inverse = false,
  className = "",
}: PolarisLogoProps) {
  return (
    <Link
      href="/"
      aria-label="Project Polaris home"
      className={`group inline-flex items-center gap-2.5 ${className}`}
    >
      <span
        className={`relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border ${
          inverse ? "border-white/20 bg-[#060714]" : "border-primary/20 bg-[#060714]"
        }`}
      >
        <img
          src={LOGO_URL}
          alt=""
          className="h-full w-full object-cover opacity-95 transition-transform duration-300 group-hover:scale-110"
        />
      </span>
      {!compact && (
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="text-[0.77rem] font-semibold tracking-tight text-foreground">
            Project Polaris
          </span>
          <span className="rounded-sm border border-primary/20 bg-primary/10 px-1.5 py-0.5 font-mono text-[0.55rem] font-medium uppercase tracking-[0.13em] text-primary">
            Labs
          </span>
        </span>
      )}
    </Link>
  );
}

export { LOGO_URL };
