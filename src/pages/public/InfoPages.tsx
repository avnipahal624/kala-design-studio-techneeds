import { Divider, Mandala } from "@/components/art/Ornaments";
import { PublicShell } from "@/components/public/PublicShell";
import { CRAFT_TRADITIONS } from "@/lib/marketplace";
import {
  ArrowRight, BadgeCheck, Banknote, Camera, CheckCircle2, FileText, Gavel, Hand,
  Handshake, Languages, Lock, MessageSquare, PackageCheck, PenLine, ScanText,
  ShieldCheck, Sparkles, Truck, Users, Wallet, XCircle,
} from "lucide-react";
import { Link, useSearchParams } from "react-router";

function PageHero({ eyebrow, title, body, hindi }: { eyebrow: string; title: string; body: string; hindi?: string }) {
  return (
    <section className="relative overflow-hidden border-b border-gold/25 bg-[#fcf1de]">
      <div className="pointer-events-none absolute -right-32 -top-32 opacity-[0.1]"><Mandala className="size-[480px]" /></div>
      <div className="relative mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-teal">{eyebrow}</span>
        <h1 className="mt-3 max-w-[24ch] font-display text-4xl font-semibold leading-[1.05] text-maroon md:text-6xl">{title}</h1>
        {hindi && <p className="mt-2 font-hindi-display text-sm text-vermilion">{hindi}</p>}
        <p className="mt-4 max-w-[68ch] text-sm leading-relaxed text-ink/65 md:text-[15px]">{body}</p>
      </div>
    </section>
  );
}

const CUSTOMER_STAGES = [
  { icon: PenLine, title: "Brief", who: "Customer", body: "Product, budget, deadline, references, must-keep details. KalaVision structures the text; a person can add images and correct every field. The brief is not public until published." },
  { icon: Users, title: "Match & invite", who: "KalaJobs", body: "CraftFit ranks eligible artisans by craft, materials, budget, capacity, location and lead time. The score and reasons are visible. A customer can invite artisans beyond the list." },
  { icon: MessageSquare, title: "Quote", who: "Artisan", body: "The artisan sends an itemised quote — making, materials, timeline, revisions — with a validity window. Questions happen in project messaging, not off-platform." },
  { icon: Handshake, title: "Agreement", who: "Both", body: "Accepting a quote creates a project and reserves the amount. The artisan sees funding before starting. Scope changes are recorded, not agreed in private DMs." },
  { icon: Camera, title: "Concept approval", who: "Artisan → customer", body: "The artisan uploads their own sketch, colour study or mockup. The customer approves or asks for a revision. Making begins only after approval." },
  { icon: PackageCheck, title: "Make & document", who: "Artisan", body: "Progress updates and milestones go into KalaProof. The customer can see what was done and when. The final piece is reviewed before handover." },
  { icon: Truck, title: "Delivery", who: "Both", body: "Shipping or handover is recorded with tracking or a condition note. The customer confirms receipt, then the review window opens." },
  { icon: Wallet, title: "Payout", who: "KALकारी", body: "On completion, the artisan’s payout is created net of the disclosed platform fee. Transfer happens via the recorded payout method after the review window." },
];

export function HowItWorksPage() {
  return (
    <PublicShell>
      <PageHero
        eyebrow="How it works"
        title="A customisation process with the boring parts done properly."
        hindi="पहले समझें, फिर बनाएँ"
        body="Eight stages, one agreement. The customer knows what they are paying for; the artisan knows the work is funded before they start. Every approval is recorded."
      />
      <section className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
        <div className="space-y-3">
          {CUSTOMER_STAGES.map((stage, index) => (
            <div key={stage.title} className="grid gap-3 rounded-2xl border border-maroon/15 bg-card p-5 md:grid-cols-[52px_1fr_140px] md:items-start">
              <span className="flex size-11 items-center justify-center rounded-xl bg-maroon/[0.06] text-maroon"><stage.icon className="size-5" /></span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-maroon/35">0{index + 1}</span>
                  <h2 className="font-display text-xl font-semibold text-ink">{stage.title}</h2>
                </div>
                <p className="mt-1 max-w-[72ch] text-[12px] leading-relaxed text-ink/60">{stage.body}</p>
              </div>
              <span className="w-fit rounded-full border border-teal/25 bg-teal/[0.05] px-2.5 py-1 text-[10px] font-medium text-teal-deep">{stage.who}</span>
            </div>
          ))}
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-vermilion/20 bg-vermilion/[0.04] p-5">
            <p className="flex items-center gap-2 text-xs font-semibold text-vermilion"><XCircle className="size-4" /> What doesn’t happen</p>
            <ul className="mt-2 space-y-1.5 text-[12px] text-ink/65">
              <li>· No AI generates the concept, artwork or final piece.</li>
              <li>· No artisan starts unpaid work to “win” a brief.</li>
              <li>· No review is written without a completed project.</li>
              <li>· No payment release while a dispute is open.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-emerald/20 bg-emerald/[0.04] p-5">
            <p className="flex items-center gap-2 text-xs font-semibold text-emerald"><CheckCircle2 className="size-4" /> What you can check</p>
            <ul className="mt-2 space-y-1.5 text-[12px] text-ink/65">
              <li>· The quote breakdown before accepting.</li>
              <li>· The platform fee before paying.</li>
              <li>· The concept version you approved.</li>
              <li>· Every KalaProof event and who recorded it.</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/customer/create-request" className="rounded-full bg-maroon px-6 py-3 text-sm font-semibold text-ivory">Customise Something</Link>
          <Link to="/for-artisans" className="rounded-full border border-teal/35 px-6 py-3 text-sm font-semibold text-teal-deep">Find Craft Work</Link>
        </div>
      </section>
    </PublicShell>
  );
}

