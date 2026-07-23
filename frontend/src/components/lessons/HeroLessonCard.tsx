import React from 'react';
import { Play, Sparkles, Clock, BookOpen, CheckCircle2, Star, Users } from 'lucide-react';
import { Chessboard } from 'react-chessboard';
import type { Lesson } from '../../types/lessons';

interface HeroLessonCardProps {
  lesson: Lesson;
  onStartLesson?: (lesson: Lesson) => void;
}

const FLOATING_PIECES = [
  { symbol: '♞', x: '8%',  y: '15%', size: 'text-4xl', delay: '0s',   duration: '6s',  opacity: 0.15 },
  { symbol: '♛', x: '82%', y: '8%',  size: 'text-5xl', delay: '1.5s', duration: '7s',  opacity: 0.12 },
  { symbol: '♜', x: '15%', y: '72%', size: 'text-3xl', delay: '0.8s', duration: '5.5s',opacity: 0.10 },
  { symbol: '♝', x: '75%', y: '68%', size: 'text-3xl', delay: '2s',   duration: '8s',  opacity: 0.08 },
  { symbol: '♟', x: '50%', y: '80%', size: 'text-2xl', delay: '0.3s', duration: '6.5s',opacity: 0.08 },
];

export const HeroLessonCard: React.FC<HeroLessonCardProps> = ({ lesson, onStartLesson }) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand-accent/30 bg-gradient-to-br from-[#0E1528] via-[#0C1020] to-[#080B14] shadow-2xl shadow-black/60 group transition-all duration-300 hover:border-brand-accent/50">
      {/* Animated Floating Pieces */}
      {FLOATING_PIECES.map((p, i) => (
        <span
          key={i}
          className={`absolute ${p.size} pointer-events-none select-none`}
          style={{
            left: p.x,
            top: p.y,
            opacity: p.opacity,
            animation: `float ${p.duration} ease-in-out ${p.delay} infinite`,
          }}
        >
          {p.symbol}
        </span>
      ))}

      {/* Radial glow blobs */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-brand-accent/8 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-emerald-500/8 blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 md:p-8 items-center">
        {/* Left Content */}
        <div className="lg:col-span-7 space-y-4">
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              Next Lesson
            </span>
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-brand-accent/12 text-brand-accent border border-brand-accent/25">
              {lesson.level}
            </span>
            <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-white/5 text-brand-secondary border border-white/10">
              {lesson.category}
            </span>
          </div>

          {/* Title */}
          <div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-white tracking-wide leading-tight group-hover:text-brand-accent transition-colors duration-300">
              {lesson.title}
            </h2>
            <p className="text-sm text-brand-secondary mt-2 leading-relaxed max-w-lg">
              {lesson.description}
            </p>
          </div>

          {/* Star rating & stats */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} className={`w-3.5 h-3.5 ${s <= 5 ? 'text-brand-accent fill-brand-accent' : 'text-brand-border'}`} />
              ))}
              <span className="text-brand-secondary ml-1">4.9 (21,432)</span>
            </div>
            <span className="text-brand-border">•</span>
            <span className="flex items-center gap-1 text-brand-secondary">
              <Users className="w-3.5 h-3.5" />
              21,432 students
            </span>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-brand-secondary border-t border-b border-brand-border/30 py-3">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-brand-accent" />
              {lesson.durationMinutes} min
            </span>
            <span className="text-brand-border">•</span>
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-brand-accent" />
              {lesson.lessonCount} Challenges
            </span>
            <span className="text-brand-border">•</span>
            <span className="font-medium text-brand-text">{lesson.instructor}</span>
          </div>

          {/* Progress bar */}
          {lesson.progressPercent !== undefined && lesson.progressPercent > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-brand-secondary flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Progress
                </span>
                <span className="text-brand-accent font-bold">{lesson.progressPercent}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/5 border border-white/8 overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
                  style={{ width: `${lesson.progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => onStartLesson?.(lesson)}
              className="flex items-center gap-2.5 px-7 py-3 rounded-xl font-bold text-white text-sm bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-lg shadow-emerald-900/50 hover:shadow-emerald-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer border border-emerald-400/30"
            >
              <Play className="w-4 h-4 fill-white" />
              {lesson.progressPercent && lesson.progressPercent > 0 ? 'Continue Lesson' : 'Start Lesson'}
            </button>
            <button className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-brand-secondary border border-brand-border/50 hover:border-brand-accent/40 hover:text-white hover:bg-white/5 transition-all duration-200 cursor-pointer">
              Preview
            </button>
          </div>
        </div>

        {/* Right - Chessboard Preview */}
        <div className="lg:col-span-5 flex justify-center items-center">
          <div className="relative w-full max-w-[220px] sm:max-w-[250px] aspect-square rounded-2xl overflow-hidden border-2 border-brand-accent/30 shadow-2xl shadow-black/80 group-hover:border-brand-accent/60 transition-colors duration-500">
            <Chessboard
              position={lesson.fen || 'start'}
              boardWidth={250}
              arePiecesDraggable={false}
              customDarkSquareStyle={{ backgroundColor: '#769656' }}
              customLightSquareStyle={{ backgroundColor: '#EEEED2' }}
              customBoardStyle={{ borderRadius: '14px', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-3">
              <span className="text-[11px] text-white font-semibold bg-black/70 px-3 py-1 rounded-full border border-white/20 backdrop-blur-md">
                Opening Preview
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating animation keyframes — injected inline */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33%       { transform: translateY(-10px) rotate(3deg); }
          66%       { transform: translateY(5px) rotate(-2deg); }
        }
      `}</style>
    </div>
  );
};
