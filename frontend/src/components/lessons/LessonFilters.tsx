import React from 'react';
import { Filter, RotateCcw, ArrowUpDown, User, SlidersHorizontal } from 'lucide-react';
import type { LessonLevel, SortOption } from '../../types/lessons';

interface LessonFiltersProps {
  level: LessonLevel;
  onLevelChange: (level: LessonLevel) => void;
  theme: string;
  onThemeChange: (theme: string) => void;
  instructor: string;
  onInstructorChange: (instructor: string) => void;
  sortBy: SortOption;
  onSortByChange: (sort: SortOption) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

const LEVELS: LessonLevel[] = ['All', 'Beginner', 'Intermediate', 'Advanced', 'Master'];

const THEMES = [
  'All Themes',
  'Fundamentals',
  'Tactical Motifs',
  'Opening Prep',
  'Endgames',
  'Calculation',
];

const INSTRUCTORS = [
  'All Instructors',
  'GM Hikaru Nakamura',
  'GM Magnus Carlsen',
  'GM Levy Rozman',
  'IM Anna Rudolf',
  'GM Daniel Naroditsky',
];

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'popular', label: 'Most Popular' },
  { id: 'newest', label: 'Newest Lessons' },
  { id: 'level_asc', label: 'Difficulty: Low to High' },
  { id: 'level_desc', label: 'Difficulty: High to Low' },
];

export const LessonFilters: React.FC<LessonFiltersProps> = ({
  level,
  onLevelChange,
  theme,
  onThemeChange,
  instructor,
  onInstructorChange,
  sortBy,
  onSortByChange,
  onResetFilters,
  hasActiveFilters,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-brand-surface/50 border border-brand-border/40 backdrop-blur-md">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Filter Label */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-secondary uppercase tracking-wider px-1">
          <Filter className="w-3.5 h-3.5 text-brand-accent" />
          <span>Filters:</span>
        </div>

        {/* Level Dropdown */}
        <div className="relative">
          <select
            value={level}
            onChange={(e) => onLevelChange(e.target.value as LessonLevel)}
            aria-label="Filter by difficulty level"
            className="appearance-none bg-brand-bg/90 text-xs font-medium text-brand-text border border-brand-border/60 rounded-lg px-3 py-1.5 pr-7 focus:outline-none focus:border-brand-accent transition-colors cursor-pointer"
          >
            {LEVELS.map((lvl) => (
              <option key={lvl} value={lvl} className="bg-brand-surface text-brand-text">
                Level: {lvl}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-brand-secondary">
            <SlidersHorizontal className="w-3 h-3" />
          </div>
        </div>

        {/* Theme Dropdown */}
        <div className="relative">
          <select
            value={theme}
            onChange={(e) => onThemeChange(e.target.value)}
            aria-label="Filter by lesson theme"
            className="appearance-none bg-brand-bg/90 text-xs font-medium text-brand-text border border-brand-border/60 rounded-lg px-3 py-1.5 pr-7 focus:outline-none focus:border-brand-accent transition-colors cursor-pointer"
          >
            {THEMES.map((t) => (
              <option key={t} value={t} className="bg-brand-surface text-brand-text">
                {t}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-brand-secondary">
            <SlidersHorizontal className="w-3 h-3" />
          </div>
        </div>

        {/* Instructor Dropdown */}
        <div className="relative hidden md:block">
          <select
            value={instructor}
            onChange={(e) => onInstructorChange(e.target.value)}
            aria-label="Filter by instructor"
            className="appearance-none bg-brand-bg/90 text-xs font-medium text-brand-text border border-brand-border/60 rounded-lg px-3 py-1.5 pr-7 focus:outline-none focus:border-brand-accent transition-colors cursor-pointer"
          >
            {INSTRUCTORS.map((ins) => (
              <option key={ins} value={ins} className="bg-brand-surface text-brand-text">
                {ins}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-brand-secondary">
            <User className="w-3 h-3" />
          </div>
        </div>

        {/* Reset Button */}
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 transition-colors cursor-pointer"
            title="Reset all filters"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Sort Dropdown */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as SortOption)}
            aria-label="Sort lessons by"
            className="appearance-none bg-brand-accent/10 text-xs font-semibold text-brand-accent border border-brand-accent/30 rounded-lg px-3 py-1.5 pr-7 focus:outline-none focus:border-brand-accent transition-colors cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id} className="bg-brand-surface text-brand-text">
                Sort: {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-brand-accent">
            <ArrowUpDown className="w-3 h-3" />
          </div>
        </div>
      </div>
    </div>
  );
};
