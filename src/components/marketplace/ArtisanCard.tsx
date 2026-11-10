import { ArrowUpRight, MapPin, Star } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { VerificationBadge } from "./Bits";
import { initials } from "@/lib/marketplace";

export type ArtisanSummary = {
  id: string;
  displayName: string;
  headline?: string;
  city: string;
  skills: string[];
  products: string[];
  verificationStatus: string;
  averageRating: number | null;
  reviewCount: number;
  completedProjects: number;
  previewUrl: string | null;
  sampleLabel?: string | null;
  availability?: string;
  score?: number;
  reasons?: string[];
};

export function ArtisanCard({ artisan, showMatch = false }: { artisan: ArtisanSummary; showMatch?: boolean }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-maroon/15 bg-card transition-all hover:-translate-y-0.5 hover:border-maroon/35 hover:shadow-[0_18px_40px_-28px_rgba(123,32,64,0.55)]">
      <div className="relative aspect-[16/10] overflow-hidden bg-[radial-gradient(circle_at_30%_20%,#f7d5bb,#fff4de_55%,#d8f0e9)]">
        {artisan.previewUrl ? (
          <img
            src={artisan.previewUrl}
            alt={`Portfolio work by ${artisan.displayName}`}
            className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <span className="flex size-20 items-center justify-center rounded-full border border-maroon/20 bg-ivory/70 font-display text-2xl font-semibold text-maroon">
              {initials(artisan.displayName)}
            </span>
          </div>
        )}
        {showMatch && typeof artisan.score === "number" && (
          <span className="absolute left-3 top-3 rounded-full bg-maroon px-2.5 py-1 text-[10px] font-semibold text-ivory shadow-sm">
            {artisan.score}% match
          </span>
        )}
        <span className="absolute right-3 top-3">
          <VerificationBadge status={artisan.verificationStatus} sampleLabel={artisan.sampleLabel} />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-display text-lg font-semibold leading-tight text-ink">{artisan.displayName}</h3>
            {artisan.headline && <p className="mt-0.5 text-xs leading-snug text-ink/60">{artisan.headline}</p>}
          </div>
          {artisan.averageRating !== null && (
            <span className="flex shrink-0 items-center gap-1 rounded-full border border-gold/40 bg-ivory px-2 py-0.5 text-[11px] font-semibold text-ink/70">
              <Star className="size-3 fill-saffron text-saffron" />
              {artisan.averageRating}
            </span>
          )}
        </div>

        <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="size-3" />
          {artisan.city}
          <span className="mx-1 text-gold">·</span>
          {artisan.completedProjects} completed · {artisan.reviewCount} review{artisan.reviewCount === 1 ? "" : "s"}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {artisan.skills.slice(0, 3).map((skill) => (
            <Badge key={skill} variant="outline" className="border-teal/25 bg-teal/[0.05] text-[10px] font-medium text-teal-deep">
              {skill}
            </Badge>
          ))}
          {artisan.skills.length > 3 && (
            <span className="text-[10px] text-muted-foreground">+{artisan.skills.length - 3}</span>
          )}
        </div>

        {showMatch && artisan.reasons && artisan.reasons.length > 0 && (
          <ul className="mt-3 space-y-1">
            {artisan.reasons.slice(0, 2).map((reason) => (
              <li key={reason} className="flex gap-1.5 text-[11px] leading-snug text-ink/60">
                <span className="mt-1 size-1 shrink-0 rounded-full bg-saffron" />
                {reason}
              </li>
            ))}
          </ul>
        )}

        <Link
          to={`/artisans/${artisan.id}`}
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-maroon transition-colors hover:text-vermilion"
        >
          View portfolio
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>
    </article>
  );
}
