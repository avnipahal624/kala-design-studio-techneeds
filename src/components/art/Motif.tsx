import type { MotifId } from "@/lib/crafts";

/**
 * Original vector motif illustrations drawn in a -50..50 coordinate box.
 * They use `currentColor` so the studio can recolour them, and the landing
 * page can tint them per section. These are contemporary illustrations
 * inspired by shared Indian decorative vocabularies — not scans or copies of
 * any community's specific artwork.
 */
export function Motif({ id }: { id: string }) {
  switch (id as MotifId) {
    case "mandala":
      return <MandalaMotif />;
    case "lotus":
      return <LotusMotif />;
    case "peacock":
      return <PeacockMotif />;
    case "fish":
      return <FishMotif />;
    case "paisley":
      return <PaisleyMotif />;
    case "marigold":
      return <MarigoldMotif />;
    case "warli":
      return <WarliMotif />;
    case "tree":
      return <TreeMotif />;
    case "mirror":
      return <MirrorMotif />;
    case "sprig":
      return <SprigMotif />;
    case "sunbird":
      return <SunbirdMotif />;
    case "border":
      return <BorderMotif />;
    default:
      return <MandalaMotif />;
  }
}

function MandalaMotif() {
  const petals = Array.from({ length: 16 });
  return (
    <g>
      {petals.map((_, i) => (
        <g key={i} transform={`rotate(${i * 22.5})`}>
          <path
            d="M0,-13 C6.5,-23 6.5,-34 0,-44 C-6.5,-34 -6.5,-23 0,-13 Z"
            fill="currentColor"
            opacity={i % 2 === 0 ? 0.95 : 0.55}
          />
          <circle cx="0" cy="-46.5" r="1.5" fill="currentColor" opacity="0.9" />
        </g>
      ))}
      <circle r="15" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.85" />
      <circle r="10.5" fill="none" stroke="currentColor" strokeWidth="0.9" strokeDasharray="1.8 2.4" />
      {Array.from({ length: 8 }).map((_, i) => (
        <circle
          key={i}
          cx={Math.cos((i * Math.PI) / 4) * 21.5}
          cy={Math.sin((i * Math.PI) / 4) * 21.5}
          r="1.4"
          fill="currentColor"
          opacity="0.8"
        />
      ))}
      <circle r="4.5" fill="currentColor" />
      <circle r="1.6" fill="#FFF9EF" opacity="0.9" />
    </g>
  );
}

function LotusMotif() {
  const side = [-1, 1];
  return (
    <g>
      {side.map((dir) =>
        [0.62, 0.82].map((scale, index) => (
          <g key={`${dir}-${index}`} transform={`scale(${dir * 1} 1) rotate(${index === 0 ? 38 : 66}) scale(${scale})`}>
            <path
              d="M0,-34 C9,-20 9,-6 0,2 C-9,-6 -9,-20 0,-34 Z"
              fill="currentColor"
              opacity={index === 0 ? 0.62 : 0.4}
            />
          </g>
        )),
      )}
      <path d="M0,-42 C11,-26 11,-6 0,6 C-11,-6 -11,-26 0,-42 Z" fill="currentColor" opacity="0.95" />
      <path d="M0,-30 C6,-20 6,-8 0,0 C-6,-8 -6,-20 0,-30 Z" fill="#FFF9EF" opacity="0.35" />
      <path d="M-34,8 C-18,2 18,2 34,8 C18,14 -18,14 -34,8 Z" fill="currentColor" opacity="0.5" />
      <path d="M-30,16 C-14,10 14,10 30,16" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
      <circle cx="0" cy="11" r="1.8" fill="currentColor" />
    </g>
  );
}

function PeacockMotif() {
  const feathers = [-84, -63, -42, -21, 0, 21, 42, 63, 84];
  return (
    <g>
      {feathers.map((angle) => (
        <g key={angle} transform={`rotate(${angle} 0 30)`}>
          <path d="M0,28 C-7,6 0,-24 0,-40 C0,-24 7,6 0,28 Z" fill="currentColor" opacity="0.3" />
          <circle cx="0" cy="-31" r="5.4" fill="currentColor" opacity="0.85" />
          <circle cx="0" cy="-31" r="2" fill="#FFF9EF" opacity="0.9" />
        </g>
      ))}
      <ellipse cx="0" cy="30" rx="10.5" ry="15" fill="currentColor" />
      <path
        d="M-2,20 C-6,6 1,-6 8,-14"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="9.5" cy="-17" r="5.2" fill="currentColor" />
      <path d="M15,-17 L23,-15 L15,-12 Z" fill="currentColor" />
      <path d="M9.5,-22 L7,-29 M9.5,-22 L12,-29" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M-7,42 L-7,49 M7,42 L7,49" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="11" cy="-18.5" r="1.1" fill="#FFF9EF" />
    </g>
  );
}

