/**
 * OpeningCompletionCard.tsx
 *
 * Full-width congratulations card shown when all steps are complete.
 * Shows the opening name, a summary, and lets the user restart.
 */

import { Trophy, RotateCcw, BookMarked } from "lucide-react";
import type { Opening } from "../../types/opening";

interface OpeningCompletionCardProps {
  opening: Opening;
  movesPlayed: string[];
  onPlayAgain: () => void;
}

export function OpeningCompletionCard({
  opening,
  movesPlayed,
  onPlayAgain,
}: OpeningCompletionCardProps) {
  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden p-8 flex flex-col items-center gap-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500"
      style={{
        background:
          "linear-gradient(135deg, rgba(12,16,32,0.95) 0%, rgba(8,11,20,0.98) 100%)",
        border: "1px solid rgba(212,175,110,0.25)",
        boxShadow:
          "0 0 0 1px rgba(212,175,110,0.10), 0 32px 80px rgba(0,0,0,0.6), 0 0 40px rgba(212,175,110,0.06)",
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(212,175,110,0.08) 0%, transparent 65%)",
        }}
      />

      {/* Trophy icon */}
      <div
        className="relative flex items-center justify-center w-16 h-16 rounded-2xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(212,175,110,0.2), rgba(212,175,110,0.06))",
          border: "1px solid rgba(212,175,110,0.35)",
          boxShadow: "0 0 24px rgba(212,175,110,0.15)",
        }}
      >
        <Trophy className="w-8 h-8 text-brand-accent" />
      </div>

      {/* Heading */}
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-3xl font-semibold text-brand-text">
          Opening Mastered!
        </h2>
        <p className="font-sans text-sm text-brand-secondary max-w-xs">
          You've completed the{" "}
          <span className="text-brand-accent font-medium">{opening.title}</span>{" "}
          in {movesPlayed.length} moves. Well done!
        </p>
      </div>

      {/* Move summary */}
      <div
        className="w-full max-w-sm rounded-xl p-4 flex flex-col gap-2"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <BookMarked className="w-3.5 h-3.5 text-brand-accent/70" />
          <span className="font-mono text-[10px] text-brand-secondary uppercase tracking-widest">
            Sequence Played
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 justify-center">
          {movesPlayed.map((san, i) => {
            const moveNum = Math.floor(i / 2) + 1;
            const isWhite = i % 2 === 0;
            return (
              <span
                key={i}
                className="inline-flex items-center gap-0.5 font-mono text-xs px-2 py-1 rounded-lg"
                style={{
                  background: "rgba(212,175,110,0.07)",
                  border: "1px solid rgba(212,175,110,0.15)",
                }}
              >
                {isWhite && (
                  <span className="text-brand-secondary/60">{moveNum}.</span>
                )}
                <span className="text-brand-accent">{san}</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onPlayAgain}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider font-semibold bg-white/5 border border-white/10 hover:border-brand-accent/40 text-brand-secondary hover:text-white transition-all duration-300 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Play Again
        </button>
      </div>
    </div>
  );
}
