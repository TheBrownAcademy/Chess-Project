/**
 * OpeningsPage.tsx
 *
 * The /openings route. Composes all opening trainer components.
 *
 * Layout (desktop):
 *   ┌──────────────────────────────────────────────┐
 *   │  ← Back     "The Italian Game"   Progress   │
 *   ├───────────────────────┬──────────────────────┤
 *   │                       │  Coach Panel         │
 *   │   OpeningBoard        │  (message + status)  │
 *   │                       │  Move History        │
 *   │                       │  [Reset]             │
 *   └───────────────────────┴──────────────────────┘
 *
 * On completion, the board is replaced by OpeningCompletionCard.
 */

import { useNavigate } from "react-router";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { italianGame } from "../data/openings/italianGame";
import { useOpeningTrainer } from "../hooks/useOpeningTrainer";
import { OpeningBoard } from "../components/openings/OpeningBoard";
import { OpeningCoachPanel } from "../components/openings/OpeningCoachPanel";
import { OpeningProgressBar } from "../components/openings/OpeningProgressBar";
import { OpeningCompletionCard } from "../components/openings/OpeningCompletionCard";
import { soundManager } from "../utils/SoundManager";

// V1: hardcoded to Italian Game. V2: read slug from URL param.
const OPENING = italianGame;

export default function OpeningsPage() {
  const navigate = useNavigate();
  const trainer = useOpeningTrainer(OPENING);

  const {
    fen,
    boardOrientation,
    status,
    currentStepIndex,
    totalSteps,
    progress,
    coachMessage,
    squareStyles,
    onPieceDrop,
    reset,
    movesPlayed,
  } = trainer;

  const isComplete = status === "complete";
  const allowDragging = status === "playing";

  const ringStyle: "none" | "wrong" | "complete" =
    status === "wrong" ? "wrong" : isComplete ? "complete" : "none";

  // How many user steps have been completed
  const userStepsDone = OPENING.steps
    .slice(0, currentStepIndex)
    .filter((s) => !s.isOpponentMove).length;

  return (
    <div className="min-h-screen flex flex-col px-4 sm:px-6 lg:px-8 py-6 gap-6 max-w-6xl mx-auto w-full">
      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Back button */}
        <button
          onClick={() => {
            soundManager.playButtonClick();
            navigate(-1);
          }}
          className="flex items-center gap-1.5 text-brand-secondary hover:text-white text-sm font-sans transition-colors duration-200 cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
          <span>Back</span>
        </button>

        {/* Opening title + ECO */}
        <div className="flex flex-col items-center gap-0.5 flex-1 text-center">
          {OPENING.eco && (
            <span className="font-mono text-[10px] text-brand-accent uppercase tracking-widest">
              ECO {OPENING.eco}
            </span>
          )}
          <h1 className="font-display text-xl sm:text-2xl font-semibold text-brand-text leading-tight">
            {OPENING.title}
          </h1>
          <span
            className="font-mono text-[10px] px-2 py-0.5 rounded-full border mt-0.5"
            style={{
              color: "rgba(212,175,110,0.7)",
              borderColor: "rgba(212,175,110,0.2)",
              background: "rgba(212,175,110,0.06)",
            }}
          >
            {OPENING.difficulty}
          </span>
        </div>

        {/* Reset button */}
        <button
          onClick={() => {
            soundManager.playButtonClick();
            reset();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-brand-secondary hover:text-white text-xs font-mono uppercase tracking-wider hover:bg-white/5 border border-transparent hover:border-brand-border/40 transition-all duration-200 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* ── Progress bar ─────────────────────────────────────────────────────── */}
      <OpeningProgressBar
        currentUserStep={isComplete ? totalSteps : userStepsDone}
        totalUserSteps={totalSteps}
        progress={progress}
      />

      {/* ── Main content: board + coach ───────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1">
        {/* Board column */}
        <div className="flex-1 flex flex-col items-center gap-4">
          {isComplete ? (
            <OpeningCompletionCard
              opening={OPENING}
              movesPlayed={movesPlayed}
              onPlayAgain={() => {
                soundManager.playButtonClick();
                reset();
              }}
            />
          ) : (
            <>
              <OpeningBoard
                fen={fen}
                boardOrientation={boardOrientation}
                squareStyles={squareStyles}
                onPieceDrop={onPieceDrop}
                allowDragging={allowDragging}
                ringStyle={ringStyle}
              />

              {/* Below-board status pill */}
              <div className="h-8 flex items-center justify-center">
                {status === "wrong" ? (
                  <span className="font-mono uppercase tracking-wider text-xs font-bold text-rose-400 flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full animate-bounce">
                    Incorrect move — try again
                  </span>
                ) : status === "opponent" ? (
                  <span className="font-mono uppercase tracking-wider text-xs font-bold text-brand-secondary flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                    <span
                      className="w-2 h-2 rounded-full bg-brand-secondary animate-pulse"
                    />
                    Opponent thinking…
                  </span>
                ) : (
                  <span className="font-mono uppercase tracking-wider text-xs font-bold text-brand-accent flex items-center gap-1.5 bg-brand-accent/5 border border-brand-accent/15 px-3 py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
                    Make the highlighted move
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Coach panel column */}
        {!isComplete && (
          <div
            className="lg:w-72 xl:w-80 rounded-2xl p-5 flex flex-col shrink-0"
            style={{
              background: "rgba(8,11,20,0.7)",
              border: "1px solid rgba(212,175,110,0.12)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}
          >
            <OpeningCoachPanel
              coachMessage={coachMessage}
              status={status}
              movesPlayed={movesPlayed}
            />
          </div>
        )}
      </div>

      {/* ── Opening description (footer) ──────────────────────────────────────── */}
      {!isComplete && (
        <p className="font-sans text-xs text-brand-secondary/60 text-center max-w-lg mx-auto leading-relaxed">
          {OPENING.description}
        </p>
      )}
    </div>
  );
}
