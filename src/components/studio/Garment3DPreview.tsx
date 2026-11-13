import { GarmentArt } from "@/components/art/garments";
import { Button } from "@/components/ui/button";
import type { CanvasState, DesignLayer } from "@/lib/design-types";
import { OrbitControls, RoundedBox, ContactShadows, Decal } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { ArrowLeftRight, Box, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";

type View = "front" | "back";

function drawMotif(layer: DesignLayer) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.clearRect(0, 0, 512, 512);
  ctx.strokeStyle = layer.color;
  ctx.fillStyle = layer.color;
  ctx.lineWidth = 11;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const c = 256;

  if (layer.kind === "text") {
    ctx.font = "600 86px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText((layer.text || "KALकारी").slice(0, 14), c, c);
    return canvas;
  }

  switch (layer.motifId) {
    case "lotus":
      for (let i = 0; i < 9; i++) {
        const angle = -Math.PI / 2 + (i - 4) * 0.28;
        ctx.beginPath();
        ctx.ellipse(c + Math.cos(angle) * 88, c + Math.sin(angle) * 88, 34, 112, angle + Math.PI / 2, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(c, c, 34, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case "fish":
      ctx.beginPath();
      ctx.ellipse(c - 58, c, 96, 46, 0, 0, Math.PI * 2);
      ctx.ellipse(c + 58, c, 96, 46, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(c - 152, c);
      ctx.lineTo(c - 208, c - 44);
      ctx.lineTo(c - 208, c + 44);
      ctx.closePath();
      ctx.stroke();
      break;
    case "paisley":
      ctx.beginPath();
      ctx.moveTo(c, c + 150);
      ctx.bezierCurveTo(c - 180, c + 30, c - 98, c - 150, c + 24, c - 130);
      ctx.bezierCurveTo(c + 154, c - 108, c + 138, c + 74, c - 12, c + 42);
      ctx.stroke();
      break;
    case "marigold":
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(c + Math.cos(angle) * 92, c + Math.sin(angle) * 92, 28, 64, angle, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    case "warli":
      for (let i = 0; i < 3; i++) {
        const x = c + (i - 1) * 120;
        ctx.beginPath();
        ctx.moveTo(x, c - 142);
        ctx.lineTo(x - 55, c + 70);
        ctx.lineTo(x + 55, c + 70);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, c - 150, 28, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    case "tree":
      ctx.beginPath();
      ctx.moveTo(c, c + 180);
      ctx.lineTo(c, c - 130);
      for (let i = 0; i < 5; i++) {
        const y = c + 100 - i * 56;
        ctx.moveTo(c, y);
        ctx.quadraticCurveTo(c - 70, y - 40, c - 130, y - 74);
        ctx.moveTo(c, y);
        ctx.quadraticCurveTo(c + 70, y - 40, c + 130, y - 74);
      }
      ctx.stroke();
      break;
    case "mirror":
      for (let r = 1; r <= 3; r++) {
        ctx.beginPath();
        ctx.moveTo(c, c - r * 56);
        ctx.lineTo(c + r * 56, c);
        ctx.lineTo(c, c + r * 56);
        ctx.lineTo(c - r * 56, c);
        ctx.closePath();
        ctx.stroke();
      }
      break;
    case "border":
      for (let i = 0; i < 6; i++) {
        const x = 52 + i * 82;
        ctx.beginPath();
        ctx.moveTo(x, 180);
        ctx.lineTo(x + 34, 256);
        ctx.lineTo(x, 332);
        ctx.lineTo(x - 34, 256);
        ctx.closePath();
        ctx.stroke();
      }
      break;
    default:
      for (let r = 1; r <= 6; r++) {
        ctx.beginPath();
        ctx.arc(c, c, r * 34, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(c + Math.cos(angle) * 104, c + Math.sin(angle) * 104, 20, 48, angle, 0, Math.PI * 2);
        ctx.stroke();
      }
  }
  return canvas;
}

function MotifSurface({ layer }: { layer: DesignLayer }) {
  const texture = useMemo(() => {
    const canvas = drawMotif(layer);
    if (!canvas) return null;
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.needsUpdate = true;
    return map;
  }, [layer]);

  if (!texture) return null;
  const x = ((layer.x - 450) / 450) * 0.44;
  const y = ((450 - layer.y) / 450) * 0.58;
  const scale = Math.max(0.12, (layer.size / 900) * 0.75);
  return (
    <Decal
      position={[x, y, 0.19]}
      rotation={[0, 0, (-layer.rotation * Math.PI) / 180]}
      scale={[scale, scale, 0.24]}
      polygonOffsetFactor={-4}
    >
      <meshBasicMaterial map={texture} transparent opacity={layer.opacity} toneMapped={false} />
    </Decal>
  );
}

function SurfaceMotifs({ layers }: { layers: DesignLayer[] }) {
  return <>{layers.slice(0, 6).map((layer) => <MotifSurface key={layer.id} layer={layer} />)}</>;
}

function Jacket({ color, layers }: { color: string; layers: DesignLayer[] }) {
  return (
    <group>
      <RoundedBox args={[1.42, 1.92, 0.36]} radius={0.09} smoothness={4} position={[0, 0.08, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={0.82} metalness={0.02} />
        <SurfaceMotifs layers={layers} />
      </RoundedBox>
      <RoundedBox args={[0.4, 1.52, 0.34]} radius={0.08} smoothness={4} position={[-0.91, 0.12, 0]} rotation={[0, 0, 0.16]} castShadow>
        <meshStandardMaterial color={color} roughness={0.84} metalness={0.02} />
      </RoundedBox>
      <RoundedBox args={[0.4, 1.52, 0.34]} radius={0.08} smoothness={4} position={[0.91, 0.12, 0]} rotation={[0, 0, -0.16]} castShadow>
        <meshStandardMaterial color={color} roughness={0.84} metalness={0.02} />
      </RoundedBox>
      <mesh position={[0, 1.02, 0.19]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.27, 0.07, 12, 32, Math.PI]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.58, 0.2]} castShadow>
        <boxGeometry args={[0.055, 0.92, 0.03]} />
        <meshStandardMaterial color="#d8a65b" roughness={0.55} metalness={0.2} />
      </mesh>
      {[0.04, -0.16, -0.36].map((y) => (
        <mesh key={y} position={[0, y, 0.215]} castShadow>
          <sphereGeometry args={[0.032, 12, 12]} />
          <meshStandardMaterial color="#a78a58" metalness={0.55} roughness={0.35} />
        </mesh>
      ))}
    </group>
  );
}

function Tee({ color, layers }: { color: string; layers: DesignLayer[] }) {
  return (
    <group>
      <RoundedBox args={[1.52, 1.62, 0.28]} radius={0.1} smoothness={4} position={[0, 0.02, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={0.88} metalness={0} />
        <SurfaceMotifs layers={layers} />
      </RoundedBox>
      <RoundedBox args={[0.46, 0.5, 0.27]} radius={0.08} smoothness={4} position={[-0.94, 0.55, 0]} rotation={[0, 0, 0.55]} castShadow>
        <meshStandardMaterial color={color} roughness={0.9} metalness={0} />
      </RoundedBox>
      <RoundedBox args={[0.46, 0.5, 0.27]} radius={0.08} smoothness={4} position={[0.94, 0.55, 0]} rotation={[0, 0, -0.55]} castShadow>
        <meshStandardMaterial color={color} roughness={0.9} metalness={0} />
      </RoundedBox>
      <mesh position={[0, 0.88, 0.15]} rotation={[0, 0, 0]} castShadow>
        <torusGeometry args={[0.25, 0.045, 12, 36]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
    </group>
  );
}

function Tote({ color, layers }: { color: string; layers: DesignLayer[] }) {
  return (
    <group>
      <RoundedBox args={[1.48, 1.55, 0.38]} radius={0.06} smoothness={4} position={[0, -0.18, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={0.86} metalness={0.01} />
        <SurfaceMotifs layers={layers} />
      </RoundedBox>
      {[-0.36, 0.36].map((x) => (
        <mesh key={x} position={[x, 0.78, 0]} rotation={[0, 0, 0]} castShadow>
          <torusGeometry args={[0.34, 0.055, 12, 40, Math.PI]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, -0.88, 0.2]} castShadow>
        <boxGeometry args={[1.2, 0.025, 0.02]} />
        <meshStandardMaterial color="#7a302a" roughness={0.7} />
      </mesh>
    </group>
  );
}

function CameraSync({ view, resetKey }: { view: View; resetKey: number }) {
  const { camera } = useThree();
  useEffect(() => {
    const z = view === "front" ? 4.3 : -4.3;
    camera.position.set(0, 0.15, z);
    camera.lookAt(0, 0.05, 0);
    camera.updateProjectionMatrix();
  }, [camera, view, resetKey]);
  return null;
}

const SUPPORTED = new Set(["jacket", "tshirt", "tote"]);

export default function Garment3DPreview({
  canvas,
  className = "",
}: {
  canvas: CanvasState;
  className?: string;
}) {
  const [supported] = useState<boolean>(() => {
    try {
      const probe = document.createElement("canvas");
      return Boolean(probe.getContext("webgl2") || probe.getContext("webgl"));
    } catch {
      return false;
    }
  });
  const [view, setView] = useState<View>("front");
  const [resetKey, setResetKey] = useState(0);

  if (!supported || !SUPPORTED.has(canvas.productType)) {
    return (
      <div className={`relative overflow-hidden rounded-xl border border-maroon/20 bg-[#fbf6eb] ${className}`}>
        <GarmentArt canvas={canvas} className="h-auto w-full" />
        <p className="absolute bottom-3 left-3 rounded-full border border-maroon/20 bg-ivory/90 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-maroon">
          {supported ? "2D placement preview · 3D model not available for this product" : "2D fallback · WebGL unavailable"}
        </p>
      </div>
    );
  }

  const motifs = canvas.layers.filter((layer) => layer.kind === "motif" || layer.kind === "text");

  return (
    <div className={`relative overflow-hidden rounded-xl border border-maroon/20 bg-[radial-gradient(circle_at_50%_25%,#fff9ee,#ede0ca)] ${className}`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-3">
        <span className="rounded-full border border-gold/40 bg-ivory/85 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-maroon">
          <Box className="mr-1 inline size-3" /> Interactive 3D
        </span>
        <span className="rounded-full border border-emerald/20 bg-emerald/[0.08] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-emerald">
          Surface-attached motifs
        </span>
      </div>

      <div className="h-[min(62vw,560px)] min-h-[380px] w-full touch-none">
        <Canvas shadows dpr={[1, 1.75]} camera={{ position: [0, 0.15, 4.3], fov: 38 }} gl={{ alpha: true, antialias: true }}>
          <ambientLight intensity={1.35} />
          <directionalLight position={[3.5, 5, 4]} intensity={2.2} castShadow shadow-mapSize={[1024, 1024]} />
          <directionalLight position={[-4, 1.5, -3]} intensity={0.8} color="#d8a65b" />
          <CameraSync view={view} resetKey={resetKey} />
          {canvas.productType === "tshirt" ? (
            <Tee color={canvas.fabricColor} layers={motifs} />
          ) : canvas.productType === "tote" ? (
            <Tote color={canvas.fabricColor} layers={motifs} />
          ) : (
            <Jacket color={canvas.fabricColor} layers={motifs} />
          )}
          <ContactShadows position={[0, -1.24, 0]} opacity={0.38} scale={6} blur={2.4} far={4} color="#5b3a2e" />
          <OrbitControls
            key={`${view}-${resetKey}`}
            makeDefault
            enablePan={false}
            enableDamping
            minDistance={2.8}
            maxDistance={6.8}
            target={[0, 0.05, 0]}
          />
        </Canvas>
      </div>

      {motifs.length === 0 && (
        <p className="pointer-events-none absolute inset-x-0 bottom-16 text-center text-[11px] text-maroon/50">
          Add a motif to preview it on the garment surface.
        </p>
      )}

      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-center justify-between gap-2 border-t border-maroon/12 bg-ivory/80 p-2.5 backdrop-blur-sm">
        <div className="flex items-center gap-1.5">
          <Button variant={view === "front" ? "default" : "outline"} size="sm" className={`h-7 rounded-full px-3 text-[10px] ${view === "front" ? "bg-maroon text-ivory" : "border-maroon/20 text-maroon"}`} onClick={() => setView("front")}>
            Front
          </Button>
          <Button variant={view === "back" ? "default" : "outline"} size="sm" className={`h-7 rounded-full px-3 text-[10px] ${view === "back" ? "bg-maroon text-ivory" : "border-maroon/20 text-maroon"}`} onClick={() => setView("back")}>
            Back
          </Button>
          <Button variant="ghost" size="sm" className="h-7 gap-1 rounded-full px-2 text-[10px] text-maroon/65" onClick={() => setResetKey((value) => value + 1)}>
            <RotateCcw className="size-3" /> Reset
          </Button>
        </div>
        <span className="flex items-center gap-1 text-[9px] uppercase tracking-[0.08em] text-ink/45">
          <ArrowLeftRight className="size-3" /> Drag to rotate · scroll to zoom
        </span>
      </div>
    </div>
  );
}
