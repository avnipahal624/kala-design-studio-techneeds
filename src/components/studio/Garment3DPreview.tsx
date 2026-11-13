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

function MotifSurface({ layer, side = "front" }: { layer: DesignLayer; side?: "left" | "right" | "front" }) {
  const texture = useMemo(() => {
    const canvas = drawMotif(layer);
    if (!canvas) return null;
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.needsUpdate = true;
    return map;
  }, [layer]);

  if (!texture) return null;
  const rawX = ((layer.x - 450) / 450) * 0.68;
  const x = side === "left" ? Math.min(-0.07, rawX) : side === "right" ? Math.max(0.07, rawX) : rawX;
  const y = ((450 - layer.y) / 450) * 0.7;
  const scale = Math.max(0.12, (layer.size / 900) * 0.78);
  return (
    <Decal
      position={[x, y, 0.205]}
      rotation={[0, 0, (-layer.rotation * Math.PI) / 180]}
      scale={[scale, scale, 0.24]}
      polygonOffsetFactor={-4}
    >
      <meshBasicMaterial map={texture} transparent opacity={layer.opacity} toneMapped={false} />
    </Decal>
  );
}

function SurfaceMotifs({ layers, side = "front" }: { layers: DesignLayer[]; side?: "left" | "right" | "front" }) {
  const sideLayers = side === "left"
    ? layers.filter((layer) => layer.x < 450)
    : side === "right"
      ? layers.filter((layer) => layer.x >= 450)
      : layers;
  return <>{sideLayers.slice(0, 6).map((layer) => <MotifSurface key={layer.id} layer={layer} side={side} />)}</>;
}

function makeFabricBump() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 128; i += 4) {
    const alpha = 0.06 + (Math.sin(i * 0.9) + 1) * 0.015;
    ctx.strokeStyle = `rgba(40,35,31,${alpha})`;
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 128);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(128, i);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 5);
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

function ClothMaterial({ color, back = false }: { color: string; back?: boolean }) {
  const bump = useMemo(() => makeFabricBump(), []);
  return (
    <meshPhysicalMaterial
      color={color}
      roughness={0.86}
      metalness={0.015}
      sheen={0.28}
      sheenColor="#d8a65b"
      sheenRoughness={0.8}
      bumpMap={bump ?? undefined}
      bumpScale={0.006}
      side={back ? THREE.DoubleSide : THREE.FrontSide}
    />
  );
}

function panelGeometry({
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
  height = 1.82,
  depth = 0.2,
  front = true,
  shoulderDrop = 0.045,
}: {
  topLeft: number;
  topRight: number;
  bottomLeft: number;
  bottomRight: number;
  height?: number;
  depth?: number;
  front?: boolean;
  shoulderDrop?: number;
}) {
  const cols = 22;
  const rows = 30;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let row = 0; row <= rows; row++) {
    const v = row / rows;
    const y = -height / 2 + v * height;
    const left = topLeft + (bottomLeft - topLeft) * v;
    const right = topRight + (bottomRight - topRight) * v;
    for (let col = 0; col <= cols; col++) {
      const u = col / cols;
      const x = left + (right - left) * u;
      const shoulder = (1 - v) * shoulderDrop * Math.abs(u - 0.5) * 2;
      const drape = Math.sin(u * Math.PI) * depth * (0.45 + v * 0.55);
      positions.push(x, y - shoulder, (front ? 1 : -1) * drape);
      uvs.push(u, v);
    }
  }
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const a = row * (cols + 1) + col;
      const b = a + 1;
      const c = a + cols + 1;
      const d = c + 1;
      if (front) indices.push(a, c, b, b, c, d);
      else indices.push(a, b, c, b, d, c);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function seamGeometry(points: [number, number, number][]) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  return new THREE.TubeGeometry(curve, 28, 0.012, 6, false);
}

function GoldSeam({ points }: { points: [number, number, number][] }) {
  const geometry = useMemo(() => seamGeometry(points), [points]);
  return (
    <mesh geometry={geometry} castShadow>
      <meshStandardMaterial color="#c69a57" roughness={0.55} metalness={0.18} />
    </mesh>
  );
}