function FishMotif() {
  return (
    <g>
      <g>
        <path
          d="M-40,0 C-28,-14 -6,-18 14,-10 C22,-6 28,-2 32,0 C28,4 22,8 14,12 C-6,20 -28,16 -40,0 Z"
          fill="currentColor"
          opacity="0.9"
        />
        <path d="M-38,0 L-50,-12 L-48,0 L-50,12 Z" fill="currentColor" opacity="0.75" />
        <circle cx="22" cy="-3" r="2" fill="#FFF9EF" />
        <path d="M-20,-7 C-8,-12 6,-10 16,-4" stroke="#FFF9EF" strokeWidth="1.2" fill="none" opacity="0.65" />
        <path d="M-16,6 C-6,10 6,8 14,4" stroke="#FFF9EF" strokeWidth="1.2" fill="none" opacity="0.5" />
      </g>
      <g transform="rotate(180) scale(0.82)">
        <path
          d="M-40,0 C-28,-14 -6,-18 14,-10 C22,-6 28,-2 32,0 C28,4 22,8 14,12 C-6,20 -28,16 -40,0 Z"
          fill="currentColor"
          opacity="0.45"
        />
        <path d="M-38,0 L-50,-12 L-48,0 L-50,12 Z" fill="currentColor" opacity="0.45" />
        <circle cx="22" cy="-3" r="2" fill="#FFF9EF" />
      </g>
    </g>
  );
}

function PaisleyMotif() {
  return (
    <g>
      <path
        d="M-6,42 C-30,34 -42,10 -30,-10 C-19,-29 6,-36 22,-22 C39,-7 34,18 16,30 C4,38 -8,33 -10,22 C-12,11 -2,4 6,8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M-1,33 C-20,27 -30,9 -21,-6 C-13,-20 4,-25 15,-15 C27,-4 24,12 11,21 C2,27 -6,23 -7,15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.7"
      />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={-4 + i * 9} cy={-2 + i * 7} r="1.6" fill="currentColor" opacity="0.8" />
      ))}
      <path d="M20,-30 C26,-38 34,-38 38,-32" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <circle cx="40" cy="-30" r="2.4" fill="currentColor" opacity="0.7" />
    </g>
  );
}

function MarigoldMotif() {
  return (
    <g>
      {[0, 1].map((ring) => (
        <g key={ring}>
          {Array.from({ length: ring === 0 ? 12 : 9 }).map((_, i) => {
            const count = ring === 0 ? 12 : 9;
            return (
              <g key={i} transform={`rotate(${(i * 360) / count + ring * 15})`}>
                <ellipse
                  cx="0"
                  cy={ring === 0 ? -32 : -20}
                  rx={ring === 0 ? 6.5 : 5.5}
                  ry={ring === 0 ? 12 : 9}
                  fill="currentColor"
                  opacity={ring === 0 ? 0.55 : 0.9}
                />
              </g>
            );
          })}
        </g>
      ))}
      <circle r="13" fill="currentColor" opacity="0.35" />
      {Array.from({ length: 8 }).map((_, i) => (
        <circle
          key={i}
          cx={Math.cos((i * Math.PI) / 4) * 7}
          cy={Math.sin((i * Math.PI) / 4) * 7}
          r="1.4"
          fill="currentColor"
        />
      ))}
      <circle r="3" fill="currentColor" />
    </g>
  );
}

function WarliMotif() {
  return (
    <g stroke="currentColor" fill="none" strokeLinecap="round" strokeWidth="2">
      <circle cx="0" cy="-30" r="6" fill="currentColor" stroke="none" />
      <path d="M0,-24 L0,8" />
      <path d="M0,-14 L-16,-4 M0,-14 L16,-4" />
      <path d="M-16,-4 L-16,14 M16,-4 L16,14" />
      <path d="M0,8 L-14,34 M0,8 L14,34" />
      <path d="M-14,34 L-8,34 M14,34 L8,34" />
      <path d="M-26,34 C-20,20 -10,14 -2,14 C6,14 16,20 22,34" strokeWidth="1.2" opacity="0.55" />
      <circle cx="-32" cy="-18" r="2" fill="currentColor" stroke="none" opacity="0.6" />
      <circle cx="32" cy="-24" r="2" fill="currentColor" stroke="none" opacity="0.4" />
    </g>
  );
}

function TreeMotif() {
  return (
    <g>
      <path d="M0,44 L0,-8" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
      {[0, 1, 2].map((level) => {
        const y = 26 - level * 20;
        const span = 16 + level * 9;
        return (
          <g key={level}>
            <path
              d={`M0,${y} C-${span * 0.4},${y} -${span},${y - 8} -${span},${y - 16}`}
              stroke="currentColor"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d={`M0,${y} C${span * 0.4},${y} ${span},${y - 8} ${span},${y - 16}`}
              stroke="currentColor"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
            />
            {[-1, 1].map((dir) => (
              <g key={dir}>
                <ellipse
                  cx={dir * span}
                  cy={y - 20}
                  rx="5.5"
                  ry="8.5"
                  fill="currentColor"
                  opacity="0.72"
                />
                <ellipse
                  cx={dir * (span - 7)}
                  cy={y - 28}
                  rx="4"
                  ry="6.5"
                  fill="currentColor"
                  opacity="0.45"
                />
              </g>
            ))}
          </g>
        );
      })}
      <circle cx="0" cy="-30" r="4" fill="currentColor" />
      <path d="M-22,44 C-10,38 10,38 22,44" stroke="currentColor" strokeWidth="1.4" fill="none" opacity="0.6" />
    </g>
  );
}

