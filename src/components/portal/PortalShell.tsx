import { api } from "@/convex/_generated/api";
import { KalaSaathiLauncher } from "@/components/kalasaathi/KalaSaathiPanel";
import { BrandLockup } from "@/components/brand/Logo";
import { Mandala } from "@/components/art/Ornaments";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { relativeTime, roleHome } from "@/lib/marketplace";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeftRight,
  Bell,
  BriefcaseBusiness,
  CalendarClock,
  CheckCheck,
  ChevronRight,
  FileText,
  FolderKanban,
  Gavel,
  Hammer,
  Handshake,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  ReceiptIndianRupee,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router";

type Role = "customer" | "artisan" | "admin";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };

const NAV: Record<Role, NavItem[]> = {
  customer: [
    { to: "/customer/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/customer/requests", label: "My requests", icon: FileText },
    { to: "/customer/quotes", label: "Quotes", icon: ReceiptIndianRupee },
    { to: "/customer/projects", label: "Projects", icon: FolderKanban },
    { to: "/track", label: "KalaTrack", icon: Package },
    { to: "/customer/messages", label: "Messages", icon: MessageSquare },
    { to: "/customer/payments", label: "Payments", icon: Wallet },
  ],
  artisan: [
    { to: "/artisan/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/artisan/jobs", label: "KalaJobs", icon: Hammer },
    { to: "/artisan/collaborations", label: "KalaCollab", icon: Handshake },
    { to: "/artisan/quotes", label: "My quotes", icon: FileText },
    { to: "/artisan/projects", label: "Projects", icon: FolderKanban },
    { to: "/track", label: "KalaTrack", icon: Package },
    { to: "/artisan/portfolio", label: "Portfolio", icon: Sparkles },
    { to: "/artisan/availability", label: "Calendar", icon: CalendarClock },
    { to: "/artisan/earnings", label: "Earnings", icon: Wallet },
    { to: "/artisan/messages", label: "Messages", icon: MessageSquare },
  ],
  admin: [
    { to: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
    { to: "/admin/verifications", label: "Verifications", icon: ShieldCheck },
    { to: "/admin/reports", label: "Reports & risk", icon: Gavel },
    { to: "/admin/disputes", label: "Disputes", icon: Gavel },
    { to: "/admin/transactions", label: "Transactions", icon: ReceiptIndianRupee },
    { to: "/admin/users", label: "People", icon: Users },
    { to: "/admin/audit", label: "Audit log", icon: BriefcaseBusiness },
  ],
};

const ROLE_INTRO: Record<Role, { hindi: string; cta: { to: string; label: string } }> = {
  customer: { hindi: "ग्राहक", cta: { to: "/customer/create-request", label: "New customisation" } },
  artisan: { hindi: "कारीगर", cta: { to: "/artisan/jobs", label: "Find KalaJobs" } },
  admin: { hindi: "प्रशासन", cta: { to: "/admin/verifications", label: "Review queue" } },
};

function NotificationsMenu() {
  const notifications = useQuery(api.notifications.list);
  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);
  const unread = notifications?.unread ?? 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative border-maroon/20 bg-card text-ink/70"
          aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        >
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-vermilion text-[9px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[320px] border-maroon/20 bg-parchment p-0">
        <div className="flex items-center justify-between border-b border-maroon/12 px-3 py-2">
          <p className="font-display text-sm font-semibold text-ink">Notifications</p>
          {unread > 0 && (
            <button
              type="button"
              onClick={() => void markAllRead({})}
              className="flex items-center gap-1 text-[10px] font-medium text-teal hover:text-teal-deep"
            >
              <CheckCheck className="size-3" /> Mark all read
            </button>
          )}
        </div>
        <div className="max-h-[340px] overflow-y-auto">
          {(notifications?.items ?? []).length === 0 && (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">Nothing yet. Activity will appear here.</p>
          )}
          {(notifications?.items ?? []).slice(0, 10).map((item) => (
            <Link
              key={item._id}
              to={item.href ?? "/notifications"}
              onClick={() => {
                if (!item.readAt) void markRead({ notificationId: item._id });
              }}
              className={cn(
                "block border-b border-maroon/8 px-3 py-2.5 transition hover:bg-ivory/70",
                !item.readAt && "bg-saffron/[0.06]",
              )}
            >
              <p className="text-xs font-semibold text-ink">{item.title}</p>
              <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-ink/60">{item.body}</p>
              <p className="mt-1 text-[9px] uppercase tracking-wide text-muted-foreground">{relativeTime(item.createdAt)}</p>
            </Link>
          ))}
        </div>
        <Link
          to="/notifications"
          className="flex items-center justify-between px-3 py-2 text-[11px] font-semibold text-maroon hover:bg-ivory"
        >
          All notifications <ChevronRight className="size-3" />
        </Link>
      </PopoverContent>
    </Popover>
  );
}

