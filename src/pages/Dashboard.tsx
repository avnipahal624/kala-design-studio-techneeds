import { AppShell } from "@/components/app/AppShell";
import { GarmentArt } from "@/components/art/garments";
import { Mandala, Peacock, VineBorder } from "@/components/art/Ornaments";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { CRAFT_BY_ID, CRAFTS, PRODUCT_BY_ID } from "@/lib/crafts";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Camera,
  Clock,
  Layers,
  Loader2,
  Palette,
  Plus,
  Sparkles,
} from "lucide-react";
import { Link, useNavigate } from "react-router";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Suprabhat";
  if (hour < 17) return "Namaste";
  return "Shubh sandhya";
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const designs = useQuery(api.designs.list);
  const inspirations = useQuery(api.inspirations.list);

  const firstName = (user?.name ?? user?.displayName ?? "").split(" ")[0];
  const latest = designs?.[0];
  const totalVersions = designs?.reduce((sum, design) => sum + design.versionCount, 0) ?? 0;
  const loading = designs === undefined;

  return (
    <AppShell
      title="Dashboard"
      hindi="डैशबोर्ड"
      actions={
        <Button
          onClick={() => navigate("/kalavision")}
          className="gap-2 rounded-full bg-maroon px-4 text-ivory hover:bg-maroon-deep"
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">New from inspiration</span>
          <span className="sm:hidden">New</span>
        </Button>
      }
    >
      {/* greeting */}
      <section className="relative overflow-hidden rounded-2xl border border-gold/35 bg-[linear-gradient(105deg,#fff5e2_0%,#fde9d2_48%,#e8f4ef_100%)]">
        <Mandala className="pointer-events-none absolute -right-20 -top-24 size-[320px] opacity-25" />
        <div className="pointer-events-none absolute -bottom-16 right-24 hidden opacity-90 md:block">
          <Peacock className="size-52" />
        </div>
        <div className="relative px-5 py-7 md:px-8 md:py-9">
          <p className="font-hindi text-sm text-teal">
            {greeting()}
            {firstName ? `, ${firstName}` : ""}
          </p>
          <h2 className="mt-1 max-w-[24ch] font-display text-3xl font-semibold leading-tight text-maroon md:text-[2.6rem]">
            Ready to make something that has never existed?
          </h2>
          <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-ink/65">
            Start from an image you love. KalaVision will read its colours and build a concept you
            can shape on the studio canvas.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              onClick={() => navigate("/kalavision")}
              className="gap-2 rounded-full bg-maroon px-5 text-ivory hover:bg-maroon-deep"
            >
              <Camera className="size-4" />
              Analyse an inspiration
            </Button>
            <Link to="/creations">
              <Button variant="outline" className="gap-2 rounded-full border-maroon/25 bg-card/70 text-maroon hover:bg-card">
                <Palette className="size-4" />
                My creations
              </Button>
            </Link>
          </div>
        </div>
        <VineBorder className="h-3 w-full opacity-70" />
      </section>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        {/* continue / start */}
        <section className="overflow-hidden rounded-2xl border border-maroon/18 bg-card">
          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : latest ? (
            <div className="grid sm:grid-cols-[1fr_0.9fr]">
              <div className="order-2 flex flex-col justify-center p-5 sm:order-1 md:p-6">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-teal">
                  <Clock className="size-3.5" />
                  Continue designing
                </div>
                <h3 className="mt-2 font-display text-2xl font-semibold leading-tight text-maroon">
                  {latest.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {PRODUCT_BY_ID[latest.productType]?.label ?? latest.productType}
                  {latest.craftId && CRAFT_BY_ID[latest.craftId]
                    ? ` · ${CRAFT_BY_ID[latest.craftId].name}`
                    : ""}{" "}
                  · v{latest.versionCount} · {latest.layerCount} layers
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Last edited{" "}
                  {new Date(latest.updatedAt).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
                <Button
                  onClick={() => navigate(`/studio/${latest._id}`)}
                  className="mt-4 w-fit gap-2 rounded-full bg-maroon px-4 text-ivory hover:bg-maroon-deep"
                >
                  Open in Design Studio
                  <ArrowRight className="size-4" />
                </Button>
              </div>
              <div className="order-1 border-b border-maroon/12 bg-[radial-gradient(circle_at_50%_30%,#fff8ec,#eed9bc)] sm:order-2 sm:border-b-0 sm:border-l">
                <motion.div initial={{ opacity: 0.6 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
                  <GarmentArt canvas={latest.canvas} className="h-auto w-full" />
                </motion.div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 p-8 text-center">
              <span className="flex size-14 items-center justify-center rounded-full border border-maroon/20 bg-parchment">
                <Sparkles className="size-6 text-maroon" />
              </span>
              <h3 className="font-display text-2xl font-semibold text-maroon">No creations yet</h3>
              <p className="max-w-[38ch] text-sm leading-relaxed text-ink/60">
                Your first design begins with one inspiration image. The studio will take it from
                there.
              </p>
              <Button onClick={() => navigate("/kalavision")} className="mt-1 gap-2 rounded-full bg-maroon text-ivory">
                Start your first creation
                <ArrowRight className="size-4" />
              </Button>
            </div>
          )}
        </section>

        {/* stats */}
        <section className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          <div className="rounded-2xl border border-maroon/18 bg-[linear-gradient(135deg,#7b2040,#5c1830)] p-5 text-ivory">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-saffron">In your studio</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {[
                [designs?.length ?? 0, "designs"],
                [totalVersions, "versions"],
                [inspirations?.length ?? 0, "inspirations"],
              ].map(([value, label]) => (
                <div key={label}>
                  <p className="font-display text-2xl font-semibold">{value}</p>
                  <p className="text-[9px] uppercase tracking-wide text-ivory/60">{label}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-ivory/70">
              Versions are immutable — every save keeps the previous artwork intact.
            </p>
          </div>

          <div className="rounded-2xl border border-teal/25 bg-mint/40 p-4 sm:col-span-2 xl:col-span-1">
            <div className="flex items-center gap-2 text-teal">
              <Layers className="size-4" />
              <p className="text-xs font-semibold">How v1 works</p>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-ink/70">
              Inspiration → measured palette → rule-based craft concept → studio canvas → version
              history. Artisan matching, quotes and collaboration are not part of this version.
            </p>
          </div>
        </section>
      </div>

      {/* recent creations */}
      <section className="mt-8">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-maroon md:text-2xl">Recent creations</h2>
            <p className="text-[11px] text-muted-foreground">Saved canvases you can reopen and keep editing.</p>
          </div>
          <Link to="/creations" className="flex items-center gap-1 text-xs font-medium text-maroon hover:underline">
            View all <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading &&
            [0, 1, 2].map((index) => (
              <div key={index} className="flex aspect-[4/3] items-center justify-center rounded-xl border border-maroon/12 bg-card">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            ))}
          {designs?.slice(0, 3).map((design) => (
            <button
              key={design._id}
              type="button"
              onClick={() => navigate(`/studio/${design._id}`)}
              className="group overflow-hidden rounded-xl border border-maroon/18 bg-card text-left transition-colors hover:border-maroon/40"
            >
              <div className="bg-[radial-gradient(circle_at_50%_30%,#fff8ec,#eed9bc)]">
                <GarmentArt canvas={design.canvas} className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.02]" />
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-maroon/12 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{design.title}</p>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    v{design.versionCount} · {design.layerCount} layers
                  </p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-maroon transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          ))}
        </div>

        {designs?.length === 0 && (
          <div className="mt-4 rounded-xl border border-dashed border-maroon/25 bg-card/60 p-8 text-center">
            <p className="text-sm text-ink/60">Nothing here yet — your first canvas is one upload away.</p>
          </div>
        )}
      </section>

      {/* inspirations + crafts */}
      <div className="mt-8 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-maroon/18 bg-card p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="size-4 text-teal" />
              <h2 className="font-display text-lg font-semibold text-maroon">Inspiration journal</h2>
            </div>
            <Link to="/kalavision" className="text-[11px] font-medium text-maroon hover:underline">
              Add one
            </Link>
          </div>
          {inspirations && inspirations.length > 0 ? (
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {inspirations.slice(0, 5).map((item) => (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => navigate(`/kalavision?inspiration=${item._id}`)}
                  className="group overflow-hidden rounded-lg border border-maroon/15 text-left transition-colors hover:border-maroon/40"
                >
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title ?? "Saved inspiration"} className="aspect-square w-full object-cover" />
                  ) : (
                    <span className="flex aspect-square items-center justify-center bg-parchment">
                      <Camera className="size-4 text-muted-foreground" />
                    </span>
                  )}
                  <span className="block truncate border-t border-maroon/10 px-1.5 py-1 text-[9px] text-muted-foreground">
                    {PRODUCT_BY_ID[item.productType]?.label ?? item.productType}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-3 rounded-lg border border-dashed border-maroon/25 bg-parchment/60 p-4">
              <Camera className="size-5 shrink-0 text-maroon/50" />
              <p className="text-[11px] leading-relaxed text-ink/60">
                Saved inspirations collect here with their measured palettes and concepts.
              </p>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-maroon/18 bg-card p-5">
          <div className="flex items-center gap-2">
            <Palette className="size-4 text-vermilion" />
            <h2 className="font-display text-lg font-semibold text-maroon">Craft library</h2>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {CRAFTS.map((craft) => (
              <span
                key={craft.id}
                className="rounded-full border border-maroon/15 bg-parchment/70 px-2.5 py-1 text-[10px] text-ink/70"
              >
                {craft.name}
              </span>
            ))}
          </div>
          <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
            Reference notes only. Every concept records the tradition it references; ownership of
            traditional motifs is never assumed.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
