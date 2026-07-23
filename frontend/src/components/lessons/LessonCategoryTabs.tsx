import React from 'react';
import type { LessonCategory } from '../../types/lessons';
import { Sparkles, Shield, Swords, Target, Trophy, Layers } from 'lucide-react';

interface LessonCategoryTabsProps {
  activeCategory: LessonCategory;
  onSelectCategory: (category: LessonCategory) => void;
  categoryCounts?: Record<LessonCategory, number>;
}

interface CategoryConfig {
  id: LessonCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CATEGORIES: CategoryConfig[] = [
  { id: 'All', label: 'All Lessons', icon: Layers },
  { id: 'Openings', label: 'Openings', icon: Shield },
  { id: 'Strategy', label: 'Strategy', icon: Target },
  { id: 'Tactics', label: 'Tactics', icon: Swords },
  { id: 'Endgames', label: 'Endgames', icon: Sparkles },
  { id: 'Master Games', label: 'Master Games', icon: Trophy },
];

export const LessonCategoryTabs: React.FC<LessonCategoryTabsProps> = ({
  activeCategory,
  onSelectCategory,
  categoryCounts,
}) => {
  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2">
      <div className="flex items-center gap-2 min-w-max pb-1">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          const count = categoryCounts ? categoryCounts[cat.id] : undefined;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-sans text-sm font-medium transition-all duration-200 cursor-pointer select-none border ${
                isActive
                  ? 'bg-brand-accent/15 text-brand-accent border-brand-accent/50 shadow-[0_0_15px_rgba(212,175,110,0.15)] font-semibold'
                  : 'bg-brand-surface/60 text-brand-secondary border-brand-border/40 hover:text-white hover:bg-white/5 hover:border-brand-border'
              }`}
            >
              <Icon
                className={`w-4 h-4 transition-transform duration-200 ${
                  isActive ? 'text-brand-accent scale-110' : 'text-brand-secondary'
                }`}
              />
              <span>{cat.label}</span>
              {count !== undefined && (
                <span
                  className={`ml-1 px-2 py-0.5 rounded-full text-xs font-mono transition-colors ${
                    isActive
                      ? 'bg-brand-accent/25 text-brand-accent'
                      : 'bg-white/5 text-brand-secondary'
                  }`}
                >
                  {count}
                </span>
              )}

              {/* Bottom Active Glow Accent Bar */}
              {isActive && (
                <span className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-brand-accent shadow-[0_0_8px_#D4AF6E]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
