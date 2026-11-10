import { Motif } from "@/components/art/Motif";
import { Swatch } from "@/components/art/Ornaments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { FABRICS, MOTIFS, MOTIF_BY_ID, PALETTE_PRESETS, PRODUCT_TYPES } from "@/lib/crafts";
import type { CanvasState, DesignLayer } from "@/lib/design-types";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Layers,
  Palette,
  Plus,
  Shirt,
  Trash2,
  Type,
} from "lucide-react";
import { useState } from "react";

export type StudioTab = "product" | "motifs" | "colours" | "text" | "layers";

const TABS: { id: StudioTab; label: string; icon: typeof Shirt }[] = [
  { id: "product", label: "Product", icon: Shirt },
  { id: "motifs", label: "Motifs", icon: Layers },
  { id: "colours", label: "Colour", icon: Palette },
  { id: "text", label: "Type", icon: Type },
  { id: "layers", label: "Layers", icon: Layers },
];

const PATTERNS = [
  { id: "none", label: "Plain" },
  { id: "dots", label: "Dotted" },
  { id: "diamond", label: "Diamond" },
  { id: "vine", label: "Vine" },
  { id: "grid", label: "Grid" },
];

const FONT_OPTIONS = [
  { label: "Fraunces", value: "Fraunces, serif" },
  { label: "DM Sans", value: "DM Sans, sans-serif" },
  { label: "Yatra One", value: "Yatra One, serif" },
  { label: "Noto Devanagari", value: "Noto Sans Devanagari, sans-serif" },
];

