import React, { useEffect } from "react";
import {
  ArrowLeft,
  Volume2,
  Crown,
  CreditCard,
  CalendarDays,
  CalendarClock,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { useSession } from "../hooks/useSession";
import { navigate } from "../hooks/useRoute";
import { AvatarDropdown } from "../components/AvatarDropdown";
import SoundToggle from "../components/SoundToggle";

// ─── Mock membership data (no backend) ───────────────────────────────────────
const MOCK_MEMBERSHIP = {
  plan: "Premium",
  planType: "Monthly",
  status: "Active",
  renewalDate: "15 Aug 2026",
  expiryDate: "15 Sep 2026",
  autoRenewal: "Enabled",
};

export default function AccountSettingsPage() {
  const { status } = useSession();

  // Protected route – redirect unauthenticated visitors
  useEffect(() => {
    if (status === "unauthenticated") {
      window.history.replaceState({}, "", "/?login=true");
      window.dispatchEvent(new Event("pushstate"));
    }
  }, [status]);

  return (
    <div className="min-h-screen text-brand-text flex flex-col bg-transparent selection:bg-brand-accent selection:text-white">
      {/* ── Top navigation bar (matches ProfilePage) ─────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-brand-bg/85 backdrop-blur-md border-b border-brand-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div
              onClick={() => navigate("/")}
              className="flex items-center gap-2 cursor-pointer select-none transition-transform duration-200 active:scale-[0.98]"
              role="link"
              aria-label="XLChess Home"
            >
              <img
                src="/final%20logo.png"
                alt="XLChess logo"
                className="h-[68px] sm:h-[80px] w-auto object-contain"
                draggable={false}
              />
            </div>

            <div className="flex items-center gap-4">
              <AvatarDropdown />
            </div>
          </div>
        </div>
      </nav>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 relative z-10 flex flex-col gap-6">

        {/* Back link */}
        <div className="mt-4">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 text-brand-secondary hover:text-white transition-colors duration-200 font-sans text-sm font-semibold cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back
          </button>
        </div>

        {/* Page heading */}
        <div>
          <h1 className="font-sans font-bold text-2xl sm:text-3xl text-white tracking-tight">
            Account Settings
          </h1>
          <p className="font-sans text-brand-secondary text-sm mt-1">
            Manage your preferences and membership details.
          </p>
        </div>

        {/* ── 1. Sound Settings ──────────────────────────────────────────── */}
        <section
          aria-labelledby="sound-settings-heading"
          className="w-full bg-gradient-to-br from-brand-surface/60 via-brand-surface/40 to-brand-bg/80 border border-brand-border/60 shadow-xl backdrop-blur-xl rounded-2xl p-6 relative overflow-hidden"
        >
          {/* Ambient glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-brand-accent/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-brand-accent/10 flex items-center justify-center">
              <Volume2 className="w-4 h-4 text-brand-accent" />
            </div>
            <h2 id="sound-settings-heading" className="font-sans font-semibold text-white text-base">
              Sound Settings
            </h2>
          </div>

          <div className="flex items-center justify-between py-3 px-4 bg-white/5 rounded-xl border border-brand-border/30">
            <div>
              <p className="font-sans font-medium text-sm text-white">Game Sounds</p>
              <p className="font-sans text-xs text-brand-secondary mt-0.5">
                Toggle move sounds, captures and UI feedback
              </p>
            </div>
            <SoundToggle />
          </div>
        </section>

        {/* ── 2. Membership Section ──────────────────────────────────────── */}
        <section
          aria-labelledby="membership-heading"
          className="w-full bg-gradient-to-br from-brand-surface/60 via-brand-surface/40 to-brand-bg/80 border border-brand-border/60 shadow-xl backdrop-blur-xl rounded-2xl p-6 relative overflow-hidden"
        >
          {/* Ambient glow */}
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-brand-accent/10 flex items-center justify-center">
              <Crown className="w-4 h-4 text-brand-accent" />
            </div>
            <h2 id="membership-heading" className="font-sans font-semibold text-white text-base">
              Membership
            </h2>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            <MembershipRow
              label="Current Plan"
              value={MOCK_MEMBERSHIP.plan}
              highlight
            />
            <MembershipRow
              label="Plan Type"
              value={MOCK_MEMBERSHIP.planType}
            />
          </div>

          {/* Change Plan button – placeholder */}
          <button
            onClick={() => alert("Membership plan changes are coming soon!")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-brand-accent/40 bg-brand-accent/10 text-brand-accent hover:bg-brand-accent/20 hover:border-brand-accent/60 font-sans font-medium text-sm transition-all duration-200 cursor-pointer active:scale-[0.98]"
          >
            <Crown className="w-4 h-4" />
            Change Membership Plan
          </button>
        </section>

        {/* ── 3. Subscription Status card ───────────────────────────────── */}
        <section
          aria-labelledby="subscription-heading"
          className="w-full bg-gradient-to-br from-brand-surface/60 via-brand-surface/40 to-brand-bg/80 border border-brand-border/60 shadow-xl backdrop-blur-xl rounded-2xl p-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-emerald-400" />
            </div>
            <h2 id="subscription-heading" className="font-sans font-semibold text-white text-base">
              Subscription Status
            </h2>
          </div>

          {/* Status card */}
          <div className="rounded-xl border border-brand-border/40 bg-white/5 divide-y divide-brand-border/20 overflow-hidden">
            <SubscriptionRow icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />} label="Status" value={MOCK_MEMBERSHIP.status} valueClass="text-emerald-400" />
            <SubscriptionRow icon={<CalendarDays className="w-4 h-4 text-brand-secondary" />} label="Renewal Date" value={MOCK_MEMBERSHIP.renewalDate} />
            <SubscriptionRow icon={<CalendarClock className="w-4 h-4 text-brand-secondary" />} label="Expiry Date" value={MOCK_MEMBERSHIP.expiryDate} />
            <SubscriptionRow icon={<RefreshCw className="w-4 h-4 text-brand-secondary" />} label="Auto Renewal" value={MOCK_MEMBERSHIP.autoRenewal} valueClass="text-emerald-400" />
          </div>
        </section>

      </main>
    </div>
  );
}

// ─── Small helper sub-components ─────────────────────────────────────────────

interface MembershipRowProps {
  label: string;
  value: string;
  highlight?: boolean;
  statusBadge?: boolean;
  icon?: React.ReactNode;
}

function MembershipRow({ label, value, highlight, statusBadge, icon }: MembershipRowProps) {
  return (
    <div className="flex flex-col gap-1 py-3 px-4 bg-white/5 rounded-xl border border-brand-border/20">
      <span className="font-sans text-[11px] font-medium text-brand-secondary uppercase tracking-widest">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        {icon && <span className="text-brand-secondary">{icon}</span>}
        {statusBadge ? (
          <span className="inline-flex items-center gap-1 text-emerald-400 font-sans font-semibold text-sm">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {value}
          </span>
        ) : (
          <span className={`font-sans font-semibold text-sm ${highlight ? "text-brand-accent" : "text-white"}`}>
            {value}
          </span>
        )}
      </div>
    </div>
  );
}

interface SubscriptionRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}

function SubscriptionRow({ icon, label, value, valueClass = "text-white" }: SubscriptionRowProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-2.5 text-brand-secondary font-sans text-sm">
        {icon}
        {label}
      </div>
      <span className={`font-sans font-semibold text-sm ${valueClass}`}>{value}</span>
    </div>
  );
}
