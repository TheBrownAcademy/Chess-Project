import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, Star, Users, Sparkles } from 'lucide-react';
import { CourseProgressRing } from './CourseProgressRing';
import type { Course } from '../../data/mockCourses';

interface FeaturedCourseCarouselProps {
  courses: Course[];
  onSelectCourse?: (course: Course) => void;
}

const getLevelColor = (level: Course['level']) => {
  switch (level) {
    case 'Beginner': return 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';
    case 'Intermediate': return 'text-amber-400 bg-amber-500/15 border-amber-500/30';
    case 'Advanced': return 'text-rose-400 bg-rose-500/15 border-rose-500/30';
    case 'Master': return 'text-purple-400 bg-purple-500/15 border-purple-500/30';
    default: return 'text-brand-accent bg-brand-accent/15 border-brand-accent/30';
  }
};

export const FeaturedCourseCarousel: React.FC<FeaturedCourseCarouselProps> = ({
  courses,
  onSelectCourse,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 320;
    scrollRef.current.scrollBy({ left: dir === 'right' ? amount : -amount, behavior: 'smooth' });
  };

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-5 rounded-full bg-brand-accent" />
          <h2 className="text-lg font-bold text-white tracking-wide">Continue Learning</h2>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-accent/15 text-brand-accent border border-brand-accent/25 uppercase tracking-widest">
            My Courses
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            className="w-8 h-8 rounded-full bg-brand-surface/80 border border-brand-border/50 text-brand-secondary hover:text-white hover:border-brand-accent/50 flex items-center justify-center transition-all duration-200 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-8 h-8 rounded-full bg-brand-surface/80 border border-brand-border/50 text-brand-secondary hover:text-white hover:border-brand-accent/50 flex items-center justify-center transition-all duration-200 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scroll Container */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto no-scrollbar pb-2"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {courses.map((course) => (
          <div
            key={course.id}
            onClick={() => onSelectCourse?.(course)}
            className="flex-shrink-0 w-72 group relative overflow-hidden rounded-2xl border border-brand-border/50 bg-gradient-to-b from-[#0E1324]/95 to-[#080B14] cursor-pointer hover:-translate-y-1 hover:border-brand-accent/50 hover:shadow-xl hover:shadow-brand-accent/10 transition-all duration-300"
            style={{ scrollSnapAlign: 'start' }}
          >
            {/* Thumbnail */}
            <div className={`relative h-36 bg-gradient-to-br ${course.thumbnailGradient} flex items-center justify-center overflow-hidden`}>
              {/* Animated chess board pattern */}
              <div className="absolute inset-0 opacity-[0.06]"
                style={{
                  backgroundImage: 'repeating-conic-gradient(rgba(255,255,255,0.3) 0% 25%, transparent 0% 50%)',
                  backgroundSize: '24px 24px',
                }}
              />
              {/* Giant Piece Icon */}
              <span className="text-6xl opacity-30 group-hover:opacity-50 group-hover:scale-110 transition-all duration-500 select-none pointer-events-none filter drop-shadow-lg">
                {course.pieceSymbol}
              </span>
              {/* New Badge */}
              {course.isNew && (
                <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-accent text-black flex items-center gap-1 shadow-lg">
                  <Sparkles className="w-2.5 h-2.5" />
                  NEW
                </div>
              )}
              {/* Progress Ring overlay */}
              <div className="absolute bottom-3 right-3">
                <CourseProgressRing completed={course.completedChapters} total={course.chapterCount} size={44} strokeWidth={3.5} />
              </div>
            </div>

            {/* Card Body */}
            <div className="p-4 space-y-3">
              {/* Category + Level */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-brand-accent uppercase tracking-wider">
                  {course.category}
                </span>
                <span className={`px-1.5 py-px rounded text-[10px] font-semibold border ${getLevelColor(course.level)}`}>
                  {course.level}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-sm font-bold text-white group-hover:text-brand-accent transition-colors line-clamp-1">
                {course.title}
              </h3>
              <p className="text-xs text-brand-secondary line-clamp-2 leading-relaxed">
                {course.description}
              </p>

              {/* Stats row */}
              <div className="flex items-center gap-3 text-[11px] text-brand-secondary">
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-brand-accent fill-brand-accent" />
                  <span className="font-semibold text-white">{course.rating}</span>
                </span>
                <span className="text-brand-border">•</span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {course.studentCount.toLocaleString()}
                </span>
                <span className="text-brand-border">•</span>
                <span>{course.completedChapters}/{course.chapterCount} chapters</span>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(course.completedChapters / course.chapterCount) * 100}%`,
                      background: course.completedChapters === course.chapterCount
                        ? '#34d399'
                        : 'linear-gradient(90deg, #D4AF6E, #B8934A)',
                    }}
                  />
                </div>
              </div>

              {/* CTA */}
              <button className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer border border-brand-accent/30 text-brand-accent hover:bg-brand-accent hover:text-black group-hover:shadow-md">
                <Play className="w-3.5 h-3.5 fill-current" />
                {course.completedChapters === 0 ? 'Start Course' : course.completedChapters === course.chapterCount ? 'Review Course' : 'Resume'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
