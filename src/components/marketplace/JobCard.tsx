import { Bookmark, BookmarkCheck, CalendarClock, MapPin, Sparkles } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatInr } from "@/lib/marketplace";

export type KalaJob = {
  _id: string;
  title: string;
  category: string;
  description: string;
  craftPreference: string | null;
  requiredSkills: string[];
  budgetInr: number;
  deadline: string | null;
  city: string;
  fulfilment: "shipping" | "local_handoff";
  previewUrl: string | null;
  score: number;
  reasons: string[];
  invited: boolean;
  saved: boolean;
  quoted: boolean;
  customerFirstName: string;
  customerVerified: boolean;
  createdAt: number;
};

export function JobCard({
  job,
  onToggleSave,
  saving,
}: {
  job: KalaJob;
  onToggleSave?: (requestId: string) => void;
  saving?: boolean;
}) {
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-maroon/15 bg-card p-4 transition-colors hover:border-maroon/30 md:flex-row">
      <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-xl bg-[radial-gradient(circle_at_30%_30%,#f7d5bb,#fff4de,#d8f0e9)] md:h-auto md:w-40">
        {job.previewUrl ? (
          <img src={job.previewUrl} alt="Customer product" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-xs text-maroon/50">Product photo</div>
        )}
        {job.invited && (
          <span className="absolute left-2 top-2 rounded-full bg-maroon px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-ivory">
            Invited
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-lg font-semibold leading-tight text-ink">{job.title}</h3>
              {job.quoted && (
                <Badge variant="outline" className="border-emerald/30 bg-emerald/10 text-[10px] text-emerald">
                  Quote sent
                </Badge>
              )}
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
              <span>{job.category}</span>
              <span className="text-gold">·</span>
              <span className="flex items-center gap-1"><MapPin className="size-3" />{job.city}</span>
              <span className="text-gold">·</span>
              <span className="flex items-center gap-1">
                <CalendarClock className="size-3" />
                {job.deadline ? formatDate(job.deadline) : "Flexible"}
              </span>
              <span className="text-gold">·</span>
              <span>{job.fulfilment === "shipping" ? "Shipping" : "Local handoff"}</span>
            </p>
          </div>
          <p className="font-display text-xl font-semibold text-maroon">{formatInr(job.budgetInr)}</p>
        </div>

        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink/65">{job.description}</p>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {job.requiredSkills.slice(0, 4).map((skill) => (
            <Badge key={skill} variant="outline" className="border-teal/25 bg-teal/[0.05] text-[10px] text-teal-deep">
              {skill}
            </Badge>
          ))}
        </div>

        <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-saffron/[0.07] px-2.5 py-1.5">
          <Sparkles className="mt-0.5 size-3 shrink-0 text-saffron" />
          <p className="text-[11px] leading-snug text-ink/65">
            <span className="font-semibold text-maroon">{job.score}% fit.</span>{" "}
            {job.reasons[0] ?? "CraftFit profile is a partial match."}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button asChild size="sm" className="rounded-full bg-maroon text-ivory hover:bg-maroon-deep">
            <Link to={`/artisan/jobs/${job._id}`}>{job.quoted ? "Revise quote" : "View & quote"}</Link>
          </Button>
          {onToggleSave && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={() => onToggleSave(job._id)}
              className="rounded-full border-maroon/25 text-maroon"
            >
              {job.saved ? <BookmarkCheck className="size-3.5" /> : <Bookmark className="size-3.5" />}
              {job.saved ? "Saved" : "Save job"}
            </Button>
          )}
          <span className="ml-auto text-[10px] text-muted-foreground">
            {job.customerVerified ? "Verified customer contact" : "Contact not verified"} · posted by {job.customerFirstName}
          </span>
        </div>
      </div>
    </article>
  );
}
