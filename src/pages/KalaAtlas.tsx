import { api } from "@/convex/_generated/api";
import { Motif } from "@/components/art/Motif";
import { PublicShell } from "@/components/public/PublicShell";
import { Button } from "@/components/ui/button";
import { canonicalStateName, craftsForState, type AtlasCraft } from "@/lib/kala-atlas";
import { useQuery } from "convex/react";
import { geoMercator, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { ArrowRight, BookOpen, Loader2, MapPin, Minus, Plus, RotateCcw, Search, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Link } from "react-router";

type StateProperties = { name: string; lgdCode?: number };
type StateFeature = Feature<Geometry, StateProperties>;
type StateCollection = FeatureCollection<Geometry, StateProperties>;
type ViewTransform = { k: number; x: number; y: number };

const MAP_WIDTH = 700;
const MAP_HEIGHT = 790;
const INITIAL_VIEW: ViewTransform = { k: 1, x: 0, y: 0 };

const LIBRARY_CRAFT_ID: Record<string, string> = {
  chikankari: "chikankari",
  phulkari: "phulkari",
  kantha: "kantha",
  madhubani: "madhubani",
  ajrakh: "ajrakh",
  pattachitra: "pattachitra",
  sozni: "kashmiri",
  kalamkari: "kalamkari",
};

function shortenState(name: string) {
  if (name.startsWith("Dadra")) return "DNH & DD";
  if (name === "Andaman & Nicobar") return "A & N Islands";
  return name;
}

export default function KalaAtlas() {
  const [states, setStates] = useState<StateCollection | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedName, setSelectedName] = useState("Rajasthan");
  const [selectedCraftId, setSelectedCraftId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewTransform>(INITIAL_VIEW);
  const [hovered, setHovered] = useState<string | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/data/india-states.geojson")
      .then((response) => {
        if (!response.ok) throw new Error(`Map request failed with ${response.status}`);
        return response.json() as Promise<StateCollection>;
      })
      .then((data) => {
        if (cancelled) return;
        if (!Array.isArray(data.features) || data.features.length < 30) {
          throw new Error("The boundary file did not contain the expected state features.");
        }
        setStates(data);
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : "Could not load the map.");
      });
    return () => { cancelled = true; };
  }, [reloadKey]);

  const projection = useMemo(
    () => (states ? geoMercator().fitExtent([[24, 26], [MAP_WIDTH - 24, MAP_HEIGHT - 26]], states) : null),
    [states],
  );
  const pathFor = useMemo(() => (projection ? geoPath(projection) : null), [projection]);

  const statesByName = useMemo(() => {
    const map = new Map<string, StateFeature>();
    for (const feature of states?.features ?? []) {
      map.set(canonicalStateName(feature.properties?.name), feature);
    }
    return map;
  }, [states]);

  const selectedFeature = statesByName.get(selectedName) ?? null;
  const selectedCrafts = craftsForState(selectedName);
  const activeCraft = selectedCrafts.find((craft) => craft.id === selectedCraftId) ?? null;
  const stateArtisans = useQuery(api.artisans.directory, { state: selectedName, limit: 8 });

  const searchMatches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return [...statesByName.keys()]
      .filter((name) => name.toLowerCase().includes(needle))
      .sort((a, b) => a.localeCompare(b))
      .slice(0, 8);
  }, [query, statesByName]);

  function selectState(name: string, zoom = false) {
    const canonical = canonicalStateName(name);
    setSelectedName(canonical);
    setSelectedCraftId(null);
    setQuery("");
    const feature = statesByName.get(canonical);
    if (zoom && feature && pathFor) {
      const [[x0, y0], [x1, y1]] = pathFor.bounds(feature);
      const k = Math.max(1, Math.min(3.2, 0.64 / Math.max((x1 - x0) / MAP_WIDTH, (y1 - y0) / MAP_HEIGHT)));
      setView({ k, x: MAP_WIDTH / 2 - (k * (x0 + x1)) / 2, y: MAP_HEIGHT / 2 - (k * (y0 + y1)) / 2 });
    }
  }

  function adjustZoom(delta: number) {
    setView((current) => {
      const k = Math.max(1, Math.min(4, current.k + delta));
      const cx = MAP_WIDTH / 2;
      const cy = MAP_HEIGHT / 2;
      return { k, x: cx - (cx - current.x) * (k / current.k), y: cy - (cy - current.y) * (k / current.k) };
    });
  }

  function resetMap() {
    setView(INITIAL_VIEW);
    setSelectedName("Rajasthan");
    setSelectedCraftId(null);
  }

  function handleKeyDown(event: ReactKeyboardEvent<SVGSVGElement>) {
    const step = 38;
    if (event.key === "+" || event.key === "=") { event.preventDefault(); adjustZoom(0.4); }
    else if (event.key === "-") { event.preventDefault(); adjustZoom(-0.4); }
    else if (event.key === "0") { event.preventDefault(); resetMap(); }
    else if (event.key === "ArrowLeft") { event.preventDefault(); setView((v) => ({ ...v, x: v.x + step })); }
    else if (event.key === "ArrowRight") { event.preventDefault(); setView((v) => ({ ...v, x: v.x - step })); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setView((v) => ({ ...v, y: v.y + step })); }
    else if (event.key === "ArrowDown") { event.preventDefault(); setView((v) => ({ ...v, y: v.y - step })); }
  }

  return (
    <PublicShell>
      <section className="relative overflow-hidden border-b border-maroon/10 bg-[#fbf5e8]">
        <div className="pointer-events-none absolute inset-0 opacity-[0.5] [background-image:radial-gradient(circle_at_20%_12%,rgba(181,80,47,0.1),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(52,72,62,0.1),transparent_30%)]" />
        <div className="relative mx-auto max-w-[1440px] px-4 pb-10 pt-12 md:px-8 md:pb-14 md:pt-16">
          <div className="grid gap-8 lg:grid-cols-[0.78fr_1.55fr_0.92fr] lg:items-start">
            <div className="lg:pt-10">
              <div className="flex items-center gap-3">
                <span className="h-px w-9 bg-gold/80" />
                <span className="label-caps text-[9px] text-teal">KalaAtlas · craft geography</span>
              </div>
              <h1 className="mt-4 max-w-[9ch] font-display text-5xl font-medium leading-[0.92] tracking-[-0.03em] text-maroon md:text-6xl">
                Discover India's craft heritage.
              </h1>
              <p className="mt-5 max-w-[38ch] text-[12px] leading-[1.85] text-ink/60">
                Explore documented craft traditions by state, then meet the makers whose profiles are actually on Kalakari. Boundaries come from an open LGD-derived dataset; craft notes link to their sources.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Button asChild className="gap-2 rounded-full bg-maroon px-4 text-[11px] text-ivory hover:bg-maroon-deep">
                  <Link to="/explore-artisans">Explore every artisan <ArrowRight className="size-3.5" /></Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full border-maroon/25 bg-card text-[11px] text-maroon">
                  <Link to="/crafts">Craft library</Link>
                </Button>
              </div>

              <div className="mt-7 lg:hidden">
                <label htmlFor="atlas-state" className="text-[9px] font-semibold uppercase tracking-[0.14em] text-ink/45">Choose a state or UT</label>
                <select
                  id="atlas-state"
                  value={selectedName}
                  onChange={(event) => selectState(event.target.value, true)}
                  className="mt-2 w-full rounded-xl border border-maroon/20 bg-card px-3 py-3 text-sm text-maroon outline-none focus:border-maroon"
                >
                  {[...statesByName.keys()].sort().map((name) => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>

              <div className="mt-6 rounded-2xl border border-maroon/15 bg-card/80 p-3">
                <label htmlFor="atlas-search" className="sr-only">Search states and union territories</label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink/40" />
                  <input
                    id="atlas-search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && searchMatches[0]) selectState(searchMatches[0], true);
                      if (event.key === "Escape") setQuery("");
                    }}
                    placeholder="Search a state or UT…"
                    className="h-10 w-full rounded-xl border border-maroon/15 bg-[#fffaf0] pl-9 pr-8 text-xs text-ink outline-none placeholder:text-ink/35 focus:border-maroon/50"
                  />
                  {query && (
                    <button type="button" onClick={() => setQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/40 hover:text-maroon" aria-label="Clear search">
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
                {query && (
                  <div className="mt-2 max-h-48 overflow-auto rounded-xl border border-maroon/10 bg-card">
                    {searchMatches.length === 0 ? <p className="p-3 text-[11px] text-ink/50">No matching state or UT.</p> : searchMatches.map((name) => (
                      <button key={name} type="button" onClick={() => selectState(name, true)} className="flex w-full items-center justify-between border-b border-maroon/8 px-3 py-2 text-left text-[11px] text-ink/70 last:border-0 hover:bg-maroon/5 hover:text-maroon">
                        {name}<MapPin className="size-3 text-maroon/45" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[28px] border border-maroon/15 bg-[#f8efdd] shadow-[0_35px_80px_-55px_rgba(66,32,24,0.55)]">
              <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:repeating-linear-gradient(0deg,transparent_0_26px,rgba(122,48,42,0.03)_26px_27px),repeating-linear-gradient(90deg,transparent_0_26px,rgba(122,48,42,0.025)_26px_27px)]" />
              <div className="relative flex items-center justify-between border-b border-maroon/10 px-4 py-3">
                <span className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-maroon/70"><MapPin className="size-3.5 text-vermillion" /> 36 states & union territories</span>
                <span className="rounded-full border border-gold/40 bg-card/70 px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-[#8a6a31]">Open boundaries</span>
              </div>

              {loadError ? (
                <div className="flex min-h-[430px] flex-col items-center justify-center gap-3 px-8 text-center">
                  <p className="font-display text-xl text-maroon">The map could not load.</p>
                  <p className="max-w-[34ch] text-[11px] leading-relaxed text-ink/55">{loadError} You can still choose a state in the list beside the map.</p>
                  <Button size="sm" variant="outline" className="border-maroon/25" onClick={() => { setLoadError(null); setReloadKey((key) => key + 1); }}>Try again</Button>
                </div>
              ) : !states || !pathFor ? (
                <div className="flex min-h-[430px] items-center justify-center gap-2 text-[11px] text-ink/50"><Loader2 className="size-4 animate-spin text-maroon" /> Loading state boundaries…</div>
              ) : (
                <div className="relative">
                  <svg
                    ref={svgRef}
                    viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
                    className="h-auto w-full touch-none select-none"
                    role="group"
                    aria-label="Interactive map of India. Select a state or union territory. Use plus and minus to zoom, arrow keys to pan, and 0 to reset."
                    tabIndex={0}
                    onKeyDown={handleKeyDown}
                    onPointerDown={(event) => {
                      if ((event.target as Element).closest("[data-state-path]")) return;
                      dragRef.current = { startX: event.clientX, startY: event.clientY, originX: view.x, originY: view.y };
                      event.currentTarget.setPointerCapture(event.pointerId);
                    }}
                    onPointerMove={(event) => {
                      if (!dragRef.current || !svgRef.current) return;
                      const rect = svgRef.current.getBoundingClientRect();
                      const scale = MAP_WIDTH / rect.width;
                      setView((current) => ({
                        ...current,
                        x: dragRef.current!.originX + (event.clientX - dragRef.current!.startX) * scale,
                        y: dragRef.current!.originY + (event.clientY - dragRef.current!.startY) * scale,
                      }));
                    }}
                    onPointerUp={() => { dragRef.current = null; }}
                    onPointerCancel={() => { dragRef.current = null; }}
                  >
                    <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
                      {states.features.map((feature) => {
                        const name = canonicalStateName(feature.properties?.name);
                        const path = pathFor(feature);
                        if (!path) return null;
                        const isSelected = name === selectedName;
                        const isHovered = name === hovered;
                        return (
                          <path
                            key={name}
                            data-state-path
                            d={path}
                            role="button"
                            tabIndex={0}
                            aria-label={`Select ${name}`}
                            aria-pressed={isSelected}
                            onClick={() => selectState(name)}
                            onFocus={() => selectState(name)}
                            onMouseEnter={() => setHovered(name)}
                            onMouseLeave={() => setHovered(null)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectState(name, true); }
                            }}
                            className="cursor-pointer outline-none transition-[fill,opacity] duration-200 focus-visible:stroke-[3] focus-visible:stroke-[#d8a65b]"
                            fill={isSelected ? "#b5502f" : isHovered ? "#d9b58b" : "#f3e7d2"}
                            stroke={isSelected ? "#7a302a" : "#6e3a32"}
                            strokeWidth={(isSelected ? 1.9 : 0.9) / view.k}
                            strokeLinejoin="round"
                            vectorEffect="non-scaling-stroke"
                          >
                            <title>{name}</title>
                          </path>
                        );
                      })}

                      {selectedCrafts.map((craft, index) => {
                        const point = projection!(craft.coords);
                        if (!point) return null;
                        const [x, y] = point;
                        const active = activeCraft?.id === craft.id;
                        return (
                          <g
                            key={craft.id}
                            transform={`translate(${x} ${y}) scale(${1 / view.k})`}
                            role="button"
                            tabIndex={0}
                            aria-label={`${craft.name}, ${craft.region}`}
                            onClick={(event) => { event.stopPropagation(); setSelectedCraftId(craft.id); }}
                            onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedCraftId(craft.id); } }}
                            className="cursor-pointer outline-none"
                          >
                            <circle r={14} fill={active ? "#d8a65b" : "#fffaf0"} stroke={active ? "#7a302a" : "#b5502f"} strokeWidth={2} />
                            <path d="M0 -6c3 0 5 2 5 5 0 4-5 8-5 8s-5-4-5-8c0-3 2-5 5-5Z" fill="#7a302a" />
                            <circle cy={-1} r={1.5} fill="#fffaf0" />
                            <text y={27} textAnchor="middle" className="pointer-events-none" fill="#5b2a22" fontSize="9" fontWeight="600">
                              {index === 0 ? shortenState(selectedName) : ""}
                            </text>
                          </g>
                        );
                      })}

                    </g>

                    {selectedFeature && (() => {
                      const centroid = pathFor.centroid(selectedFeature);
                      return (
                        <text
                          x={view.x + centroid[0] * view.k}
                          y={view.y + centroid[1] * view.k + 4}
                          textAnchor="middle"
                          className="pointer-events-none font-display"
                          fill="#fff8e8"
                          fontSize={Math.max(11, 15 / Math.sqrt(view.k))}
                          fontWeight={600}
                        >
                          {shortenState(selectedName)}
                        </text>
                      );
                    })()}
                  </svg>

                  <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-xl border border-maroon/15 bg-[#fffaf0]/95 p-1 shadow-sm">
                    <button type="button" onClick={() => adjustZoom(0.4)} className="flex size-8 items-center justify-center rounded-lg text-maroon hover:bg-maroon/8" aria-label="Zoom in"><Plus className="size-4" /></button>
                    <button type="button" onClick={() => adjustZoom(-0.4)} className="flex size-8 items-center justify-center rounded-lg text-maroon hover:bg-maroon/8" aria-label="Zoom out"><Minus className="size-4" /></button>
                    <button type="button" onClick={resetMap} className="flex size-8 items-center justify-center rounded-lg text-maroon hover:bg-maroon/8" aria-label="Reset map"><RotateCcw className="size-3.5" /></button>
                  </div>

                  <div className="absolute left-3 top-3 flex flex-wrap gap-2 rounded-xl border border-maroon/10 bg-[#fffaf0]/90 px-2.5 py-2 text-[8px] font-medium text-ink/55">
                    <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm border border-maroon/50 bg-[#f3e7d2]" /> State / UT</span>
                    <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-[#b5502f]" /> Selected</span>
                    <span className="flex items-center gap-1"><MapPin className="size-3 text-vermillion" /> Craft region</span>
                  </div>
                </div>
              )}

              <p className="relative border-t border-maroon/10 px-4 py-2.5 text-[8px] leading-relaxed text-ink/40">
                Boundaries: LGD-derived open data via India Geodata, CC0; upstream references include Survey of India and Bhuvan. Simplified for web display; not a legal or survey map. <a className="underline decoration-maroon/30 underline-offset-2 hover:text-maroon" href="https://github.com/yashveeeeeeer/india-geodata/releases/tag/admin/states" target="_blank" rel="noreferrer">Source</a>
              </p>
            </div>

            <aside className="overflow-hidden rounded-[26px] border border-maroon/15 bg-[#fffaf0] shadow-[0_30px_70px_-55px_rgba(66,32,24,0.45)]">
              <div className="relative border-b border-maroon/10 bg-[radial-gradient(circle_at_88%_18%,rgba(216,166,91,0.22),transparent_36%),linear-gradient(135deg,#fbf4e6,#f4e7d2)] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-teal">Selected region</p>
                    <h2 className="mt-1 font-display text-3xl font-semibold leading-none text-maroon">{selectedName}</h2>
                    <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-ink/40">{selectedCrafts.length ? `${selectedCrafts.length} documented ${selectedCrafts.length === 1 ? "tradition" : "traditions"}` : "State / union territory"}</p>
                  </div>
                  <span className="flex size-10 items-center justify-center rounded-full border border-maroon/15 bg-card/70 text-maroon"><MapPin className="size-4" /></span>
                </div>
                <p className="mt-3 max-w-[42ch] text-[11px] leading-relaxed text-ink/60">
                  {selectedCrafts[0]?.state === selectedName
                    ? "Craft notes below describe regional techniques and histories. They are editorial references, not certificates of origin for any individual object."
                    : "This atlas does not yet carry a curated craft entry for this region. The artisan directory may still have real maker profiles here."}
                </p>
              </div>

              <div className="max-h-[640px] overflow-y-auto p-4">
                {selectedCrafts.length > 0 ? (
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-lg font-semibold text-maroon">Craft traditions</h3>
                      <span className="text-[8px] uppercase tracking-[0.1em] text-ink/35">Source-linked</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {selectedCrafts.map((craft) => (
                        <Link
                          key={craft.id}
                          to={LIBRARY_CRAFT_ID[craft.id] ? `/crafts?craft=${LIBRARY_CRAFT_ID[craft.id]}` : "/crafts"}
                          className="group overflow-hidden rounded-xl border border-maroon/12 bg-[#fcf7ec] transition hover:border-maroon/30 hover:bg-[#fffaf0]"
                        >
                          <div className="flex h-16 items-center justify-center border-b border-maroon/8" style={{ background: `linear-gradient(135deg, ${craft.palette[0]}, ${craft.palette[1]}33)` }}>
                            <span className="size-11 text-maroon/80 transition-transform group-hover:scale-105 [&>svg]:size-full"><Motif id={craft.motifId} /></span>
                          </div>
                          <div className="p-2.5">
                            <p className="text-[11px] font-semibold leading-tight text-maroon">{craft.name}</p>
                            <p className="mt-0.5 flex items-center gap-1 text-[8px] text-ink/45"><MapPin className="size-2.5" /> {craft.region}</p>
                          </div>
                        </Link>
                      ))}
                    </div>

                    <div className="mt-4 space-y-2">
                      {selectedCrafts.map((craft) => (
                        <CraftEvidence key={craft.id} craft={craft} open={activeCraft?.id === craft.id} onToggle={() => setSelectedCraftId(activeCraft?.id === craft.id ? null : craft.id)} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-maroon/20 bg-[#fcf7ec] p-4">
                    <div className="flex items-center gap-2 text-maroon"><BookOpen className="size-4" /><p className="font-display text-base font-semibold">No curated craft note yet</p></div>
                    <p className="mt-2 text-[10px] leading-relaxed text-ink/55">
                      We have not attached a source-grounded craft entry to this region. Rather than invent one, the atlas leaves it open and shows real directory profiles where they exist.
                    </p>
                  </div>
                )}

                <div className="mt-5 border-t border-maroon/10 pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-semibold text-maroon">Artisans here</h3>
                    <Link to={`/explore-artisans?state=${encodeURIComponent(selectedName)}`} className="text-[9px] font-semibold text-teal hover:text-maroon">View all <ArrowRight className="inline size-3" /></Link>
                  </div>
                  {stateArtisans === undefined ? (
                    <p className="mt-3 flex items-center gap-2 text-[10px] text-ink/45"><Loader2 className="size-3 animate-spin" /> Loading profiles…</p>
                  ) : stateArtisans.length === 0 ? (
                    <div className="mt-3 rounded-xl border border-maroon/10 bg-[#fcf7ec] p-3">
                      <p className="text-[10px] leading-relaxed text-ink/55">No artisan profiles currently list this state. The directory is built from real profiles, so it stays empty rather than showing placeholder makers.</p>
                      <Link to="/explore-artisans" className="mt-2 inline-flex items-center gap-1 text-[9px] font-semibold text-maroon">Browse all artisans <ArrowRight className="size-3" /></Link>
                    </div>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {stateArtisans.slice(0, 5).map((artisan) => (
                        <Link key={artisan.id} to={`/artisans/${artisan.id}`} className="group flex items-center gap-3 rounded-xl border border-maroon/10 bg-[#fcf7ec] p-2 transition hover:border-maroon/30 hover:bg-[#fffaf0]">
                          <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-maroon/15 bg-[#efe2ca] font-display text-sm font-semibold text-maroon">
                            {artisan.displayName.slice(0, 1)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5">
                              <span className="truncate text-[11px] font-semibold text-maroon">{artisan.displayName}</span>
                              {artisan.sampleLabel && <span className="shrink-0 rounded-full bg-rani/10 px-1.5 py-0.5 text-[7px] font-semibold uppercase tracking-[0.06em] text-rani">Demo</span>}
                            </span>
                            <span className="mt-0.5 block truncate text-[9px] text-ink/45">{artisan.headline} · {artisan.city}</span>
                          </span>
                          <ArrowRight className="size-3 shrink-0 text-maroon/35 transition group-hover:translate-x-0.5 group-hover:text-maroon" />
                        </Link>
                      ))}
                    </div>
                  )}
                  {stateArtisans?.some((artisan) => artisan.sampleLabel) && (
                    <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-rani/[0.06] p-2 text-[8px] leading-relaxed text-rani/80"><Sparkles className="mt-0.5 size-2.5 shrink-0" /> Mixed list: some profiles are fictional sample records seeded for the demo. They are labelled and are not real makers.</p>
                  )}
                </div>

                <div className="mt-5 rounded-2xl bg-[#7a302a] p-4 text-ivory">
                  <p className="label-caps text-[8px] text-gold">From map to making</p>
                  <p className="mt-1 font-display text-lg leading-tight">Carry a regional motif into the Studio.</p>
                  <p className="mt-1.5 text-[10px] leading-relaxed text-ivory/65">Choose a product, adjust the motif and attach the saved design to a customer brief.</p>
                  <Button asChild className="mt-3 h-8 gap-1.5 rounded-full bg-ivory px-3 text-[10px] text-maroon hover:bg-gold">
                    <Link to="/studio">Open the Studio <ArrowRight className="size-3" /></Link>
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1360px] px-4 py-12 md:px-8">
        <div className="grid gap-8 border-t border-maroon/10 pt-8 md:grid-cols-[0.8fr_1.6fr]">
          <div>
            <p className="label-caps text-[9px] text-teal">How to read this atlas</p>
            <h2 className="mt-3 font-display text-3xl font-medium text-maroon">A map is a starting point, not a certificate.</h2>
          </div>
          <div className="grid gap-4 text-[11px] leading-relaxed text-ink/55 sm:grid-cols-3">
            <p><strong className="block text-[9px] uppercase tracking-[0.12em] text-maroon">Boundaries</strong>State and UT geometry is simplified open data derived from the Local Government Directory. It is for discovery, not legal or survey use.</p>
            <p><strong className="block text-[9px] uppercase tracking-[0.12em] text-maroon">Craft notes</strong>Each entry links to an official, museum or registry reference. Techniques are described conservatively; no community is claimed as the sole owner of a tradition.</p>
            <p><strong className="block text-[9px] uppercase tracking-[0.12em] text-maroon">People</strong>Artisan cards come from the live directory. Fictional sample profiles remain labelled; a state does not have a maker just because a craft note exists.</p>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}

function CraftEvidence({ craft, open, onToggle }: { craft: AtlasCraft; open: boolean; onToggle: () => void }) {
  return (
    <div className="overflow-hidden rounded-xl border border-maroon/10 bg-card">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center justify-between gap-2 p-3 text-left">
        <span className="flex items-center gap-2 text-[10px] font-semibold text-maroon"><BookOpen className="size-3 text-gold" /> {craft.name} · evidence note</span>
        <span className="text-[10px] text-maroon/50">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="border-t border-maroon/8 px-3 pb-3 pt-2">
          <p className="text-[10px] leading-relaxed text-ink/60">{craft.summary}</p>
          <p className="mt-2 text-[10px] leading-relaxed text-ink/55"><span className="font-semibold text-maroon/80">Technique.</span> {craft.technique}</p>
          <p className="mt-2 text-[10px] leading-relaxed text-ink/55"><span className="font-semibold text-maroon/80">Materials in reference.</span> {craft.materials.join(", ")}</p>
          <p className="mt-2 rounded-lg bg-gold/10 p-2 text-[9px] leading-relaxed text-[#74572c]">{craft.note}</p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            {craft.sources.map((source) => (
              <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="text-[8px] leading-relaxed text-teal underline decoration-teal/25 underline-offset-2 hover:text-maroon">{source.label} ↗</a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
