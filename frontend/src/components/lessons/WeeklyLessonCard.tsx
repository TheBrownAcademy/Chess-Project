import React from 'react';
import { Calendar, Crown, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router';

interface WeeklyLessonCardProps {
  remaining: number;
  max: number;
  resetDaysLeft: number;
}

export const WeeklyLessonCard: React.FC<WeeklyLessonCardProps> = ({
  remaining = 3,
  max = 5,
  resetDaysLeft = 3,
}) => {
  const navigate = useNavigate();
  const percentage = Math.round((remaining / max) * 100);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand-border/60 bg-gradient-to-b from-[#0F1426] to-[#080B14] p-5 shadow-xl shadow-black/50 space-y-4 group">
      {/* Top Gold Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-gold to-amber-600" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-brand-accent/10 border border-brand-accent/30 text-brand-accent">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Weekly Lessons Remaining
            </h3>
            <p className="text-[11px] text-brand-secondary">Free Tier Limit</p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-brand-accent/20 text-brand-accent border border-brand-accent/30">
          {remaining} / {max}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden p-0.5 border border-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 via-gold to-yellow-300 transition-all duration-500 shadow-[0_0_10px_rgba(212,175,110,0.5)]"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-brand-secondary">
          <span>{remaining} lessons left</span>
          <span>Resets in {resetDaysLeft} days</span>
        </div>
      </div>

      {/* Premium Upgrade Banner CTA */}
      <div className="pt-2">
        <button
          onClick={() => navigate('/premium')}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-brand-accent/15 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-brand-accent/40 text-brand-accent text-xs font-bold transition-all duration-200 group/btn cursor-pointer shadow-md"
        >
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-brand-accent fill-brand-accent/20" />
            <span>Unlock Unlimited Lessons</span>
          </div>
          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};
