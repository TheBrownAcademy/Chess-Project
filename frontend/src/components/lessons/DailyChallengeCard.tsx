import React, { useState, useEffect } from 'react';
import { Zap, Timer, ChevronRight } from 'lucide-react';

interface DailyChallengeCardProps {
  onSolve?: () => void;
}

export const DailyChallengeCard: React.FC<DailyChallengeCardProps> = ({ onSolve }) => {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    // Calculate seconds until midnight UTC
    const now = new Date();
    const midnight = new Date();
    midnight.setUTCHours(24, 0, 0, 0);
    return Math.floor((midnight.getTime() - now.getTime()) / 1000);
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand-border/60 bg-gradient-to-b from-[#0F1426] to-[#080B14] p-5 shadow-xl shadow-black/50 space-y-4">
      {/* Top Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-brand-accent to-orange-500" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-yellow-500/15 border border-yellow-500/30">
            <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400/40" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Daily Challenge</h3>
            <p className="text-[11px] text-brand-secondary">Tactic of the Day</p>
          </div>
        </div>
        {/* Countdown */}
        <div className="flex items-center gap-1 text-[11px] font-mono font-semibold text-brand-secondary">
          <Timer className="w-3 h-3 text-brand-accent" />
          <span>{pad(hours)}:{pad(minutes)}:{pad(seconds)}</span>
        </div>
      </div>

      {/* Mini Chess Board Preview */}
      <div className="rounded-xl overflow-hidden border border-brand-border/40 aspect-square w-full max-w-[160px] mx-auto">
        <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
          {Array.from({ length: 64 }).map((_, i) => {
            const row = Math.floor(i / 8);
            const col = i % 8;
            const isLight = (row + col) % 2 === 0;
            // Minimal piece hints
            const pieces: Record<number, string> = {
              4: '♚', 3: '♛', 11: '♜', 20: '♞', 59: '♔', 60: '♕',
            };
            return (
              <div
                key={i}
                className="flex items-center justify-center"
                style={{
                  backgroundColor: isLight ? '#EEEED2' : '#769656',
                  fontSize: '9px',
                  lineHeight: 1,
                  color: pieces[i] && [4, 3, 11, 20].includes(i) ? '#1a1a1a' : '#ffffff',
                }}
              >
                {pieces[i] || ''}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'Rating', value: '1,450' },
          { label: 'Theme', value: 'Fork' },
          { label: 'Solved', value: '2.1k' },
        ].map((stat) => (
          <div key={stat.label} className="px-2 py-2 rounded-lg bg-brand-surface/60 border border-brand-border/30">
            <p className="text-[10px] text-brand-secondary uppercase tracking-wide">{stat.label}</p>
            <p className="text-xs font-bold text-white mt-0.5">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={onSolve}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-400 border border-yellow-500/40 transition-all duration-200 cursor-pointer group"
      >
        <Zap className="w-3.5 h-3.5 fill-yellow-400/30" />
        <span>Solve Today's Puzzle</span>
        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
};
