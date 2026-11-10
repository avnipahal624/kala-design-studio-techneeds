import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

export type UploadedImage = {
  storageId: Id<"_storage">;
  name?: string;
  contentType?: string;
  size?: number;
  previewUrl: string;
};

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024;

export function UploadImages({
  value,
  onChange,
  max = 4,
  label = "Add photos",
  hint = "PNG, JPG or WebP · up to 8 MB each. Stored privately in your account.",
}: {
  value: UploadedImage[];
  onChange: (next: UploadedImage[]) => void;
  max?: number;
  label?: string;
  hint?: string;
}) {
  const generateUploadUrl = useMutation(api.uploads.generateUploadUrl);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    const remaining = max - value.length;
    const chosen = Array.from(files).slice(0, Math.max(0, remaining));
    if (chosen.length === 0) {
      setError(`You can attach up to ${max} images.`);
      return;
    }
    setBusy(true);
    const uploaded: UploadedImage[] = [];
    try {
      for (const file of chosen) {
        if (!ALLOWED.includes(file.type)) {
          setError("Only PNG, JPG and WebP images are supported.");
          continue;
        }
        if (file.size > MAX_BYTES) {
          setError("Each image must be 8 MB or smaller.");
          continue;
        }
        const url = await generateUploadUrl();
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!response.ok) throw new Error("Upload failed");
        const result = (await response.json()) as { storageId: Id<"_storage"> };
        uploaded.push({
          storageId: result.storageId,
          name: file.name,
          contentType: file.type,
          size: file.size,
          previewUrl: URL.createObjectURL(file),
        });
      }
      if (uploaded.length > 0) onChange([...value, ...uploaded]);
    } catch {
      setError("That upload did not finish. Check the file and try again.");
      toast.error("Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(index: number) {
    const target = value[index];
    if (target?.previewUrl.startsWith("blob:")) URL.revokeObjectURL(target.previewUrl);
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {value.map((image, index) => (
          <div key={image.storageId} className="group relative size-20 overflow-hidden rounded-lg border border-maroon/20 bg-muted">
            <img src={image.previewUrl} alt={image.name ?? "Uploaded product"} className="size-full object-cover" />
            <button
              type="button"
              onClick={() => remove(index)}
              aria-label={`Remove ${image.name ?? "image"}`}
              className="absolute right-1 top-1 rounded-full bg-ink/70 p-0.5 text-ivory opacity-90 transition hover:bg-vermilion"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
        {value.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex size-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-maroon/30 bg-card text-maroon/70 transition hover:border-maroon/60 hover:text-maroon disabled:opacity-50"
          >
            {busy ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
            <span className="text-[10px] font-medium">{value.length}/{max}</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED.join(",")}
        multiple={max > 1}
        className="sr-only"
        onChange={(event) => void handleFiles(event.target.files)}
      />
      <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
        {busy ? "Uploading…" : hint} <span className="font-medium text-ink/60">{label}</span>
      </p>
      {error && <p className="mt-1 text-xs text-vermilion">{error}</p>}
    </div>
  );
}
