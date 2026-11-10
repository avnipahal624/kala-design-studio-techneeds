import { Link } from "react-router";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <g transform="translate(32 32)">
        {Array.from({ length: 12 }).map((_, i) => (
          <g key={i} transform={`rotate(${i * 30})`}>
            <path d="M0,-9 C4,-15 4,-22 0,-28 C-4,-22 -4,-15 0,-9 Z" fill={i % 2 === 0 ? "#f2a33a" : "#d94b39"} />
            <circle cx="0" cy="-29.5" r="1.5" fill="#087f83" />
          </g>
        ))}
        <circle r="9" fill="#7b2040" />
        <circle r="6" fill="none" stroke="#fff4de" strokeWidth="0.9" strokeDasharray="1.6 1.6" />
        <circle r="2.4" fill="#f2a33a" />
      </g>
    </svg>
  );
}

export function Wordmark({
  className = "",
  tone = "ink",
  size = "md",
}: {
  className?: string;
  tone?: "ink" | "ivory";
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl md:text-5xl",
  };
  return (
    <span
      className={`inline-flex items-baseline gap-[0.1em] font-display leading-none tracking-tight ${sizes[size]} ${
        tone === "ivory" ? "text-ivory" : "text-maroon"
      } ${className}`}
    >
      <span lang="en" className="font-semibold tracking-[0.01em]">
        KAL
      </span>
      <span lang="hi" className="font-hindi-display text-[1.02em] leading-none">
        कारी
      </span>
    </span>
  );
}

export function BrandLockup({
  to = "/",
  tone = "ink",
  size = "md",
  className = "",
}: {
  to?: string;
  tone?: "ink" | "ivory";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={`group flex items-center gap-2.5 ${className}`}
      aria-label="KALकारी home"
    >
      <LogoMark className={`${size === "lg" ? "size-12" : "size-8"} shrink-0 transition-transform duration-500 group-hover:rotate-45`} />
      <span className="flex flex-col">
        <Wordmark tone={tone} size={size} />
        {size !== "sm" && (
          <span
            className={`mt-1 text-[10px] font-medium uppercase tracking-[0.18em] ${
              tone === "ivory" ? "text-ivory/70" : "text-muted-foreground"
            }`}
          >
            AI Connects. Artisans Create.
          </span>
        )}
      </span>
    </Link>
  );
}