function Jacket({ color, layers }: { color: string; layers: DesignLayer[] }) {
  const left = useMemo(() => panelGeometry({ topLeft: -0.72, topRight: -0.045, bottomLeft: -0.8, bottomRight: -0.06, height: 1.82, depth: 0.2 }), []);
  const right = useMemo(() => panelGeometry({ topLeft: 0.045, topRight: 0.72, bottomLeft: 0.06, bottomRight: 0.8, height: 1.82, depth: 0.2 }), []);
  const back = useMemo(() => panelGeometry({ topLeft: -0.72, topRight: 0.72, bottomLeft: -0.8, bottomRight: 0.8, height: 1.82, depth: 0.16, front: false }), []);
  return (
    <group>
      <mesh geometry={left} castShadow receiveShadow>
        <ClothMaterial color={color} back />
        <SurfaceMotifs layers={layers} side="left" />
      </mesh>
      <mesh geometry={right} castShadow receiveShadow>
        <ClothMaterial color={color} back />
        <SurfaceMotifs layers={layers} side="right" />
      </mesh>
      <mesh geometry={back} castShadow receiveShadow>
        <ClothMaterial color={color} back />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 0.82, 0.12, -0.01]} rotation={[0, 0, side * 0.34]} castShadow>
            <cylinderGeometry args={[0.19, 0.245, 1.2, 28, 1, true]} />
            <ClothMaterial color={color} back />
          </mesh>
          <mesh position={[side * 0.98, -0.46, -0.01]} rotation={[0, 0, side * 0.34]} castShadow>
            <torusGeometry args={[0.2, 0.016, 8, 28]} />
            <meshStandardMaterial color="#c69a57" roughness={0.55} metalness={0.2} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.91, 0.01]} castShadow>
        <cylinderGeometry args={[0.265, 0.3, 0.17, 32, 1, true]} />
        <ClothMaterial color={color} back />
      </mesh>
      <mesh position={[0, 1.0, 0.01]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.275, 0.018, 8, 40]} />
        <meshStandardMaterial color="#c69a57" roughness={0.55} metalness={0.18} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.15, 0.57, 0.195]} rotation={[0, 0, side * 0.16]} castShadow>
          <boxGeometry args={[0.16, 0.62, 0.035]} />
          <meshStandardMaterial color={color} roughness={0.78} side={THREE.DoubleSide} />
        </mesh>
      ))}
      <GoldSeam points={[[-0.055, -0.9, 0.16], [-0.05, -0.35, 0.195], [-0.045, 0.2, 0.205], [-0.045, 0.78, 0.18]]} />
      <GoldSeam points={[[0.055, -0.9, 0.16], [0.05, -0.35, 0.195], [0.045, 0.2, 0.205], [0.045, 0.78, 0.18]]} />
      <GoldSeam points={[[-0.8, -0.88, 0.08], [-0.4, -0.91, 0.18], [0, -0.92, 0.2], [0.4, -0.91, 0.18], [0.8, -0.88, 0.08]]} />
      {[0.18, -0.04, -0.26].map((y) => (
        <mesh key={y} position={[0.04, y, 0.215]} castShadow>
          <sphereGeometry args={[0.028, 12, 12]} />
          <meshStandardMaterial color="#a78a58" metalness={0.55} roughness={0.35} />
        </mesh>
      ))}
    </group>
  );
}

function Tee({ color, layers }: { color: string; layers: DesignLayer[] }) {
  const left = useMemo(() => panelGeometry({ topLeft: -0.74, topRight: -0.035, bottomLeft: -0.73, bottomRight: -0.05, height: 1.5, depth: 0.16, shoulderDrop: 0.03 }), []);
  const right = useMemo(() => panelGeometry({ topLeft: 0.035, topRight: 0.74, bottomLeft: 0.05, bottomRight: 0.73, height: 1.5, depth: 0.16, shoulderDrop: 0.03 }), []);
  const back = useMemo(() => panelGeometry({ topLeft: -0.74, topRight: 0.74, bottomLeft: -0.73, bottomRight: 0.73, height: 1.5, depth: 0.13, front: false, shoulderDrop: 0.03 }), []);
  return (
    <group>
      <mesh geometry={left} castShadow receiveShadow>
        <ClothMaterial color={color} back />
        <SurfaceMotifs layers={layers} side="left" />
      </mesh>
      <mesh geometry={right} castShadow receiveShadow>
        <ClothMaterial color={color} back />
        <SurfaceMotifs layers={layers} side="right" />
      </mesh>
      <mesh geometry={back} castShadow receiveShadow>
        <ClothMaterial color={color} back />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.83, 0.43, 0]} rotation={[0, 0, side * 0.72]} castShadow>
          <cylinderGeometry args={[0.2, 0.23, 0.56, 24, 1, true]} />
          <ClothMaterial color={color} back />
        </mesh>
      ))}
      <mesh position={[0, 0.76, 0.06]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.255, 0.026, 10, 44]} />
        <meshStandardMaterial color={color} roughness={0.88} />
      </mesh>
      <GoldSeam points={[[-0.72, -0.733, 0.1], [-0.36, -0.75, 0.17], [0, -0.755, 0.18], [0.36, -0.75, 0.17], [0.72, -0.733, 0.1]]} />
    </group>
  );
}

function Tote({ color, layers }: { color: string; layers: DesignLayer[] }) {
  const handle = (side: number) => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.35, 0.58, 0.04),
      new THREE.Vector3(side * 0.42, 0.9, 0.04),
      new THREE.Vector3(side * 0.34, 1.06, 0.04),
      new THREE.Vector3(side * 0.25, 1.07, 0.04),
      new THREE.Vector3(side * 0.22, 0.88, 0.04),
      new THREE.Vector3(side * 0.22, 0.58, 0.04),
    ]);
    return new THREE.TubeGeometry(curve, 24, 0.038, 8, false);
  };
  const handles = useMemo(() => [handle(-1), handle(1)], []);
  return (
    <group>
      <RoundedBox args={[1.5, 1.5, 0.38]} radius={0.05} smoothness={4} position={[0, -0.2, 0]} castShadow receiveShadow>
        <ClothMaterial color={color} back />
        <SurfaceMotifs layers={layers} />
      </RoundedBox>
      {handles.map((geometry, index) => (
        <mesh key={index} geometry={geometry} castShadow>
          <ClothMaterial color={color} back />
        </mesh>
      ))}
      <mesh position={[0, 0.5, 0.2]} castShadow>
        <boxGeometry args={[1.42, 0.035, 0.02]} />
        <meshStandardMaterial color="#7a302a" roughness={0.7} />
      </mesh>
      <mesh position={[0, -0.92, 0.2]} castShadow>
        <boxGeometry args={[1.3, 0.025, 0.02]} />
        <meshStandardMaterial color="#c69a57" roughness={0.6} metalness={0.12} />
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
