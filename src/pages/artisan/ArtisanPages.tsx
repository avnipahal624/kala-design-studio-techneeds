import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { PortalShell } from "@/components/portal/PortalShell";
import { ProjectWorkspace } from "@/components/marketplace/ProjectWorkspace";
import { StatusPill, StatCard, VerificationBadge } from "@/components/marketplace/Bits";
import { UploadImages, type UploadedImage } from "@/components/marketplace/UploadImages";
import { Button } from "@/components/ui/button";
import {
  CRAFT_SKILLS, LANGUAGES, MATERIALS, PRODUCT_CAPABILITIES, REUSE_PERMISSIONS,
  formatDate, formatInr, statusLabel,
} from "@/lib/marketplace";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowRight, BadgeCheck, CalendarClock, CheckCircle2, ChevronLeft, Clock,
  FileText, Hammer, ImagePlus, IndianRupee, Loader2, MapPin, MessageSquare,
  Package, Pencil, Plus, ReceiptText, ScanText, Send, ShieldCheck, Sparkles,
  Trash2, TrendingUp, Upload, Users, Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";

function Notice({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-gold/40 bg-ivory/70 px-4 py-3 text-[11px] leading-relaxed text-ink/65">{children}</div>;
}

export function ArtisanDashboard() {
  const { user } = useAuth();
  const data = useQuery(api.artisans.dashboard);
  const quotes = useQuery(api.quotes.forArtisan);

  if (data === undefined) return <PortalShell role="artisan" title="Dashboard"><div className="h-64 animate-pulse rounded-2xl bg-card" /></PortalShell>;
  if (data === null) {
    return (
      <PortalShell role="artisan" title="Your craft, your terms" hindi="कारीगर" subtitle="Set up CraftFit to see matched work.">
        <div className="mx-auto max-w-[760px] rounded-2xl border border-teal/25 bg-card p-6 text-center">
          <ScanText className="mx-auto size-10 text-teal/60" />
          <h2 className="mt-3 font-display text-3xl font-semibold text-maroon">Start with what your hands know.</h2>
          <p className="mx-auto mt-2 max-w-[56ch] text-sm leading-relaxed text-ink/60">CraftFit asks for your skills, materials, capacity and rates so matched briefs make sense. It takes about ten minutes, and nothing is published until you decide to take work.</p>
          <Link to="/artisan/onboarding" className="mt-5 inline-flex items-center gap-2 rounded-full bg-teal px-6 py-3 text-sm font-semibold text-ivory">Build my CraftFit profile <ArrowRight className="size-4" /></Link>
          <p className="mt-3 text-[10px] text-muted-foreground">Your portfolio is never used to train AI. No profile is invented for you.</p>
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell role="artisan" title={`नमस्ते${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`} hindi="कारीगर" subtitle={data.profile.headline} actions={<Link to="/artisan/jobs" className="hidden items-center gap-1.5 rounded-full bg-teal px-4 py-2 text-xs font-semibold text-ivory sm:inline-flex"><Hammer className="size-3.5" /> KalaJobs</Link>}>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-maroon/15 bg-card p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-full bg-maroon/[0.07] font-display text-lg font-semibold text-maroon">{data.profile.displayName.charAt(0)}</span>
          <div><p className="text-sm font-semibold text-ink">{data.profile.displayName}</p><p className="text-[11px] text-ink/55">{data.profile.city} · {data.profile.skills.slice(0, 2).join(" · ")}</p></div>
        </div>
        <div className="flex flex-wrap gap-2"><VerificationBadge status={data.profile.verificationStatus} sampleLabel={data.profile.sampleLabel} /><span className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${data.profile.availability === "available" ? "border-teal/30 bg-teal/10 text-teal-deep" : data.profile.availability === "limited" ? "border-saffron/50 bg-saffron/15 text-[#8a5a12]" : "border-ink/15 bg-ink/5 text-ink/55"}`}>{data.profile.availability === "available" ? "Available for work" : data.profile.availability === "limited" ? "Limited capacity" : "Paused"}</span></div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active projects" value={data.counts.activeProjects} hint="Funded work in hand" tone="maroon" />
        <StatCard label="Quotes open" value={data.counts.pendingQuotes} hint="Awaiting customer" tone="teal" />
        <StatCard label="Invitations" value={data.counts.invites} hint="Direct from customers" tone="saffron" />
        <StatCard label="Pending payout" value={formatInr(data.earnings.pendingPayoutInr)} hint={`${formatInr(data.earnings.lifetimeReleasedInr)} released`} tone="emerald" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="rounded-2xl border border-maroon/15 bg-card p-5">
          <div className="flex items-center justify-between"><h2 className="font-display text-xl font-semibold text-maroon">Work in motion</h2><Link to="/artisan/projects" className="text-[11px] font-semibold text-teal-deep">All projects →</Link></div>
          {data.recentProjects.length === 0 ? (
            <div className="mt-3 rounded-xl border border-dashed border-maroon/20 p-6 text-center">
              <Hammer className="mx-auto size-7 text-maroon/25" />
              <p className="mt-2 text-sm font-medium text-ink">No funded project yet.</p>
              <p className="mx-auto mt-1 max-w-[46ch] text-[11px] text-ink/55">Matched briefs appear in KalaJobs. Quote clearly; a customer accepting your quote creates a project.</p>
              <Link to="/artisan/jobs" className="mt-3 inline-flex rounded-full bg-teal px-4 py-2 text-[11px] font-semibold text-ivory">See matched work</Link>
            </div>
          ) : (
            <div className="mt-3 divide-y divide-maroon/10">
              {data.recentProjects.map((project) => (
                <Link key={project._id} to={`/artisan/projects/${project._id}`} className="flex items-center gap-3 py-3 first:pt-0">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-maroon/[0.06]"><Package className="size-4 text-maroon/50" /></span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink">{project.title}</p><p className="text-[10px] text-ink/50">{formatInr(project.amountInr)} · updated {formatDate(project.updatedAt)}</p></div>
                  <StatusPill kind="project" status={project.status} />
                </Link>
              ))}
            </div>
          )}
        </section>

        <div className="space-y-4">
          <section className="rounded-2xl border border-maroon/15 bg-card p-5">
            <h2 className="font-display text-lg font-semibold text-maroon">Profile completeness</h2>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-maroon/10"><div className="h-full rounded-full bg-teal" style={{ width: `${data.profileCompletion}%` }} /></div>
            <p className="mt-1 text-[11px] text-ink/55">{data.profileCompletion}% complete. Verification needs at least one portfolio piece and a document review.</p>
            <div className="mt-3 space-y-1.5 text-[11px]">
              <Link to="/artisan/portfolio" className="flex items-center justify-between rounded-lg bg-parchment/60 px-2.5 py-2"><span className="text-ink/65">Portfolio pieces</span><span className="font-semibold text-maroon">{data.counts.portfolio} →</span></Link>
              <Link to="/artisan/onboarding" className="flex items-center justify-between rounded-lg bg-parchment/60 px-2.5 py-2"><span className="text-ink/65">CraftFit details</span><span className="font-semibold text-maroon">Edit →</span></Link>
              <Link to="/artisan/availability" className="flex items-center justify-between rounded-lg bg-parchment/60 px-2.5 py-2"><span className="text-ink/65">Availability</span><span className="font-semibold text-maroon">Manage →</span></Link>
            </div>
          </section>
          <section className="rounded-2xl border border-teal/25 bg-teal/[0.04] p-4">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-teal"><ShieldCheck className="size-3.5" /> Paid before you start</p>
            <p className="mt-1 text-[11px] leading-relaxed text-ink/60">A project only reaches you as funded work after the customer pays. Never start making on a promise of off-platform payment.</p>
          </section>
        </div>
      </div>

      <section className="mt-5 rounded-2xl border border-maroon/15 bg-card p-5">
        <div className="flex items-center justify-between"><h2 className="font-display text-xl font-semibold text-maroon">Recent quotes</h2><Link to="/artisan/quotes" className="text-[11px] font-semibold text-teal-deep">All quotes →</Link></div>
        {quotes === undefined ? <div className="mt-2 h-20 animate-pulse rounded-lg bg-parchment" /> : quotes.length === 0 ? <p className="mt-2 text-[11px] text-ink/50">No quotes sent yet. Open a matched brief to quote.</p> : (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {quotes.slice(0, 4).map((quote) => (
              <Link key={quote._id} to={`/artisan/jobs/${quote.requestId}`} className="rounded-xl border border-maroon/12 p-3">
                <div className="flex items-start justify-between gap-2"><p className="truncate text-xs font-semibold text-ink">{quote.requestTitle}</p><StatusPill kind="quote" status={quote.status} /></div>
                <p className="mt-1 text-[10px] text-ink/50">{formatInr(quote.totalInr)} · {quote.timelineDays} days · {formatInr(quote.netPayoutInr)} net</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </PortalShell>
  );
}

type CraftFitForm = {
  displayName: string; craftHeadline: string; city: string; serviceRegion: string;
  mode: "individual" | "collective"; yearsExperience: number; intro: string;
  languages: string[]; skills: string[]; customSkills: string[]; products: string[];
  materials: string[]; minProjectValue: number; maxProjectValue: number; weeklyCapacity: number;
  turnaroundDays: number; shipsNationwide: boolean; localOnly: boolean; collaborates: boolean;
  workingHours: string; availability: "available" | "limited" | "paused";
};

const DEFAULT_CRAFTFIT: CraftFitForm = {
  displayName: "", craftHeadline: "", city: "", serviceRegion: "", mode: "individual",
  yearsExperience: 5, intro: "", languages: ["Hindi", "English"], skills: [], customSkills: [],
  products: [], materials: [], minProjectValue: 2000, maxProjectValue: 0, weeklyCapacity: 3,
  turnaroundDays: 21, shipsNationwide: true, localOnly: false, collaborates: false,
  workingHours: "", availability: "available",
};

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function ChipPicker({ options, value, onChange, label }: { options: readonly string[]; value: string[]; onChange: (next: string[]) => void; label: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-ink/70">{label}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {options.map((option) => (
          <button key={option} type="button" onClick={() => onChange(toggle(value, option))} className={`rounded-full border px-2.5 py-1 text-[10px] font-medium transition ${value.includes(option) ? "border-teal bg-teal text-ivory" : "border-maroon/20 bg-parchment text-ink/60 hover:border-teal/50"}`}>{option}</button>
        ))}
      </div>
    </div>
  );
}

export function ArtisanOnboarding() {
  const existing = useQuery(api.artisans.myProfile);
  const save = useMutation(api.artisans.saveCraftFit);
  const navigate = useNavigate();
  const [form, setForm] = useState<CraftFitForm>(DEFAULT_CRAFTFIT);
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    if (existing && !prefilled) {
      setForm({
        displayName: existing.displayName,
        craftHeadline: existing.headline,
        city: existing.city,
        serviceRegion: existing.serviceRegion,
        mode: existing.mode,
        yearsExperience: existing.yearsExperience,
        intro: existing.intro,
        languages: existing.languages,
        skills: existing.skills,
        customSkills: existing.customSkills ?? [],
        products: existing.products,
        materials: existing.materials,
        minProjectValue: existing.minProjectValue,
        maxProjectValue: existing.maxProjectValue ?? 0,
        weeklyCapacity: existing.weeklyCapacity ?? 3,
        turnaroundDays: existing.turnaroundDays,
        shipsNationwide: existing.shipsNationwide,
        localOnly: existing.localOnly,
        collaborates: existing.collaborates,
        workingHours: existing.workingHours ?? "",
        availability: existing.availability as CraftFitForm["availability"],
      });
      setPrefilled(true);
    }
  }, [existing, prefilled]);

  function set<K extends keyof CraftFitForm>(key: K, value: CraftFitForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const canContinue = step === 1
    ? form.displayName.trim().length >= 2 && form.craftHeadline.trim().length >= 4 && form.city.trim().length >= 2 && form.serviceRegion.trim().length >= 2
    : step === 2
      ? form.intro.trim().length >= 30 && form.skills.length > 0 && form.products.length > 0 && form.materials.length > 0
      : true;

  async function submit() {
    setBusy(true);
    try {
      await save({
        displayName: form.displayName,
        craftHeadline: form.craftHeadline,
        city: form.city,
        serviceRegion: form.serviceRegion,
        mode: form.mode,
        yearsExperience: Number(form.yearsExperience),
        intro: form.intro,
        languages: form.languages,
        skills: form.skills,
        customSkills: form.customSkills,
        products: form.products,
        materials: form.materials,
        minProjectValue: Number(form.minProjectValue),
        maxProjectValue: form.maxProjectValue > 0 ? Number(form.maxProjectValue) : undefined,
        weeklyCapacity: Number(form.weeklyCapacity),
        turnaroundDays: Number(form.turnaroundDays),
        shipsNationwide: form.shipsNationwide,
        localOnly: form.localOnly,
        collaborates: form.collaborates,
        workingHours: form.workingHours || undefined,
        availability: form.availability,
      });
      toast.success("CraftFit saved. Matched briefs will appear in KalaJobs.");
      navigate("/artisan/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^[A-Z_]+:\s*/, "") : "Could not save CraftFit.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PortalShell role="artisan" title={existing ? "Edit your CraftFit" : "Build your CraftFit"} hindi="कारीगर प्रोफ़ाइल" subtitle="Skills, materials, rates and capacity. You can edit this any time.">
      <div className="mx-auto max-w-[860px]">
        <ol className="mb-4 grid grid-cols-3 gap-1.5">
          {["Who you are", "What you make", "How you work"].map((label, index) => (
            <li key={label} className={`rounded-lg border px-2 py-2 text-center ${step === index + 1 ? "border-teal bg-teal text-ivory" : step > index + 1 ? "border-emerald/30 bg-emerald/[0.06] text-emerald" : "border-maroon/15 bg-card text-ink/45"}`}><span className="block text-[9px] font-bold">0{index + 1}</span><span className="text-[10px] font-medium">{label}</span></li>
          ))}
        </ol>
        <div className="rounded-2xl border border-maroon/15 bg-card p-5 md:p-6">
          {step === 1 && (
            <div className="space-y-3">
              <div><h2 className="font-display text-2xl font-semibold text-maroon">Start with your name and craft.</h2><p className="mt-1 text-xs text-ink/55">Use the name you want customers to see. Your legal documents stay private in the verification step.</p></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block"><span className="text-[11px] font-semibold text-ink/70">Display name</span><input value={form.displayName} onChange={(e) => set("displayName", e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-maroon/20 bg-parchment px-3 text-sm" /></label>
                <label className="block"><span className="text-[11px] font-semibold text-ink/70">Craft headline</span><input value={form.craftHeadline} onChange={(e) => set("craftHeadline", e.target.value)} placeholder="e.g. Hand-painted denim and leather" className="mt-1 h-10 w-full rounded-lg border border-maroon/20 bg-parchment px-3 text-sm" /></label>
                <label className="block"><span className="text-[11px] font-semibold text-ink/70">City</span><input value={form.city} onChange={(e) => set("city", e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-maroon/20 bg-parchment px-3 text-sm" /></label>
                <label className="block"><span className="text-[11px] font-semibold text-ink/70">Service region</span><input value={form.serviceRegion} onChange={(e) => set("serviceRegion", e.target.value)} placeholder="e.g. Pune and nearby districts" className="mt-1 h-10 w-full rounded-lg border border-maroon/20 bg-parchment px-3 text-sm" /></label>
                <label className="block"><span className="text-[11px] font-semibold text-ink/70">Practice type</span><select value={form.mode} onChange={(e) => set("mode", e.target.value as CraftFitForm["mode"])} className="mt-1 h-10 w-full rounded-lg border border-maroon/20 bg-parchment px-2.5 text-sm"><option value="individual">Individual artisan</option><option value="collective">Collective / workshop</option></select></label>
                <label className="block"><span className="text-[11px] font-semibold text-ink/70">Years in craft</span><input type="number" min={0} max={60} value={form.yearsExperience} onChange={(e) => set("yearsExperience", Number(e.target.value))} className="mt-1 h-10 w-full rounded-lg border border-maroon/20 bg-parchment px-3 text-sm" /></label>
              </div>
              <ChipPicker options={LANGUAGES} value={form.languages} onChange={(next) => set("languages", next)} label="Languages you work in" />
              <label className="block"><span className="text-[11px] font-semibold text-ink/70">About your work</span><textarea value={form.intro} onChange={(e) => set("intro", e.target.value)} rows={4} maxLength={1200} placeholder="What do you make, how did you learn, what materials do you prefer? At least a couple of sentences." className="mt-1 w-full rounded-lg border border-maroon/20 bg-parchment px-3 py-2 text-sm" /><span className="text-[10px] text-muted-foreground">{form.intro.trim().length}/30 characters minimum</span></label>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div><h2 className="font-display text-2xl font-semibold text-maroon">What can your hands do?</h2><p className="mt-1 text-xs text-ink/55">These fields drive matching. Be specific — overstating a skill leads to briefs you cannot make.</p></div>
              <ChipPicker options={CRAFT_SKILLS} value={form.skills} onChange={(next) => set("skills", next)} label="Craft skills (choose all that genuinely apply)" />
              <label className="block"><span className="text-[11px] font-semibold text-ink/70">Other skills <span className="font-normal text-muted-foreground">(comma separated, optional)</span></span><input value={form.customSkills.join(", ")} onChange={(e) => set("customSkills", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} className="mt-1 h-10 w-full rounded-lg border border-maroon/20 bg-parchment px-3 text-sm" /></label>
              <ChipPicker options={PRODUCT_CAPABILITIES} value={form.products} onChange={(next) => set("products", next)} label="Products you can work on" />
              <ChipPicker options={MATERIALS} value={form.materials} onChange={(next) => set("materials", next)} label="Materials you are comfortable with" />
              <Notice>Your portfolio is separate and comes next. KALकारी never uses it to train AI without your explicit permission.</Notice>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div><h2 className="font-display text-2xl font-semibold text-maroon">Set the terms that work for you.</h2><p className="mt-1 text-xs text-ink/55">Budget and capacity filters protect you from briefs that do not fit. The 8% platform fee is shown on every quote.</p></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block"><span className="text-[11px] font-semibold text-ink/70">Minimum project value (₹)</span><input type="number" min={100} value={form.minProjectValue} onChange={(e) => set("minProjectValue", Number(e.target.value))} className="mt-1 h-10 w-full rounded-lg border border-maroon/20 bg-parchment px-3 text-sm" /></label>
                <label className="block"><span className="text-[11px] font-semibold text-ink/70">Typical maximum (₹, optional)</span><input type="number" min={0} value={form.maxProjectValue} onChange={(e) => set("maxProjectValue", Number(e.target.value))} className="mt-1 h-10 w-full rounded-lg border border-maroon/20 bg-parchment px-3 text-sm" /></label>
                <label className="block"><span className="text-[11px] font-semibold text-ink/70">New projects per week</span><input type="number" min={1} max={20} value={form.weeklyCapacity} onChange={(e) => set("weeklyCapacity", Number(e.target.value))} className="mt-1 h-10 w-full rounded-lg border border-maroon/20 bg-parchment px-3 text-sm" /></label>
                <label className="block"><span className="text-[11px] font-semibold text-ink/70">Typical turnaround (days)</span><input type="number" min={1} max={180} value={form.turnaroundDays} onChange={(e) => set("turnaroundDays", Number(e.target.value))} className="mt-1 h-10 w-full rounded-lg border border-maroon/20 bg-parchment px-3 text-sm" /></label>
                <label className="block sm:col-span-2"><span className="text-[11px] font-semibold text-ink/70">Working hours / notes <span className="font-normal text-muted-foreground">(optional)</span></span><input value={form.workingHours} onChange={(e) => set("workingHours", e.target.value)} placeholder="e.g. Mon–Sat, 10am–6pm" className="mt-1 h-10 w-full rounded-lg border border-maroon/20 bg-parchment px-3 text-sm" /></label>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  ["shipsNationwide", "I can ship nationwide"],
                  ["localOnly", "I prefer local handoff"],
                  ["collaborates", "I can collaborate with other artisans"],
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 rounded-lg border border-maroon/15 bg-parchment/60 px-3 py-2 text-[11px] text-ink/65"><input type="checkbox" checked={Boolean(form[key as keyof CraftFitForm])} onChange={(e) => set(key as "shipsNationwide" | "localOnly" | "collaborates", e.target.checked)} className="size-4 accent-[#087f83]" />{label}</label>
                ))}
              </div>
              <label className="block"><span className="text-[11px] font-semibold text-ink/70">Current availability</span><select value={form.availability} onChange={(e) => set("availability", e.target.value as CraftFitForm["availability"])} className="mt-1 h-10 w-full rounded-lg border border-maroon/20 bg-parchment px-2.5 text-sm"><option value="available">Available for new work</option><option value="limited">Limited — small projects only</option><option value="paused">Paused — no new work</option></select></label>
              <Notice>Saving makes this profile visible in the artisan directory as <strong>not verified</strong> unless you have completed document review. You can pause or edit it at any time.</Notice>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between border-t border-maroon/10 pt-4">
            <Button type="button" variant="outline" className="rounded-full border-maroon/25" disabled={step === 1} onClick={() => setStep((s) => s - 1)}><ChevronLeft className="size-4" /> Back</Button>
            {step < 3 ? <Button type="button" className="rounded-full bg-teal px-5 text-ivory" disabled={!canContinue} onClick={() => setStep((s) => s + 1)}>Continue <ArrowRight className="size-4" /></Button> : <Button type="button" className="rounded-full bg-teal px-5 text-ivory" disabled={busy} onClick={() => void submit()}>{busy ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Save CraftFit</Button>}
          </div>
        </div>
      </div>
    </PortalShell>
  );
}

export function ArtisanJobs() {
  const feed = useQuery(api.requests.jobFeed, {});
  const save = useMutation(api.requests.toggleSavedJob);
  const [busy, setBusy] = useState<string | null>(null);

  async function toggleSave(requestId: Id<"customerRequests">) {
    setBusy(requestId);
    try { await save({ requestId }); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save."); } finally { setBusy(null); }
  }

  if (feed === undefined) return <PortalShell role="artisan" title="KalaJobs"><div className="h-64 animate-pulse rounded-2xl bg-card" /></PortalShell>;
  if (feed.needsProfile) return <PortalShell role="artisan" title="KalaJobs"><div className="rounded-2xl border border-teal/25 bg-card p-8 text-center"><ScanText className="mx-auto size-9 text-teal/60" /><p className="mt-3 font-display text-2xl text-maroon">Complete CraftFit to see matched work.</p><p className="mx-auto mt-1 max-w-[52ch] text-xs text-ink/55">Matching uses your skills, materials, budget range, capacity and location. Without a profile there is nothing honest to match against.</p><Link to="/artisan/onboarding" className="mt-4 inline-flex rounded-full bg-teal px-5 py-2.5 text-xs font-semibold text-ivory">Build my profile</Link></div></PortalShell>;

  return (
    <PortalShell role="artisan" title="KalaJobs" hindi="काम" subtitle="Briefs matched to your craft. Invitations are marked separately.">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-ink/55">{feed.jobs.length} brief{feed.jobs.length === 1 ? "" : "s"} match your profile. Scores are explainable; nobody pays for placement.</p>
        <Link to="/artisan/quotes" className="text-[11px] font-semibold text-teal-deep">My quotes →</Link>
      </div>
      {feed.jobs.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-maroon/25 bg-card/60 p-10 text-center"><Hammer className="mx-auto size-8 text-maroon/25" /><p className="mt-2 font-display text-xl text-maroon">No matched briefs right now.</p><p className="mx-auto mt-1 max-w-[52ch] text-xs text-ink/55">This can genuinely happen when the marketplace is new. Your profile stays visible in the directory, and direct invitations appear here.</p><Link to="/artisan/portfolio" className="mt-4 inline-flex rounded-full border border-teal/30 px-4 py-2 text-xs font-semibold text-teal-deep">Strengthen my portfolio</Link></div>
      ) : (
        <div className="mt-4 space-y-3">
          {feed.jobs.map((job) => (
            <article key={job._id} className="rounded-2xl border border-maroon/15 bg-card p-4 transition hover:border-maroon/35">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex min-w-0 gap-3">
                  {job.previewUrl ? <img src={job.previewUrl} alt="" className="size-16 shrink-0 rounded-xl object-cover" /> : <span className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-maroon/[0.05]"><ImagePlus className="size-5 text-maroon/25" /></span>}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">{job.invited && <span className="rounded-full bg-teal px-2 py-0.5 text-[9px] font-semibold text-ivory">Invited you</span>}<StatusPill kind="request" status="open" /></div>
                    <Link to={`/artisan/jobs/${job._id}`} className="mt-1 block font-display text-lg font-semibold leading-tight text-ink hover:text-maroon">{job.title}</Link>
                    <p className="mt-0.5 text-[10px] text-ink/50">{job.category} · {job.city} · {job.customerFirstName} · {job.customerVerified ? "email verified" : "email not verified"}</p>
                  </div>
                </div>
                <div className="text-right"><p className="font-display text-lg font-semibold text-maroon">{formatInr(job.budgetInr)}</p><p className="text-[9px] uppercase tracking-wide text-muted-foreground">budget ceiling</p></div>
              </div>
              <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-ink/60">{job.description}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">{job.requiredSkills.slice(0, 3).map((skill) => <span key={skill} className="rounded-full border border-teal/25 bg-teal/[0.05] px-2 py-0.5 text-[9px] font-medium text-teal-deep">{skill}</span>)}</div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-maroon/8 pt-2.5">
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-ink/55">
                  {job.deadline && <span className="flex items-center gap-1"><CalendarClock className="size-3" /> by {formatDate(job.deadline)}</span>}
                  <span>{job.fulfilment === "shipping" ? "Shipping" : "Local handoff"}</span>
                  <span className="font-medium text-teal-deep">{job.score}% fit</span>
                  {job.quoted && <span className="font-medium text-emerald">Quote sent</span>}
                </div>
                <div className="flex gap-2">
                  <button type="button" disabled={busy === job._id} onClick={() => void toggleSave(job._id)} className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold ${job.saved ? "border-saffron bg-saffron/15 text-[#8a5a12]" : "border-maroon/20 text-ink/55"}`}>{job.saved ? "Saved" : "Save"}</button>
                  <Link to={`/artisan/jobs/${job._id}`} className="rounded-full bg-teal px-3.5 py-1.5 text-[10px] font-semibold text-ivory">{job.quoted ? "View quote" : "View & quote"}</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </PortalShell>
  );
}

export function ArtisanJobDetail() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const job = useQuery(api.requests.getJob, requestId ? { requestId: requestId as Id<"customerRequests"> } : "skip");
  const submitQuote = useMutation(api.quotes.submit);
  const declineInvite = useMutation(api.requests.declineInvitation);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ materialsInr: 1500, labourInr: 3500, preparationInr: 300, finishingInr: 500, packagingInr: 150, deliveryInr: 0, timelineDays: 14, revisionRounds: 1, depositPercent: 50, terms: "50% project deposit; balance on approval. One revision round included. Materials subject to inspection on receipt.", note: "", expiresInDays: 7 });
  const [analysisOpen, setAnalysisOpen] = useState(false);

  if (!requestId) return null;
  if (job === undefined) return <PortalShell role="artisan" title="KalaJob"><div className="h-64 animate-pulse rounded-2xl bg-card" /></PortalShell>;
  if (job === null) return <PortalShell role="artisan" title="KalaJob"><p className="text-sm text-ink/60">This job is not available.</p></PortalShell>;

  const total = Math.round(form.materialsInr + form.labourInr + form.preparationInr + form.finishingInr + form.packagingInr + form.deliveryInr);
  const fee = Math.round(total * 0.08);
  const net = total - fee;
  const request = job.request;

  async function submit() {
    setBusy(true);
    try {
      await submitQuote({
        requestId: request._id,
        materialsInr: Number(form.materialsInr), labourInr: Number(form.labourInr),
        preparationInr: Number(form.preparationInr), finishingInr: Number(form.finishingInr),
        packagingInr: Number(form.packagingInr), deliveryInr: Number(form.deliveryInr),
        timelineDays: Number(form.timelineDays), revisionRounds: Number(form.revisionRounds),
        depositPercent: Number(form.depositPercent),
        terms: form.terms, note: form.note || undefined, expiresInDays: Number(form.expiresInDays),
      });
      toast.success("Quote submitted. The customer can now review it.");
      navigate("/artisan/quotes");
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^[A-Z_]+:\s*/, "") : "Could not submit the quote.");
    } finally { setBusy(false); }
  }

  return (
    <PortalShell role="artisan" title={request.title} hindi="काम विवरण" subtitle={`${request.category} · ${request.city} · posted ${formatDate(request.createdAt)}`} actions={<Link to="/artisan/jobs" className="hidden items-center gap-1 text-xs font-semibold text-teal-deep sm:inline-flex"><ChevronLeft className="size-4" /> KalaJobs</Link>}>
      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <section className="rounded-2xl border border-maroon/15 bg-card p-5">
            <div className="flex items-start justify-between gap-2">
              <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-teal">Customer brief</p><h2 className="font-display text-xl font-semibold text-maroon">{request.title}</h2><p className="mt-1 text-[11px] text-ink/55">{request.customerFirstName} · {request.customerCity ?? request.city} · {request.customerVerified ? "email verified" : "email not verified"}</p></div>
              <div className="text-right"><p className="font-display text-xl font-semibold text-maroon">{formatInr(request.budgetInr)}</p><p className="text-[9px] uppercase text-muted-foreground">budget ceiling</p></div>
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-ink/70">{request.productDescription}</p>
            <p className="mt-2 whitespace-pre-line text-[12px] leading-relaxed text-ink/65">{request.description}</p>
            {request.specialInstructions && <div className="mt-2 rounded-lg bg-saffron/[0.08] p-2.5 text-[11px] text-ink/65"><strong>Must keep:</strong> {request.specialInstructions}</div>}
            {request.images.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{request.images.map((image) => image.url && <a key={image.storageId} href={image.url} target="_blank" rel="noreferrer"><img src={image.url} alt="Customer reference" className="size-24 rounded-lg border border-maroon/15 object-cover" /></a>)}</div>}
            <div className="mt-3 grid gap-2 text-[10px] sm:grid-cols-2">
              {[["Deadline", request.deadline ? formatDate(request.deadline) : "Flexible"], ["Fulfilment", request.fulfilment === "shipping" ? "Shipping" : "Local handoff"], ["Product supplied by", request.customerSuppliesProduct ? "Customer" : "You (quote materials)"], ["Craft preference", request.craftPreference || "Open"]].map(([label, value]) => <div key={label} className="rounded-lg bg-parchment/60 px-2.5 py-2"><p className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-0.5 font-medium text-ink/75">{value}</p></div>)}
            </div>
          </section>

          <section className="rounded-2xl border border-teal/25 bg-teal/[0.04] p-4">
            <button type="button" onClick={() => setAnalysisOpen((value) => !value)} className="flex w-full items-center justify-between gap-2">
              <span><span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-teal"><Sparkles className="size-3.5" /> Why this was matched to you</span><span className="mt-0.5 block text-left text-[11px] text-ink/55">{job.match.score}% fit · explainable scoring, no paid placement</span></span>
              <span className="text-lg text-teal">{analysisOpen ? "−" : "+"}</span>
            </button>
            {analysisOpen && (
              <div className="mt-3 space-y-2">
                {job.match.reasons.map((reason) => <p key={reason} className="text-[11px] text-ink/65">· {reason}</p>)}
                {job.match.breakdown && <div className="grid grid-cols-2 gap-1.5 text-[10px] sm:grid-cols-3">{Object.entries(job.match.breakdown).map(([key, value]) => <div key={key} className="rounded bg-card px-2 py-1"><p className="capitalize text-muted-foreground">{key}</p><p className="font-semibold text-ink">{String(value)}</p></div>)}</div>}
                <p className="text-[9px] text-muted-foreground">Matching never uses protected traits. The score is a fit signal, not a promise of acceptance.</p>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-gold/40 bg-ivory/60 p-4">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-maroon"><ShieldCheck className="size-3.5" /> Before you quote</p>
            <ul className="mt-1.5 space-y-1 text-[11px] leading-relaxed text-ink/60">
              <li>· Ask for photos of damage or areas the customer did not show.</li>
              <li>· Clarify whether the base product is in hand or still to be sourced.</li>
              <li>· State what you will not do — no copying another artist’s work.</li>
              <li>· Never ask for payment outside the platform.</li>
            </ul>
          </section>
        </div>

        <aside>
          {job.invite?.status === "sent" && (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-saffron/40 bg-saffron/[0.07] px-3 py-2.5">
              <p className="text-[10px] leading-snug text-ink/60">The customer invited you directly. You are not obliged to quote.</p>
              <button type="button" disabled={busy} onClick={async () => { try { await declineInvite({ requestId: request._id }); toast.success("Invitation declined. The customer has been notified."); navigate("/artisan/jobs"); } catch (error) { toast.error(error instanceof Error ? error.message.replace(/^[A-Z_]+:\s*/, "") : "Could not decline."); } }} className="text-[10px] font-semibold text-vermilion">Decline invitation</button>
            </div>
          )}
          <section className="rounded-2xl border border-maroon/15 bg-card p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-teal">Your quote</p>
            <h2 className="font-display text-xl font-semibold text-maroon">{job.existingQuote ? "Revise your quote" : "Price the work honestly"}</h2>
            {job.existingQuote && <p className="mt-1 text-[10px] text-ink/50">Version {job.existingQuote.version + 1} will replace your submitted quote. The customer sees the change in the quote history.</p>}
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[["materialsInr", "Materials"], ["labourInr", "Labour"], ["preparationInr", "Preparation"], ["finishingInr", "Finishing"], ["packagingInr", "Packaging"], ["deliveryInr", "Delivery"]].map(([key, label]) => (
                <label key={key} className="block"><span className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">{label} ₹</span><input type="number" min={0} value={form[key as keyof typeof form] as number} onChange={(e) => setForm((prev) => ({ ...prev, [key]: Number(e.target.value) }))} className="mt-0.5 h-8 w-full rounded-md border border-maroon/20 bg-parchment px-2 text-xs" /></label>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-maroon/[0.05] px-3 py-2">
              <div><p className="text-[9px] uppercase tracking-wide text-muted-foreground">Total</p><p className="font-display text-lg font-semibold text-maroon">{formatInr(total)}</p></div>
              <div className="text-right"><p className="text-[9px] uppercase tracking-wide text-muted-foreground">Your net (8% fee)</p><p className="text-sm font-semibold text-emerald">{formatInr(net)}</p></div>
            </div>
            {total > request.budgetInr && <p className="mt-1 text-[10px] font-medium text-vermilion">This exceeds the customer’s ceiling of {formatInr(request.budgetInr)}. Reduce lines or explain a scope change in the note.</p>}
            <div className="mt-3 grid grid-cols-3 gap-2">
              <label className="block"><span className="text-[9px] font-medium uppercase text-muted-foreground">Days</span><input type="number" min={100} max={365} value={form.timelineDays} onChange={(e) => setForm((p) => ({ ...p, timelineDays: Number(e.target.value) }))} className="mt-0.5 h-8 w-full rounded-md border border-maroon/20 bg-parchment px-2 text-xs" /></label>
              <label className="block"><span className="text-[9px] font-medium uppercase text-muted-foreground">Revisions</span><input type="number" min={0} max={5} value={form.revisionRounds} onChange={(e) => setForm((p) => ({ ...p, revisionRounds: Number(e.target.value) }))} className="mt-0.5 h-8 w-full rounded-md border border-maroon/20 bg-parchment px-2 text-xs" /></label>
              <label className="block"><span className="text-[9px] font-medium uppercase text-muted-foreground">Valid days</span><input type="number" min={1} max={30} value={form.expiresInDays} onChange={(e) => setForm((p) => ({ ...p, expiresInDays: Number(e.target.value) }))} className="mt-0.5 h-8 w-full rounded-md border border-maroon/20 bg-parchment px-2 text-xs" /></label>
            </div>
            <label className="mt-2 block"><span className="text-[9px] font-medium uppercase text-muted-foreground">Terms</span><textarea value={form.terms} onChange={(e) => setForm((p) => ({ ...p, terms: e.target.value }))} rows={4} maxLength={2000} className="mt-0.5 w-full rounded-md border border-maroon/20 bg-parchment px-2 py-1.5 text-xs" /></label>
            <label className="mt-2 block"><span className="text-[9px] font-medium uppercase text-muted-foreground">Note to customer <span className="normal-case">(optional)</span></span><textarea value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} rows={2} maxLength={800} className="mt-0.5 w-full rounded-md border border-maroon/20 bg-parchment px-2 py-1.5 text-xs" /></label>
            <Button type="button" className="mt-3 w-full rounded-full bg-teal text-ivory hover:bg-teal-deep" disabled={busy || total <= 0 || total > request.budgetInr || form.terms.trim().length < 10} onClick={() => void submit()}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} {job.existingQuote ? "Submit revised quote" : "Submit quote"}</Button>
            <p className="mt-2 text-[9px] leading-relaxed text-muted-foreground">Submitting does not guarantee acceptance. The customer may compare other quotes. Your quote is binding for {form.expiresInDays} days if accepted.</p>
          </section>
        </aside>
      </div>
    </PortalShell>
  );
}

export function ArtisanQuotes() {
  const quotes = useQuery(api.quotes.forArtisan);
  const withdraw = useMutation(api.quotes.withdraw);
  async function doWithdraw(quoteId: Id<"quotes">) {
    try { await withdraw({ quoteId }); toast.success("Quote withdrawn."); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not withdraw."); }
  }
  return (
    <PortalShell role="artisan" title="My quotes" hindi="मेरे कोटेशन" subtitle="What you sent, what it earns, and what the customer decided.">
      {quotes === undefined ? <div className="h-64 animate-pulse rounded-2xl bg-card" /> : quotes.length === 0 ? <div className="rounded-2xl border border-dashed border-maroon/25 bg-card/60 p-10 text-center"><ReceiptText className="mx-auto size-8 text-maroon/25" /><p className="mt-2 font-display text-xl text-maroon">No quotes yet.</p><p className="mx-auto mt-1 max-w-[48ch] text-xs text-ink/55">Quotes are how work begins. Open a matched KalaJob to price it.</p><Link to="/artisan/jobs" className="mt-4 inline-flex rounded-full bg-teal px-4 py-2 text-xs font-semibold text-ivory">See KalaJobs</Link></div> : (
        <div className="space-y-3">
          {quotes.map((quote) => (
            <article key={quote._id} className="rounded-2xl border border-maroon/15 bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div><p className="font-display text-lg font-semibold text-ink">{quote.requestTitle}</p><p className="text-[10px] text-ink/50">{quote.requestCategory} · {statusLabel("request", quote.requestStatus)} · version {quote.version}</p></div>
                <StatusPill kind="quote" status={quote.status} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
                {[["Total", formatInr(quote.totalInr)], ["Platform fee", formatInr(quote.platformFeeInr)], ["Your payout", formatInr(quote.netPayoutInr)], ["Timeline", `${quote.timelineDays} days`]].map(([label, value]) => <div key={label} className="rounded-lg bg-parchment/60 p-2"><p className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</p><p className={`mt-0.5 font-semibold ${label === "Your payout" ? "text-emerald" : "text-ink"}`}>{value}</p></div>)}
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[10px] text-muted-foreground">Submitted {formatDate(quote.createdAt)} · expires {formatDate(quote.expiresAt)} · {quote.revisionRounds} revision{quote.revisionRounds === 1 ? "" : "s"}</p>
                <div className="flex gap-2">
                  {quote.status === "accepted" && <span className="rounded-full bg-emerald/10 px-3 py-1.5 text-[10px] font-semibold text-emerald">Accepted — project created</span>}
                  {quote.status === "submitted" && <button type="button" onClick={() => void doWithdraw(quote._id)} className="rounded-full border border-maroon/20 px-3 py-1.5 text-[10px] font-semibold text-ink/60">Withdraw</button>}
                  {quote.status === "submitted" && <Link to={`/artisan/jobs/${quote.requestId}`} className="rounded-full bg-teal px-3 py-1.5 text-[10px] font-semibold text-ivory">Revise</Link>}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </PortalShell>
  );
}

export function ArtisanProjects() {
  const projects = useQuery(api.projects.mine);
  const mine = (projects ?? []).filter((project) => project.role === "artisan");
  return (
    <PortalShell role="artisan" title="Projects" hindi="परियोजनाएँ" subtitle="Funded work, concept approvals and handover.">
      {projects === undefined ? <div className="h-64 animate-pulse rounded-2xl bg-card" /> : mine.length === 0 ? <div className="rounded-2xl border border-dashed border-maroon/25 bg-card/60 p-10 text-center"><Package className="mx-auto size-8 text-maroon/25" /><p className="mt-2 font-display text-xl text-maroon">No projects yet.</p><p className="mx-auto mt-1 max-w-[48ch] text-xs text-ink/55">A project begins when a customer accepts your quote and funds it. Only then should making start.</p><Link to="/artisan/jobs" className="mt-4 inline-flex rounded-full bg-teal px-4 py-2 text-xs font-semibold text-ivory">Find work</Link></div> : (
        <div className="grid gap-3 sm:grid-cols-2">
          {mine.map((project) => (
            <Link key={project._id} to={`/artisan/projects/${project._id}`} className="flex gap-3 rounded-2xl border border-maroon/15 bg-card p-4 hover:border-maroon/40">
              {project.imageUrl ? <img src={project.imageUrl} alt="" className="size-20 rounded-xl object-cover" /> : <span className="flex size-20 items-center justify-center rounded-xl bg-maroon/[0.05]"><Package className="size-7 text-maroon/25" /></span>}
              <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="line-clamp-2 text-sm font-semibold text-ink">{project.title}</p><StatusPill kind="project" status={project.status} /></div><p className="mt-1 text-[11px] text-ink/55">{project.counterpartName}</p><p className="mt-2 text-[10px] text-ink/50">{formatInr(project.amountInr)} · updated {formatDate(project.updatedAt)}</p></div>
            </Link>
          ))}
        </div>
      )}
    </PortalShell>
  );
}

export function ArtisanProjectDetail() {
  const { projectId } = useParams();
  if (!projectId) return null;
  return <PortalShell role="artisan" title="Project workspace" hindi="कार्यक्षेत्र" subtitle="Concepts, progress, delivery and payment."><ProjectWorkspace projectId={projectId as Id<"projects">} /></PortalShell>;
}

export function ArtisanPortfolio() {
  const mine = useQuery(api.artisans.myProfile);
  const add = useMutation(api.artisans.addPortfolioItem);
  const remove = useMutation(api.artisans.removePortfolioItem);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [form, setForm] = useState({ title: "", description: "", craftTags: [] as string[], materialTags: [] as string[], durationDays: 0, externalUrl: "", attribution: "", reusePermission: "display_only" as "display_only" | "portfolio_and_promotion" | "reuse_with_credit" });
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const portfolio = useQuery(api.artisans.publicProfile, mine ? { artisanId: mine.id as Id<"users"> } : "skip");

  async function submit() {
    setBusy(true);
    try {
      await add({
        title: form.title, description: form.description, craftTags: form.craftTags,
        materialTags: form.materialTags, durationDays: form.durationDays || undefined,
        externalUrl: form.externalUrl || undefined,
        image: images[0] ? { storageId: images[0].storageId, name: images[0].name, contentType: images[0].contentType, size: images[0].size } : undefined,
        ownershipDeclared: true, attribution: form.attribution || undefined, reusePermission: form.reusePermission,
      });
      toast.success("Portfolio piece added.");
      setForm({ title: "", description: "", craftTags: [], materialTags: [], durationDays: 0, externalUrl: "", attribution: "", reusePermission: "display_only" });
      setImages([]);
      setShowForm(false);
    } catch (error) { toast.error(error instanceof Error ? error.message.replace(/^[A-Z_]+:\s*/, "") : "Could not add the piece."); } finally { setBusy(false); }
  }

  return (
    <PortalShell role="artisan" title="Portfolio" hindi="मेरा काम" subtitle="Only work you own or have permission to show. Never used for AI training." actions={<Button size="sm" className="rounded-full bg-teal text-ivory" onClick={() => setShowForm((value) => !value)}><Plus className="size-3.5" /> Add work</Button>}>
      {showForm && (
        <section className="mb-4 rounded-2xl border border-teal/30 bg-card p-5">
          <h2 className="font-display text-xl font-semibold text-maroon">Add a portfolio piece</h2>
          <p className="mt-1 text-[11px] text-ink/55">Upload your own photo or link to work you have permission to share. Attribution and reuse permission are required.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block"><span className="text-[11px] font-semibold text-ink/70">Title</span><input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="mt-1 h-9 w-full rounded-lg border border-maroon/20 bg-parchment px-2.5 text-xs" /></label>
            <label className="block"><span className="text-[11px] font-semibold text-ink/70">Attribution / collaborator</span><input value={form.attribution} onChange={(e) => setForm((p) => ({ ...p, attribution: e.target.value }))} placeholder="Your name or the maker credited" className="mt-1 h-9 w-full rounded-lg border border-maroon/20 bg-parchment px-2.5 text-xs" /></label>
            <label className="block sm:col-span-2"><span className="text-[11px] font-semibold text-ink/70">Description</span><textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2} className="mt-1 w-full rounded-lg border border-maroon/20 bg-parchment px-2.5 py-1.5 text-xs" /></label>
            <label className="block"><span className="text-[11px] font-semibold text-ink/70">External link <span className="font-normal text-muted-foreground">(optional)</span></span><input value={form.externalUrl} onChange={(e) => setForm((p) => ({ ...p, externalUrl: e.target.value }))} placeholder="https://" className="mt-1 h-9 w-full rounded-lg border border-maroon/20 bg-parchment px-2.5 text-xs" /></label>
            <label className="block"><span className="text-[11px] font-semibold text-ink/70">Reuse permission</span><select value={form.reusePermission} onChange={(e) => setForm((p) => ({ ...p, reusePermission: e.target.value as typeof form.reusePermission }))} className="mt-1 h-9 w-full rounded-lg border border-maroon/20 bg-parchment px-2 text-xs">{REUSE_PERMISSIONS.map((permission) => <option key={permission.value} value={permission.value}>{permission.label}</option>)}</select></label>
            <label className="block"><span className="text-[11px] font-semibold text-ink/70">Duration (days, optional)</span><input type="number" min={0} value={form.durationDays} onChange={(e) => setForm((p) => ({ ...p, durationDays: Number(e.target.value) }))} className="mt-1 h-9 w-full rounded-lg border border-maroon/20 bg-parchment px-2.5 text-xs" /></label>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <ChipPicker options={CRAFT_SKILLS} value={form.craftTags} onChange={(next) => setForm((p) => ({ ...p, craftTags: next }))} label="Craft tags" />
            <ChipPicker options={MATERIALS} value={form.materialTags} onChange={(next) => setForm((p) => ({ ...p, materialTags: next }))} label="Material tags" />
          </div>
          <div className="mt-3"><UploadImages value={images} onChange={setImages} max={1} label="One clear photo" hint="Your own photo of the work. PNG, JPG or WebP under 8 MB." /></div>
          <div className="mt-3 flex items-center justify-between gap-2"><p className="text-[10px] text-muted-foreground">I confirm this is my work, or I have permission to show it, and I have credited collaborators.</p><Button size="sm" className="rounded-full bg-teal text-ivory" disabled={busy || form.title.trim().length < 3 || form.description.trim().length < 12 || form.craftTags.length === 0 || (images.length === 0 && !form.externalUrl)} onClick={() => void submit()}>{busy ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />} Publish piece</Button></div>
        </section>
      )}

      {portfolio === undefined ? <div className="h-48 animate-pulse rounded-2xl bg-card" /> : !portfolio || portfolio.portfolio.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-maroon/25 bg-card/60 p-10 text-center"><ImagePlus className="mx-auto size-8 text-maroon/25" /><p className="mt-2 font-display text-xl text-maroon">No portfolio pieces yet.</p><p className="mx-auto mt-1 max-w-[48ch] text-xs text-ink/55">At least one piece is required before requesting verification. Upload real work — never a generated image presented as handmade.</p></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {portfolio.portfolio.map((item) => (
            <article key={item._id} className="overflow-hidden rounded-2xl border border-maroon/15 bg-card">
              {item.url ? <img src={item.url} alt={item.title} className="aspect-[4/3] w-full object-cover" /> : <div className="flex aspect-[4/3] items-center justify-center bg-maroon/[0.04] text-xs text-muted-foreground">External link</div>}
              <div className="p-3">
                <div className="flex items-start justify-between gap-2"><p className="font-display text-base font-semibold text-ink">{item.title}</p><button type="button" aria-label={`Remove ${item.title}`} onClick={async () => { try { await remove({ portfolioItemId: item._id }); toast.success("Piece removed."); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not remove."); } }} className="text-maroon/35 hover:text-vermilion"><Trash2 className="size-3.5" /></button></div>
                <p className="mt-1 line-clamp-2 text-[11px] text-ink/55">{item.description}</p>
                <p className="mt-1.5 text-[9px] uppercase tracking-wide text-muted-foreground">{item.craftTags.join(" · ")}</p>
                <p className="mt-1 text-[9px] text-muted-foreground">{item.reusePermission.split("_").join(" ")}</p>
              </div>
            </article>
          ))}
        </div>
      )}
      {mine && mine.verificationStatus !== "verified" && (
        <section className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-saffron/40 bg-saffron/[0.07] p-4">
          <div><p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a5a12]"><BadgeCheck className="size-3.5" /> Verification</p><p className="mt-1 text-[11px] text-ink/60">{mine.verificationStatus === "pending" ? "Your request is in the admin review queue." : mine.verificationStatus === "info_required" ? "The review team needs more information. Check your notifications." : "Add at least one portfolio piece, then request a document review."}</p></div>
          <Link to="/settings" className="rounded-full border border-maroon/25 bg-card px-4 py-2 text-[11px] font-semibold text-maroon">Account & verification</Link>
        </section>
      )}
    </PortalShell>
  );
}

export function ArtisanAvailability() {
  const data = useQuery(api.artisans.dashboard);
  const setAvailability = useMutation(api.artisans.setAvailability);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ availability: "available" as "available" | "limited" | "paused", weeklyCapacity: 3, workingHours: "" });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (data?.profile && !loaded) {
      setForm({ availability: data.profile.availability as typeof form.availability, weeklyCapacity: data.profile.weeklyCapacity ?? 3, workingHours: data.profile.workingHours ?? "" });
      setLoaded(true);
    }
  }, [data, loaded, form.availability]);

  async function save() {
    setBusy(true);
    try { await setAvailability({ availability: form.availability, weeklyCapacity: form.weeklyCapacity, workingHours: form.workingHours || undefined }); toast.success("Availability updated."); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not update."); } finally { setBusy(false); }
  }

  return (
    <PortalShell role="artisan" title="Availability" hindi="उपलब्धता" subtitle="Protect your calendar. Capacity affects which briefs are matched.">
      {data === undefined ? <div className="h-48 animate-pulse rounded-2xl bg-card" /> : data === null ? <div className="rounded-2xl border border-maroon/15 bg-card p-8 text-center"><p className="text-sm text-ink/60">Complete CraftFit first.</p><Link to="/artisan/onboarding" className="mt-3 inline-flex rounded-full bg-teal px-4 py-2 text-xs font-semibold text-ivory">Build profile</Link></div> : (
        <div className="mx-auto max-w-[620px] rounded-2xl border border-maroon/15 bg-card p-5">
          <h2 className="font-display text-xl font-semibold text-maroon">How much work can you take?</h2>
          <p className="mt-1 text-[11px] text-ink/55">This is not a deadline promise. It is a filter so briefs match your actual hands and hours.</p>
          <div className="mt-4 space-y-3">
            {[
              { value: "available", title: "Available", body: "Open to new projects at your normal capacity." },
              { value: "limited", title: "Limited", body: "Smaller projects only — still visible in matching." },
              { value: "paused", title: "Paused", body: "No new work. Existing projects continue normally." },
            ].map((option) => (
              <label key={option.value} className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${form.availability === option.value ? "border-teal bg-teal/[0.05]" : "border-maroon/15"}`}>
                <input type="radio" name="availability" checked={form.availability === option.value} onChange={() => setForm((p) => ({ ...p, availability: option.value as typeof form.availability }))} className="mt-1 accent-[#087f83]" />
                <div><p className="text-sm font-semibold text-ink">{option.title}</p><p className="text-[11px] text-ink/55">{option.body}</p></div>
              </label>
            ))}
            <label className="block"><span className="text-[11px] font-semibold text-ink/70">New projects per week</span><input type="number" min={1} max={20} value={form.weeklyCapacity} onChange={(e) => setForm((p) => ({ ...p, weeklyCapacity: Number(e.target.value) }))} className="mt-1 h-10 w-full rounded-lg border border-maroon/20 bg-parchment px-3 text-sm" /></label>
            <label className="block"><span className="text-[11px] font-semibold text-ink/70">Working hours / notes</span><input value={form.workingHours} onChange={(e) => setForm((p) => ({ ...p, workingHours: e.target.value }))} placeholder="e.g. Mon–Sat, 10am–6pm" className="mt-1 h-10 w-full rounded-lg border border-maroon/20 bg-parchment px-3 text-sm" /></label>
            <Button type="button" className="w-full rounded-full bg-teal text-ivory" disabled={busy} onClick={() => void save()}>{busy ? <Loader2 className="size-4 animate-spin" /> : <CalendarClock className="size-4" />} Save availability</Button>
          </div>
        </div>
      )}
    </PortalShell>
  );
}

export function ArtisanEarnings() {
  const data = useQuery(api.artisans.dashboard);
  const payouts = useQuery(api.payments.myPayouts);
  const projects = useQuery(api.projects.mine);
  const completed = (projects ?? []).filter((project) => project.role === "artisan" && project.status === "completed");

  return (
    <PortalShell role="artisan" title="Earnings" hindi="कमाई" subtitle="Released payouts, pending amounts and the fee, with no invented figures.">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Released to you" value={formatInr(data?.earnings.lifetimeReleasedInr ?? 0)} hint={`${data?.earnings.paidPayoutCount ?? 0} paid transfer${data?.earnings.paidPayoutCount === 1 ? "" : "s"}`} tone="emerald" />
        <StatCard label="Pending payout" value={formatInr(data?.earnings.pendingPayoutInr ?? 0)} hint="Created on completion" tone="saffron" />
        <StatCard label="Completed projects" value={completed.length} hint="Real handovers only" tone="maroon" />
      </div>
      <section className="mt-5 rounded-2xl border border-maroon/15 bg-card p-5">
        <h2 className="font-display text-xl font-semibold text-maroon">Payout ledger</h2>
        <p className="mt-1 text-[11px] text-ink/55">A payout is created when a project is completed, net of the disclosed platform fee. It is marked paid only after an actual transfer is recorded by an admin.</p>
        {payouts === undefined ? <div className="mt-3 h-28 animate-pulse rounded-xl bg-parchment" /> : payouts.length === 0 ? <div className="mt-3 rounded-xl border border-dashed border-maroon/20 p-6 text-center text-xs text-ink/50">No payouts yet. Your first completed project will create one.</div> : (
          <div className="mt-3 divide-y divide-maroon/10">
            {payouts.map((payout) => (
              <div key={payout._id} className="flex flex-wrap items-center gap-3 py-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-emerald/10"><IndianRupee className="size-4 text-emerald" /></span>
                <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-ink">{payout.projectTitle}</p><p className="text-[10px] text-muted-foreground">{formatDate(payout.createdAt)} · fee {formatInr(payout.platformFeeInr)} · {payout.provider}</p></div>
                <p className="text-sm font-semibold text-ink">{formatInr(payout.amountInr)}</p>
                <span className="rounded-full border border-maroon/15 bg-parchment px-2 py-1 text-[10px] font-medium capitalize text-ink/60">{payout.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link to="/artisan/projects" className="rounded-full bg-teal px-4 py-2 text-xs font-semibold text-ivory">See completed projects</Link>
        <Link to="/settings" className="rounded-full border border-maroon/25 px-4 py-2 text-xs font-semibold text-maroon">Payout details</Link>
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">Payment provider transfers are recorded manually when needed. There is no instant payout claim here. If a payout status looks wrong, contact support from Settings with the project name.</p>
    </PortalShell>
  );
}
