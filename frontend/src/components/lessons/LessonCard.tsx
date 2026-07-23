import React, { useState } from 'react';
import { Bookmark, Clock, BookOpen, Play, CheckCircle2, Star, Users } from 'lucide-react';
import type { Lesson } from '../../types/lessons';

interface LessonCardProps {
  lesson: Lesson;
  onSelectLesson?: (lesson: Lesson) => void;
  onToggleBookmark?: (lessonId: string, e: React.MouseEvent) => void;
}

const CATEGORY_PIECE: Record<string, string> = {
  Openings: '♞',
  Strategy: '♚',
  Tactics: '♛',
  Endgames: '♜',
  'Master Games': '♝',
};

const MOCK_RATINGS: Record<string, { rating: number; students: number }> = {
  'lesson-1': { rating: 4.8, students: 48920 },
  'lesson-2': { rating: 4.7, students: 33210 },
  'lesson-3': { rating: 4.9, students: 52340 },
  'lesson-4': { rating: 4.6, students: 28190 },
  'lesson-5': { rating: 4.8, students: 21750 },
  'lesson-6': { rating: 4.5, students: 17320 },
  'lesson-7': { rating: 4.6, students: 14890 },
  'lesson-8': { rating: 4.9, students: 41230 },
  'lesson-9': { rating: 4.7, students: 18443 },
  'lesson-10': { rating: 4.6, students: 12099 },
  'lesson-11': { rating: 4.8, students: 22310 },
  'lesson-12': { rating: 4.9, students: 9870 },
};

const NEW_LESSON_IDS = new Set(['lesson-11', 'lesson-12', 'lesson-9']);

const getLevelColor = (level: Lesson['level']) => {
  switch (level) {
    case 'Beginner':    return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    case 'Intermediate':return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    case 'Advanced':    return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    case 'Master':      return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
    default:            return 'bg-brand-accent/15 text-brand-accent border-brand-accent/30';
  }
};

export const LessonCard: React.FC<LessonCardProps> = ({ lesson, onSelectLesson, onToggleBookmark }) => {
  const [isBookmarked, setIsBookmarked] = useState(lesson.isBookmarked ?? false);
  const meta = MOCK_RATINGS[lesson.id] ?? { rating: 4.5, students: 9999 };
  const isNew = NEW_LESSON_IDS.has(lesson.id);
  const piece = CATEGORY_PIECE[lesson.category] ?? '♟';

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
    onToggleBookmark?.(lesson.id, e);
  };

  const stars = Math.round(meta.rating);

  return (
    <div
      onClick={() => onSelectLesson?.(lesson)}
      className="group relative flex flex-col rounded-2xl border border-brand-border/50 bg-gradient-to-b from-[#0E1324]/90 to-[#080B14] overflow-hidden shadow-lg shadow-black/40 hover:-translate-y-1.5 hover:border-brand-accent/50 hover:shadow-2xl hover:shadow-brand-accent/10 transition-all duration-300 cursor-pointer select-none"
    >
      {/* Gold top accent line on hover */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-accent/0 via-brand-accent to-brand-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      {/* Ambient hover glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-brand-accent/0 to-brand-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Thumbnail */}
      <div className={`relative w-full h-36 bg-gradient-to-br ${lesson.thumbnailGradient || 'from-slate-800 to-slate-950'} flex items-center justify-center overflow-hidden`}>
        {/* Chess grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'repeating-conic-gradient(rgba(255,255,255,0.25) 0% 25%, transparent 0% 50%)',
            backgroundSize: '20px 20px',
          }}
        />
        {/* Piece icon (large watermark) */}
        <span className="absolute text-[80px] opacity-[0.12] group-hover:opacity-[0.22] group-hover:scale-110 transition-all duration-500 pointer-events-none select-none filter drop-shadow-lg" style={{ lineHeight: 1 }}>
          {piece}
        </span>

        {/* Play button overlay */}
        <div className="relative z-10 w-11 h-11 rounded-full bg-black/50 border border-white/15 backdrop-blur-md flex items-center justify-center text-brand-accent group-hover:scale-110 group-hover:bg-brand-accent group-hover:text-black transition-all duration-300 shadow-lg">
          <Play className="w-4.5 h-4.5 fill-current ml-0.5" />
        </div>

        {/* Top-left badges */}
        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border backdrop-blur-md ${getLevelColor(lesson.level)}`}>
            {lesson.level}
          </span>
          {isNew && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-accent text-black border border-brand-accent shadow-sm">
              NEW
            </span>
          )}
        </div>

        {/* Bookmark */}
        <button
          onClick={handleBookmarkClick}
          className={`absolute top-2.5 right-2.5 p-1.5 rounded-lg border transition-all duration-200 cursor-pointer ${
            isBookmarked
              ? 'bg-brand-accent text-black border-brand-accent shadow-md'
              : 'bg-black/60 text-brand-secondary border-white/10 hover:text-white hover:bg-black/80'
          }`}
          title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Lesson'}
        >
          <Bookmark className="w-3.5 h-3.5 fill-current" />
        </button>

        {/* Duration */}
        <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/75 text-[11px] font-mono border border-white/10 flex items-center gap-1 text-brand-secondary">
          <Clock className="w-3 h-3 text-brand-accent" />
          {lesson.durationMinutes}m
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-col flex-1 p-4 space-y-2.5">
        {/* Category + Title */}
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold text-brand-accent uppercase tracking-widest">
            {lesson.category}
          </span>
          <h3 className="text-sm font-bold text-white group-hover:text-brand-accent transition-colors line-clamp-1">
            {lesson.title}
          </h3>
          <p className="text-xs text-brand-secondary line-clamp-2 leading-relaxed">
            {lesson.description}
          </p>
        </div>

        {/* Star Rating Row */}
        <div className="flex items-center gap-2 text-[11px]">
          <div className="flex items-center gap-0.5">
            {[1,2,3,4,5].map((s) => (
              <Star key={s} className={`w-3 h-3 ${s <= stars ? 'text-brand-accent fill-brand-accent' : 'text-brand-border'}`} />
            ))}
          </div>
          <span className="text-brand-secondary font-mono">{meta.rating}</span>
          <span className="text-brand-border">•</span>
          <span className="flex items-center gap-1 text-brand-secondary">
            <Users className="w-3 h-3" />
            {meta.students.toLocaleString()}
          </span>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-brand-border/30 flex items-center justify-between text-[11px] text-brand-secondary mt-auto">
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-brand-accent" />
            {lesson.lessonCount} Lessons
          </span>
          <span className="truncate max-w-[120px] text-right">{lesson.instructor}</span>
        </div>

        {/* Progress bar */}
        {lesson.progressPercent !== undefined && lesson.progressPercent > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-emerald-400 flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" />
                {lesson.progressPercent === 100 ? 'Completed' : 'In Progress'}
              </span>
              <span className="text-brand-secondary font-mono">{lesson.progressPercent}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${lesson.progressPercent === 100 ? 'bg-emerald-400' : 'bg-gradient-to-r from-amber-500 to-brand-accent'}`}
                style={{ width: `${lesson.progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
