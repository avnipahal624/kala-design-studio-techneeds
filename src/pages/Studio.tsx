import { LogoMark } from "@/components/brand/Logo";
import { getGarment, PatternDefs } from "@/components/art/garments";
import { StudioBrief } from "@/components/studio/StudioBrief";
import { StudioTools, type StudioTab } from "@/components/studio/StudioTools";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { CRAFT_BY_ID, MOTIF_BY_ID, PRODUCT_BY_ID, PRODUCT_TYPES } from "@/lib/crafts";
import {
  Component,
  lazy,
  Suspense,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { GarmentArt, LayerShape } from "@/components/art/garments";
import {
  ArrowLeft,
  Check,
  Download,
  Eye,
  EyeOff,
  History,
  Loader2,
  Minus,
  PanelLeft,
  Plus,
  Redo2,
  RotateCw,
  Save,
  SlidersHorizontal,
  Undo2,
  Copy,
  Box,
  Square,
} from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { uid, type CanvasState, type DesignLayer } from "@/lib/design-types";
import { darken, readableInk } from "@/lib/craft-engine";

const Garment3DPreview = lazy(() => import("@/components/studio/Garment3DPreview"));
const THREE_D_PRODUCTS = new Set(["jacket", "tshirt", "tote"]);

/* ------------------------------------------------------------------ helpers */

const STAGE = 900;

const clampNum = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** React error boundary so a canvas bug never whites out the whole studio. */
class StudioErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null as string | null };
  static getDerivedStateFromError(error: Error) {
    return { error: error.message };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
          <p className="font-display text-lg text-maroon">The canvas hit a snag</p>
          <p className="max-w-sm text-xs text-muted-foreground">{this.state.error}</p>
          <Button className="mt-2 bg-maroon text-ivory" onClick={() => this.setState({ error: null })}>
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

function layerName(layer: DesignLayer) {
  if (layer.kind === "text") return layer.text || "Text";
  return MOTIF_BY_ID[layer.motifId ?? ""]?.label ?? "Motif";
}

/* -------------------------------------------------------------------- page */

export default function Studio() {
  const { designId } = useParams<{ designId: string }>();
  const navigate = useNavigate();
  const typedId = designId as Id<"designs"> | undefined;

  const design = useQuery(api.designs.get, typedId ? { designId: typedId } : "skip");
  const versions = useQuery(api.designs.versions, typedId ? { designId: typedId } : "skip");
  const saveDesign = useMutation(api.designs.save);
  const renameDesign = useMutation(api.designs.rename);
  const restoreVersion = useMutation(api.designs.restoreVersion);

  const [canvas, setCanvas] = useState<CanvasState | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const [past, setPast] = useState<CanvasState[]>([]);
  const [future, setFuture] = useState<CanvasState[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<StudioTab>("motifs");
  const [zoom, setZoom] = useState(1);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [title, setTitle] = useState("");
  const [toolsOpen, setToolsOpen] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [restoring, setRestoring] = useState<number | null>(null);
  const [compareSaved, setCompareSaved] = useState(false);
  const [viewMode, setViewMode] = useState<"2d" | "3d">("3d");

  const svgRef = useRef<SVGSVGElement>(null);
  const initialisedFor = useRef<string | null>(null);
  const dragRef = useRef<{
    mode: "move" | "resize" | "rotate";
    layer: DesignLayer;
    startPoint: { x: number; y: number };
    startDistance: number;
  } | null>(null);

  // Initialise local canvas exactly once per design id.
  useEffect(() => {
    if (!design || initialisedFor.current === design._id) return;
    initialisedFor.current = design._id;
    setCanvas(design.canvas);
    setViewMode(THREE_D_PRODUCTS.has(design.canvas.productType) ? "3d" : "2d");
    setSavedSnapshot(JSON.stringify(design.canvas));
    setTitle(design.title);
    setPast([]);
    setFuture([]);
    setSelectedId(null);
  }, [design]);

  const selectedLayer = useMemo(
    () => canvas?.layers.find((layer) => layer.id === selectedId) ?? null,
    [canvas, selectedId],
  );
  const dirty = Boolean(canvas && JSON.stringify(canvas) !== savedSnapshot);
  const savedCanvas = useMemo<CanvasState | null>(() => {
    if (!savedSnapshot) return null;
    try {
      return JSON.parse(savedSnapshot) as CanvasState;
    } catch {
      return null;
    }
  }, [savedSnapshot]);

  // Warn before leaving with unsaved canvas changes.
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function commit(next: CanvasState, recordHistory = true) {
    if (!canvas) return;
    if (recordHistory) {
      setPast((prev) => [...prev.slice(-39), canvas]);
      setFuture([]);
    }
    setCanvas(next);
  }

  function undo() {
    setPast((prev) => {
      if (prev.length === 0 || !canvas) return prev;
      const previous = prev[prev.length - 1];
      setFuture((next) => [canvas, ...next].slice(0, 40));
      setCanvas(previous);
      return prev.slice(0, -1);
    });
  }

  function redo() {
    setFuture((next) => {
      if (next.length === 0 || !canvas) return next;
      const forward = next[0];
      setPast((prev) => [...prev.slice(-39), canvas]);
      setCanvas(forward);
      return next.slice(1);
    });
  }

  function addMotif(motifId: string) {
    if (!canvas) return;
    const craft = design?.craftId ? CRAFT_BY_ID[design.craftId] : undefined;
    const ink = readableInk(canvas.fabricColor);
    const candidates = [
      ...(craft?.palette ?? []),
      "#7a302a",
      "#a5483b",
      "#34483e",
      "#343e87",
      "#f7f2e8",
      "#292322",
    ];
    const chosen =
      candidates.find((hex) => {
        const a = hex.replace("#", "");
        const b = canvas.fabricColor.replace("#", "");
        return a !== b && ink !== hex;
      }) ?? "#7a302a";
    const offset = (canvas.layers.length % 5) * 14 - 28;
    const layer: DesignLayer = {
      id: uid("m"),
      kind: "motif",
      motifId,
      x: 450 + offset,
      y: 430 + offset,
      size: 150,
      rotation: 0,
      color: chosen,
      opacity: 1,
    };
    commit({ ...canvas, layers: [...canvas.layers, layer] });
    setSelectedId(layer.id);
    setTab("layers");
  }

  function addText(text: string, fontFamily: string) {
    if (!canvas) return;
    const layer: DesignLayer = {
      id: uid("t"),
      kind: "text",
      text,
      fontFamily,
      x: 450,
      y: 610,
      size: 120,
      rotation: 0,
      color: readableInk(canvas.fabricColor),
      opacity: 1,
    };
    commit({ ...canvas, layers: [...canvas.layers, layer] });
    setSelectedId(layer.id);
    setTab("layers");
  }

  function updateLayer(patch: Partial<DesignLayer>) {
    if (!canvas || !selectedId) return;
    commit(
      {
        ...canvas,
        layers: canvas.layers.map((layer) =>
          layer.id === selectedId ? { ...layer, ...patch } : layer,
        ),
      },
      true,
    );
  }

  function deleteLayer() {
    if (!canvas || !selectedId) return;
    commit({ ...canvas, layers: canvas.layers.filter((layer) => layer.id !== selectedId) });
    setSelectedId(null);
  }

  function duplicateLayer() {
    if (!canvas || !selectedLayer) return;
    const copy: DesignLayer = {
      ...selectedLayer,
      id: uid(selectedLayer.kind === "text" ? "t" : "m"),
      x: clampNum(selectedLayer.x + 28, -100, 1000),
      y: clampNum(selectedLayer.y + 28, -100, 1000),
    };
    commit({ ...canvas, layers: [...canvas.layers, copy] });
    setSelectedId(copy.id);
  }

  function reorderLayer(direction: -1 | 1) {
    if (!canvas || !selectedId) return;
    const index = canvas.layers.findIndex((layer) => layer.id === selectedId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= canvas.layers.length) return;
    const layers = [...canvas.layers];
    const [moved] = layers.splice(index, 1);
    layers.splice(target, 0, moved);
    commit({ ...canvas, layers });
  }

  function applyPalette(colors: string[]) {
    if (!canvas) return;
    const ground = colors[3] ?? colors[0];
    const inks = colors.filter((hex) => hex !== ground);
    commit({
      ...canvas,
      fabricColor: ground,
      layers: canvas.layers.map((layer, index) => ({
        ...layer,
        color: inks[index % Math.max(inks.length, 1)] ?? layer.color,
      })),
    });
  }

  function changeProductType(productType: string) {
    if (!canvas) return;
    const product = PRODUCT_BY_ID[productType] ?? PRODUCT_TYPES[0];
    commit({ ...canvas, productType, silhouette: product.silhouette });
    if (!THREE_D_PRODUCTS.has(productType)) setViewMode("2d");
  }

  async function handleSave(note = "Edited in studio") {
    if (!canvas || !typedId) return;
    setSaving(true);
    try {
      const version = await saveDesign({ designId: typedId, canvas, note });
      setSavedSnapshot(JSON.stringify(canvas));
      toast.success(`Saved as version ${version}`, {
        description: "The previous version stays untouched in history.",
      });
    } catch (error) {
      toast.error("Save failed", {
        description: error instanceof Error ? error.message : "Try again in a moment.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleRename() {
    if (!typedId || !design) return;
    const next = title.trim();
    if (!next || next === design.title) {
      setTitle(design.title);
      return;
    }
    try {
      await renameDesign({ designId: typedId, title: next });
    } catch {
      toast.error("Couldn't rename this creation");
      setTitle(design.title);
    }
  }

  async function handleRestore(version: number, snapshot: CanvasState) {
    if (!typedId) return;
    setRestoring(version);
    try {
      const next = await restoreVersion({ designId: typedId, version });
      setCanvas(snapshot);
      setSavedSnapshot(JSON.stringify(snapshot));
      setPast([]);
      setFuture([]);
      setSelectedId(null);
      setVersionsOpen(false);
      toast.success(`Restored v${version} as new v${next}`);
    } catch (error) {
      toast.error("Couldn't restore that version", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setRestoring(null);
    }
  }

  function stagePoint(event: ReactPointerEvent<SVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const scale = STAGE / rect.width;
    return {
      x: (event.clientX - rect.left) * scale,
      y: (event.clientY - rect.top) * scale,
    };
  }

  function beginDrag(event: ReactPointerEvent<SVGGElement>, layer: DesignLayer) {
    if (!canvas) return;
    event.stopPropagation();
    event.preventDefault();
    svgRef.current?.setPointerCapture(event.pointerId);
    setSelectedId(layer.id);
    setPast((prev) => [...prev.slice(-39), canvas]);
    setFuture([]);
    dragRef.current = {
      mode: "move",
      layer: { ...layer },
      startPoint: stagePoint(event),
      startDistance: 0,
    };
  }

  function beginHandleDrag(event: ReactPointerEvent<SVGElement>, mode: "resize" | "rotate") {
    if (!canvas || !selectedLayer) return;
    event.stopPropagation();
    event.preventDefault();
    svgRef.current?.setPointerCapture(event.pointerId);
    const point = stagePoint(event);
    setPast((prev) => [...prev.slice(-39), canvas]);
    setFuture([]);
    dragRef.current = {
      mode,
      layer: { ...selectedLayer },
      startPoint: point,
      startDistance: Math.max(
        12,
        Math.hypot(point.x - selectedLayer.x, point.y - selectedLayer.y),
      ),
    };
  }

  function onPointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    const drag = dragRef.current;
    if (!drag || !canvas) return;
    const point = stagePoint(event);
    let next: Partial<DesignLayer> = {};

    if (drag.mode === "move") {
      next = {
        x: clampNum(drag.layer.x + (point.x - drag.startPoint.x), -100, 1000),
        y: clampNum(drag.layer.y + (point.y - drag.startPoint.y), -100, 1000),
      };
    } else if (drag.mode === "resize") {
      const distance = Math.hypot(point.x - drag.layer.x, point.y - drag.layer.y);
      const ratio = distance / Math.max(drag.startDistance, 1);
      next = { size: clampNum(drag.layer.size * ratio, 20, 700) };
    } else {
      const angle =
        (Math.atan2(point.y - drag.layer.y, point.x - drag.layer.x) * 180) / Math.PI + 90;
      next = { rotation: Math.round(angle) };
    }

    setCanvas({
      ...canvas,
      layers: canvas.layers.map((layer) =>
        layer.id === drag.layer.id ? { ...layer, ...next } : layer,
      ),
    });
  }

  function endDrag() {
    dragRef.current = null;
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || target?.isContentEditable) {
        return;
      }
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void handleSave();
        return;
      }
      if (!canvas) return;
      if ((event.key === "Delete" || event.key === "Backspace") && selectedId) {
        event.preventDefault();
        deleteLayer();
        return;
      }
      if (selectedId && event.key.startsWith("Arrow")) {
        event.preventDefault();
        const step = event.shiftKey ? 16 : 4;
        const layer = canvas.layers.find((item) => item.id === selectedId);
        if (!layer) return;
        const delta =
          event.key === "ArrowLeft"
            ? { x: -step, y: 0 }
            : event.key === "ArrowRight"
              ? { x: step, y: 0 }
              : event.key === "ArrowUp"
                ? { x: 0, y: -step }
                : { x: 0, y: step };
        commit(
          {
            ...canvas,
            layers: canvas.layers.map((item) =>
              item.id === selectedId
                ? {
                    ...item,
                    x: clampNum(item.x + delta.x, -100, 1000),
                    y: clampNum(item.y + delta.y, -100, 1000),
                  }
                : item,
            ),
          },
          true,
        );
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, selectedId, past, future]);

  async function handleExport() {
    const svg = svgRef.current;
    if (!svg) return;
    setExporting(true);
    try {
      const clone = svg.cloneNode(true) as SVGSVGElement;
      clone.querySelectorAll("[data-export-ignore]").forEach((node) => node.remove());
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      clone.setAttribute("width", "1200");
      clone.setAttribute("height", "1200");
      const source = new XMLSerializer().serializeToString(clone);
      const url = URL.createObjectURL(new Blob([source], { type: "image/svg+xml;charset=utf-8" }));

      await new Promise<void>((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
          const output = document.createElement("canvas");
          output.width = 1200;
          output.height = 1200;
          const context = output.getContext("2d");
          if (!context) {
            reject(new Error("Canvas unavailable"));
            return;
          }
          context.fillStyle = "#f7f2e8";
          context.fillRect(0, 0, 1200, 1200);
          context.drawImage(image, 0, 0, 1200, 1200);
          output.toBlob((blob) => {
            if (!blob) {
              reject(new Error("Export failed"));
              return;
            }
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "kalakari-design"}.png`;
            link.click();
            URL.revokeObjectURL(link.href);
            resolve();
          }, "image/png");
        };
        image.onerror = () => reject(new Error("Could not render the canvas"));
        image.src = url;
      });
      URL.revokeObjectURL(url);
      toast.success("Preview exported as PNG");
    } catch (error) {
      toast.error("Export failed", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setExporting(false);
    }
  }

  if (!typedId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-parchment p-6 text-center">
        <div>
          <p className="font-display text-xl text-maroon">This studio link is incomplete</p>
          <Button className="mt-3 bg-maroon text-ivory" onClick={() => navigate("/creations")}>
            Go to my creations
          </Button>
        </div>
      </div>
    );
  }

  if (design === undefined || !canvas) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-parchment">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Opening your studio…
        </div>
      </div>
    );
  }

  const garment = getGarment(canvas.productType);
  const clipId = "studio-garment-clip";
  const shadeId = "studio-garment-shade";
  const selectedBox = selectedLayer
    ? selectedLayer.kind === "text"
      ? {
          x: selectedLayer.x - Math.max(60, (selectedLayer.text?.length ?? 4) * selectedLayer.size * 0.24) / 2,
          y: selectedLayer.y - (selectedLayer.size * 0.5) / 2,
          w: Math.max(60, (selectedLayer.text?.length ?? 4) * selectedLayer.size * 0.24),
          h: selectedLayer.size * 0.5,
        }
      : {
          x: selectedLayer.x - selectedLayer.size / 2,
          y: selectedLayer.y - selectedLayer.size / 2,
          w: selectedLayer.size,
          h: selectedLayer.size,
        }
    : null;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-parchment text-ink">
      {/* header */}
      <header className="z-30 shrink-0 border-b border-maroon/15 bg-[#fffaf0]">
        <div className="flex items-center gap-2 px-3 py-2 md:px-4">
          <button
            type="button"
            onClick={() => navigate("/creations")}
            className="flex size-8 items-center justify-center rounded-lg border border-maroon/20 text-maroon transition-colors hover:bg-maroon/5"
            aria-label="Back to creations"
          >
            <ArrowLeft className="size-4" />
          </button>
          <LogoMark className="hidden size-7 sm:block" />
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              onBlur={handleRename}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
              className="min-w-0 flex-1 truncate rounded-md border border-transparent bg-transparent px-1.5 py-1 font-display text-base font-semibold text-maroon outline-none transition-colors hover:border-maroon/15 focus:border-maroon/35 focus:bg-card md:text-lg"
              aria-label="Design title"
            />
            <span
              className={`hidden shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium sm:flex ${
                dirty
                  ? "border-saffron/50 bg-saffron/10 text-[#8a6a31]"
                  : "border-teal/30 bg-teal/8 text-teal"
              }`}
            >
              {dirty ? "Unsaved changes" : <><Check className="size-2.5" /> Saved</>}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-maroon/20 text-maroon"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(window.location.href);
                  toast("Studio link copied");
                } catch {
                  toast.error("Couldn't copy the link");
                }
              }}
              aria-label="Copy studio link"
            >
              <Copy className="size-3.5" />
              <span className="hidden lg:inline">Link</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-maroon/20 text-maroon"
              onClick={() => setVersionsOpen(true)}
            >
              <History className="size-3.5" />
              <span className="hidden md:inline">v{design.versionCount}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-maroon/20 text-maroon"
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button
              size="sm"
              className="gap-1.5 bg-maroon text-ivory hover:bg-maroon-deep"
              onClick={() => void handleSave()}
              disabled={saving || !dirty}
            >
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              Save
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 border-t border-maroon/10 px-3 py-1.5 md:px-4">
          <div className="flex items-center rounded-full border border-maroon/15 bg-card p-0.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={`h-7 gap-1 rounded-full px-2.5 text-[10px] ${viewMode === "2d" ? "bg-maroon text-ivory hover:bg-maroon-deep hover:text-ivory" : "text-maroon/65"}`}
              onClick={() => setViewMode("2d")}
            >
              <Square className="size-3" /> 2D
            </Button>
            {THREE_D_PRODUCTS.has(canvas.productType) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`h-7 gap-1 rounded-full px-2.5 text-[10px] ${viewMode === "3d" ? "bg-maroon text-ivory hover:bg-maroon-deep hover:text-ivory" : "text-maroon/65"}`}
                onClick={() => setViewMode("3d")}
                title="Interactive 3D preview"
              >
                <Box className="size-3" /> 3D
              </Button>
            )}
          </div>
          <span className="h-4 w-px bg-maroon/15" />
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-ink/70 hover:bg-maroon/8"
              onClick={undo}
              disabled={past.length === 0}
              aria-label="Undo"
            >
              <Undo2 className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-ink/70 hover:bg-maroon/8"
              onClick={redo}
              disabled={future.length === 0}
              aria-label="Redo"
            >
              <Redo2 className="size-3.5" />
            </Button>
            <span className="mx-1 h-4 w-px bg-maroon/15" />
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-ink/70"
              onClick={() => setZoom((z) => clampNum(z - 0.15, 0.5, 2))}
              aria-label="Zoom out"
            >
              <Minus className="size-3.5" />
            </Button>
            <span className="w-10 text-center text-[10px] text-muted-foreground">{Math.round(zoom * 100)}%</span>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-ink/70"
              onClick={() => setZoom((z) => clampNum(z + 0.15, 0.5, 2))}
              aria-label="Zoom in"
            >
              <Plus className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[10px] text-ink/60"
              onClick={() => setZoom(1)}
            >
              Reset
            </Button>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <span className="hidden truncate text-[10px] text-muted-foreground lg:inline">
              {selectedLayer ? `${layerName(selectedLayer)} selected` : "Tap a layer to edit · scroll to pan"}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-maroon/20 text-[11px] text-maroon"
              onClick={() => setCompareSaved((value) => !value)}
              aria-pressed={compareSaved}
            >
              {compareSaved ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              <span className="hidden sm:inline">{compareSaved ? "Hide saved" : "Compare saved"}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-maroon/20 text-[11px] text-maroon xl:hidden"
              onClick={() => setBriefOpen(true)}
            >
              <SlidersHorizontal className="size-3.5" />
              Brief
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-maroon/20 text-[11px] text-maroon lg:hidden"
              onClick={() => setToolsOpen(true)}
            >
              <PanelLeft className="size-3.5" />
              Tools
            </Button>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* left tools */}
        <aside className="hidden w-[286px] shrink-0 flex-col border-r border-maroon/15 bg-card lg:flex">
          <StudioTools
            canvas={canvas}
            tab={tab}
            onTabChange={setTab}
            selectedLayer={selectedLayer}
            onProductType={changeProductType}
            onFabric={(hex) => commit({ ...canvas, fabricColor: hex })}
            onPattern={(id) => commit({ ...canvas, patternId: id })}
            onAddMotif={addMotif}
            onAddText={addText}
            onUpdateLayer={updateLayer}
            onDeleteLayer={deleteLayer}
            onDuplicateLayer={duplicateLayer}
            onReorderLayer={reorderLayer}
            onSelectLayer={setSelectedId}
            onApplyPalette={applyPalette}
          />
        </aside>

        {/* canvas */}
        <main className="flex min-w-0 flex-1 flex-col bg-[#e9dfd0]">
          <div className="min-h-0 flex-1 overflow-auto p-3 md:p-5">
            <div
              className="mx-auto"
              style={{
                width: `${zoom * 100}%`,
                minWidth: 280,
                maxWidth: 960,
              }}
            >
              <StudioErrorBoundary>
                {viewMode === "3d" && THREE_D_PRODUCTS.has(canvas.productType) ? (
                  <Suspense fallback={<div className="grid min-h-[420px] place-items-center rounded-xl border border-maroon/20 bg-[#fbf6eb]"><span className="flex items-center gap-2 text-xs text-maroon/60"><Loader2 className="size-4 animate-spin" /> Loading 3D studio…</span></div>}>
                    <Garment3DPreview canvas={canvas} />
                  </Suspense>
                ) : (
                <div className="relative rounded-xl border border-maroon/20 bg-[#fbf6eb] shadow-[0_1px_0_rgba(255,255,255,0.6)_inset]">
                  <svg
                    ref={svgRef}
                    viewBox={`0 0 ${STAGE} ${STAGE}`}
                    className="block h-auto w-full touch-none select-none"
                    onPointerMove={onPointerMove}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                  >
                    <defs>
                      <clipPath id={clipId}>
                        <path d={garment.body} />
                      </clipPath>
                      <linearGradient id={shadeId} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#000" stopOpacity="0.14" />
                        <stop offset="32%" stopColor="#000" stopOpacity="0" />
                        <stop offset="70%" stopColor="#000" stopOpacity="0" />
                        <stop offset="100%" stopColor="#000" stopOpacity="0.1" />
                      </linearGradient>
                      <PatternDefs patternId={canvas.patternId} color={readableInk(canvas.fabricColor)} />
                    </defs>

                    {/* pasteboard texture */}
                    <rect
                      width={STAGE}
                      height={STAGE}
                      fill="#fbf6eb"
                      onPointerDown={() => setSelectedId(null)}
                    />
                    <g opacity="0.35" pointerEvents="none">
                      {Array.from({ length: 18 }).map((_, index) => (
                        <line
                          key={index}
                          x1={index * 50}
                          y1={0}
                          x2={index * 50}
                          y2={STAGE}
                          stroke="#d8c9b6"
                          strokeWidth="0.5"
                          strokeDasharray="2 8"
                        />
                      ))}
                      {Array.from({ length: 18 }).map((_, index) => (
                        <line
                          key={`h${index}`}
                          x1={0}
                          y1={index * 50}
                          x2={STAGE}
                          y2={index * 50}
                          stroke="#d8c9b6"
                          strokeWidth="0.5"
                          strokeDasharray="2 8"
                        />
                      ))}
                    </g>

                    <text x={450} y={40} textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize="13" letterSpacing="4" fill="#7a302a" opacity="0.45">
                      {canvas.silhouette.toUpperCase()} · KALकारी LEGACY STUDIO
                    </text>

                    <path
                      d={garment.body}
                      fill={canvas.fabricColor}
                      stroke={darken(canvas.fabricColor, 0.35)}
                      strokeWidth="2.5"
                      strokeLinejoin="round"
                      onPointerDown={() => setSelectedId(null)}
                    />

                    <g clipPath={`url(#${clipId})`}>
                      {canvas.patternId && canvas.patternId !== "none" && (
                        <path d={garment.body} fill={`url(#kal-pattern--${canvas.patternId})`} opacity="0.5" />
                      )}
                      {canvas.layers.map((layer) => (
                        <LayerShape key={layer.id} layer={layer} onPointerDown={beginDrag} />
                      ))}
                      <path d={garment.body} fill={`url(#${shadeId})`} />
                    </g>

                    {garment.detail(canvas.fabricColor)}

                    {/* selection overlay (excluded from export) */}
                    {selectedBox && selectedLayer && (
                      <g
                        data-export-ignore
                        transform={`rotate(${selectedLayer.rotation} ${selectedLayer.x} ${selectedLayer.y})`}
                      >
                        <rect
                          x={selectedBox.x}
                          y={selectedBox.y}
                          width={selectedBox.w}
                          height={selectedBox.h}
                          fill="none"
                          stroke="#7a302a"
                          strokeWidth="1.5"
                          strokeDasharray="6 5"
                          vectorEffect="non-scaling-stroke"
                        />
                        <line
                          x1={selectedLayer.x}
                          y1={selectedBox.y}
                          x2={selectedLayer.x}
                          y2={selectedBox.y - 34}
                          stroke="#7a302a"
                          strokeWidth="1.5"
                        />
                        <circle
                          cx={selectedLayer.x}
                          cy={selectedBox.y - 40}
                          r="9"
                          fill="#f7f2e8"
                          stroke="#7a302a"
                          strokeWidth="1.5"
                          style={{ cursor: "grab" }}
                          onPointerDown={(event) => beginHandleDrag(event, "rotate")}
                        />
                        <circle cx={selectedLayer.x} cy={selectedBox.y - 40} r="3" fill="#7a302a" pointerEvents="none" />
                        <rect
                          x={selectedBox.x + selectedBox.w - 9}
                          y={selectedBox.y + selectedBox.h - 9}
                          width="18"
                          height="18"
                          rx="3"
                          fill="#d8a65b"
                          stroke="#7a302a"
                          strokeWidth="1.5"
                          style={{ cursor: "nwse-resize" }}
                          onPointerDown={(event) => beginHandleDrag(event, "resize")}
                        />
                        <circle cx={selectedBox.x} cy={selectedBox.y} r="3.5" fill="#7a302a" />
                        <circle cx={selectedBox.x + selectedBox.w} cy={selectedBox.y} r="3.5" fill="#7a302a" />
                        <circle cx={selectedBox.x} cy={selectedBox.y + selectedBox.h} r="3.5" fill="#7a302a" />
                      </g>
                    )}
                  </svg>
                  {compareSaved && savedCanvas && (
                    <div className="pointer-events-none absolute bottom-3 left-3 w-[132px] overflow-hidden rounded-lg border border-maroon/25 bg-[#fbf6eb] shadow-[0_14px_30px_-15px_rgba(40,35,31,0.5)] sm:bottom-4 sm:left-4 sm:w-[172px]">
                      <div className="flex items-center justify-between border-b border-maroon/12 px-2 py-1.5">
                        <span className="text-[7px] font-semibold uppercase tracking-[0.12em] text-maroon/60">Last saved</span>
                        <span className="text-[7px] text-muted-foreground">v{design.versionCount}</span>
                      </div>
                      <GarmentArt canvas={savedCanvas} className="h-auto w-full" />
                    </div>
                  )}
                </div>
                )}

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-1">
                  <p className="flex items-center gap-1.5 text-[10px] text-ink/55">
                    <RotateCw className="size-3" />
                    {viewMode === "3d" ? "Drag to rotate · switch to 2D to move motifs" : "Drag to move · corner to resize · top dot to rotate"}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex overflow-hidden rounded ring-1 ring-ink/10">
                      {[canvas.fabricColor, ...canvas.layers.slice(0, 3).map((layer) => layer.color)].map(
                        (hex, index) => (
                          <span key={`${hex}-${index}`} className="h-3.5 w-6" style={{ background: hex }} />
                        ),
                      )}
                    </div>
                    <span className="text-[10px] text-ink/55">
                      {PRODUCT_BY_ID[canvas.productType]?.label} · {canvas.layers.length} layers
                    </span>
                  </div>
                </div>
              </StudioErrorBoundary>
            </div>
          </div>
        </main>

        {/* right brief */}
        <aside className="hidden w-[300px] shrink-0 flex-col border-l border-maroon/15 bg-card xl:flex">
          <StudioBrief canvas={canvas} craftId={design.craftId} title={design.title} designId={design._id} />
        </aside>
      </div>

      {/* mobile drawers */}
      <Sheet open={toolsOpen} onOpenChange={setToolsOpen}>
        <SheetContent side="left" className="w-[min(340px,92vw)] border-maroon/20 bg-card p-0">
          <SheetTitle className="sr-only">Design tools</SheetTitle>
          <StudioTools
            canvas={canvas}
            tab={tab}
            onTabChange={setTab}
            selectedLayer={selectedLayer}
            onProductType={changeProductType}
            onFabric={(hex) => commit({ ...canvas, fabricColor: hex })}
            onPattern={(id) => commit({ ...canvas, patternId: id })}
            onAddMotif={addMotif}
            onAddText={addText}
            onUpdateLayer={updateLayer}
            onDeleteLayer={deleteLayer}
            onDuplicateLayer={duplicateLayer}
            onReorderLayer={reorderLayer}
            onSelectLayer={setSelectedId}
            onApplyPalette={applyPalette}
          />
        </SheetContent>
      </Sheet>

      <Sheet open={briefOpen} onOpenChange={setBriefOpen}>
        <SheetContent side="right" className="w-[min(340px,92vw)] border-maroon/20 bg-card p-0">
          <SheetTitle className="sr-only">Production read-out</SheetTitle>
          <StudioBrief canvas={canvas} craftId={design.craftId} title={design.title} designId={design._id} />
        </SheetContent>
      </Sheet>

      {/* version history */}
      <Dialog open={versionsOpen} onOpenChange={setVersionsOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto border-maroon/20 bg-parchment sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-maroon">Version history</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Every save is immutable. Restoring an old version creates a new one rather than
              overwriting history.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-1.5">
            {versions === undefined && (
              <div className="flex justify-center py-6">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            )}
            {versions?.map((version) => (
              <div
                key={version._id}
                className="flex items-center gap-3 rounded-lg border border-maroon/15 bg-card px-3 py-2"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-maroon/8 font-display text-xs font-semibold text-maroon">
                  v{version.version}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-medium text-ink">
                    {version.note ?? `Version ${version.version}`}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(version._creationTime).toLocaleString()} · {version.layerCount} layers
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 border-maroon/25 text-[10px] text-maroon"
                  disabled={restoring !== null || version.version === design.versionCount}
                  onClick={() => handleRestore(version.version, version.canvas)}
                >
                  {restoring === version.version ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : version.version === design.versionCount ? (
                    "Current"
                  ) : (
                    "Restore"
                  )}
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