function NavLinks({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const location = useLocation();
  const items = NAV[role];
  return (
    <nav className="flex flex-col gap-0.5" aria-label={`${role} workspace`}>
      {items.map((item) => {
        const active =
          location.pathname === item.to ||
          (item.to !== `/${role}/dashboard` && location.pathname.startsWith(item.to));
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              active ? "bg-ivory/15 text-ivory" : "text-ivory/70 hover:bg-ivory/10 hover:text-ivory",
            )}
          >
            <item.icon className={cn("size-4", active ? "text-saffron" : "text-ivory/50")} />
            <span className="flex-1 font-medium">{item.label}</span>
            {active && <span className="size-1.5 rounded-full bg-saffron" />}
          </Link>
        );
      })}
    </nav>
  );
}

function Sidebar({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const { user, signOut } = useAuth();
  const profiles = useQuery(api.account.profiles);
  const setActiveRole = useMutation(api.account.setActiveRole);
  const navigate = useNavigate();
  const initial = (user?.name ?? user?.displayName ?? "K").trim().charAt(0).toUpperCase();
  const cta = ROLE_INTRO[role].cta;
  const canSwitch = role !== "admin" && profiles?.customer && profiles?.artisan;
  const switchTarget = role === "artisan" ? "customer" : "artisan";

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[linear-gradient(178deg,#3d2a25_0%,#32231f_50%,#241a17_100%)] text-ivory">
      <div className="pointer-events-none absolute -right-20 top-20 opacity-[0.12]">
        <Mandala className="size-64" />
      </div>
      <div className="pointer-events-none absolute -bottom-24 -left-24 opacity-[0.14]">
        <Mandala className="size-72" colors={["#d8a65b", "#a96558", "#9bad9d", "#f7f2e8", "#b78a4e"]} />
      </div>

      <div className="relative px-5 pb-4 pt-6">
        <BrandLockup to={roleHome(user?.role, Boolean(profiles?.artisan))} tone="ivory" size="md" />
      </div>
      <div className="relative h-px w-full bg-ivory/15" />

      <div className="relative px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-ivory/40">
          {role === "admin" ? "Administration" : `${role} workspace`}
          <span className="ml-1.5 font-hindi normal-case tracking-normal text-ivory/50">{ROLE_INTRO[role].hindi}</span>
        </p>
        <NavLinks role={role} onNavigate={onNavigate} />
      </div>

      <div className="relative px-4">
        <Button
          className="w-full justify-between gap-2 rounded-lg bg-saffron text-maroon-deep hover:bg-marigold"
          onClick={() => {
            onNavigate?.();
            navigate(cta.to);
          }}
        >
          {cta.label}
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="relative mt-auto px-4 pb-5 pt-5">
        {canSwitch && (
          <button
            type="button"
            onClick={async () => {
              await setActiveRole({ role: switchTarget });
              onNavigate?.();
              navigate(switchTarget === "artisan" ? "/artisan/dashboard" : "/customer/dashboard");
            }}
            className="mb-3 flex w-full items-center gap-2 rounded-lg border border-ivory/20 px-3 py-2 text-[11px] text-ivory/70 transition hover:bg-ivory/10 hover:text-ivory"
          >
            <ArrowLeftRight className="size-3.5 text-saffron" />
            Switch to {switchTarget} view
          </button>
        )}

        <div className="mb-3 rounded-xl border border-ivory/15 bg-ivory/[0.06] p-3">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-saffron">
            <Package className="size-3" /> KalaProof keeps the work honest
          </p>
          <p className="mt-1 text-[10px] leading-relaxed text-ivory/65">
            Concepts, approvals, payments and progress are recorded as an append-only timeline.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-ivory/25 bg-ivory/10 font-display text-sm">
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.name ?? user?.displayName ?? "Member"}</p>
            <p className="truncate text-[10px] text-ivory/45">{user?.email ?? "Guest session"}</p>
          </div>
          <Link
            to="/settings"
            onClick={onNavigate}
            aria-label="Account settings"
            className="rounded-md p-1.5 text-ivory/55 transition hover:bg-ivory/10 hover:text-ivory"
          >
            <ShieldCheck className="size-4" />
          </Link>
          <button
            type="button"
            aria-label="Sign out"
            className="rounded-md p-1.5 text-ivory/55 transition hover:bg-ivory/10 hover:text-ivory"
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

export function PortalShell({
  role,
  title,
  hindi,
  subtitle,
  actions,
  children,
}: {
  role: Role;
  title: string;
  hindi?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const items = NAV[role].slice(0, role === "admin" ? 4 : 5);

  return (
    <div className="min-h-screen bg-parchment text-ink craft-paper">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] lg:block">
        <Sidebar role={role} />
      </aside>

      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-30 border-b border-gold/25 bg-parchment/88 backdrop-blur-md">
          <div className="mx-auto flex min-h-16 max-w-[1480px] items-center gap-3 px-4 py-3 md:px-8">
            <div className="flex items-center gap-2 lg:hidden">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="border-maroon/20 bg-card" aria-label="Open menu">
                    <Menu className="size-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] border-maroon-deep p-0">
                  <SheetTitle className="sr-only">KALकारी navigation</SheetTitle>
                  <Sidebar role={role} onNavigate={() => setOpen(false)} />
                </SheetContent>
              </Sheet>
              <BrandLockup size="sm" tone="ink" />
            </div>

            <div className="hidden min-w-0 flex-1 lg:block">
              <div className="flex items-baseline gap-2.5">
                <h1 className="truncate font-display text-2xl font-semibold tracking-tight text-maroon">{title}</h1>
                {hindi && <span className="font-hindi text-sm text-muted-foreground">{hindi}</span>}
              </div>
              {subtitle && <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>}
            </div>

            <div className="flex flex-1 items-center justify-end gap-2">
              {actions}
              <NotificationsMenu />
            </div>
          </div>
          <div className="px-4 pb-3 lg:hidden">
            <h1 className="font-display text-xl font-semibold tracking-tight text-maroon">{title}</h1>
            {subtitle && <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>}
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1480px] px-4 pb-24 pt-5 md:px-8 md:py-8 lg:pb-12">{children}</main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-gold/30 bg-parchment/95 px-1 pb-[max(env(safe-area-inset-bottom),0.25rem)] pt-1.5 backdrop-blur-md lg:hidden"
        aria-label="Mobile navigation"
      >
        {items.map((item) => {
          const active = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-md px-1 py-1 text-[9px] font-medium transition-colors",
                active ? "text-maroon" : "text-ink/50",
              )}
            >
              <item.icon className={cn("size-5", active && "text-vermilion")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <KalaSaathiLauncher role={role} />
    </div>
  );
}
