import { nameColor, rgbToHsl, rgbToHex } from "@/lib/craft-engine";
import type { ExtractedColor } from "@/lib/design-types";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/avif"];

export type ImageSignals = {
  palette: ExtractedColor[];
  brightness: number;
  saturation: number;
  contrast: number;
  edgeDensity: number;
  symmetry: number;
  aspectRatio: number;
  dominantWarmth: "warm" | "cool" | "neutral";
};

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Use a PNG, JPG, WebP or AVIF image.";
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return "That image is larger than 8 MB. Try a smaller export.";
  }
  if (file.size === 0) return "That file is empty.";
  return null;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That image could not be read. Try another file."));
    };
    image.src = url;
  });
}

/**
 * Measures the uploaded image in the browser. These are real pixel statistics —
 * labelled in the UI as measurements, never as a model's interpretation.
 */
export async function analyseImage(file: File): Promise<ImageSignals> {
  const image = await loadImage(file);
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas is unavailable in this browser.");

  // Cover-crop into a square so palette weights are not distorted by aspect.
  const sourceSize = Math.min(image.width, image.height);
  const sx = (image.width - sourceSize) / 2;
  const sy = (image.height - sourceSize) / 2;
  ctx.drawImage(image, sx, sy, sourceSize, sourceSize, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  const buckets = new Map<string, { r: number; g: number; b: number; count: number }>();
  let brightnessSum = 0;
  let saturationSum = 0;
  let warmthSum = 0;
  let pixels = 0;
  const grey = new Float32Array(size * size);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = (y * size + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const a = data[index + 3] / 255;
      if (a < 0.4) {
        grey[y * size + x] = 255;
        continue;
      }
      grey[y * size + x] = 0.299 * r + 0.587 * g + 0.114 * b;

      const key = `${r >> 5}-${g >> 5}-${b >> 5}`;
      const bucket = buckets.get(key) ?? { r: 0, g: 0, b: 0, count: 0 };
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
      bucket.count += 1;
      buckets.set(key, bucket);

      const { s, l } = rgbToHsl(r, g, b);
      brightnessSum += l;
      saturationSum += s;
      warmthSum += r - b;
      pixels += 1;
    }
  }

  const palette: ExtractedColor[] = Array.from(buckets.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 14)
    .map((bucket) => {
      const r = bucket.r / bucket.count;
      const g = bucket.g / bucket.count;
      const b = bucket.b / bucket.count;
      return {
        hex: rgbToHex(r, g, b),
        share: bucket.count / Math.max(pixels, 1),
        name: nameColor(rgbToHex(r, g, b)),
      };
    })
    .filter((entry, index, list) => {
      // Drop near-duplicates so the palette reads as distinct choices.
      return list.findIndex((other) => colorDistance(other.hex, entry.hex) < 34) === index;
    })
    .slice(0, 6);

  // Edge density → a complexity hint (an actual measurement, not a guess).
  let edges = 0;
  let comparisons = 0;
  for (let y = 1; y < size; y += 1) {
    for (let x = 1; x < size; x += 1) {
      const center = grey[y * size + x];
      const dx = Math.abs(center - grey[y * size + (x - 1)]);
      const dy = Math.abs(center - grey[(y - 1) * size + x]);
      if (dx + dy > 42) edges += 1;
      comparisons += 1;
    }
  }

  let symmetryDiff = 0;
  let symmetryCount = 0;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size / 2; x += 1) {
      symmetryDiff += Math.abs(grey[y * size + x] - grey[y * size + (size - 1 - x)]);
      symmetryCount += 1;
    }
  }
  const symmetry = 1 - symmetryDiff / (symmetryCount * 255);

  let variance = 0;
  const mean = brightnessSum / Math.max(pixels, 1);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      variance += ((grey[y * size + x] / 255) - mean) ** 2;
    }
  }

  const warmthIndex = warmthSum / Math.max(pixels, 1);

  return {
    palette,
    brightness: Math.round(mean * 100),
    saturation: Math.round((saturationSum / Math.max(pixels, 1)) * 100),
    contrast: Math.round(Math.sqrt(variance / (size * size)) * 100),
    edgeDensity: Math.round((edges / Math.max(comparisons, 1)) * 100),
    symmetry: Math.round(symmetry * 100),
    aspectRatio: Math.round((image.width / image.height) * 100) / 100,
    dominantWarmth: warmthIndex > 12 ? "warm" : warmthIndex < -12 ? "cool" : "neutral",
  };
}

export function colorDistance(a: string, b: string) {
  const pa = parseInt(a.replace("#", ""), 16);
  const pb = parseInt(b.replace("#", ""), 16);
  const ar = (pa >> 16) & 255;
  const ag = (pa >> 8) & 255;
  const ab = pa & 255;
  const br = (pb >> 16) & 255;
  const bg = (pb >> 8) & 255;
  const bb = pb & 255;
  return Math.sqrt((ar - br) ** 2 * 0.3 + (ag - bg) ** 2 * 0.59 + (ab - bb) ** 2 * 0.11);
}
