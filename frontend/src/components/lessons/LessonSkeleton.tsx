import React from 'react';

export const LessonSkeleton: React.FC = () => {
  return (
    <div className="rounded-xl border border-brand-border/40 bg-brand-surface/40 p-4 sm:p-5 space-y-4 animate-pulse">
      {/* Thumbnail Skeleton */}
      <div className="w-full h-32 sm:h-36 rounded-lg bg-white/5" />

      {/* Text Lines */}
      <div className="space-y-2">
        <div className="w-1/3 h-3 rounded bg-white/10" />
        <div className="w-3/4 h-5 rounded bg-white/10" />
        <div className="w-full h-3 rounded bg-white/5" />
        <div className="w-4/5 h-3 rounded bg-white/5" />
      </div>

      {/* Footer Line */}
      <div className="pt-3 border-t border-brand-border/30 flex items-center justify-between">
        <div className="w-1/4 h-3 rounded bg-white/10" />
        <div className="w-1/4 h-3 rounded bg-white/10" />
      </div>
    </div>
  );
};
