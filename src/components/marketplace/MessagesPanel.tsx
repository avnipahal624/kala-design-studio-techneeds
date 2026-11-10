import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, MessageSquare, Send } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "./Bits";
import { UploadImages, type UploadedImage } from "./UploadImages";
import { relativeTime } from "@/lib/marketplace";
import { cn } from "@/lib/utils";

function Thread({ conversationId, role }: { conversationId: Id<"conversations">; role: "customer" | "artisan" }) {
  const thread = useQuery(api.messages.thread, { conversationId });
  const send = useMutation(api.messages.send);
  const markRead = useMutation(api.messages.markRead);
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<UploadedImage[]>([]);
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void markRead({ conversationId });
    // Marking read is idempotent; run when the thread opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [thread?.messages.length]);

  if (thread === undefined) {
    return <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">Loading conversation…</div>;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-maroon/12 px-4 py-3">
        <div>
          <p className="font-display text-base font-semibold text-ink">{thread.counterpart.name}</p>
          <p className="text-[10px] text-muted-foreground">
            {thread.context.projectTitle ?? thread.context.requestTitle ?? "Conversation"} · {thread.counterpart.verification === "verified" ? "verified contact" : "contact not verified"}
          </p>
        </div>
        <div className="flex gap-2">
          {thread.context.projectId && (
            <Link to={`/${role}/projects/${thread.context.projectId}`} className="rounded-full border border-maroon/20 px-2.5 py-1 text-[10px] font-medium text-maroon hover:bg-ivory">
              Project
            </Link>
          )}
          {thread.context.requestId && (
            <Link to={`/${role}/requests/${thread.context.requestId}`} className="rounded-full border border-maroon/20 px-2.5 py-1 text-[10px] font-medium text-maroon hover:bg-ivory">
              Request
            </Link>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[radial-gradient(circle_at_85%_0%,#fff4de,#fff9ef)] px-4 py-4">
        {thread.messages.length === 0 && (
          <p className="rounded-lg border border-maroon/15 bg-card p-3 text-xs text-muted-foreground">
            No messages yet. Keep scope, revisions and delivery questions here so both sides have a record. Never move payment off the platform.
          </p>
        )}
        {thread.messages.map((message) => (
          <div key={message._id} className={cn("max-w-[85%] space-y-1.5", message.mine ? "ml-auto" : "")}>
            <div
              className={cn(
                "whitespace-pre-line rounded-2xl px-3 py-2 text-xs leading-relaxed",
                message.mine ? "rounded-br-md bg-maroon text-ivory" : "rounded-bl-md border border-maroon/12 bg-card text-ink/80",
              )}
            >
              {message.body}
            </div>
            {message.attachments.length > 0 && (
              <div className={cn("flex flex-wrap gap-1.5", message.mine && "justify-end")}>
                {message.attachments.map((attachment) =>
                  attachment.url ? (
                    <a key={attachment.storageId} href={attachment.url} target="_blank" rel="noreferrer" className="block size-20 overflow-hidden rounded-lg border border-maroon/15">
                      <img src={attachment.url} alt={attachment.name ?? "Attachment"} className="size-full object-cover" />
                    </a>
                  ) : null,
                )}
              </div>
            )}
            <p className={cn("text-[9px] text-muted-foreground", message.mine && "text-right")}>
              {message.mine ? "You" : thread.counterpart.name} · {relativeTime(message.createdAt)}
            </p>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form
        className="border-t border-maroon/12 bg-card p-3"
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy) return;
          setBusy(true);
          try {
            await send({
              conversationId,
              body,
              attachments: attachments.map((image) => ({ storageId: image.storageId, name: image.name, contentType: image.contentType, size: image.size })),
            });
            setBody("");
            setAttachments([]);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Message not sent.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <UploadImages value={attachments} onChange={setAttachments} max={1} label="Attach an image (optional)" hint="Product or progress photos only." />
        <div className="mt-2 flex items-end gap-2">
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={2}
            maxLength={2000}
            placeholder="Write a message…"
            className="min-h-[44px] flex-1 resize-none rounded-lg border border-maroon/20 bg-parchment px-3 py-2 text-xs focus:border-maroon/50 focus:outline-none"
          />
          <Button type="submit" size="icon" disabled={busy || (body.trim().length === 0 && attachments.length === 0)} className="size-9 shrink-0 rounded-lg bg-maroon text-ivory" aria-label="Send message">
            <Send className="size-4" />
          </Button>
        </div>
        <p className="mt-1 text-[9px] text-muted-foreground">
          Payments must stay on KALकारी so KalaProof and dispute protection apply.
        </p>
      </form>
    </div>
  );
}

export function MessagesPanel({ role }: { role: "customer" | "artisan" }) {
  const conversations = useQuery(api.messages.list);
  const [params, setParams] = useSearchParams();
  const selected = params.get("c");

  return (
    <div className="grid min-h-[62vh] overflow-hidden rounded-2xl border border-maroon/15 bg-card md:grid-cols-[300px_1fr]">
      <aside className={cn("border-r border-maroon/12", selected ? "hidden md:block" : "block")}>
        <div className="border-b border-maroon/12 px-4 py-3">
          <p className="font-display text-sm font-semibold text-ink">Conversations</p>
          <p className="text-[10px] text-muted-foreground">Private to the two participants.</p>
        </div>
        <div className="max-h-[58vh] overflow-y-auto">
          {(conversations ?? []).length === 0 && (
            <p className="px-4 py-8 text-center text-xs text-muted-foreground">
              No conversations yet. Message an artisan from a request or project.
            </p>
          )}
          {(conversations ?? []).map((conversation) => (
            <button
              key={conversation._id}
              type="button"
              onClick={() => setParams({ c: conversation._id })}
              className={cn(
                "block w-full border-b border-maroon/8 px-4 py-3 text-left transition hover:bg-ivory/60",
                selected === conversation._id && "bg-ivory/80",
              )}
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-xs font-semibold text-ink">{conversation.counterpartName}</p>
                {conversation.unread > 0 && (
                  <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-vermilion text-[9px] font-bold text-white">
                    {conversation.unread}
                  </span>
                )}
              </div>
              <p className="mt-0.5 line-clamp-1 text-[11px] text-ink/55">{conversation.lastMessagePreview}</p>
              <p className="mt-1 text-[9px] uppercase tracking-wide text-muted-foreground">
                {conversation.scopeType === "project" ? "Project" : "Request"} · {relativeTime(conversation.lastMessageAt)}
              </p>
            </button>
          ))}
        </div>
      </aside>

      {selected ? (
        <div className="flex min-h-[62vh] flex-col">
          <button
            type="button"
            onClick={() => setParams({})}
            className="flex items-center gap-1 border-b border-maroon/12 px-3 py-2 text-[11px] text-muted-foreground md:hidden"
          >
            <ArrowLeft className="size-3" /> All conversations
          </button>
          <Thread conversationId={selected as Id<"conversations">} role={role} />
        </div>
      ) : (
        <div className="hidden items-center justify-center p-8 md:flex">
          <EmptyState
            icon={<MessageSquare className="size-5" />}
            title="Choose a conversation"
            body="Messages stay attached to the request or project so context is never lost."
          />
        </div>
      )}
    </div>
  );
}
