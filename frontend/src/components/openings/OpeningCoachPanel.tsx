/**
 * OpeningCoachPanel.tsx
 *
 * Right-side panel displaying the virtual coach's message, move status
 * (correct / wrong / opponent), and the move history list.
 *
 * Coach image (coach.png) is displayed on the left of a speech bubble
 * whose tail points LEFT toward the coach — matching chess.com's style.
 */

import { CheckCircle2, XCircle, Loader2, GraduationCap } from "lucide-react";
import type { TrainerStatus } from "../../hooks/useOpeningTrainer";

interface OpeningCoachPanelProps {
  coachMessage: string;
  status: TrainerStatus;
  movesPlayed: string[];
}

const statusConfig: Record<
  TrainerStatus,
  {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    Icon: React.ComponentType<{ className?: string }>;
  }
> = {
  playing: {
    label: "Your move",
    color: "text-brand-accent",
    bgColor: "rgba(212,175,110,0.08)",
    borderColor: "rgba(212,175,110,0.25)",
    Icon: GraduationCap,
  },
  opponent: {
    label: "Opponent's move…",
    color: "text-brand-secondary",
    bgColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.10)",
    Icon: Loader2,
  },
  wrong: {
    label: "Incorrect — try again",
    color: "text-rose-400",
    bgColor: "rgba(239,68,68,0.06)",
    borderColor: "rgba(239,68,68,0.25)",
    Icon: XCircle,
  },
  complete: {
    label: "Opening complete!",
    color: "text-emerald-400",
    bgColor: "rgba(52,211,153,0.06)",
    borderColor: "rgba(52,211,153,0.25)",
    Icon: CheckCircle2,
  },
};

export function OpeningCoachPanel({
  coachMessage,
  status,
  movesPlayed,
}: OpeningCoachPanelProps) {
  const cfg = statusConfig[status];
  const Icon = cfg.Icon;

  return (
    <div className="flex flex-col gap-5 h-full">

      {/* ── Coach + Speech Bubble ─────────────────────────────────────────── */}
      <div className="flex items-start gap-3">

        {/* Coach avatar */}
        <div className="shrink-0 flex flex-col items-center gap-1.5">
          <div
            className="w-16 h-16 rounded-full overflow-hidden ring-2"
            style={{
              boxShadow:
                "0 0 0 2px rgba(212,175,110,0.30), 0 4px 16px rgba(0,0,0,0.5)",
            }}
          >
            <img
              src="/coach.png"
              alt="Coach"
              className="w-full h-full object-cover object-top"
              draggable={false}
            />
          </div>
          <p className="font-mono text-[9px] text-brand-secondary uppercase tracking-widest text-center">
            Coach
          </p>
        </div>

        {/* Speech bubble with left-pointing tail */}
        <div className="relative flex-1 min-w-0">
          {/* Left-pointing triangle tail */}
          <div
            className="absolute left-0 top-5 -translate-x-full"
            style={{
              width: 0,
              height: 0,
              borderTop: "9px solid transparent",
              borderBottom: "9px solid transparent",
              borderRight: `10px solid ${cfg.bgColor}`,
              filter: "drop-shadow(-1px 0 0 rgba(212,175,110,0.15))",
            }}
          />

          {/* Bubble body */}
          <div
            className="rounded-2xl rounded-tl-sm px-4 py-3 text-sm font-sans leading-relaxed transition-colors duration-300"
            style={{
              background: cfg.bgColor,
              border: `1px solid ${cfg.borderColor}`,
              color: "var(--text-primary)",
            }}
          >
            {coachMessage}
          </div>
        </div>
      </div>

      {/* ── Status badge ──────────────────────────────────────────────────── */}
      <div
        className={`flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider ${cfg.color}`}
      >
        <Icon
          className={`w-4 h-4 shrink-0 ${status === "opponent" ? "animate-spin" : ""}`}
        />
        <span>{cfg.label}</span>
      </div>

      {/* ── Move history ──────────────────────────────────────────────────── */}
      {movesPlayed.length > 0 && (
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-brand-border/30" />
            <p className="font-mono text-[10px] text-brand-secondary uppercase tracking-widest">
              Moves Played
            </p>
            <div className="flex-1 h-px bg-brand-border/30" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {movesPlayed.map((san, i) => {
              const moveNum = Math.floor(i / 2) + 1;
              const isWhite = i % 2 === 0;
              return (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 font-mono text-xs px-2 py-1 rounded-lg"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {isWhite && (
                    <span className="text-brand-secondary/60">{moveNum}.</span>
                  )}
                  <span className="text-brand-text">{san}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
