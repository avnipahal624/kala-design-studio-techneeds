import {
  BadgeCheck,
  Camera,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  FileText,
  Flag,
  Gavel,
  Hammer,
  Handshake,
  MessageSquareWarning,
  PackageCheck,
  PencilRuler,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Truck,
  Wallet,
} from "lucide-react";
import { formatDateTime } from "@/lib/marketplace";

export type EvidenceEvent = {
  _id: string;
  type: string;
  title: string;
  note?: string;
  actorRole: "customer" | "artisan" | "admin" | "system";
  createdAt: number;
  attachments: { storageId: string; url: string | null; name?: string }[];
};

const ICONS: Record<string, typeof FileText> = {
  request_created: ClipboardList,
  quote_requested: FileText,
  quote_submitted: FileText,
  quote_accepted: Handshake,
  concept_uploaded: PencilRuler,
  concept_approved: CheckCircle2,
  revision_requested: RotateCcw,
  payment_order_created: CreditCard,
  payment_confirmed: BadgeCheck,
  production_started: Hammer,
  progress_uploaded: Camera,
  product_dispatched: Truck,
  condition_documented: ClipboardCheck,
  quality_reviewed: Sparkles,
  product_shipped: Truck,
  product_received: PackageCheck,
  product_delivered: PackageCheck,
  review_period_started: CalendarClock,
  dispute_opened: ShieldAlert,
  dispute_updated: MessageSquareWarning,
  dispute_resolved: Gavel,
  payout_processed: Wallet,
  project_completed: Flag,
  note: FileText,
};

export function KalaProofTimeline({
  events,
  emptyText = "No evidence has been recorded yet.",
}: {
  events: EvidenceEvent[];
  emptyText?: string;
}) {
  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-maroon/20 bg-card/60 px-4 py-8 text-center text-sm text-muted-foreground">
        {emptyText}
      </div>
    );
  }

  return (
    <ol className="relative space-y-0">
      {events.map((event, index) => {
        const Icon = ICONS[event.type] ?? FileText;
        const last = index === events.length - 1;
        return (
          <li key={event._id} className="relative flex gap-3 pb-5 last:pb-0">
            {!last && <span className="absolute left-[15px] top-8 h-[calc(100%-1.75rem)] w-px bg-gradient-to-b from-gold/50 to-gold/10" />}
            <span className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-ivory text-maroon">
              <Icon className="size-3.5" />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="text-sm font-semibold leading-snug text-ink">{event.title}</p>
                <time className="text-[10px] uppercase tracking-wide text-muted-foreground" dateTime={new Date(event.createdAt).toISOString()}>
                  {formatDateTime(event.createdAt)}
                </time>
              </div>
              <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                Recorded by {event.actorRole}
              </p>
              {event.note && <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-ink/65">{event.note}</p>}
              {event.attachments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {event.attachments.map((attachment) =>
                    attachment.url ? (
                      <a
                        key={attachment.storageId}
                        href={attachment.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block size-16 overflow-hidden rounded-lg border border-maroon/15 bg-muted transition hover:border-maroon/40"
                      >
                        <img
                          src={attachment.url}
                          alt={attachment.name ?? "Evidence attachment"}
                          className="size-full object-cover"
                        />
                      </a>
                    ) : null,
                  )}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
