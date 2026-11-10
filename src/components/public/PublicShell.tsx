import { BrandLockup, Wordmark } from "@/components/brand/Logo";
import { VineBorder } from "@/components/art/Ornaments";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { ArrowRight, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router";

const LINKS = [
  { to: "/how-it-works", label: "How it works" },
  { to: "/explore-artisans", label: "Explore artisans" },
  { to: "/crafts", label: "Crafts" },
  { to: "/trust-and-safety", label: "Trust & safety" },
  { to: "/for-artisans", label: "For artisans" },
  { to: "/why-kalkaari", label: "Why KALकारी?" },
];

export function PublicShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { isAuthenticated, user } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const workspace = user?.role === "admin" ? "/admin/dashboard" : user?.role === "artisan" ? "/artisan/dashboard" : "/customer/dashboard";

  return (
    <div className={cn("min-h-screen bg-parchment text-ink", className)}>
      <header className="sticky top-0 z-40 border-b border-gold/25 bg-parchment/92 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 px-4 py-3 md:px-8">
          <BrandLockup size="md" />
          <nav className="hidden items-center gap-5 text-[12px] font-medium text-ink/65 lg:flex" aria-label="Main">
            {LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "transition-colors hover:text-maroon",
                  location.pathname === link.to && "text-maroon",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Link
                to={workspace}
                className="inline-flex items-center gap-1.5 rounded-full bg-maroon px-4 py-2 text-xs font-semibold text-ivory transition hover:bg-maroon-deep"
              >
                My workspace <ArrowRight className="size-3.5" />
              </Link>
            ) : (
              <>
                <Link to="/auth" className="hidden rounded-full px-3 py-2 text-xs font-medium text-maroon hover:bg-maroon/5 sm:inline-flex">
                  Sign in
                </Link>
                <Link
                  to="/auth?returnTo=%2Fcustomer%2Fcreate-request"
                  className="inline-flex items-center gap-1.5 rounded-full bg-maroon px-4 py-2 text-xs font-semibold text-ivory transition hover:bg-maroon-deep"
                >
                  Customise Something <ArrowRight className="size-3.5" />
                </Link>
              </>
            )}
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="border-maroon/20 bg-card lg:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X className="size-4" /> : <Menu className="size-4" />}
            </Button>
          </div>
        </div>
        {open && (
          <nav className="border-t border-gold/20 bg-parchment px-4 pb-3 pt-1 lg:hidden" aria-label="Mobile">
            {LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className="block border-b border-maroon/8 py-2.5 text-sm text-ink/70"
              >
                {link.label}
              </Link>
            ))}
            <Link to="/for-artisans" onClick={() => setOpen(false)} className="mt-2 block rounded-lg bg-teal/10 px-3 py-2 text-sm font-semibold text-teal-deep">
              Find craft work
            </Link>
          </nav>
        )}
        <VineBorder className="h-2 w-full opacity-60" />
      </header>

      <main>{children}</main>

      <footer className="border-t border-gold/30 bg-[#fbf0dc]">
        <div className="mx-auto grid max-w-[1320px] gap-8 px-4 py-10 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-8">
          <div>
            <Wordmark size="sm" />
            <p className="mt-2 max-w-[34ch] text-[11px] leading-relaxed text-ink/55">
              An artisan-first customisation marketplace. Share the idea, choose the maker, and keep
              every step documented. AI connects; artisans create.
            </p>
            <p className="mt-3 text-[10px] font-medium uppercase tracking-[0.16em] text-teal">
              Your Imagination. Their Craftsmanship.
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-maroon">For customers</p>
            <ul className="mt-2 space-y-1.5 text-[11px] text-ink/60">
              <li><Link to="/how-it-works" className="hover:text-maroon">How customisation works</Link></li>
              <li><Link to="/explore-artisans" className="hover:text-maroon">Explore artisans</Link></li>
              <li><Link to="/customer/create-request" className="hover:text-maroon">Start a brief</Link></li>
              <li><Link to="/trust-and-safety" className="hover:text-maroon">Payment protection</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-maroon">For artisans</p>
            <ul className="mt-2 space-y-1.5 text-[11px] text-ink/60">
              <li><Link to="/for-artisans" className="hover:text-maroon">Why join</Link></li>
              <li><Link to="/artisan/onboarding" className="hover:text-maroon">Build a CraftFit profile</Link></li>
              <li><Link to="/artisan/jobs" className="hover:text-maroon">KalaJobs</Link></li>
              <li><Link to="/why-kalkaari" className="hover:text-maroon">Fair discovery</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-maroon">The promise</p>
            <ul className="mt-2 space-y-1.5 text-[11px] text-ink/60">
              <li>No AI artwork generation</li>
              <li>Artisan-owned concepts</li>
              <li>Append-only KalaProof</li>
              <li>Verification shown honestly</li>
              <li>Disputes reviewed by people</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gold/20 px-4 py-4 text-center text-[10px] text-muted-foreground md:px-8">
          KALकारी · KalaVision, CraftFit, KalaJobs, KalaTrust, KalaProof and KalaRights are product
          names, not claims of legal escrow, insurance or guaranteed verification.
        </div>
      </footer>
    </div>
  );
}
