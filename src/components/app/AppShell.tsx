import { BrandLockup, Wordmark } from "@/components/brand/Logo";
import { Mandala } from "@/components/art/Ornaments";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import {
  Camera,
  LogOut,
  Menu,
  Palette,
  Plus,
  Sparkles,
  LayoutDashboard,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router";

const NAV = [
  { to: "/dashboard", label: "Dashboard", hindi: "डैशबोर्ड", icon: LayoutDashboard },
  { to: "/kalavision", label: "KalaVision", hindi: "कलाविज़न", icon: Camera },
  { to: "/creations", label: "My Creations", hindi: "मेरी रचनाएँ", icon: Palette },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active =
          location.pathname === item.to ||
          (item.to === "/creations" && location.pathname.startsWith("/studio"));
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
              active
                ? "bg-ivory/15 text-ivory"
                : "text-ivory/75 hover:bg-ivory/10 hover:text-ivory"
            }`}
          >
            <item.icon className={`size-4 ${active ? "text-saffron" : "text-ivory/55"}`} />
            <span className="flex-1 font-medium">{item.label}</span>
            <span className="font-hindi text-[11px] text-ivory/40">{item.hindi}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarInner({ onNavigate }: { onNavigate?: () => void }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const initial = (user?.name ?? user?.displayName ?? "K").trim().charAt(0).toUpperCase();

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[linear-gradient(175deg,#7b2040_0%,#651a34_45%,#4d1229_100%)] text-ivory">
      <div className="pointer-events-none absolute -right-16 top-24 opacity-[0.13]">
        <Mandala className="size-64" />
      </div>
      <div className="pointer-events-none absolute -bottom-24 -left-20 opacity-[0.16]">
        <Mandala className="size-72" colors={["#f2a33a", "#e66a99", "#087f83", "#fff4de", "#c49a55"]} />
      </div>

      <div className="relative px-5 pb-5 pt-6">
        <BrandLockup to="/dashboard" tone="ivory" size="md" />
      </div>

      <div className="relative h-px w-full bg-ivory/15" />

      <div className="relative px-3 py-5">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-ivory/45">
          Studio
        </p>
        <NavLinks onNavigate={onNavigate} />
      </div>

      <div className="relative px-4">
        <Button
          className="w-full justify-start gap-2 rounded-lg bg-saffron text-maroon-deep hover:bg-saffron/90"
          onClick={() => {
            onNavigate?.();
            navigate("/kalavision");
          }}
        >
          <Plus className="size-4" />
          New from inspiration
        </Button>
      </div>

      <div className="relative mt-auto px-4 pb-5 pt-6">
        <div className="mb-4 rounded-xl border border-ivory/15 bg-ivory/[0.06] p-3">
          <div className="flex items-start gap-2">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-saffron" />
            <p className="text-[11px] leading-relaxed text-ivory/70">
              Version 1 focus: inspiration in, a real design out. Craft matching and
              artisan collaboration come next.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-ivory/25 bg-ivory/10 font-display text-sm">
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {user?.name ?? user?.displayName ?? "Craft explorer"}
            </p>
            <p className="truncate text-[11px] text-ivory/50">{user?.email ?? "Guest session"}</p>
          </div>
          <button
            type="button"
            aria-label="Sign out"
            className="rounded-md p-1.5 text-ivory/55 transition-colors hover:bg-ivory/10 hover:text-ivory"
            onClick={async () => {
              await signOut();
              navigate("/");
            }}
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppShell({
  children,
  title,
  hindi,
  subtitle,
  actions,
}: {
  children: ReactNode;
  title: string;
  hindi?: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-parchment text-ink craft-paper">
      <aside className="fixed inset-y-0 left-0 hidden w-[264px] lg:block">
        <SidebarInner />
      </aside>

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-30 border-b border-gold/25 bg-parchment/85 backdrop-blur-md">
          <div className="mx-auto flex min-h-16 max-w-[1500px] items-center gap-3 px-4 py-3 md:px-8">
            <div className="flex items-center gap-2 lg:hidden">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="border-maroon/25 bg-card" aria-label="Open menu">
                    <Menu className="size-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] border-maroon-deep p-0">
                  <SheetTitle className="sr-only">KALकारी navigation</SheetTitle>
                  <SidebarInner onNavigate={() => setOpen(false)} />
                </SheetContent>
              </Sheet>
              <Wordmark size="sm" />
            </div>

            <div className="hidden min-w-0 flex-1 lg:block">
              <div className="flex items-baseline gap-2.5">
                <h1 className="truncate font-display text-2xl font-semibold tracking-tight text-maroon">
                  {title}
                </h1>
                {hindi && <span className="font-hindi text-sm text-muted-foreground">{hindi}</span>}
              </div>
              {subtitle && <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>}
            </div>

            <div className="flex flex-1 items-center justify-end gap-2">{actions}</div>
          </div>
          <div className="px-4 pb-3 lg:hidden">
            <div className="flex items-baseline gap-2">
              <h1 className="font-display text-xl font-semibold tracking-tight text-maroon">{title}</h1>
              {hindi && <span className="font-hindi text-xs text-muted-foreground">{hindi}</span>}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1500px] px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
