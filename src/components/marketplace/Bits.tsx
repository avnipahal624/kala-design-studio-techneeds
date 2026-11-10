import { ShieldCheck, ShieldQuestion, ShieldX, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { statusLabel, statusTone } from "@/lib/marketplace";

export function StatusPill({
  kind,
  status,
  className,
}: {
  kind: "request" | "quote" | "project" | "payment" | "verification" | "dispute";
  status: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        statusTone(status),
        className,
      )}
    >
      {statusLabel(kind, status)}
    </span>
  );
}

export function VerificationBadge({
  status,
  sampleLabel,
  className,
}: {
  status: string;
  sampleLabel?: string | null;
  className?: string;
}) {
  if (sampleLabel) {
    return (
      <Badge variant="outline" className={cn("border-rani/40 bg-rani/10 text-[10px] text-rani", className)}>
        <Sparkles className="size-3" />
        Sample — not verified
      </Badge>
    );
  }
  if (status === "verified") {
    return (
      <Badge variant="outline" className={cn("border-emerald/30 bg-emerald/10 text-[10px] text-emerald", className)}>
        <ShieldCheck className="size-3" />
        Verified artisan
      </Badge>
    );
  }
  if (status === "pending" || status === "info_required") {
    return (
      <Badge variant="outline" className={cn("border-saffron/50 bg-saffron/10 text-[10px] text-[#8a5a12]", className)}>
        <ShieldQuestion className="size-3" />
        {statusLabel("verification", status)}
      </Badge>
    );
  }
  if (status === "rejected" || status === "suspended") {
    return (
      <Badge variant="outline" className={cn("border-vermilion/35 bg-vermilion/10 text-[10px] text-vermilion", className)}>
        <ShieldX className="size-3" />
        {statusLabel("verification", status)}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className={cn("border-ink/20 bg-ink/5 text-[10px] text-ink/55", className)}>
      Not verified
    </Badge>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  body,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-3", className)}>
      <div>
        {eyebrow && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-teal">{eyebrow}</p>
        )}
        <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-maroon">{title}</h2>
        {body && <p className="mt-1 max-w-[65ch] text-sm leading-relaxed text-ink/60">{body}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "maroon",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "maroon" | "teal" | "saffron" | "rani" | "emerald";
}) {
  const tones = {
    maroon: "border-maroon/20 bg-maroon/[0.04] text-maroon",
    teal: "border-teal/25 bg-teal/[0.06] text-teal-deep",
    saffron: "border-saffron/40 bg-saffron/10 text-[#8a5a12]",
    rani: "border-rani/30 bg-rani/[0.07] text-rani",
    emerald: "border-emerald/25 bg-emerald/[0.06] text-emerald",
  };
  return (
    <div className={cn("rounded-xl border p-4", tones[tone])}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-70">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold leading-none">{value}</p>
      {hint && <p className="mt-1.5 text-[11px] leading-snug opacity-70">{hint}</p>}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-maroon/25 bg-card/60 px-6 py-10 text-center">
      {icon && <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-maroon/8 text-maroon">{icon}</div>}
      <p className="font-display text-lg font-semibold text-ink">{title}</p>
      {body && <p className="mt-1 max-w-[48ch] text-sm leading-relaxed text-ink/55">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  required,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="flex items-baseline gap-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink/65">
        {label}
        {required && <span className="text-vermilion">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function SampleNote({ children }: { children?: ReactNode }) {
  return (
    <p className="rounded-lg border border-rani/25 bg-rani/[0.04] px-3 py-2 text-[11px] leading-relaxed text-rani">
      {children ?? "Sample content for demonstration — not a real artisan, review, payment or verification."}
    </p>
  );
}

export function ChoiceChips({
  options,
  selected,
  onToggle,
  max,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
  max?: number;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(option)}
            disabled={!active && max !== undefined && selected.length >= max}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40",
              active
                ? "border-maroon bg-maroon text-ivory"
                : "border-maroon/20 bg-card text-ink/70 hover:border-maroon/45",
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
