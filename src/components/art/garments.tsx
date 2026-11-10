import { useId, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { Motif } from "@/components/art/Motif";
import type { CanvasState, DesignLayer } from "@/lib/design-types";
import { darken, lighten, readableInk } from "@/lib/craft-engine";

/**
 * Flat-lay garment silhouettes drawn for KALकारी. They are intentionally
 * stylised studio illustrations rather than photographs, so a design reads as
 * a design concept rather than a finished product.
 */

type GarmentShape = {
  body: string;
  detail: (fabricColor: string) => ReactNode;
  /** Motif-safe area used when auto-placing elements. */
  safeArea: { x: number; y: number; w: number; h: number };
};

export const GARMENT_SHAPES: Record<string, GarmentShape> = {
  jacket: {
    body: "M450 138 C400 138 360 150 330 172 L262 212 L150 470 L232 504 L296 372 L288 776 C348 796 552 796 612 776 L604 372 L668 504 L750 470 L638 212 L570 172 C540 150 500 138 450 138 Z",
    detail: (fabric) => {
      const shade = darken(fabric, 0.35);
      return (
        <g>
          <path d="M450 152 L378 198 L432 334 L450 272 Z" fill={shade} opacity="0.35" />
          <path d="M450 152 L522 198 L468 334 L450 272 Z" fill={shade} opacity="0.25" />
          <path d="M450 272 L450 776" stroke={shade} strokeWidth="2" opacity="0.5" />
          <path d="M262 212 L330 172" stroke={shade} strokeWidth="1.5" opacity="0.3" />
          <path d="M638 212 L570 172" stroke={shade} strokeWidth="1.5" opacity="0.3" />
          <path d="M168 462 L244 494" stroke={shade} strokeWidth="2" opacity="0.3" />
          <path d="M732 462 L656 494" stroke={shade} strokeWidth="2" opacity="0.3" />
        </g>
      );
    },
    safeArea: { x: 300, y: 210, w: 300, h: 520 },
  },
  kurta: {
    body: "M450 138 C410 138 372 148 348 168 L258 226 L236 340 L318 360 L330 300 L322 800 C380 818 520 818 578 800 L570 300 L582 360 L664 340 L642 226 L552 168 C528 148 490 138 450 138 Z",
    detail: (fabric) => {
      const shade = darken(fabric, 0.35);
      return (
        <g>
          <path d="M410 150 L450 204 L490 150" fill="none" stroke={shade} strokeWidth="2.2" opacity="0.6" />
          <path d="M450 204 L450 806" stroke={shade} strokeWidth="1.6" opacity="0.45" />
          <path d="M330 300 L570 300" stroke={shade} strokeWidth="1" opacity="0.18" />
          {[0, 1, 2, 3].map((i) => (
            <circle key={i} cx="450" cy={264 + i * 48} r="2.4" fill={shade} opacity="0.5" />
          ))}
          <path d="M314 786 L314 704 M586 786 L586 704" stroke={shade} strokeWidth="1.2" opacity="0.3" />
        </g>
      );
    },
    safeArea: { x: 340, y: 220, w: 220, h: 540 },
  },
  tote: {
    body: "M282 300 L618 300 L652 758 C652 780 636 792 614 792 L286 792 C264 792 248 780 248 758 Z",
    detail: (fabric) => {
      const shade = darken(fabric, 0.4);
      const highlight = lighten(fabric, 0.35);
      return (
        <g>
          <path
            d="M332 300 C332 208 366 178 394 178 C422 178 450 208 450 300"
            fill="none"
            stroke={shade}
            strokeWidth="17"
            strokeLinecap="round"
          />
          <path
            d="M450 300 C450 208 478 178 506 178 C534 178 568 208 568 300"
            fill="none"
            stroke={shade}
            strokeWidth="17"
            strokeLinecap="round"
          />
          <path
            d="M332 300 C332 216 366 186 394 186"
            fill="none"
            stroke={highlight}
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.5"
          />
          <path
            d="M568 300 C568 216 534 186 506 186"
            fill="none"
            stroke={highlight}
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.5"
          />
          <path d="M282 736 L618 736" stroke={shade} strokeWidth="1.6" opacity="0.28" />
          <rect x="300" y="318" width="300" height="438" fill="none" stroke={shade} strokeWidth="1" opacity="0.18" strokeDasharray="4 6" />
        </g>
      );
    },
    safeArea: { x: 300, y: 318, w: 300, h: 438 },
  },
  cushion: {
    body: "M250 214 Q250 196 268 196 L632 196 Q650 196 650 214 L650 686 Q650 704 632 704 L268 704 Q250 704 250 686 Z",
    detail: (fabric) => {
      const shade = darken(fabric, 0.35);
      return (
        <g>
          <rect x="268" y="214" width="364" height="472" rx="20" fill="none" stroke={shade} strokeWidth="1.4" opacity="0.35" />
          {[
            [250, 210],
            [650, 210],
            [250, 690],
            [650, 690],
          ].map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r="5" fill={shade} opacity="0.45" />
              <path d={`M${x} ${y} L${x + (x < 450 ? -12 : 12)} ${y + (y < 450 ? -12 : 12)}`} stroke={shade} strokeWidth="1.4" opacity="0.35" />
            </g>
          ))}
          <path d="M276 232 Q450 250 624 232" stroke="#ffffff" strokeWidth="10" fill="none" opacity="0.14" />
        </g>
      );
    },
    safeArea: { x: 280, y: 230, w: 340, h: 440 },
  },
  stole: {
    body: "M330 122 C390 102 510 102 570 122 L622 742 C566 764 334 764 278 742 Z",
    detail: (fabric) => {
      const shade = darken(fabric, 0.35);
      return (
        <g>
          {Array.from({ length: 13 }).map((_, i) => (
            <path
              key={i}
              d={`M${292 + i * 25} 750 L${288 + i * 25} 800`}
              stroke={shade}
              strokeWidth="1.8"
              opacity="0.5"
              strokeLinecap="round"
            />
          ))}
          <path d="M316 128 C370 112 530 112 584 128" fill="none" stroke={shade} strokeWidth="1.2" opacity="0.35" />
        </g>
      );
    },
    safeArea: { x: 320, y: 180, w: 260, h: 540 },
  },
};

