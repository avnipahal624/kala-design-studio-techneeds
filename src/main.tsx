import '@vly-ai/integrations';
import { Toaster } from "@/components/ui/sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import React, { StrictMode, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from "react-router";
import "./index.css";

import { PublicShell } from "@/components/public/PublicShell";
import Landing from "./pages/Landing";
import ExploreArtisans, { ArtisanPublicPage } from "./pages/ExploreArtisans";
import KalaCollabPage from "./pages/KalaCollab";
import { KalaPassportPrivate, KalaPassportPublic } from "./pages/KalaPassport";
import ArtisanCollaborations from "./pages/artisan/Collaborations";
import { CraftsPage, ForArtisansPage, HowItWorksPage, KalaRightsPage, TrustAndSafetyPage, WhyKalkaariPage } from "./pages/public/InfoPages";
import {
  CreateRequest, CustomerDashboard, CustomerPayments, CustomerProjectDetail,
  CustomerProjects, CustomerQuotes, CustomerRequestDetail, CustomerRequests,
} from "./pages/customer/CustomerPages";
import {
  ArtisanAvailability, ArtisanDashboard, ArtisanEarnings, ArtisanJobDetail, ArtisanJobs,
  ArtisanOnboarding, ArtisanPortfolio, ArtisanProjectDetail, ArtisanProjects, ArtisanQuotes,
} from "./pages/artisan/ArtisanPages";
import {
  DisputePage, KalaSaathiPage, MessagesPage, NotificationsPage, ProjectKalaProofPage, SettingsPage,
} from "./pages/shared/SharedPages";
import AdminDashboard, {
  AdminAudit, AdminDisputes, AdminReports, AdminTransactions, AdminUsers, AdminVerifications,
} from "./pages/admin/AdminPages";

// Legacy studio routes stay available but are no longer part of the marketplace navigation.
const DemoPage = lazy(() => import("./pages/Demo"));
const AuthPage = lazy(() => import("./pages/Auth.tsx"));
const LegacyDashboard = lazy(() => import("./pages/Dashboard.tsx"));
const KalaVision = lazy(() => import("./pages/KalaVision.tsx"));
const Creations = lazy(() => import("./pages/Creations.tsx"));
const Studio = lazy(() => import("./pages/Studio.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

function RouteLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-parchment">
      <div className="animate-pulse text-sm text-muted-foreground">Loading KALकारी…</div>
    </div>
  );
}

class ToolbarErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err: Error) { console.warn("[VlyToolbar] Caught error, toolbar disabled:", err.message); }
  render() { return this.state.hasError ? null : this.props.children; }
}

class RootErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; message: string; stack: string }> {
  state = { hasError: false, message: "", stack: "" };
  static getDerivedStateFromError(error: Error) { return { hasError: true, message: error.message || "Unknown runtime error", stack: error.stack || "" }; }
  componentDidCatch(err: Error) { console.error("[Preview] Root crash:", err); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
          <div className="max-w-lg text-center">
            <p className="text-sm font-semibold">Preview runtime error</p>
            <p className="mt-2 break-words text-xs text-muted-foreground">{this.state.message}</p>
            {this.state.stack && <pre className="mt-3 max-h-40 overflow-auto rounded border border-border/60 p-2 text-left text-[10px] leading-4 text-muted-foreground/80">{this.state.stack}</pre>}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage({ type: "iframe-route-change", path: location.pathname }, "*");
  }, [location.pathname]);
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);
  return null;
}

