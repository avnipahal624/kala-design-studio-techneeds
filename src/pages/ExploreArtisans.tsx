import { api } from "@/convex/_generated/api";
import { ArtisanCard, type ArtisanSummary } from "@/components/marketplace/ArtisanCard";
import { PublicShell } from "@/components/public/PublicShell";
import { Button } from "@/components/ui/button";
import { CRAFT_SKILLS, PRODUCT_CAPABILITIES, formatInr } from "@/lib/marketplace";
import { useQuery } from "convex/react";
import { ArrowRight, Search, SlidersHorizontal, Sparkles, Users, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";

export default function ExploreArtisans() {
  const [params, setParams] = useSearchParams();
  const craft = params.get("craft") ?? "";
  const product = params.get("product") ?? "";
  const city = params.get("city") ?? "";
  const verifiedOnly = params.get("verified") === "1";
  const [draftCity, setDraftCity] = useState(city);
  const [compare, setCompare] = useState<ArtisanSummary[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  const query = useMemo(
    () => ({
      craft: craft || undefined,
      product: product || undefined,
      city: city || undefined,
      verifiedOnly: verifiedOnly || undefined,
      limit: 36,
    }),
    [craft, product, city, verifiedOnly],
  );
  const artisans = useQuery(api.artisans.directory, query);

  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  const hasFilters = Boolean(craft || product || city || verifiedOnly);

  function toggleCompare(artisan: ArtisanSummary) {
    setCompare((current) => {
      if (current.some((item) => item.id === artisan.id)) {
        return current.filter((item) => item.id !== artisan.id);
      }
      return [...current, artisan].slice(-3);
    });
  }

  return (
    <PublicShell>
      <section className="relative overflow-hidden border-b border-maroon/10">
        <div className="pointer-events-none absolute inset-0 craft-paper" />
        <div className="relative mx-auto grid max-w-[1360px] gap-8 px-4 py-14 md:px-8 md:py-20 lg:grid-cols-[1fr_0.55fr] lg:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-9 bg-gold/70" />
              <span className="label-caps text-[9px] text-teal">The artisan directory</span>
            </div>
            <h1 className="mt-5 max-w-[13ch] font-display text-5xl font-medium leading-[0.9] tracking-[-0.025em] text-ink md:text-7xl">
              Find the hands that fit the idea.
            </h1>
          </div>
          <div className="lg:pb-1">
            <p className="max-w-[46ch] text-[12px] leading-[1.8] text-ink/55">
              A considered directory of real craft profiles — skills, materials, cities, capacity and
              stated verification. No pay-to-rank. No invented makers to fill the page.
            </p>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[9px] uppercase tracking-[0.1em] text-ink/45">
              <span><strong className="font-semibold text-maroon">{artisans?.length ?? "—"}</strong> profiles shown</span>
              <span>Sample profiles labelled</span>
              <Link to="/for-artisans" className="font-semibold text-teal-deep">Join as an artisan →</Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1320px] px-4 py-8 md:px-8 md:py-10">
        <div className="border border-maroon/15 bg-[#fcf9f2] p-4 md:p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-maroon/60">
              <SlidersHorizontal className="size-3.5" /> Refine the directory
            </div>
            <span className="hidden text-[9px] uppercase tracking-[0.1em] text-muted-foreground sm:block">Filters are free · order is not paid</span>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-4">
            <label className="block">
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Craft skill</span>
              <select value={craft} onChange={(event) => update("craft", event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-maroon/20 bg-parchment px-2.5 text-xs text-ink">
                <option value="">Any craft</option>
                {CRAFT_SKILLS.map((skill) => <option key={skill} value={skill}>{skill}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Product</span>
              <select value={product} onChange={(event) => update("product", event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-maroon/20 bg-parchment px-2.5 text-xs text-ink">
                <option value="">Any product</option>
                {PRODUCT_CAPABILITIES.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">City</span>
              <div className="mt-1 flex gap-1.5">
                <input value={draftCity} onChange={(event) => setDraftCity(event.target.value)} placeholder="e.g. Jaipur" className="h-10 min-w-0 flex-1 rounded-lg border border-maroon/20 bg-parchment px-2.5 text-xs" />
                <Button type="button" size="icon" className="size-10 shrink-0 rounded-lg bg-maroon text-ivory" aria-label="Search city" onClick={() => update("city", draftCity.trim())}>
                  <Search className="size-4" />
                </Button>
              </div>
            </label>
            <label className="flex items-end gap-2 pb-2.5">
              <input type="checkbox" checked={verifiedOnly} onChange={(event) => update("verified", event.target.checked ? "1" : "")} className="size-4 accent-[#087f83]" />
              <span className="text-xs text-ink/70">Documented verification only</span>
            </label>
          </div>
          {hasFilters && (
            <button type="button" onClick={() => { setDraftCity(""); setParams({}, { replace: true }); }} className="mt-3 text-[11px] font-semibold text-vermilion hover:underline">
              Clear all filters
            </button>
          )}
        </div>

        {artisans === undefined ? (
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((key) => <div key={key} className="h-96 animate-pulse border border-maroon/10 bg-card/60" />)}
          </div>
        ) : artisans.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-maroon/25 bg-card/60 px-6 py-16 text-center">
            <Users className="mx-auto size-9 text-maroon/30" />
            <p className="mt-3 font-display text-2xl text-maroon">{hasFilters ? "No profile matches those filters yet." : "The directory is just opening."}</p>
            <p className="mx-auto mt-2 max-w-[50ch] text-xs leading-relaxed text-ink/55">
              {hasFilters
                ? "Try a broader craft or remove the city filter. Artisans join with their own profiles — we don’t invent listings to fill the page."
                : "No artisans have published a profile yet. You can still post a brief: matching will consider profiles as they arrive, and you can invite anyone directly."}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {hasFilters && <Button variant="outline" className="rounded-full border-maroon/25" onClick={() => { setDraftCity(""); setParams({}, { replace: true }); }}>Clear filters</Button>}
              <Link to="/customer/create-request" className="rounded-full bg-maroon px-5 py-2.5 text-xs font-semibold text-ivory">Post a brief</Link>
            </div>
          </div>
        ) : (
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {artisans.map((artisan) => (
              <ArtisanCard
                key={artisan.id}
                artisan={artisan}
                onCompare={toggleCompare}
                selectedForCompare={compare.some((item) => item.id === artisan.id)}
              />
            ))}
          </div>
        )}

        <p className="mt-6 max-w-[80ch] text-[9px] leading-relaxed text-muted-foreground">
          Profile information is supplied and maintained by each artisan. “Sample” profiles are
          demonstration data and are excluded from matching unless updated by a real artisan. Minimum
          project values, capacity and delivery scope are set by the artisan.
        </p>
      </div>

      {compare.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gold/35 bg-[#f7f2e8]/96 px-4 py-3 shadow-[0_-16px_40px_-30px_rgba(40,35,31,0.55)] backdrop-blur-md md:px-8">
          <div className="mx-auto flex max-w-[1360px] flex-wrap items-center gap-3">
            <span className="label-caps flex items-center gap-1.5 text-[9px] text-teal"><Sparkles className="size-3.5" /> Compare makers</span>
            <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
              {compare.map((artisan) => (
                <span key={artisan.id} className="flex items-center gap-1.5 border border-maroon/15 bg-card px-2 py-1 text-[10px] text-ink/65">
                  {artisan.displayName}
                  <button type="button" onClick={() => toggleCompare(artisan)} aria-label={`Remove ${artisan.displayName}`} className="text-ink/35 hover:text-vermilion"><X className="size-3" /></button>
                </span>
              ))}
            </div>
            <Button size="sm" className="rounded-full bg-maroon px-4 text-ivory hover:bg-maroon-deep" onClick={() => setCompareOpen(true)} disabled={compare.length < 2}>
              Compare {compare.length} <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      {compareOpen && compare.length > 1 && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Compare artisans">
          <div className="max-h-[88vh] w-full max-w-[1050px] overflow-auto border border-maroon/20 bg-[#f7f2e8] shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-maroon/15 bg-[#f7f2e8]/96 px-4 py-3 backdrop-blur">
              <div>
                <p className="label-caps text-[9px] text-teal">Side by side</p>
                <h2 className="font-display text-2xl font-semibold text-maroon">A considered comparison</h2>
              </div>
              <button type="button" onClick={() => setCompareOpen(false)} className="flex size-8 items-center justify-center border border-maroon/20 text-maroon" aria-label="Close comparison"><X className="size-4" /></button>
            </div>
            <div className="overflow-x-auto p-4">
              <table className="w-full min-w-[640px] border-collapse text-left text-[11px]">
                <thead>
                  <tr>
                    <th className="w-[150px] border-b border-maroon/15 p-3 align-bottom text-[9px] uppercase tracking-[0.12em] text-muted-foreground">What matters</th>
                    {compare.map((artisan) => (
                      <th key={artisan.id} className="border-b border-l border-maroon/12 p-3 align-bottom">
                        <p className="font-display text-lg font-semibold text-ink">{artisan.displayName}</p>
                        <p className="mt-0.5 text-[9px] font-normal text-ink/45">{artisan.city} · {artisan.verificationStatus === "verified" ? "Documents verified" : "Not verified"}</p>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Craft", (a: ArtisanSummary) => a.skills.slice(0, 3).join(" · ")],
                    ["Products", (a: ArtisanSummary) => a.products.slice(0, 3).join(" · ") || "Not stated"],
                    ["Availability", (a: ArtisanSummary) => a.availability === "available" ? "Taking work" : a.availability === "limited" ? "Limited capacity" : "Paused"],
                    ["Minimum project", (a: ArtisanSummary) => a.minProjectValue ? formatInr(a.minProjectValue) : "Not stated"],
                    ["Typical lead time", (a: ArtisanSummary) => a.turnaroundDays ? `${a.turnaroundDays} days` : "Not stated"],
                    ["KalaCollab", (a: ArtisanSummary) => a.collaborates ? "Open to collaboration" : "Individual projects"],
                    ["Completed work", (a: ArtisanSummary) => `${a.completedProjects} projects · ${a.reviewCount} reviews`],
                  ].map(([label, value]) => (
                    <tr key={String(label)}>
                      <th className="border-b border-maroon/10 p-3 align-top text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{String(label)}</th>
                      {compare.map((artisan) => (
                        <td key={artisan.id} className="border-b border-l border-maroon/10 p-3 align-top text-ink/65">
                          {(value as (a: ArtisanSummary) => string)(artisan)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="border-t border-maroon/12 px-4 py-3 text-[9px] leading-relaxed text-muted-foreground">
              Comparison uses the artisans’ published profile facts. It does not rank people or
              imply a guaranteed outcome. Verification means documents were reviewed.
            </p>
          </div>
        </div>
      )}
    </PublicShell>
  );
}

export function ArtisanPublicPage({ artisanId }: { artisanId: string }) {
  const profile = useQuery(api.artisans.publicProfile, { artisanId: artisanId as never });
  if (profile === undefined) {
    return <PublicShell><div className="mx-auto max-w-[1100px] px-4 py-16"><div className="h-72 animate-pulse rounded-2xl border border-maroon/10 bg-card" /></div></PublicShell>;
  }
  if (!profile) {
    return (
      <PublicShell>
        <div className="mx-auto max-w-[680px] px-4 py-24 text-center">
          <p className="font-display text-3xl text-maroon">This profile isn’t available.</p>
          <p className="mt-2 text-sm text-ink/60">It may have been removed, suspended or never published.</p>
          <Link to="/explore-artisans" className="mt-5 inline-flex rounded-full bg-maroon px-5 py-2.5 text-xs font-semibold text-ivory">Back to the directory</Link>
        </div>
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <section className="relative overflow-hidden border-b border-gold/25 bg-[linear-gradient(120deg,#fdf3e3,#f7e6cf)]">
        <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-12 md:grid-cols-[1.4fr_0.6fr] md:px-8 md:py-16">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {profile.sampleLabel && <span className="rounded-full border border-saffron/50 bg-saffron/15 px-2.5 py-1 text-[10px] font-semibold text-[#8a5a12]">{profile.sampleLabel}</span>}
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${profile.verificationStatus === "verified" ? "border-emerald/30 bg-emerald/10 text-emerald" : "border-ink/15 bg-ivory text-ink/55"}`}>
                {profile.verificationStatus === "verified" ? "Documents verified" : profile.verificationStatus === "pending" ? "Verification pending" : "Not verified"}
              </span>
            </div>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-tight text-maroon md:text-5xl">{profile.displayName}</h1>
            <p className="mt-1 text-sm font-medium text-teal-deep">{profile.headline}</p>
            <p className="mt-1 text-xs text-ink/55">{profile.city}{profile.serviceRegion ? ` · serves ${profile.serviceRegion}` : ""} · {profile.yearsExperience} years in craft</p>
            <p className="mt-4 max-w-[66ch] text-sm leading-relaxed text-ink/70">{profile.intro || "This artisan has not added an introduction yet."}</p>
            <div className="mt-5 flex flex-wrap gap-1.5">
              {profile.skills.map((skill) => (
                <span key={skill} className="rounded-full border border-teal/25 bg-teal/[0.05] px-2.5 py-1 text-[10px] font-medium text-teal-deep">{skill}</span>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to={`/customer/create-request?craft=${encodeURIComponent(profile.skills[0] ?? "")}`} className="rounded-full bg-maroon px-5 py-2.5 text-xs font-semibold text-ivory">Brief this craft</Link>
              <Link to="/explore-artisans" className="rounded-full border border-maroon/25 px-5 py-2.5 text-xs font-semibold text-maroon">Back to directory</Link>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-3 self-start rounded-2xl border border-maroon/15 bg-card p-4">
            {[
              ["Completed projects", String(profile.stats.completedProjects)],
              ["Reviews", String(profile.reviews.length)],
              ["Minimum project", formatInr(profile.minProjectValue)],
              ["Availability", profile.availability === "available" ? "Taking work" : profile.availability === "limited" ? "Limited capacity" : "Paused"],
              ["Ships nationwide", profile.shipsNationwide ? "Yes" : "Local only"],
              ["Languages", profile.languages.slice(0, 3).join(" · ")],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-parchment/70 p-3">
                <dt className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
                <dd className="mt-1 text-sm font-semibold text-maroon">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="mx-auto max-w-[1200px] px-4 py-10 md:px-8 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.35fr_0.65fr]">
          <div>
            <h2 className="font-display text-2xl font-semibold text-maroon">Portfolio</h2>
            <p className="mt-1 text-xs text-ink/55">Work uploaded by the artisan. Attribution and reuse permission are shown with each piece.</p>
            {profile.portfolio.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-maroon/25 bg-card/50 px-5 py-10 text-center text-xs text-ink/55">No portfolio work published yet.</div>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {profile.portfolio.map((item) => (
                  <article key={item._id} className="overflow-hidden rounded-xl border border-maroon/15 bg-card">
                    {item.url ? <img src={item.url} alt={item.title} className="aspect-[4/3] w-full object-cover" /> : <div className="flex aspect-[4/3] items-center justify-center bg-maroon/[0.04] text-xs text-muted-foreground">External work</div>}
                    <div className="p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-display text-base font-semibold text-ink">{item.title}</p>
                        {item.sampleLabel && <span className="rounded bg-saffron/15 px-1.5 py-0.5 text-[8px] font-semibold text-[#8a5a12]">{item.sampleLabel}</span>}
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-ink/60">{item.description}</p>
                      <p className="mt-2 text-[9px] uppercase tracking-wide text-muted-foreground">{item.craftTags.join(" · ")}{item.durationDays ? ` · ${item.durationDays} days` : ""}</p>
                      <p className="mt-1 text-[9px] text-muted-foreground">Attribution: {item.attribution} · {item.reusePermission.split("_").join(" ")}</p>
                      {item.externalUrl && <a href={item.externalUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[10px] font-semibold text-teal-deep">View original ↗</a>}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <aside>
            <h2 className="font-display text-2xl font-semibold text-maroon">Reviews</h2>
            <p className="mt-1 text-xs text-ink/55">Only customers with a completed project can review.</p>
            {profile.reviews.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-maroon/20 bg-card/50 p-5 text-center text-xs text-ink/50">No reviews yet. This artisan may be new to KALकारी.</div>
            ) : (
              <div className="mt-4 space-y-3">
                {profile.reviews.map((review) => (
                  <article key={review._id} className="rounded-xl border border-maroon/15 bg-card p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-ink">{review.authorName}</p>
                      <span className="text-[10px] text-saffron">{"★".repeat(review.rating)}<span className="text-gold/30">{"★".repeat(5 - review.rating)}</span></span>
                    </div>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-ink/65">{review.body}</p>
                    <p className="mt-1 text-[9px] text-muted-foreground">{new Date(review.createdAt).toLocaleDateString("en-IN")}</p>
                  </article>
                ))}
              </div>
            )}

            <div className="mt-6 rounded-xl border border-gold/40 bg-ivory/70 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-maroon">How this profile works</p>
              <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-ink/60">
                <li>· Skills and rates are set by the artisan.</li>
                <li>· “Verified” means documents were checked, not that work is guaranteed.</li>
                <li>· Sample profiles are demo data and labelled.</li>
                <li>· Your brief is shared only with artisans you choose.</li>
              </ul>
              <Link to="/trust-and-safety" className="mt-2 inline-block text-[10px] font-semibold text-teal-deep">Read the protection policy →</Link>
            </div>
          </aside>
        </div>
      </div>
    </PublicShell>
  );
}
