import React from 'react';
import { Award, Shield, Zap, Crown, Check, Lock, ChevronUp } from 'lucide-react';
import type { LearningRankInfo, LearningRankName } from '../../types/lessons';

interface LearningRankCardProps {
  currentRank: LearningRankName;
  currentXP: number;
  nextRankXP: number;
  ranks: LearningRankInfo[];
}

export const LearningRankCard: React.FC<LearningRankCardProps> = ({
  currentRank = 'Knight',
  currentXP = 1450,
  nextRankXP = 2000,
  ranks,
}) => {
  const getRankIcon = (name: LearningRankName, isCurrent: boolean) => {
    const iconClass = `w-4 h-4 ${isCurrent ? 'text-black' : 'text-brand-accent'}`;
    switch (name) {
      case 'King':
        return <Award className={iconClass} />;
      case 'Queen':
        return <Crown className={iconClass} />;
      case 'Rook':
        return <Shield className={iconClass} />;
      case 'Bishop':
        return <Zap className={iconClass} />;
      case 'Knight':
        return <Shield className={iconClass} />;
      case 'Pawn':
      default:
        return <ChevronUp className={iconClass} />;
    }
  };

  const progressPercent = Math.round((currentXP / nextRankXP) * 100);

  return (
    <div className="rounded-2xl border border-brand-border/60 bg-gradient-to-b from-[#0F1426] to-[#080B14] p-5 shadow-xl shadow-black/50 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-brand-accent/15 border border-brand-accent/30 text-brand-accent">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Learning Rank
            </h3>
            <p className="text-[11px] text-brand-secondary">Skill Progression</p>
          </div>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-accent text-black border border-brand-accent shadow-sm">
          {currentRank}
        </span>
      </div>

      {/* XP Progress Bar to Next Rank */}
      <div className="p-3 rounded-xl bg-brand-surface/60 border border-brand-border/40 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-brand-secondary font-medium">Rank XP</span>
          <span className="text-brand-accent font-mono font-bold">
            {currentXP} / {nextRankXP} XP
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden p-0.5 border border-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-accent to-yellow-300 transition-all duration-500 shadow-[0_0_8px_rgba(212,175,110,0.4)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-[11px] text-brand-secondary/80 text-right">
          {nextRankXP - currentXP} XP until Bishop rank
        </p>
      </div>

      {/* Ranks Ladder List */}
      <div className="space-y-1.5 pt-1">
        {ranks.map((rank) => {
          const isCurrent = rank.name === currentRank;

          return (
            <div
              key={rank.name}
              className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 border ${
                isCurrent
                  ? 'bg-brand-accent/15 border-brand-accent/60 shadow-[0_0_12px_rgba(212,175,110,0.15)]'
                  : rank.isAchieved
                  ? 'bg-white/5 border-white/5 text-brand-secondary'
                  : 'bg-transparent border-transparent opacity-50 text-brand-secondary'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
                    isCurrent
                      ? 'bg-brand-accent border-brand-accent shadow-md'
                      : rank.isAchieved
                      ? 'bg-brand-surface border-brand-border/60'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  {getRankIcon(rank.name, isCurrent)}
                </div>

                <div>
                  <span
                    className={`text-xs font-semibold ${
                      isCurrent
                        ? 'text-brand-accent'
                        : rank.isAchieved
                        ? 'text-white'
                        : 'text-brand-secondary'
                    }`}
                  >
                    {rank.name}
                  </span>
                  <p className="text-[10px] text-brand-secondary font-mono">
                    {rank.minXP} XP
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div>
                {isCurrent ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-accent text-black uppercase tracking-wider">
                    Current
                  </span>
                ) : rank.isAchieved ? (
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full bg-white/5 text-brand-secondary flex items-center justify-center">
                    <Lock className="w-3 h-3" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
