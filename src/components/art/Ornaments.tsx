/**
 * Decorative folk-art artwork for KALकारी: mandala compositions, a peacock
 * illustration, dividers and borders. All original vector work in an
 * Indian-craft-inspired idiom — used decoratively, not as documentation of a
 * specific tradition.
 */

const GOLD = "#c49a55";
const MAROON = "#7b2040";
const SAFFRON = "#f2a33a";
const TEAL = "#087f83";
const RANI = "#e66a99";
const INDIGO = "#343e87";
const VERMILION = "#d94b39";
const IVORY = "#fff4de";

function petal(r1: number, r2: number, width: number) {
  const mid = (r1 + r2) / 2;
  return `M0,-${r1} C${width},-${mid} ${width * 0.85},-${r2 - 6} 0,-${r2} C-${width * 0.85},-${r2 - 6} -${width},-${mid} 0,-${r1} Z`;
}

export function Mandala({
  className,
  colors = [MAROON, SAFFRON, TEAL, RANI, GOLD],
  rings = 3,
}: {
  className?: string;
  colors?: string[];
  rings?: number;
}) {
  const outerCount = 24;
  const midCount = 16;
  const innerCount = 12;
  return (
    <svg viewBox="0 0 400 400" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="mandala-glow">
          <stop offset="0%" stopColor={IVORY} stopOpacity="0.85" />
          <stop offset="100%" stopColor={IVORY} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="200" cy="200" r="198" fill="url(#mandala-glow)" />
      <g transform="translate(200 200)">
        <circle r="196" fill="none" stroke={colors[0]} strokeWidth="1.4" strokeDasharray="2 6" opacity="0.6" />
        {Array.from({ length: outerCount }).map((_, i) => (
          <g key={`o${i}`} transform={`rotate(${(i * 360) / outerCount})`}>
            <path d={petal(150, 192, 13)} fill={colors[i % colors.length]} opacity={0.9} />
            <circle cx="0" cy="-184" r="2" fill={IVORY} opacity="0.85" />
          </g>
        ))}
        <circle r="150" fill="none" stroke={colors[4] ?? GOLD} strokeWidth="1.6" opacity="0.8" />
        <circle r="144" fill="none" stroke={colors[0]} strokeWidth="0.8" strokeDasharray="1 4" opacity="0.6" />

        {Array.from({ length: midCount }).map((_, i) => (
          <g key={`m${i}`} transform={`rotate(${(i * 360) / midCount + 8})`}>
            <path d={petal(96, 140, 15)} fill={colors[(i + 2) % colors.length]} opacity="0.82" />
            <path d={petal(104, 132, 6)} fill={IVORY} opacity="0.35" />
          </g>
        ))}

        <circle r="92" fill="none" stroke={colors[0]} strokeWidth="1.2" opacity="0.7" />
        {Array.from({ length: 32 }).map((_, i) => (
          <circle
            key={`d${i}`}
            cx={Math.cos((i * Math.PI) / 16) * 84}
            cy={Math.sin((i * Math.PI) / 16) * 84}
            r={i % 2 === 0 ? 2.4 : 1.4}
            fill={i % 2 === 0 ? colors[1] : colors[2]}
            opacity="0.9"
          />
        ))}

        {Array.from({ length: innerCount }).map((_, i) => (
          <g key={`i${i}`} transform={`rotate(${(i * 360) / innerCount + 15})`}>
            <path d={petal(42, 78, 11)} fill={colors[(i + 1) % colors.length]} opacity="0.9" />
          </g>
        ))}
        <circle r="38" fill="none" stroke={colors[4] ?? GOLD} strokeWidth="1.4" />
        {rings > 1 &&
          Array.from({ length: 8 }).map((_, i) => (
            <circle
              key={`c${i}`}
              cx={Math.cos((i * Math.PI) / 4) * 26}
              cy={Math.sin((i * Math.PI) / 4) * 26}
              r="7"
              fill={i % 2 === 0 ? colors[1] : colors[3]}
              opacity="0.85"
            />
          ))}
        <circle r="18" fill={colors[0]} />
        <circle r="12" fill="none" stroke={IVORY} strokeWidth="1" opacity="0.7" strokeDasharray="2 3" />
        <circle r="6" fill={colors[1]} />
        <circle r="2.4" fill={IVORY} />
      </g>
    </svg>
  );
}

