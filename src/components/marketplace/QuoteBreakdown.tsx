import { formatInr } from "@/lib/marketplace";

export type QuoteMoney = {
  materialsInr: number;
  labourInr: number;
  preparationInr: number;
  finishingInr: number;
  packagingInr: number;
  deliveryInr: number;
  totalInr: number;
  platformFeePercent: number;
  platformFeeInr: number;
  netPayoutInr: number;
  timelineDays?: number;
  revisionRounds?: number;
  depositPercent?: number;
  terms?: string;
  expiresAt?: number | null;
  version?: number;
};

const LINES: { key: keyof QuoteMoney; label: string }[] = [
  { key: "materialsInr", label: "Materials" },
  { key: "labourInr", label: "Labour" },
  { key: "preparationInr", label: "Preparation" },
  { key: "finishingInr", label: "Finishing" },
  { key: "packagingInr", label: "Packaging" },
  { key: "deliveryInr", label: "Delivery" },
];

export function QuoteBreakdown({ quote, compact = false }: { quote: QuoteMoney; compact?: boolean }) {
  return (
    <div className="rounded-xl border border-maroon/15 bg-card">
      <dl className="divide-y divide-maroon/8 px-4 py-3 text-sm">
        {LINES.filter((line) => Number(quote[line.key] ?? 0) > 0).map((line) => (
          <div key={line.key} className="flex items-baseline justify-between gap-3 py-1.5">
            <dt className="text-ink/60">{line.label}</dt>
            <dd className="font-medium tabular-nums text-ink">{formatInr(Number(quote[line.key] ?? 0))}</dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-3 py-2">
          <dt className="font-semibold text-ink">Total</dt>
          <dd className="font-display text-lg font-semibold tabular-nums text-maroon">{formatInr(quote.totalInr)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 py-1.5 text-xs">
          <dt className="text-ink/55">Platform fee ({quote.platformFeePercent}%)</dt>
          <dd className="tabular-nums text-ink/65">{formatInr(quote.platformFeeInr)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 py-1.5 text-xs">
          <dt className="font-medium text-emerald">Artisan net payout</dt>
          <dd className="font-semibold tabular-nums text-emerald">{formatInr(quote.netPayoutInr)}</dd>
        </div>
      </dl>

      {!compact && (
        <div className="grid grid-cols-3 gap-2 border-t border-maroon/10 px-4 py-3 text-center text-[11px]">
          <div>
            <p className="font-display text-base font-semibold text-ink">{quote.timelineDays ?? "—"}</p>
            <p className="text-muted-foreground">days</p>
          </div>
          <div>
            <p className="font-display text-base font-semibold text-ink">{quote.revisionRounds ?? "—"}</p>
            <p className="text-muted-foreground">revisions</p>
          </div>
          <div>
            <p className="font-display text-base font-semibold text-ink">{quote.depositPercent ?? 0}%</p>
            <p className="text-muted-foreground">deposit</p>
          </div>
        </div>
      )}

      {!compact && quote.terms && (
        <div className="border-t border-maroon/10 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Agreed terms</p>
          <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-ink/65">{quote.terms}</p>
        </div>
      )}
    </div>
  );
}