export function getGarment(productType: string) {
  return GARMENT_SHAPES[productType] ?? GARMENT_SHAPES.jacket;
}

export function PatternDefs({ patternId, color }: { patternId?: string; color: string }) {
  if (!patternId || patternId === "none") return null;
  const sizes: Record<string, number> = { dots: 40, diamond: 120, vine: 180, grid: 48 };
  const size = sizes[patternId] ?? 60;
  return (
    <pattern id={`kal-pattern--${patternId}`} width={size} height={size} patternUnits="userSpaceOnUse">
      {patternId === "dots" && (
        <>
          <circle cx={size / 2} cy={size / 2} r="2.4" fill={color} opacity="0.5" />
          <circle cx="0" cy="0" r="1.2" fill={color} opacity="0.3" />
        </>
      )}
      {patternId === "diamond" && (
        <g fill="none" stroke={color} strokeWidth="1.6" opacity="0.45">
          <path d={`M${size / 2} 6 L${size - 6} ${size / 2} L${size / 2} ${size - 6} L6 ${size / 2} Z`} />
          <circle cx={size / 2} cy={size / 2} r="2.5" fill={color} stroke="none" />
        </g>
      )}
      {patternId === "vine" && (
        <g color={color} opacity="0.55">
          <g transform={`translate(${size / 2} ${size / 2}) scale(${size / 100})`}>
            <Motif id="border" />
          </g>
        </g>
      )}
      {patternId === "grid" && (
        <g stroke={color} strokeWidth="1.4" opacity="0.35">
          <path d={`M0 ${size / 2} H${size}`} />
          <path d={`M${size / 2} 0 V${size}`} />
        </g>
      )}
    </pattern>
  );
}

