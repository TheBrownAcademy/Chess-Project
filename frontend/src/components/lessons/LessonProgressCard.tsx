import React from 'react';
import { Flame, Clock, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react';
import type { UserLessonStats } from '../../types/lessons';

interface LessonProgressCardProps {
  stats: UserLessonStats;
}

export const LessonProgressCard: React.FC<LessonProgressCardProps> = ({ stats }) => {
  const activityDays = [
    { day: 'M', active: true },
    { day: 'T', active: true },
    { day: 'W', active: true },
    { day: 'T', active: true },
    { day: 'F', active: true },
    { day: 'S', active: true },
    { day: 'S', active: true },
  ];

  return (
    <div className="rounded-2xl border border-brand-border/60 bg-gradient-to-b from-[#0F1426] to-[#080B14] p-5 shadow-xl shadow-black/50 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
          <TrendingUp className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide">
            Your Progress
          </h3>
          <p className="text-[11px] text-brand-secondary">Learning Stats</p>
        </div>
      </div>

      {/* Main Stats 3-Grid */}
      <div className="grid grid-cols-3 gap-2">
        {/* Completed */}
        <div className="p-3 rounded-xl bg-brand-surface/60 border border-brand-border/40 text-center space-y-1">
          <div className="flex justify-center text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-lg font-bold text-white font-mono">{stats.lessonsCompleted}</p>
          <p className="text-[10px] text-brand-secondary font-medium uppercase tracking-wider">
            Completed
          </p>
        </div>

        {/* Hours Studied */}
        <div className="p-3 rounded-xl bg-brand-surface/60 border border-brand-border/40 text-center space-y-1">
          <div className="flex justify-center text-brand-accent">
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-lg font-bold text-white font-mono">{stats.hoursStudied}h</p>
          <p className="text-[10px] text-brand-secondary font-medium uppercase tracking-wider">
            Studied
          </p>
        </div>

        {/* Streak */}
        <div className="p-3 rounded-xl bg-brand-surface/60 border border-brand-border/40 text-center space-y-1">
          <div className="flex justify-center text-amber-500">
            <Flame className="w-4 h-4 fill-amber-500/30 animate-pulse" />
          </div>
          <p className="text-lg font-bold text-amber-400 font-mono">{stats.streakDays}d</p>
          <p className="text-[10px] text-brand-secondary font-medium uppercase tracking-wider">
            Streak 🔥
          </p>
        </div>
      </div>

      {/* Streak Activity Dots */}
      <div className="p-3 rounded-xl bg-brand-surface/40 border border-brand-border/30 space-y-2">
        <div className="flex items-center justify-between text-xs text-brand-secondary">
          <span>Weekly Activity</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            7 Day Streak!
          </span>
        </div>

        <div className="flex items-center justify-between gap-1 pt-1">
          {activityDays.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono transition-all ${
                  item.active
                    ? 'bg-emerald-500 text-black shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                    : 'bg-white/5 text-brand-secondary border border-white/5'
                }`}
              >
                ✓
              </div>
              <span className="text-[10px] text-brand-secondary font-mono">{item.day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
