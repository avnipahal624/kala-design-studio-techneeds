import { LogoMark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-parchment px-6 text-center craft-paper">
      <LogoMark className="size-14" />
      <p className="mt-6 font-hindi-display text-sm text-teal">यह पृष्ठ नहीं मिला</p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-maroon">
        This thread leads nowhere
      </h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink/60">
        The page you asked for isn't part of the KALAकारी studio. Head back to your creations and
        pick up where you left off.
      </p>
      <div className="mt-6 flex gap-2">
        <Link to="/">
          <Button variant="outline" className="border-maroon/25 text-maroon">
            Home
          </Button>
        </Link>
        <Link to="/dashboard">
          <Button className="bg-maroon text-ivory hover:bg-maroon-deep">Go to dashboard</Button>
        </Link>
      </div>
    </main>
  );
}
