import { ArrowUpRight, Check, Clock3, MapPin, Star } from "lucide-react";
import { Link } from "react-router";
import { VerificationBadge } from "./Bits";
import { formatInr, initials } from "@/lib/marketplace";
import { cn } from "@/lib/utils";

export type FitBreakdownRow = {
  key: string;
  label: string;
  score: number;
  weight: number;
};

export type ArtisanSummary = {
  id: string;
  displayName: string;
  headline?: string;
  city: string;
  serviceRegion?: string;
  skills: string[];
  products: string[];
  materials?: string[];
  verificationStatus: string;
  averageRating: number | null;
  reviewCount: number;
  completedProjects: number;
  previewUrl: string | null;
  sampleLabel?: string | null;
  availability?: string;
  minProjectValue?: number;
  turnaroundDays?: number;
  collaborates?: boolean;
  score?: number;
  reasons?: string[];
  breakdown?: FitBreakdownRow[];
};

const AVAILABILITY: Record<string, { label: string; dot: string; text: string }> = {
  available: { label: "Taking work", dot: "bg-emerald", text: "text-emerald" },
  limited: { label: "Limited capacity", dot: "bg-saffron", text: "text-[#7d5a24]" },
  paused: { label: "Paused", dot: "bg-ink/35", text: "text-ink/50" },
};

export function ArtisanCard({
  artisan,
  showMatch = false,
  onCompare,
  selectedForCompare = false,
}: {
  artisan: ArtisanSummary;
  showMatch?: boolean;
  onCompare?: (artisan: ArtisanSummary) => void;
  selectedForCompare?: boolean;
}) {
  const availability = AVAILABILITY[artisan.availability ?? ""] ?? AVAILABILITY.paused;
  const topReasons = artisan.reasons?.slice(0, 2) ?? [];

  return (
    <article className="group relative flex h-full flex-col overflow-hidden border border-maroon/15 bg-[#fcf9f2] transition duration-500 hover:-translate-y-0.5 hover:border-maroon/35 hover:shadow-[0_26px_55px_-38px_rgba(66,32,24,0.55)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-[radial-gradient(circle_at_30%_18%,#efe5d6,#faf5eb_55%,#e3e7df)]">
        {artisan.previewUrl ? (
          <img
            src={artisan.previewUrl}
            alt={`Portfolio work by ${artisan.displayName}`}
            className="size-full object-cover transition-transform duration-[900ms] group-hover:scale-[1.035]"
          />
        ) : (
          <div className="relative flex size-full items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-30 [background-image:repeating-linear-gradient(45deg,rgba(122,48,42,0.12)_0_1px,transparent_1px_13px),repeating-linear-gradient(-45deg,rgba(52,72,62,0.1)_0_1px,transparent_1px_13px)]" />
            <span className="relative flex size-24 items-center justify-center rounded-full border border-maroon/20 bg-[#f7f2e8]/80 font-display text-3xl font-semibold text-maroon">
              {initials(artisan.displayName)}
            </span>
            <span className="absolute bottom-3 left-3 text-[8px] uppercase tracking-[0.16em] text-ink/35">Portfolio preview pending</span>
          </div>
        )}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <VerificationBadge status={artisan.verificationStatus} sampleLabel={artisan.sampleLabel} />
          {showMatch && typeof artisan.score === "number" && (
            <span className="flex items-center gap-1 bg-maroon px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-ivory shadow-sm">
              {artisan.score}% CraftFit
            </span>
          )}
        </div>
        {onCompare && (
          <button
            type="button"
            onClick={() => onCompare(artisan)}
            aria-pressed={selectedForCompare}
            className={cn(
              "absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] backdrop-blur-md transition",
              selectedForCompare
                ? "border-maroon bg-maroon text-ivory"
                : "border-maroon/20 bg-[#f7f2e8]/90 text-maroon hover:border-maroon/50",
            )}
          >
            {selectedForCompare ? <Check className="size-3" /> : <span className="size-3 rounded-full border border-current" />}
            {selectedForCompare ? "In compare" : "Compare"}
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-display text-[1.35rem] font-semibold leading-none text-ink">{artisan.displayName}</h3>
            <p className="mt-1 flex items-center gap-1 text-[10px] text-ink/48">
              <MapPin className="size-3" /> {artisan.city}
              {artisan.serviceRegion ? <span className="truncate"> · {artisan.serviceRegion}</span> : null}
            </p>
          </div>
          {artisan.averageRating !== null && (
            <span className="flex shrink-0 items-center gap-1 border border-gold/35 bg-ivory px-2 py-1 text-[10px] font-semibold text-ink/65">
              <Star className="size-2.5 fill-saffron text-saffron" /> {artisan.averageRating}
            </span>
          )}
        </div>

        {artisan.headline && <p className="mt-2 text-[11px] leading-snug text-ink/60">{artisan.headline}</p>}

        <div className="mt-2.5 flex flex-wrap gap-1">
          {artisan.skills.slice(0, 3).map((skill) => (
            <span key={skill} className="border border-teal/20 bg-teal/[0.035] px-2 py-1 text-[8px] font-medium uppercase tracking-[0.06em] text-teal-deep">
              {skill}
            </span>
          ))}
          {artisan.skills.length > 3 && (
            <span className="px-1 py-1 text-[8px] text-muted-foreground">+{artisan.skills.length - 3}</span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-maroon/10 pt-2.5 text-[9px] text-ink/48">
          <span className={cn("flex items-center gap-1.5 font-medium", availability.text)}>
            <span className={cn("size-1.5 rounded-full", availability.dot)} /> {availability.label}
          </span>
          {typeof artisan.minProjectValue === "number" && <span>From {formatInr(artisan.minProjectValue)}</span>}
          {artisan.turnaroundDays ? <span className="flex items-center gap-1"><Clock3 className="size-2.5" /> {artisan.turnaroundDays}d typical</span> : null}
          {artisan.collaborates ? <span className="text-teal-deep">Open to KalaCollab</span> : null}
        </div>

        {showMatch && topReasons.length > 0 && (
          <div className="mt-3 border-l border-gold/50 pl-2.5">
            <ul className="space-y-1">
              {topReasons.map((reason) => (
                <li key={reason} className="text-[9px] leading-snug text-ink/52">{reason}</li>
              ))}
            </ul>
          </div>
        )}

        {showMatch && artisan.breakdown && artisan.breakdown.length > 0 && (
          <div className="mt-3 space-y-1.5 border-t border-maroon/10 pt-3">
            <p className="label-caps text-[8px] text-muted-foreground">CraftFit breakdown</p>
            {artisan.breakdown.map((row) => (
              <div key={row.key} className="grid grid-cols-[74px_1fr_24px] items-center gap-2">
                <span className="truncate text-[8px] text-ink/50">{row.label}</span>
                <span className="h-1 overflow-hidden rounded-full bg-maroon/10">
                  <span className="block h-full rounded-full bg-teal/70" style={{ width: `${Math.max(2, row.score)}%` }} />
                </span>
                <span className="text-right text-[8px] font-medium text-ink/55">{row.score}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <p className="text-[8px] uppercase leading-relaxed tracking-[0.1em] text-muted-foreground">
            {artisan.completedProjects} completed · {artisan.reviewCount} review{artisan.reviewCount === 1 ? "" : "s"}
          </p>
          <Link
            to={`/artisans/${artisan.id}`}
            className="inline-flex items-center gap-1.5 border-b border-maroon/30 pb-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-maroon transition hover:border-maroon"
          >
            Portfolio <ArrowUpRight className="size-3" />
          </Link>
        </div>
      </div>
    </article>
  );
}
