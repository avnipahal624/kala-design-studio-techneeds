import { Mandala, Peacock, VineBorder } from "@/components/art/Ornaments";
import { BrandLockup, Wordmark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, ArrowRight, Loader2, Mail, ShieldCheck, UserRound } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(returnTo: string | null, fallback = "/dashboard") {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(searchParams.get("returnTo"), redirectAfterAuth);
  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirect, { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      setStep({ email: formData.get("email") as string });
    } catch (signInError) {
      setError(
        signInError instanceof Error
          ? signInError.message
          : "Couldn't send a verification code. Try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      navigate(redirect, { replace: true });
    } catch {
      setError("That code didn't match. Check the six digits and try again.");
      setOtp("");
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("anonymous");
      navigate(redirect, { replace: true });
    } catch {
      setError("Guest sign-in is unavailable right now. Use an email instead.");
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-parchment lg:grid-cols-[1.05fr_1fr]">
      {/* artwork panel */}
      <section className="relative hidden overflow-hidden bg-[linear-gradient(160deg,#7b2040_0%,#651a34_55%,#3b1a3f_100%)] px-10 py-10 text-ivory lg:flex lg:flex-col">
        <Mandala className="pointer-events-none absolute -right-32 -top-24 size-[460px] opacity-25" />
        <Mandala className="pointer-events-none absolute -bottom-40 -left-32 size-[420px] opacity-20" />
        <div className="relative flex flex-1 flex-col justify-between">
          <BrandLockup to="/" tone="ivory" size="md" />

          <div className="max-w-[30ch]">
            <p className="font-hindi-display text-sm text-saffron">अनेक हाथों की कारीगरी</p>
            <h1 className="mt-3 font-display text-5xl font-semibold leading-[1.05]">
              Your imagination.
              <br />
              Their craft.
              <br />
              <span className="text-saffron">One creation.</span>
            </h1>
            <p className="mt-5 max-w-[38ch] text-sm leading-relaxed text-ivory/75">
              Sign in to keep your inspirations, concepts and canvas versions together — private to
              your account.
            </p>
          </div>

          <div className="relative flex items-end justify-between">
            <div className="space-y-2 text-[11px] text-ivory/65">
              <p className="flex items-center gap-2">
                <ShieldCheck className="size-3.5 text-saffron" />
                Server-side ownership checks on every design
              </p>
              <p className="flex items-center gap-2">
                <ShieldCheck className="size-3.5 text-saffron" />
                Uploads limited to images under 8 MB
              </p>
              <p className="flex items-center gap-2">
                <ShieldCheck className="size-3.5 text-saffron" />
                Immutable version history
              </p>
            </div>
            <Peacock className="size-48 shrink-0" />
          </div>
        </div>
      </section>

      {/* form panel */}
      <section className="relative flex flex-col">
        <div className="flex items-center justify-between px-5 py-5 md:px-10">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-xs text-ink/60 transition-colors hover:text-maroon"
          >
            <ArrowLeft className="size-3.5" />
            Back to home
          </button>
          <div className="lg:hidden">
            <Wordmark size="sm" />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-10 md:px-10">
          <div className="w-full max-w-[400px]">
            <div className="rounded-2xl border border-maroon/18 bg-card p-6 md:p-7">
              {step === "signIn" ? (
                <>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/25 bg-teal/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-teal">
                    Email sign-in
                  </span>
                  <h2 className="mt-3 font-display text-2xl font-semibold text-maroon">
                    Enter the studio
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-ink/60">
                    We'll email you a six-digit code. No password to remember.
                  </p>

                  <form onSubmit={handleEmailSubmit} className="mt-5">
                    <label htmlFor="email" className="text-[11px] font-medium text-ink/70">
                      Email address
                    </label>
                    <div className="relative mt-1.5">
                      <Mail className="absolute left-3 top-3 size-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        className="border-maroon/20 bg-parchment pl-9"
                        disabled={isLoading}
                        required
                      />
                    </div>
                    {error && <p className="mt-2 text-xs text-vermilion">{error}</p>}
                    <Button
                      type="submit"
                      className="mt-3 w-full gap-2 bg-maroon py-5 text-ivory hover:bg-maroon-deep"
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
                      Send me a code
                    </Button>
                  </form>

                  <div className="my-5 flex items-center gap-3">
                    <span className="h-px flex-1 bg-maroon/15" />
                    <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">or</span>
                    <span className="h-px flex-1 bg-maroon/15" />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2 border-maroon/25 py-5 text-maroon"
                    onClick={handleGuestLogin}
                    disabled={isLoading}
                  >
                    <UserRound className="size-4" />
                    Continue as guest
                  </Button>
                  <p className="mt-2 text-center text-[10px] leading-relaxed text-muted-foreground">
                    Guest sessions are tied to this browser until you sign out.
                  </p>
                </>
              ) : (
                <>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/25 bg-teal/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-teal">
                    Check your inbox
                  </span>
                  <h2 className="mt-3 font-display text-2xl font-semibold text-maroon">
                    Enter your code
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-ink/60">
                    We sent six digits to <span className="font-medium text-ink">{step.email}</span>.
                  </p>

                  <form onSubmit={handleOtpSubmit} className="mt-5">
                    <input type="hidden" name="email" value={step.email} />
                    <input type="hidden" name="code" value={otp} />
                    <div className="flex justify-center">
                      <InputOTP
                        value={otp}
                        onChange={setOtp}
                        maxLength={6}
                        disabled={isLoading}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && otp.length === 6 && !isLoading) {
                            const form = (event.target as HTMLElement).closest("form");
                            form?.requestSubmit();
                          }
                        }}
                      >
                        <InputOTPGroup>
                          {Array.from({ length: 6 }).map((_, index) => (
                            <InputOTPSlot key={index} index={index} />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    {error && <p className="mt-2 text-center text-xs text-vermilion">{error}</p>}
                    <Button
                      type="submit"
                      className="mt-4 w-full gap-2 bg-maroon py-5 text-ivory hover:bg-maroon-deep"
                      disabled={isLoading || otp.length !== 6}
                    >
                      {isLoading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
                      Verify and enter the studio
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="mt-2 w-full text-xs text-muted-foreground"
                      onClick={() => {
                        setStep("signIn");
                        setOtp("");
                        setError(null);
                      }}
                      disabled={isLoading}
                    >
                      Use a different email
                    </Button>
                  </form>
                </>
              )}
            </div>

            <p className="mt-4 text-center text-[10px] leading-relaxed text-muted-foreground">
              You keep ownership of every artwork you upload. KALAकारी makes no claim to
              traditional craft motifs — they belong to the communities that carry them.
            </p>
          </div>
        </div>

        <VineBorder className="h-2 w-full opacity-50" />
      </section>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}