export function StudioTools({
  canvas,
  tab,
  onTabChange,
  selectedLayer,
  onProductType,
  onFabric,
  onPattern,
  onAddMotif,
  onAddText,
  onUpdateLayer,
  onDeleteLayer,
  onDuplicateLayer,
  onReorderLayer,
  onSelectLayer,
  onApplyPalette,
}: {
  canvas: CanvasState;
  tab: StudioTab;
  onTabChange: (tab: StudioTab) => void;
  selectedLayer: DesignLayer | null;
  onProductType: (id: string) => void;
  onFabric: (hex: string) => void;
  onPattern: (id: string) => void;
  onAddMotif: (id: string) => void;
  onAddText: (text: string, fontFamily: string) => void;
  onUpdateLayer: (patch: Partial<DesignLayer>) => void;
  onDeleteLayer: () => void;
  onDuplicateLayer: () => void;
  onReorderLayer: (direction: -1 | 1) => void;
  onSelectLayer: (id: string | null) => void;
  onApplyPalette: (colors: string[]) => void;
}) {
  const [textDraft, setTextDraft] = useState("KALAकारी");
  const [font, setFont] = useState(FONT_OPTIONS[0].value);
  const [motifFocus, setMotifFocus] = useState<string | null>(null);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-maroon/12 px-3 py-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onTabChange(item.id)}
            aria-pressed={tab === item.id}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
              tab === item.id
                ? "bg-maroon text-ivory"
                : "text-ink/60 hover:bg-maroon/8 hover:text-maroon"
            }`}
          >
            <item.icon className="size-3.5" />
            {item.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {tab === "product" && (
          <div className="space-y-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Silhouette
              </p>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {PRODUCT_TYPES.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => onProductType(product.id)}
                    className={`rounded-lg border px-2.5 py-2 text-left text-[11px] transition-colors ${
                      canvas.productType === product.id
                        ? "border-maroon bg-maroon/6 font-semibold text-maroon"
                        : "border-maroon/15 text-ink/70 hover:border-maroon/40"
                    }`}
                  >
                    {product.label}
                    <span className="mt-0.5 block font-hindi text-[10px] font-normal text-teal">
                      {product.hindi}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Fabric ground
              </p>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {FABRICS.map((fabric) => (
                  <button
                    key={fabric.id}
                    type="button"
                    onClick={() => onFabric(fabric.color)}
                    title={`${fabric.name} — ${fabric.detail}`}
                    className={`overflow-hidden rounded-lg border text-left transition-colors ${
                      canvas.fabricColor.toLowerCase() === fabric.color.toLowerCase()
                        ? "border-maroon"
                        : "border-maroon/15 hover:border-maroon/40"
                    }`}
                  >
                    <Swatch color={fabric.color} pattern="diagonal" className="h-9 w-full" />
                    <span className="block truncate px-1 py-1 text-[9px] text-ink/70">{fabric.name}</span>
                  </button>
                ))}
              </div>
              <label className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-maroon/15 px-2 py-1.5">
                <span className="text-[10px] text-muted-foreground">Custom ground</span>
                <input
                  type="color"
                  value={canvas.fabricColor}
                  onChange={(event) => onFabric(event.target.value)}
                  className="h-6 w-10 cursor-pointer rounded border border-maroon/20 bg-transparent"
                  aria-label="Fabric colour"
                />
              </label>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Woven pattern
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {PATTERNS.map((pattern) => (
                  <button
                    key={pattern.id}
                    type="button"
                    onClick={() => onPattern(pattern.id)}
                    className={`rounded-full border px-2.5 py-1 text-[10px] transition-colors ${
                      (canvas.patternId ?? "none") === pattern.id
                        ? "border-teal bg-teal/10 text-teal"
                        : "border-maroon/15 text-ink/60 hover:border-teal/40"
                    }`}
                  >
                    {pattern.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
                Patterns sit beneath your motifs and clip to the garment.
              </p>
            </div>
          </div>
        )}

        {tab === "motifs" && (
          <div className="space-y-3">
            <p className="text-[11px] leading-relaxed text-ink/60">
              Original motif illustrations. Tap to add a layer at the centre of the piece.
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {MOTIFS.map((motif) => (
                <button
                  key={motif.id}
                  type="button"
                  onClick={() => {
                    onAddMotif(motif.id);
                    setMotifFocus(motif.id);
                  }}
                  onMouseEnter={() => setMotifFocus(motif.id)}
                  className="group rounded-lg border border-maroon/15 bg-card p-1.5 text-center transition-colors hover:border-maroon/45 hover:bg-parchment"
                  title={motif.label}
                >
                  <svg viewBox="-50 -50 100 100" className="mx-auto size-10 text-maroon transition-transform group-hover:scale-110">
                    <Motif id={motif.id} />
                  </svg>
                  <span className="mt-1 block truncate text-[9px] text-ink/70">{motif.label}</span>
                </button>
              ))}
            </div>
            {motifFocus && MOTIF_BY_ID[motifFocus] && (
              <div className="rounded-lg border border-teal/25 bg-mint/40 p-2.5">
                <p className="text-[11px] font-semibold text-teal">
                  {MOTIF_BY_ID[motifFocus].label}{" "}
                  <span className="font-hindi font-normal">· {MOTIF_BY_ID[motifFocus].hindi}</span>
                </p>
                <p className="mt-1 text-[10px] leading-relaxed text-ink/65">
                  {MOTIF_BY_ID[motifFocus].note}
                </p>
              </div>
            )}
          </div>
        )}

        {tab === "colours" && (
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Curated palettes
              </p>
              <div className="mt-2 space-y-1.5">
                {PALETTE_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => onApplyPalette(preset.colors)}
                    className="group flex w-full items-center gap-2 rounded-lg border border-maroon/15 p-1.5 text-left transition-colors hover:border-maroon/40"
                  >
                    <span className="flex flex-1 overflow-hidden rounded ring-1 ring-ink/10">
                      {preset.colors.map((hex) => (
                        <span key={hex} className="h-6 flex-1" style={{ background: hex }} />
                      ))}
                    </span>
                    <span className="w-[88px] shrink-0 text-[10px] text-ink/70">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Selected layer colour
              </p>
              {selectedLayer ? (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedLayer.color}
                    onChange={(event) => onUpdateLayer({ color: event.target.value })}
                    className="h-9 w-12 cursor-pointer rounded border border-maroon/20 bg-transparent"
                    aria-label="Layer colour"
                  />
                  <span className="font-mono text-[11px] uppercase text-ink/60">{selectedLayer.color}</span>
                </div>
              ) : (
                <p className="mt-2 rounded-lg border border-dashed border-maroon/25 bg-parchment/60 p-3 text-[10px] leading-relaxed text-muted-foreground">
                  Select a motif or text layer on the canvas to recolour it.
                </p>
              )}
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Palette in this design
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {Array.from(new Set([canvas.fabricColor, ...canvas.layers.map((layer) => layer.color)])).map(
                  (hex) => (
                    <span
                      key={hex}
                      className="size-7 rounded-full ring-1 ring-ink/15"
                      style={{ background: hex }}
                      title={hex}
                    />
                  ),
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "text" && (
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Add lettering
              </p>
              <Input
                value={textDraft}
                onChange={(event) => setTextDraft(event.target.value)}
                maxLength={40}
                className="mt-2 border-maroon/20 bg-card text-sm"
                placeholder="Your word or phrase"
              />
              <select
                value={font}
                onChange={(event) => setFont(event.target.value)}
                className="mt-2 w-full rounded-md border border-maroon/20 bg-card px-2 py-1.5 text-xs text-ink"
                aria-label="Lettering font"
              >
                {FONT_OPTIONS.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                className="mt-2 w-full gap-1.5 bg-maroon text-ivory hover:bg-maroon-deep"
                onClick={() => textDraft.trim() && onAddText(textDraft.trim(), font)}
              >
                <Plus className="size-3.5" />
                Add text layer
              </Button>
            </div>

            <div className="rounded-lg border border-maroon/15 bg-parchment/60 p-3">
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                Text is rendered as vector lettering inside the garment clip. Keep it short — this
                is a design annotation, not a printed label.
              </p>
            </div>

            {selectedLayer?.kind === "text" && (
              <div className="space-y-2 rounded-lg border border-teal/25 bg-mint/30 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-teal">
                  Edit selected text
                </p>
                <Input
                  value={selectedLayer.text ?? ""}
                  onChange={(event) => onUpdateLayer({ text: event.target.value.slice(0, 40) })}
                  className="border-maroon/20 bg-card text-sm"
                />
                <select
                  value={selectedLayer.fontFamily ?? FONT_OPTIONS[0].value}
                  onChange={(event) => onUpdateLayer({ fontFamily: event.target.value })}
                  className="w-full rounded-md border border-maroon/20 bg-card px-2 py-1.5 text-xs"
                  aria-label="Selected text font"
                >
                  {FONT_OPTIONS.map((option) => (
                    <option key={option.label} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {tab === "layers" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {canvas.layers.length} layer{canvas.layers.length === 1 ? "" : "s"}
              </p>
              {selectedLayer && (
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="size-6 border-maroon/20"
                    onClick={onDuplicateLayer}
                    aria-label="Duplicate layer"
                  >
                    <Copy className="size-3" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="size-6 border-vermilion/30 text-vermilion"
                    onClick={onDeleteLayer}
                    aria-label="Delete layer"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-1">
              {[...canvas.layers]
                .slice()
                .reverse()
                .map((layer) => {
                  const active = selectedLayer?.id === layer.id;
                  return (
                    <button
                      key={layer.id}
                      type="button"
                      onClick={() => onSelectLayer(layer.id)}
                      className={`flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition-colors ${
                        active
                          ? "border-maroon bg-maroon/5"
                          : "border-maroon/12 hover:border-maroon/35"
                      }`}
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded border border-maroon/12 bg-card">
                        {layer.kind === "text" ? (
                          <span className="font-display text-[9px] text-ink/70">Aa</span>
                        ) : (
                          <svg viewBox="-50 -50 100 100" className="size-5" style={{ color: layer.color }}>
                            <Motif id={layer.motifId ?? "mandala"} />
                          </svg>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] text-ink/80">
                          {layer.kind === "text" ? layer.text : MOTIF_BY_ID[layer.motifId ?? ""]?.label ?? "Motif"}
                        </span>
                        <span className="block text-[9px] text-muted-foreground">
                          {layer.kind === "text" ? "Text" : "Motif"} · {Math.round(layer.size)}px
                        </span>
                      </span>
                      <span
                        className="size-3.5 shrink-0 rounded-full ring-1 ring-ink/15"
                        style={{ background: layer.color }}
                      />
                    </button>
                  );
                })}
              {canvas.layers.length === 0 && (
                <p className="rounded-lg border border-dashed border-maroon/25 bg-parchment/60 p-3 text-[10px] leading-relaxed text-muted-foreground">
                  No layers yet. Add a motif from the Motifs tab.
                </p>
              )}
            </div>

            {selectedLayer && (
              <div className="space-y-3 rounded-lg border border-maroon/15 bg-parchment/50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-medium text-ink/70">Bring forward / send back</span>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="size-6 border-maroon/20"
                      onClick={() => onReorderLayer(1)}
                      aria-label="Bring layer forward"
                    >
                      <ArrowUp className="size-3" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="size-6 border-maroon/20"
                      onClick={() => onReorderLayer(-1)}
                      aria-label="Send layer backward"
                    >
                      <ArrowDown className="size-3" />
                    </Button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[10px] text-ink/70">
                    <span>Size</span>
                    <span>{Math.round(selectedLayer.size)}</span>
                  </div>
                  <Slider
                    value={[selectedLayer.size]}
                    min={24}
                    max={480}
                    step={2}
                    onValueChange={([value]) => onUpdateLayer({ size: value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between text-[10px] text-ink/70">
                    <span>Rotation</span>
                    <span>{Math.round(selectedLayer.rotation)}°</span>
                  </div>
                  <Slider
                    value={[selectedLayer.rotation]}
                    min={-180}
                    max={180}
                    step={1}
                    onValueChange={([value]) => onUpdateLayer({ rotation: value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between text-[10px] text-ink/70">
                    <span>Opacity</span>
                    <span>{Math.round(selectedLayer.opacity * 100)}%</span>
                  </div>
                  <Slider
                    value={[selectedLayer.opacity * 100]}
                    min={10}
                    max={100}
                    step={1}
                    onValueChange={([value]) => onUpdateLayer({ opacity: value / 100 })}
                    className="mt-1.5"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
