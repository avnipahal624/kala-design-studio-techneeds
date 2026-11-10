import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Languages, Loader2, MessageCircleHeart, Send, Sparkles, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAction, useMutation, useQuery } from "convex/react";

type Language = "en" | "hi" | "hinglish";

const SUGGESTIONS: Record<string, string[]> = {
  customer: [
    "Help me describe a mandala on white sneakers",
    "What should I ask before accepting a quote?",
    "Explain the 8% platform fee",
  ],
  artisan: [
    "Help me write a clear quote description",
    "What should I confirm before starting work?",
    "Translate a customer update into Hindi",
  ],
  admin: [
    "Summarise what KalaProof records contain",
    "Explain the dispute decision options",
    "What evidence should I check in a damage dispute?",
  ],
};

export function KalaSaathiChat({
  role = "customer",
  className,
  compact = false,
}: {
  role?: string;
  className?: string;
  compact?: boolean;
}) {
  const { isAuthenticated } = useAuth();
  const history = useQuery(api.kalasaathiData.history);
  const status = useQuery(api.kalasaathiData.status);
  const ask = useAction(api.kalasaathi.ask);
  const clear = useMutation(api.kalasaathiData.clear);
  const [message, setMessage] = useState("");
  const [language, setLanguage] = useState<Language>("en");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimistic, setOptimistic] = useState<{ role: "user" | "assistant"; body: string }[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [history?.length, optimistic.length, busy]);

  async function send(text: string) {
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    setError(null);
    setMessage("");
    setOptimistic([{ role: "user", body }]);
    try {
      const result = await ask({ message: body, language });
      if (result.status !== "ok") {
        setOptimistic([
          { role: "user", body },
          { role: "assistant", body: result.reply },
        ]);
      } else {
        setOptimistic([]);
      }
    } catch {
      setError("KalaSaathi could not be reached. Your project screens still work normally.");
      setOptimistic([{ role: "user", body }]);
    } finally {
      setBusy(false);
    }
  }

  const suggestions = SUGGESTIONS[role] ?? SUGGESTIONS.customer;

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className="flex items-center justify-between gap-2 border-b border-maroon/12 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-maroon text-ivory">
            <MessageCircleHeart className="size-4" />
          </span>
          <div>
            <p className="font-display text-sm font-semibold leading-tight text-ink">KalaSaathi</p>
            <p className="text-[10px] text-muted-foreground">Your Creative Craft Companion</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <label className="sr-only" htmlFor="saathi-language">Assistant language</label>
          <div className="relative">
            <Languages className="pointer-events-none absolute left-1.5 top-1.5 size-3 text-muted-foreground" />
            <select
              id="saathi-language"
              value={language}
              onChange={(event) => setLanguage(event.target.value as Language)}
              className="h-6 rounded-md border border-maroon/15 bg-card pl-5 pr-1 text-[10px] text-ink/70"
            >
              <option value="en">EN</option>
              <option value="hi">हिं</option>
              <option value="hinglish">Hing</option>
            </select>
          </div>
          {isAuthenticated && (
            <button
              type="button"
              aria-label="Clear conversation"
              className="rounded-md p-1.5 text-muted-foreground transition hover:bg-maroon/5 hover:text-maroon"
              onClick={() => void clear({})}
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {status && !status.configured && (
        <p className="mx-4 mt-3 rounded-lg border border-saffron/40 bg-saffron/10 px-2.5 py-2 text-[11px] leading-relaxed text-[#7a4f10]">
          No AI key is configured. KalaSaathi will say so honestly; briefs, quotes, payments and KalaProof work without it.
        </p>
      )}

      <div className={cn("min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3", compact ? "max-h-[38vh]" : "")}>
        {!isAuthenticated && (
          <div className="rounded-xl border border-maroon/15 bg-ivory/60 p-3 text-xs text-ink/65">
            Sign in to keep a conversation history and let KalaSaathi read your own requests and projects.
          </div>
        )}

        {(history ?? []).length === 0 && optimistic.length === 0 && isAuthenticated && (
          <div className="rounded-xl border border-maroon/15 bg-[radial-gradient(circle_at_20%_10%,#f7d5bb,#fff4de)] p-3">
            <p className="font-display text-sm font-semibold text-maroon">Namaste. What are we making?</p>
            <p className="mt-1 text-[11px] leading-relaxed text-ink/65">
              I can help shape a brief, explain a quote, or suggest what to ask an artisan. I cannot draw the design or move money.
            </p>
          </div>
        )}

        {(history ?? []).map((row) => (
          <div
            key={row._id}
            className={cn(
              "max-w-[92%] whitespace-pre-line rounded-2xl px-3 py-2 text-xs leading-relaxed",
              row.role === "user"
                ? "ml-auto rounded-br-md bg-maroon text-ivory"
                : "rounded-bl-md border border-maroon/12 bg-card text-ink/80",
            )}
          >
            {row.body}
          </div>
        ))}

        {optimistic.map((row, index) => (
          <div
            key={`${row.role}-${index}`}
            className={cn(
              "max-w-[92%] whitespace-pre-line rounded-2xl px-3 py-2 text-xs leading-relaxed",
              row.role === "user"
                ? "ml-auto rounded-br-md bg-maroon text-ivory"
                : "rounded-bl-md border border-maroon/12 bg-card text-ink/80",
            )}
          >
            {row.body}
          </div>
        ))}

        {busy && (
          <div className="flex items-center gap-2 rounded-2xl border border-maroon/12 bg-card px-3 py-2 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" /> KalaSaathi is thinking…
          </div>
        )}
        {error && <p className="text-[11px] text-vermilion">{error}</p>}
        <div ref={endRef} />
      </div>

      {!compact && (
        <div className="flex flex-wrap gap-1.5 border-t border-maroon/10 px-4 py-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => void send(suggestion)}
              disabled={busy || !isAuthenticated}
              className="rounded-full border border-maroon/20 bg-card px-2.5 py-1 text-[10px] text-ink/65 transition hover:border-maroon/45 hover:text-maroon disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <form
        className="border-t border-maroon/12 p-3"
        onSubmit={(event) => {
          event.preventDefault();
          void send(message);
        }}
      >
        <div className="flex items-end gap-2">
          <label className="sr-only" htmlFor="saathi-message">Message KalaSaathi</label>
          <textarea
            id="saathi-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send(message);
              }
            }}
            rows={2}
            maxLength={1000}
            disabled={!isAuthenticated || busy}
            placeholder={isAuthenticated ? "Ask about your brief, quote or KalaProof…" : "Sign in to chat"}
            className="min-h-[44px] flex-1 resize-none rounded-lg border border-maroon/20 bg-parchment px-3 py-2 text-xs text-ink placeholder:text-muted-foreground/70 focus:border-maroon/50 focus:outline-none disabled:opacity-60"
          />
          <Button
            type="submit"
            size="icon"
            disabled={busy || !isAuthenticated || message.trim().length === 0}
            className="size-9 shrink-0 rounded-lg bg-maroon text-ivory hover:bg-maroon-deep"
            aria-label="Send message"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </div>
        <p className="mt-1.5 flex items-center gap-1 text-[9px] leading-snug text-muted-foreground">
          <Sparkles className="size-2.5" />
          AI assistant. It cannot create artwork, pay, accept quotes or change terms. Verify anything important in KalaProof.
        </p>
      </form>
    </div>
  );
}

