/**
 * OpeningProgressBar.tsx
 *
 * Displays step progress: "Step N of M" + a gold-filled progress bar.
 * Consistent with the existing PuzzlePage stat chips style.
 */

interface OpeningProgressBarProps {
  currentUserStep: number;
  totalUserSteps: number;
  progress: number; // 0–1
}

export function OpeningProgressBar({
  currentUserStep,
  totalUserSteps,
  progress,
}: OpeningProgressBarProps) {
  const pct = Math.round(progress * 100);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-brand-secondary uppercase tracking-widest">
          Progress
        </span>
        <span className="font-mono text-xs text-brand-accent font-semibold">
          {currentUserStep} / {totalUserSteps}
        </span>
      </div>

      {/* Track */}
      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
        {/* Fill */}
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            background:
              "linear-gradient(90deg, #B8934A 0%, #D4AF6E 60%, #E8C88A 100%)",
            boxShadow: "0 0 8px rgba(212,175,110,0.4)",
          }}
        />
      </div>
    </div>
  );
}
