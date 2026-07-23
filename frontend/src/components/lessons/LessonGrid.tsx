import React from 'react';
import type { Lesson } from '../../types/lessons';
import { LessonCard } from './LessonCard';
import { SearchX, RotateCcw } from 'lucide-react';
import { LessonSkeleton } from './LessonSkeleton';

interface LessonGridProps {
  lessons: Lesson[];
  isLoading?: boolean;
  onSelectLesson?: (lesson: Lesson) => void;
  onToggleBookmark?: (lessonId: string, e: React.MouseEvent) => void;
  onResetSearch?: () => void;
}

export const LessonGrid: React.FC<LessonGridProps> = ({
  lessons,
  isLoading = false,
  onSelectLesson,
  onToggleBookmark,
  onResetSearch,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, idx) => (
          <LessonSkeleton key={idx} />
        ))}
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl border border-dashed border-brand-border/60 bg-brand-surface/30 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center text-brand-secondary">
          <SearchX className="w-7 h-7" />
        </div>
        <div className="max-w-md space-y-1">
          <h3 className="text-lg font-bold text-white">No Lessons Found</h3>
          <p className="text-sm text-brand-secondary">
            We couldn't find any lessons matching your current filters or search query.
          </p>
        </div>
        {onResetSearch && (
          <button
            onClick={onResetSearch}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-accent/15 text-brand-accent hover:bg-brand-accent/25 border border-brand-accent/40 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Search & Filters</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {lessons.map((lesson) => (
        <LessonCard
          key={lesson.id}
          lesson={lesson}
          onSelectLesson={onSelectLesson}
          onToggleBookmark={onToggleBookmark}
        />
      ))}
    </div>
  );
};