export function KalaSaathiLauncher({ role = "customer" }: { role?: string }) {
  const [open, setOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const reduce = useReducedMotion();

  if (!isAuthenticated) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full border border-gold/40 bg-maroon px-3.5 py-2.5 text-xs font-semibold text-ivory shadow-[0_14px_30px_-12px_rgba(41,35,34,0.6)] transition hover:bg-maroon-deep md:bottom-6"
        aria-label="Open KalaSaathi assistant"
      >
        <MessageCircleHeart className="size-4 text-saffron" />
        KalaSaathi
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-ink/35 backdrop-blur-[2px] md:bg-ink/20"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={reduce ? false : { x: "100%" }}
              animate={{ x: 0 }}
              exit={reduce ? { opacity: 0 } : { x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-0 z-50 flex flex-col border-l border-gold/30 bg-parchment shadow-2xl md:inset-y-0 md:left-auto md:right-0 md:w-[420px]"
              aria-label="KalaSaathi assistant"
            >
              <div className="flex items-center justify-between border-b border-maroon/12 px-4 py-2">
                <span className="font-hindi text-xs text-teal">आपका कारीगर साथी</span>
                <button
                  type="button"
                  aria-label="Close KalaSaathi"
                  onClick={() => setOpen(false)}
                  className="rounded-md p-1.5 text-muted-foreground transition hover:bg-maroon/5 hover:text-maroon"
                >
                  <X className="size-4" />
                </button>
              </div>
              <KalaSaathiChat role={role} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