function Protected({ children, title, description }: { children: React.ReactNode; title: string; description: string }) {
  return <RequireAuth redirectImmediately title={title} description={description}>{children}</RequireAuth>;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <ToolbarErrorBoundary><VlyToolbar /></ToolbarErrorBoundary>
      <ConvexAuthProvider client={convex}>
        <BrowserRouter>
          <RouteSyncer />
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/demo" element={<DemoPage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/explore-artisans" element={<ExploreArtisans />} />
              <Route path="/kalacollab" element={<KalaCollabPage />} />
              <Route path="/passport/:token" element={<KalaPassportPublic />} />
              <Route path="/artisans/:artisanId" element={<ArtisanProfileRoute />} />
              <Route path="/crafts" element={<CraftsPage />} />
              <Route path="/trust-and-safety" element={<TrustAndSafetyPage />} />
              <Route path="/for-artisans" element={<ForArtisansPage />} />
              <Route path="/why-kalkaari" element={<WhyKalkaariPage />} />
              <Route path="/kala-rights" element={<KalaRightsPage />} />

              <Route path="/auth" element={<AuthPage redirectAfterAuth="/customer/dashboard" />} />

              <Route path="/customer/dashboard" element={<Protected title="Sign in to your workspace" description="Your briefs, quotes and projects are private to your account."><CustomerDashboard /></Protected>} />
              <Route path="/customer/create-request" element={<Protected title="Sign in to post a brief" description="A brief connects your idea to matched artisans. It is free to publish."><CreateRequest /></Protected>} />
              <Route path="/customer/requests" element={<Protected title="Sign in to see your briefs" description="Every brief and quote is tied to your account."><CustomerRequests /></Protected>} />
              <Route path="/customer/requests/:requestId" element={<Protected title="Sign in to open this brief" description="Quotes, matched artisans and the project link live here."><CustomerRequestDetail /></Protected>} />
              <Route path="/customer/quotes" element={<Protected title="Sign in to review quotes" description="Quote breakdowns are visible only to the customer and artisan involved."><CustomerQuotes /></Protected>} />
              <Route path="/customer/projects" element={<Protected title="Sign in to see your projects" description="Projects contain the approved concept, payment state and KalaProof record."><CustomerProjects /></Protected>} />
              <Route path="/customer/projects/:projectId" element={<Protected title="Sign in to open this project" description="Only the customer, artisan and admin reviewers can view it."><CustomerProjectDetail /></Protected>} />
              <Route path="/customer/payments" element={<Protected title="Sign in to see payments" description="Payment history is private to the customer account."><CustomerPayments /></Protected>} />
              <Route path="/customer/messages" element={<Protected title="Sign in to view messages" description="Conversations are private to the two participants."><MessagesPage /></Protected>} />

              <Route path="/artisan/onboarding" element={<Protected title="Sign in to build CraftFit" description="Your craft profile drives honest matching and paid work."><ArtisanOnboarding /></Protected>} />
              <Route path="/artisan/dashboard" element={<Protected title="Sign in to your artisan workspace" description="Matched work, quotes and projects are private to your account."><ArtisanDashboard /></Protected>} />
              <Route path="/artisan/jobs" element={<Protected title="Sign in to see KalaJobs" description="Matched briefs use your CraftFit skills, materials and capacity."><ArtisanJobs /></Protected>} />
              <Route path="/artisan/jobs/:requestId" element={<Protected title="Sign in to view this job" description="The full brief is visible to eligible and invited artisans."><ArtisanJobDetail /></Protected>} />
              <Route path="/artisan/quotes" element={<Protected title="Sign in to see your quotes" description="Quote versions and customer decisions stay private to you."><ArtisanQuotes /></Protected>} />
              <Route path="/artisan/collaborations" element={<Protected title="Sign in to see KalaCollab tasks" description="Collaboration invitations and task ownership are private to you."><ArtisanCollaborations /></Protected>} />
              <Route path="/artisan/projects" element={<Protected title="Sign in to see your projects" description="Funded work and handover records are tied to your account."><ArtisanProjects /></Protected>} />
              <Route path="/artisan/projects/:projectId" element={<Protected title="Sign in to open this project" description="Concepts, progress and payouts are private to project participants."><ArtisanProjectDetail /></Protected>} />
              <Route path="/artisan/profile" element={<Navigate to="/settings" replace />} />
              <Route path="/artisan/portfolio" element={<Protected title="Sign in to manage your portfolio" description="Only work you own or have permission to show belongs here."><ArtisanPortfolio /></Protected>} />
              <Route path="/artisan/availability" element={<Protected title="Sign in to manage availability" description="Capacity affects which briefs are matched to you."><ArtisanAvailability /></Protected>} />
              <Route path="/artisan/earnings" element={<Protected title="Sign in to see earnings" description="Payout records are private to your artisan account."><ArtisanEarnings /></Protected>} />
              <Route path="/artisan/messages" element={<Protected title="Sign in to view messages" description="Conversations stay attached to the work."><MessagesPage /></Protected>} />

              <Route path="/admin/dashboard" element={<Protected title="Admin sign-in required" description="Administration is role-checked on the server."><AdminDashboard /></Protected>} />
              <Route path="/admin/verifications" element={<Protected title="Admin sign-in required" description="Verification decisions are restricted to administrators."><AdminVerifications /></Protected>} />
              <Route path="/admin/reports" element={<Protected title="Admin sign-in required" description="Moderation and risk review are restricted."><AdminReports /></Protected>} />
              <Route path="/admin/disputes" element={<Protected title="Admin sign-in required" description="Dispute decisions are restricted."><AdminDisputes /></Protected>} />
              <Route path="/admin/transactions" element={<Protected title="Admin sign-in required" description="Payment and payout records are restricted."><AdminTransactions /></Protected>} />
              <Route path="/admin/users" element={<Protected title="Admin sign-in required" description="Member management is restricted."><AdminUsers /></Protected>} />
              <Route path="/admin/audit" element={<Protected title="Admin sign-in required" description="The audit log is restricted."><AdminAudit /></Protected>} />

              <Route path="/notifications" element={<Protected title="Sign in to see notifications" description="Activity on your account appears here."><NotificationsPage /></Protected>} />
              <Route path="/settings" element={<Protected title="Sign in to manage settings" description="Contact details and verification are private."><SettingsPage /></Protected>} />
              <Route path="/kalasaathi" element={<Protected title="Sign in to talk to KalaSaathi" description="KalaSaathi helps with briefs and craft language; it cannot make payments or approve work."><KalaSaathiPage /></Protected>} />
              <Route path="/projects/:projectId/dispute" element={<Protected title="Sign in to open support" description="Dispute cases are private to project participants and reviewers."><DisputePage /></Protected>} />
              <Route path="/projects/:projectId/proof" element={<Protected title="Sign in to view KalaProof" description="The evidence timeline is private to project participants."><ProjectKalaProofPage /></Protected>} />
              <Route path="/projects/:projectId/passport" element={<Protected title="Sign in to view KalaPassport" description="The passport is private until its owner shares the public summary."><KalaPassportPrivate /></Protected>} />

              <Route path="/dashboard" element={<Navigate to="/customer/dashboard" replace />} />
              <Route path="/kalavision" element={<Protected title="Sign in to use the legacy studio" description="The original inspiration canvas is kept as an archive."><KalaVision /></Protected>} />
              <Route path="/creations" element={<Protected title="Sign in to view legacy creations" description="Legacy studio canvases are private to your account."><Creations /></Protected>} />
              <Route path="/studio/:designId" element={<Protected title="Sign in to open the legacy studio" description="Legacy studio canvases are private to your account."><Studio /></Protected>} />
              <Route path="/legacy/dashboard" element={<Protected title="Sign in to open the legacy studio" description="The original studio dashboard is kept as an archive."><LegacyDashboard /></Protected>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster />
      </ConvexAuthProvider>
    </RootErrorBoundary>
  </StrictMode>,
);

function ArtisanProfileRoute() {
  const { artisanId } = useParams();
  if (!artisanId) return <PublicShell><div className="p-16 text-center text-sm text-ink/60">Profile not found.</div></PublicShell>;
  return <ArtisanPublicPage artisanId={artisanId} />;
}
