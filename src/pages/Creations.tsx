import { AppShell } from "@/components/app/AppShell";
import { GarmentArt } from "@/components/art/garments";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { CRAFT_BY_ID, PRODUCT_BY_ID, PRODUCT_TYPES } from "@/lib/crafts";
import { emptyCanvas } from "@/lib/craft-engine";
import { useMutation, useQuery } from "convex/react";
import { ArrowRight, Box, Copy, Loader2, Palette, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Creations() {
  const navigate = useNavigate();
  const designs = useQuery(api.designs.list);
  const createDesign = useMutation(api.designs.create);
  const duplicate = useMutation(api.designs.duplicate);
  const remove = useMutation(api.designs.remove);

  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ id: Id<"designs">; title: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function createBlank(productType: string) {
    setCreating(true);
    try {
      const id = await createDesign({
        title: "Untitled creation",
        productType,
        palette: ["#7b2040", "#f2a33a", "#087f83", "#fff4de", "#292322"],
        canvas: emptyCanvas(productType as never),
        note: "Blank canvas",
      });
      navigate(`/studio/${id}`);
    } catch (error) {
      toast.error("Couldn't start a new canvas", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setCreating(false);
    }
  }

  return (
    <AppShell
      title="Design Studio"
      hindi="डिज़ाइन स्टूडियो"
      subtitle="Shape a product in 3D, place motifs on its surface, and save every version"
      actions={
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="gap-2 rounded-full bg-maroon text-ivory hover:bg-maroon-deep" disabled={creating}>
              {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              New blank canvas
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 border-maroon/20 bg-card">
            {PRODUCT_TYPES.map((product) => (
              <DropdownMenuItem
                key={product.id}
                onClick={() => createBlank(product.id)}
                className="cursor-pointer text-xs"
              >
                {product.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      }
    >
      <section className="mb-6 overflow-hidden rounded-2xl border border-maroon/15 bg-[#fbf5e9]">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-maroon/10 px-5 py-4">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold"><Box className="size-3.5" /> Interactive 3D product studio</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-maroon">Choose a product to begin</h2>
            <p className="mt-1 text-xs leading-relaxed text-ink/55">Jacket, T-shirt and tote have surface-attached motif previews in WebGL. Other products keep the full 2D placement editor.</p>
          </div>
          <span className="rounded-full border border-emerald/25 bg-emerald/[0.08] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-emerald">3 products · 3D ready</span>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-3">
          {["jacket", "tshirt", "tote"].map((productId) => {
            const product = PRODUCT_BY_ID[productId];
            if (!product) return null;
            return (
              <button
                key={productId}
                type="button"
                disabled={creating}
                onClick={() => void createBlank(productId)}
                className="group overflow-hidden rounded-xl border border-maroon/12 bg-card text-left transition hover:-translate-y-0.5 hover:border-maroon/35 hover:shadow-[0_16px_35px_-28px_rgba(70,17,38,0.55)] disabled:opacity-60"
              >
                <div className="bg-[radial-gradient(circle_at_50%_30%,#fff8ec,#eed9bc)] p-2">
                  <GarmentArt canvas={emptyCanvas(productId as never)} className="mx-auto h-32 w-auto" />
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-maroon/10 px-3 py-2.5">
                  <div>
                    <p className="text-xs font-semibold text-maroon">{product.label}</p>
                    <p className="mt-0.5 text-[9px] text-ink/45">{product.hint}</p>
                  </div>
                  <ArrowRight className="size-3.5 shrink-0 text-maroon/50 transition group-hover:translate-x-0.5" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {designs === undefined ? (
        <div className="flex min-h-[320px] items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : designs.length === 0 ? (
        <div className="relative overflow-hidden rounded-2xl border border-maroon/18 bg-card px-6 py-16 text-center">
          <Palette className="mx-auto size-8 text-maroon/40" />
          <h2 className="mt-4 font-display text-2xl font-semibold text-maroon">No creations yet</h2>
          <p className="mx-auto mt-2 max-w-[44ch] text-sm leading-relaxed text-ink/60">
            Start from an inspiration image for a ready-made concept, or open a blank canvas and
            build the composition yourself.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button
              onClick={() => navigate("/kalavision")}
              className="rounded-full bg-maroon text-ivory hover:bg-maroon-deep"
            >
              Start from inspiration
            </Button>
            <Button
              variant="outline"
              onClick={() => createBlank("jacket")}
              className="rounded-full border-maroon/25 text-maroon"
            >
              Blank jacket canvas
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {designs.map((design) => (
            <article
              key={design._id}
              className="group flex flex-col overflow-hidden rounded-xl border border-maroon/18 bg-card transition-colors hover:border-maroon/40"
            >
              <button
                type="button"
                onClick={() => navigate(`/studio/${design._id}`)}
                className="relative bg-[radial-gradient(circle_at_50%_30%,#fff8ec,#eed9bc)] text-left"
                aria-label={`Open ${design.title}`}
              >
                <GarmentArt canvas={design.canvas} className="h-auto w-full" />
                <span className="absolute left-2 top-2 rounded-full bg-parchment/90 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-ink/60">
                  v{design.versionCount}
                </span>
                {design.craftId && CRAFT_BY_ID[design.craftId] && (
                  <span className="absolute bottom-2 left-2 rounded-full bg-maroon/90 px-2 py-0.5 text-[9px] font-medium text-ivory">
                    {CRAFT_BY_ID[design.craftId].name}
                  </span>
                )}
              </button>

              <div className="flex flex-1 flex-col justify-between gap-3 border-t border-maroon/12 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{design.title}</p>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {PRODUCT_BY_ID[design.productType]?.label ?? design.productType} ·{" "}
                    {design.layerCount} layers
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    Updated{" "}
                    {new Date(design.updatedAt).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    className="h-7 flex-1 bg-maroon text-[11px] text-ivory hover:bg-maroon-deep"
                    onClick={() => navigate(`/studio/${design._id}`)}
                  >
                    Open studio
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="size-7 border-maroon/20 text-ink/60"
                    aria-label={`Duplicate ${design.title}`}
                    disabled={busyId === design._id}
                    onClick={async () => {
                      setBusyId(design._id);
                      try {
                        const id = await duplicate({ designId: design._id });
                        toast.success("Creation duplicated");
                        navigate(`/studio/${id}`);
                      } catch (error) {
                        toast.error("Couldn't duplicate", {
                          description: error instanceof Error ? error.message : undefined,
                        });
                      } finally {
                        setBusyId(null);
                      }
                    }}
                  >
                    {busyId === design._id ? <Loader2 className="size-3 animate-spin" /> : <Copy className="size-3" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="size-7 border-vermilion/25 text-vermilion"
                    aria-label={`Delete ${design.title}`}
                    onClick={() => setPendingDelete({ id: design._id, title: design.title })}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent className="border-maroon/20 bg-parchment">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-maroon">Delete this creation?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-ink/65">
              “{pendingDelete?.title}” and its version history will be removed permanently. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-maroon/25">Keep it</AlertDialogCancel>
            <AlertDialogAction
              className="bg-vermilion text-ivory hover:bg-vermilion/90"
              onClick={async () => {
                if (!pendingDelete) return;
                try {
                  await remove({ designId: pendingDelete.id });
                  toast.success("Creation deleted");
                } catch (error) {
                  toast.error("Couldn't delete", {
                    description: error instanceof Error ? error.message : undefined,
                  });
                } finally {
                  setPendingDelete(null);
                }
              }}
            >
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