export function Peacock({ className }: { className?: string }) {
  const feathers = [-78, -58, -39, -20, 0, 20, 39, 58, 78];
  return (
    <svg viewBox="0 0 360 360" className={className} aria-hidden="true">
      <g transform="translate(180 268)">
        {feathers.map((angle, index) => (
          <g key={angle} transform={`rotate(${angle})`}>
            <ellipse
              cx="0"
              cy="-104"
              rx="19"
              ry="86"
              fill={index % 2 === 0 ? TEAL : "#0a6a6f"}
              opacity="0.92"
            />
            <ellipse cx="0" cy="-86" rx="13" ry="66" fill={SAFFRON} opacity="0.28" />
            <circle cx="0" cy="-172" r="15" fill={INDIGO} />
            <circle cx="0" cy="-172" r="10" fill={TEAL} />
            <circle cx="0" cy="-172" r="5.5" fill={SAFFRON} />
            <circle cx="0" cy="-172" r="2" fill={MAROON} />
          </g>
        ))}

        <ellipse cx="0" cy="-10" rx="34" ry="52" fill={TEAL} />
        <ellipse cx="0" cy="-6" rx="24" ry="42" fill="#0a6a6f" opacity="0.8" />
        <path d="M-4,-44 C-22,-76 -18,-104 -6,-122 C2,-136 16,-132 18,-116 C20,-100 8,-88 6,-72 L6,-46 Z" fill={TEAL} />
        <path d="M6,-46 C10,-70 18,-84 20,-100" stroke={SAFFRON} strokeWidth="2" fill="none" opacity="0.6" />
        <circle cx="12" cy="-126" r="15" fill={TEAL} />
        <circle cx="16" cy="-128" r="2.6" fill={IVORY} />
        <circle cx="17" cy="-128.5" r="1.2" fill="#292322" />
        <path d="M26,-128 L40,-124 L26,-119 Z" fill={SAFFRON} />
        <path d="M12,-140 L8,-152 M12,-140 L14,-154 M12,-140 L19,-151" stroke={SAFFRON} strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="8" cy="-154" r="2.6" fill={RANI} />
        <circle cx="14" cy="-156" r="2.2" fill={SAFFRON} />
        <circle cx="19" cy="-153" r="2" fill={TEAL} />
        <path d="M-14,34 L-14,52 M10,34 L10,52" stroke={MAROON} strokeWidth="3" strokeLinecap="round" />
        <path d="M-20,52 L-8,52 M4,52 L16,52" stroke={MAROON} strokeWidth="2" strokeLinecap="round" />
        <path d="M-30,-24 C-46,-16 -52,-4 -54,10" stroke={SAFFRON} strokeWidth="2" fill="none" opacity="0.5" />
      </g>
    </svg>
  );
}

export function Divider({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 520 40" className={className} aria-hidden="true">
      <path d="M0 20 H190" stroke={MAROON} strokeWidth="1" opacity="0.28" />
      <path d="M330 20 H520" stroke={MAROON} strokeWidth="1" opacity="0.28" />
      <g transform="translate(260 20)">
        {[0, 45, 90, 135, 180, 225, 315].map((angle) => (
          <ellipse
            key={angle}
            cx="0"
            cy="-11"
            rx="5"
            ry="10"
            fill={angle % 90 === 0 ? SAFFRON : MAROON}
            opacity={angle % 90 === 0 ? 0.9 : 0.55}
            transform={`rotate(${angle})`}
          />
        ))}
        <circle r="4" fill={TEAL} />
      </g>
      <circle cx="216" cy="20" r="2.4" fill={TEAL} opacity="0.7" />
      <circle cx="234" cy="20" r="1.6" fill={SAFFRON} />
      <circle cx="304" cy="20" r="2.4" fill={TEAL} opacity="0.7" />
      <circle cx="286" cy="20" r="1.6" fill={SAFFRON} />
    </svg>
  );
}

/** Fine running border used along the top and bottom of editorial panels. */
export function VineBorder({ className, color = MAROON }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 1200 32" className={className} preserveAspectRatio="none" aria-hidden="true">
      <path
        d="M0 22 C40 6 80 38 120 22 C160 6 200 38 240 22 C280 6 320 38 360 22 C400 6 440 38 480 22 C520 6 560 38 600 22 C640 6 680 38 720 22 C760 6 800 38 840 22 C880 6 920 38 960 22 C1000 6 1040 38 1080 22 C1120 6 1160 38 1200 22"
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        opacity="0.42"
      />
      {Array.from({ length: 30 }).map((_, i) => (
        <circle
          key={i}
          cx={i * 40 + 20}
          cy={i % 2 === 0 ? 12 : 32}
          r={i % 3 === 0 ? 3 : 2}
          fill={i % 2 === 0 ? SAFFRON : color}
          opacity="0.5"
        />
      ))}
    </svg>
  );
}

export function CornerFlourish({ className, color = GOLD }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <g fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round">
        <path d="M2 2 H34 M2 2 V34" />
        <path d="M8 8 C30 8 46 22 46 44" opacity="0.7" />
        <path d="M8 8 C8 30 22 46 44 46" opacity="0.5" />
        <path d="M26 8 C34 16 34 22 28 26 C22 30 16 26 16 20 C16 15 21 12 25 15" opacity="0.8" />
        <circle cx="49" cy="49" r="2.2" fill={color} stroke="none" />
      </g>
    </svg>
  );
}

/** Small woven swatch used in fabric and palette pickers. */
export function Swatch({
  color,
  pattern = "none",
  className,
}: {
  color: string;
  pattern?: "none" | "dots" | "diagonal" | "grid";
  className?: string;
}) {
  return (
    <svg viewBox="0 0 60 60" className={className} aria-hidden="true">
      <rect width="60" height="60" rx="10" fill={color} />
      {pattern === "dots" &&
        Array.from({ length: 16 }).map((_, i) => (
          <circle
            key={i}
            cx={(i % 4) * 16 + 8}
            cy={Math.floor(i / 4) * 16 + 8}
            r="1.8"
            fill="#fff9ef"
            opacity="0.45"
          />
        ))}
      {pattern === "diagonal" &&
        Array.from({ length: 6 }).map((_, i) => (
          <path key={i} d={`M${-20 + i * 16} 60 L${10 + i * 16} 0`} stroke="#fff9ef" strokeWidth="2" opacity="0.22" />
        ))}
      {pattern === "grid" && (
        <g stroke="#fff9ef" strokeWidth="1.2" opacity="0.28">
          {[15, 30, 45].map((v) => (
            <g key={v}>
              <path d={`M${v} 0 V60`} />
              <path d={`M0 ${v} H60`} />
            </g>
          ))}
        </g>
      )}
      <rect x="0.75" y="0.75" width="58.5" height="58.5" rx="9.5" fill="none" stroke="#292322" strokeOpacity="0.18" />
    </svg>
  );
}

export { GOLD, MAROON, SAFFRON, TEAL, RANI, INDIGO, VERMILION, IVORY };