export function TrustAndSafetyPage() {
  return (
    <PublicShell>
      <PageHero
        eyebrow="KalaTrust"
        title="Clear rules, held payments, and a human when things go wrong."
        hindi="भरोसा, प्रक्रिया से बनता है"
        body="Custom work involves real money and real expectations. These are the protections we can actually implement, and the limits we won’t hide behind vague language."
      />
      <section className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { icon: Lock, title: "Payment state machine", body: "Orders move through explicit states with verified webhooks and idempotency keys. A successful frontend callback alone never marks a payment paid. Sandbox payments are labelled and never mixed with live ones." },
            { icon: BadgeCheck, title: "Verification, not vibes", body: "Admin review checks identity and craft documents. The badge means that review happened. It does not mean a guarantee, a ranking or an insurance policy. Pending and rejected statuses are visible." },
            { icon: FileText, title: "Append-only KalaProof", body: "Concept approvals, progress, condition notes, delivery and decisions are appended. Corrections are new events, not silent edits. Both project parties can read the same record." },
            { icon: Gavel, title: "Dispute with evidence", body: "Either side can open a dispute with a reason and evidence. Response windows are visible. An admin records a decision; an appeal creates a new review. Payout release pauses during review." },
            { icon: ShieldCheck, title: "Abuse and fraud signals", body: "Off-platform payment requests, repeated cancellations and suspicious account behaviour create review signals for admins. Signals are reviewed by a person; they are not automatic bans." },
            { icon: Banknote, title: "Refunds and payouts", body: "A refund is recorded against the original payment, not invented as a new transfer. Payouts are created on completion, net of the disclosed fee, and marked paid only after an actual transfer." },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-maroon/15 bg-card p-5">
              <item.icon className="size-5 text-teal" />
              <h2 className="mt-2 text-sm font-semibold text-ink">{item.title}</h2>
              <p className="mt-1 text-[12px] leading-relaxed text-ink/60">{item.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-saffron/40 bg-saffron/[0.07] p-5 md:p-6">
          <h2 className="font-display text-xl font-semibold text-maroon">The honest limits</h2>
          <div className="mt-2 grid gap-3 text-[12px] leading-relaxed text-ink/65 md:grid-cols-2">
            <p>KALकारी is not a bank, an insurer or a court. Held payments are a contractual workflow, not a regulated escrow service. We do not promise that every dispute ends in your favour.</p>
            <p>Handmade work varies. Colour, texture and finish can differ from a screen. The approved concept, material notes and revision terms are the standard we can actually hold both sides to.</p>
            <p>Verification is document review. It is not a criminal background check, a craft guild certification or a guarantee of future quality.</p>
            <p>If a payment provider is unavailable or keys are not configured, the app falls back to clearly labelled sandbox mode. No real money moves in sandbox mode.</p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl bg-maroon p-6 text-ivory">
          <h2 className="font-display text-2xl font-semibold">Need to raise something?</h2>
          <p className="mt-2 max-w-[62ch] text-sm text-ivory/70">Open the project, then “Dispute & help”. Include what was agreed, what happened, and the KalaProof entries that show it. If you can’t access the project, contact support from Settings.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/customer/projects" className="rounded-full bg-saffron px-5 py-2.5 text-xs font-semibold text-maroon-deep">Go to my projects</Link>
            <Link to="/settings" className="rounded-full border border-ivory/30 px-5 py-2.5 text-xs font-semibold">Contact support</Link>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}

export function ForArtisansPage() {
  return (
    <PublicShell>
      <PageHero
        eyebrow="For artisans"
        title="Your craft is the product. Not a content supply."
        hindi="आपकी कारीगरी, आपकी शर्तें"
        body="KALकारी is built so craft work is quoted, funded and documented — not harvested for free designs, exposure or AI training. You choose the work, the price and what appears in your portfolio."
      />
      <section className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Banknote, title: "Paid quoted work", body: "Every project begins with your quote. You set making charges, materials, timeline and revisions. No speculative samples, no unpaid pitches." },
            { icon: Users, title: "Matched, not buried", body: "CraftFit scores briefs against your actual skills, materials and capacity. Newcomers get a fair-discovery boost. Nobody can pay to rank above you." },
            { icon: FileText, title: "Your work, your record", body: "KalaProof records your concepts, progress and handover. Your portfolio is never used to train AI without explicit permission." },
            { icon: Languages, title: "In your language", body: "KalaSaathi works in Hindi, English and Hinglish for understanding briefs and explaining next steps. It will not accept work or move money for you." },
            { icon: ShieldCheck, title: "Clear fees", body: "The platform fee is disclosed before you quote and shown in the payout breakdown. No surprise deductions after the work is done." },
            { icon: Handshake, title: "A real agreement", body: "Funding is visible before you start. Scope changes are recorded. Disputes have a response window and a human decision." },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-teal/20 bg-card p-5">
              <item.icon className="size-5 text-teal" />
              <h2 className="mt-2 font-display text-lg font-semibold text-ink">{item.title}</h2>
              <p className="mt-1 text-[12px] leading-relaxed text-ink/60">{item.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="font-display text-3xl font-semibold text-maroon">What CraftFit asks for</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink/65">About ten minutes. You can save and come back. Nothing is published until you choose to make your profile visible.</p>
            <ol className="mt-4 space-y-2 text-[12px] text-ink/65">
              {["Craft headline, introduction and city", "Skills, products, materials and languages", "Minimum project value, turnaround and capacity", "Portfolio — only work you own or have permission to show", "Optional verification documents, reviewed by a person"].map((line, index) => (
                <li key={line} className="flex gap-2"><span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-teal/10 text-[10px] font-bold text-teal-deep">{index + 1}</span>{line}</li>
              ))}
            </ol>
            <Link to="/artisan/onboarding" className="mt-5 inline-flex items-center gap-2 rounded-full bg-teal px-5 py-3 text-sm font-semibold text-ivory">Build my CraftFit profile <ArrowRight className="size-4" /></Link>
          </div>
          <div className="rounded-2xl border border-gold/40 bg-[#fdf3e3] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-maroon">What we will never do</p>
            <ul className="mt-3 space-y-2 text-[12px] leading-relaxed text-ink/70">
              {[
                "Train a model on your portfolio without written permission.",
                "Generate a “your style” concept and sell it to a customer.",
                "Call machine output handmade or attribute it to you.",
                "Publish your real name, address or documents publicly.",
                "Invent a review, a completed order or an earnings figure.",
                "Auto-accept a project or a scope change on your behalf.",
              ].map((line) => <li key={line} className="flex gap-2"><XCircle className="mt-0.5 size-3.5 shrink-0 text-vermilion" />{line}</li>)}
            </ul>
            <Divider className="my-4 h-6 w-full" />
            <p className="text-[11px] leading-relaxed text-ink/55">Documents for verification are private to you and the review team. You can update availability or pause new work at any time.</p>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}

export function WhyKalkaariPage() {
  return (
    <PublicShell>
      <PageHero
        eyebrow="Why KALकारी?"
        title="Because “AI-designed” is not a craft."
        hindi="कला + कारी = कारीगरी"
        body="The name joins kala (art) and kaari (the act of making). The product exists to move an idea toward a pair of human hands — not to replace them with a prompt."
      />
      <section className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-emerald/25 bg-emerald/[0.04] p-6">
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald"><Sparkles className="size-4" /> AI, in its place</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-maroon">A translator, not an artist.</h2>
            <ul className="mt-3 space-y-2 text-[12px] leading-relaxed text-ink/65">
              <li>· KalaVision structures a brief and names what is missing.</li>
              <li>· CraftFit explains why an artisan fits — with weights you can see.</li>
              <li>· KalaSaathi helps in Hindi, English and Hinglish.</li>
              <li>· Pricing explanations show the maths, not a magic number.</li>
              <li>· Risk signals support human review; they never auto-punish.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-vermilion/25 bg-vermilion/[0.04] p-6">
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-vermilion"><XCircle className="size-4" /> Where we stop</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-maroon">No synthetic craft.</h2>
            <ul className="mt-3 space-y-2 text-[12px] leading-relaxed text-ink/65">
              <li>· No image generation of products or patterns.</li>
              <li>· No AI “concept” uploaded as the artisan’s work.</li>
              <li>· No portfolio training without explicit consent.</li>
              <li>· No acceptance, approval or dispute decision by AI.</li>
              <li>· No fabricated social proof to make the market look busy.</li>
            </ul>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="font-display text-3xl font-semibold text-maroon">Built on four commitments</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              { title: "Artisan-first economics", body: "The maker quotes first. The customer funds before work begins. The platform fee is disclosed, not buried in a marked-up price." },
              { title: "Explainable matching", body: "Craft and skills weigh most. Materials, budget, capacity, location and lead time follow. Protected traits are never inputs. Newcomers get a bounded fair-discovery boost." },
              { title: "Evidence over argument", body: "Approved concepts, progress notes, condition records and handover live in one append-only timeline. Disputes start from shared facts." },
              { title: "Honest presentation", body: "Sample data is labelled. Verification is defined. Reviews require completed work. Empty states say the marketplace is new instead of inventing activity." },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-maroon/15 bg-card p-5">
                <h3 className="font-display text-lg font-semibold text-ink">{item.title}</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-ink/60">{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 rounded-2xl bg-[linear-gradient(120deg,#7b2040,#651a34_60%,#343e87)] px-6 py-10 text-center text-ivory">
          <p className="font-hindi-display text-sm text-saffron">आपकी कल्पना, उनकी कारीगरी</p>
          <h2 className="mt-2 font-display text-3xl font-semibold md:text-4xl">Put a real maker behind the idea.</h2>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link to="/customer/create-request" className="rounded-full bg-saffron px-5 py-2.5 text-sm font-semibold text-maroon-deep">Start a brief</Link>
            <Link to="/for-artisans" className="rounded-full border border-ivory/30 px-5 py-2.5 text-sm font-semibold">Join as an artisan</Link>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}

export function KalaRightsPage() {
  return (
    <PublicShell>
      <PageHero
        eyebrow="KalaRights"
        title="The maker keeps the rights. The customer gets what was agreed."
        hindi="अधिकार साफ़, रचना सुरक्षित"
        body="Every portfolio piece states who made it, how it may be reused and whether it can be shown beyond KALकारी. Every project concept carries a usage note. Rights are recorded before work begins, not argued about after."
      />
      <section className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { title: "Artisan ownership", body: "Uploading a portfolio piece does not transfer copyright. KALकारी receives a limited licence to display the work in the directory. Anything beyond display needs the reuse permission the artisan selected." },
            { title: "Customer usage", body: "The customer receives the physical piece and the usage rights recorded on the approved concept. They do not receive the right to reproduce the artisan’s work commercially unless that is explicitly agreed in writing." },
            { title: "Attribution travels", body: "Portfolio items require attribution and a reuse setting. Concepts show the artisan’s usage note. KalaProof keeps the approved version so neither side can quietly rewrite the agreement." },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-maroon/15 bg-card p-5">
              <h2 className="font-display text-xl font-semibold text-maroon">{item.title}</h2>
              <p className="mt-2 text-[12px] leading-relaxed text-ink/60">{item.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-maroon/15 bg-card">
          <div className="border-b border-maroon/10 bg-maroon/[0.03] px-4 py-3"><h2 className="font-display text-xl font-semibold text-maroon">Reuse settings, in plain language</h2></div>
          <div className="divide-y divide-maroon/8">
            {[
              ["Display on KALकारी only", "The work appears in the artisan’s directory profile. It is not used for promotion outside the platform."],
              ["Portfolio and KALकारी promotion", "The work may be shown in KALकारी’s editorial and social channels with attribution. It is not sold as a stock asset."],
              ["Reuse with credit (discuss first)", "The artisan is open to a separate reuse conversation. This is not automatic permission; terms must be agreed before use."],
            ].map(([label, body]) => (
              <div key={label} className="grid gap-1 px-4 py-3 md:grid-cols-[240px_1fr]">
                <p className="text-xs font-semibold text-ink">{label}</p>
                <p className="text-[12px] leading-relaxed text-ink/60">{body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-vermilion/20 bg-vermilion/[0.04] p-5">
            <p className="flex items-center gap-2 text-xs font-semibold text-vermilion"><XCircle className="size-4" /> Not permitted</p>
            <ul className="mt-2 space-y-1.5 text-[12px] text-ink/65">
              <li>· Copying a living artisan’s signature work and calling it a new design.</li>
              <li>· Using portfolio images to train an AI model without written permission.</li>
              <li>· Selling a customer’s commissioned piece as a repeated product without agreement.</li>
              <li>· Claiming a traditional motif as KALकारी’s exclusive intellectual property.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-teal/25 bg-teal/[0.04] p-5">
            <p className="flex items-center gap-2 text-xs font-semibold text-teal-deep"><ShieldCheck className="size-4" /> What we can enforce</p>
            <ul className="mt-2 space-y-1.5 text-[12px] text-ink/65">
              <li>· Required ownership declarations before a portfolio piece is published.</li>
              <li>· Usage notes attached to every concept, visible to both parties.</li>
              <li>· A KalaProof record of the approved concept version.</li>
              <li>· Reports and admin review when a rights breach is alleged.</li>
            </ul>
          </div>
        </div>
        <p className="mt-5 text-[10px] leading-relaxed text-muted-foreground">KALकारी is a marketplace, not a court. This page describes the platform’s recorded terms; it is not legal advice. For a commercial licence or a dispute outside the platform, consult a lawyer.</p>
        <div className="mt-6 flex flex-wrap gap-3"><Link to="/customer/create-request" className="rounded-full bg-maroon px-5 py-2.5 text-xs font-semibold text-ivory">Start a brief with clear terms</Link><Link to="/explore-artisans" className="rounded-full border border-maroon/25 px-5 py-2.5 text-xs font-semibold text-maroon">See attribution in profiles</Link></div>
      </section>
    </PublicShell>
  );
}

export function CraftsPage() {
  const [params, setParams] = useSearchParams();
  const selected = params.get("craft") ?? CRAFT_TRADITIONS[0].id;
  const craft = CRAFT_TRADITIONS.find((item) => item.id === selected) ?? CRAFT_TRADITIONS[0];

  return (
    <PublicShell>
      <PageHero
        eyebrow="Craft library"
        title="Traditions with a place, a technique and people behind them."
        body="These are reference notes, not style presets. They help a customer describe what they mean and help an artisan set expectations. No motif here is owned by KALकारी."
      />
      <section className="mx-auto max-w-[1200px] px-4 py-10 md:px-8 md:py-14">
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <nav className="grid grid-cols-2 gap-2 self-start sm:grid-cols-3 lg:grid-cols-2" aria-label="Craft traditions">
            {CRAFT_TRADITIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setParams({ craft: item.id }, { replace: true })}
                className={`rounded-xl border p-3 text-left transition ${item.id === craft.id ? "border-maroon/50 bg-card" : "border-maroon/15 bg-card/60 hover:border-maroon/35"}`}
              >
                <p className="text-[9px] uppercase tracking-wide text-muted-foreground">{item.region}</p>
                <p className="mt-0.5 font-display text-sm font-semibold leading-tight text-ink">{item.name}</p>
              </button>
            ))}
          </nav>
          <article className="rounded-2xl border border-maroon/20 bg-card p-6 md:p-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-teal">{craft.region}</p>
            <h2 className="mt-2 font-display text-4xl font-semibold text-maroon">{craft.name}</h2>
            <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-ink/70">{craft.note}</p>
            <div className="mt-6 rounded-xl border border-gold/35 bg-ivory/60 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-maroon">What to put in a brief</p>
              <ul className="mt-2 grid gap-1.5 text-[12px] text-ink/65 sm:grid-cols-2">
                <li>· The product and material</li>
                <li>· Where the work will sit</li>
                <li>· Colours you want to keep</li>
                <li>· Meaning or story, if any</li>
                <li>· Deadline and wear conditions</li>
                <li>· Your budget range</li>
              </ul>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to={`/explore-artisans?craft=${encodeURIComponent(craft.name)}`} className="rounded-full bg-maroon px-5 py-2.5 text-xs font-semibold text-ivory">Find {craft.name} artisans</Link>
              <Link to={`/customer/create-request?craft=${encodeURIComponent(craft.name)}`} className="rounded-full border border-maroon/25 px-5 py-2.5 text-xs font-semibold text-maroon">Brief this craft</Link>
            </div>
            <p className="mt-5 text-[10px] leading-relaxed text-muted-foreground">
              Reference notes are general and may not reflect every regional variant. The artisan you
              choose is the authority on their own practice and materials.
            </p>
          </article>
        </div>
      </section>
    </PublicShell>
  );
}