export function LayerShape({
  layer,
  onPointerDown,
}: {
  layer: DesignLayer;
  onPointerDown?: (event: ReactPointerEvent<SVGGElement>, layer: DesignLayer) => void;
}) {
  if (layer.kind === "text") {
    return (
      <g
        transform={`translate(${layer.x} ${layer.y}) rotate(${layer.rotation})`}
        opacity={layer.opacity}
        style={{ cursor: onPointerDown ? "grab" : undefined }}
        onPointerDown={onPointerDown ? (event) => onPointerDown(event, layer) : undefined}
      >
        <text
          x={0}
          y={0}
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily={layer.fontFamily ?? "Fraunces, serif"}
          fontSize={layer.size * 0.42}
          fill={layer.color}
          letterSpacing="2"
        >
          {layer.text || "KALकारी"}
        </text>
      </g>
    );
  }

  return (
    <g
      transform={`translate(${layer.x} ${layer.y}) rotate(${layer.rotation}) scale(${layer.size / 100})`}
      color={layer.color}
      opacity={layer.opacity}
      style={{ cursor: onPointerDown ? "grab" : undefined }}
      onPointerDown={onPointerDown ? (event) => onPointerDown(event, layer) : undefined}
    >
      <Motif id={layer.motifId ?? "mandala"} />
    </g>
  );
}

/** Complete, self-contained garment render used for cards and previews. */
export function GarmentArt({
  canvas,
  className,
  selectedId,
  onSelectLayer,
  onStartDrag,
}: {
  canvas: CanvasState;
  className?: string;
  selectedId?: string | null;
  onSelectLayer?: (id: string | null) => void;
  onStartDrag?: (event: ReactPointerEvent<SVGGElement>, layer: DesignLayer) => void;
}) {
  const rawId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const clipId = `garment-clip-${rawId}`;
  const shadeId = `garment-shade-${rawId}`;
  const shape = getGarment(canvas.productType);
  const ink = readableInk(canvas.fabricColor);

  return (
    <svg viewBox="0 0 900 900" className={className} role="img" aria-label={`${canvas.silhouette} design preview`}>
      <defs>
        <clipPath id={clipId}>
          <path d={shape.body} />
        </clipPath>
        <linearGradient id={shadeId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#000" stopOpacity="0.14" />
          <stop offset="30%" stopColor="#000" stopOpacity="0" />
          <stop offset="72%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.1" />
        </linearGradient>
        <PatternDefs patternId={canvas.patternId} color={ink} />
      </defs>

      <path d={shape.body} fill={canvas.fabricColor} stroke={darken(canvas.fabricColor, 0.35)} strokeWidth="2.5" strokeLinejoin="round" />

      <g clipPath={`url(#${clipId})`}>
        {canvas.patternId && canvas.patternId !== "none" && (
          <path d={shape.body} fill={`url(#kal-pattern--${canvas.patternId})`} opacity="0.5" />
        )}
        {canvas.layers.map((layer) => (
          <LayerShape
            key={layer.id}
            layer={layer}
            onPointerDown={
              onStartDrag ??
              (onSelectLayer
                ? (event, clicked) => {
                    event.stopPropagation();
                    onSelectLayer(clicked.id);
                  }
                : undefined)
            }
          />
        ))}
        <path d={shape.body} fill={`url(#${shadeId})`} />
      </g>

      {shape.detail(canvas.fabricColor)}

      {selectedId && (
        <g pointerEvents="none">
          {canvas.layers
            .filter((layer) => layer.id === selectedId)
            .map((layer) => (
              <circle key={layer.id} cx={layer.x} cy={layer.y} r={2.5} fill="#fff9ef" stroke="#292322" strokeWidth="1" />
            ))}
        </g>
      )}
    </svg>
  );
}