function MirrorMotif() {
  return (
    <g>
      <path d="M0,-44 L36,0 L0,44 L-36,0 Z" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path d="M0,-28 L23,0 L0,28 L-23,0 Z" fill="currentColor" opacity="0.18" />
      <path d="M0,-28 L23,0 L0,28 L-23,0 Z" fill="none" stroke="currentColor" strokeWidth="1.1" opacity="0.7" />
      <path d="M0,-14 L11,0 L0,14 L-11,0 Z" fill="currentColor" opacity="0.85" />
      <path d="M0,-44 L0,44 M-36,0 L36,0" stroke="currentColor" strokeWidth="0.7" opacity="0.35" strokeDasharray="2 3" />
      {[
        [0, -35],
        [0, 35],
        [-30, 0],
        [30, 0],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="2.4" fill="currentColor" opacity="0.8" />
      ))}
    </g>
  );
}

function SprigMotif() {
  return (
    <g>
      <path d="M-6,40 C-2,16 2,-6 10,-34" stroke="currentColor" strokeWidth="1.9" fill="none" strokeLinecap="round" />
      {[0, 1, 2, 3].map((i) => {
        const y = 26 - i * 18;
        const x = -4 + i * 4;
        const dir = i % 2 === 0 ? -1 : 1;
        return (
          <g key={i}>
            <ellipse
              cx={x + dir * 11}
              cy={y}
              rx="10"
              ry="5"
              fill="currentColor"
              opacity={i % 2 === 0 ? 0.7 : 0.5}
              transform={`rotate(${dir * 28} ${x + dir * 11} ${y})`}
            />
            <path
              d={`M${x},${y + 2} C${x + dir * 6},${y} ${x + dir * 9},${y - 1} ${x + dir * 10},${y - 2}`}
              stroke="currentColor"
              strokeWidth="0.9"
              fill="none"
              opacity="0.7"
            />
          </g>
        );
      })}
      <circle cx="10" cy="-36" r="3.2" fill="currentColor" />
      <path d="M10,-33 L14,-26 M10,-33 L6,-27" stroke="currentColor" strokeWidth="1" />
    </g>
  );
}

function SunbirdMotif() {
  return (
    <g>
      <circle cx="-14" cy="-16" r="14" fill="currentColor" opacity="0.28" />
      {Array.from({ length: 10 }).map((_, i) => (
        <path
          key={i}
          d="M-14,-30 L-14,-38"
          stroke="currentColor"
          strokeWidth="1.3"
          opacity="0.65"
          transform={`rotate(${i * 36} -14 -16)`}
        />
      ))}
      <circle cx="-14" cy="-16" r="8" fill="currentColor" opacity="0.5" />
      <path
        d="M4,10 C10,-4 24,-8 34,-4 C28,2 26,6 22,12 C18,18 8,20 4,10 Z"
        fill="currentColor"
      />
      <path d="M-4,14 C6,10 16,12 22,16 C12,20 2,20 -6,18 Z" fill="currentColor" opacity="0.7" />
      <path d="M34,-4 L44,-10 L40,0 Z" fill="currentColor" />
      <circle cx="28" cy="-2" r="1.3" fill="#FFF9EF" />
      <path d="M10,14 L4,32 M14,15 L12,33" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
      <path d="M0,12 C-6,6 -10,0 -10,-6" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.6" />
    </g>
  );
}

function BorderMotif() {
  return (
    <g>
      <path d="M-50,0 C-30,-14 -10,14 10,0 C30,-14 42,6 50,0" stroke="currentColor" strokeWidth="2" fill="none" />
      {[-36, -12, 12, 36].map((x, i) => (
        <g key={x} transform={`translate(${x} ${i % 2 === 0 ? -7 : 7})`}>
          {[0, 1, 2, 3, 4].map((p) => (
            <ellipse
              key={p}
              cx="0"
              cy="-5.5"
              rx="2.4"
              ry="4.4"
              fill="currentColor"
              opacity="0.8"
              transform={`rotate(${p * 72})`}
            />
          ))}
          <circle r="1.4" fill="#FFF9EF" opacity="0.85" />
        </g>
      ))}
      <path d="M-50,12 L50,12" stroke="currentColor" strokeWidth="0.8" opacity="0.35" strokeDasharray="3 3" />
    </g>
  );
}
