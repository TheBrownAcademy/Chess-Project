import React, { useState, useMemo } from 'react';
import { HeroLessonCard } from '../components/lessons/HeroLessonCard';
import { LessonCategoryTabs } from '../components/lessons/LessonCategoryTabs';
import { LessonSearchBar } from '../components/lessons/LessonSearchBar';
import { LessonFilters } from '../components/lessons/LessonFilters';
import { LessonGrid } from '../components/lessons/LessonGrid';
import { WeeklyLessonCard } from '../components/lessons/WeeklyLessonCard';
import { LearningRankCard } from '../components/lessons/LearningRankCard';
import { LessonProgressCard } from '../components/lessons/LessonProgressCard';
import { FeaturedCourseCarousel } from '../components/lessons/FeaturedCourseCarousel';
import { DailyChallengeCard } from '../components/lessons/DailyChallengeCard';

import { HERO_LESSON, MOCK_LESSONS, MOCK_USER_STATS, MOCK_RANKS } from '../data/mockLessons';
import { MOCK_COURSES } from '../data/mockCourses';
import type { LessonCategory, LessonLevel, SortOption, Lesson } from '../types/lessons';
import { GraduationCap, BookOpen, Sparkles, Flame } from 'lucide-react';
import { useNavigate } from 'react-router';

export default function LessonsPage() {
  const navigate = useNavigate();

  // Filter & Search State
  const [activeCategory, setActiveCategory] = useState<LessonCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<LessonLevel>('All');
  const [selectedTheme, setSelectedTheme] = useState('All Themes');
  const [selectedInstructor, setSelectedInstructor] = useState('All Instructors');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [lessons, setLessons] = useState<Lesson[]>(MOCK_LESSONS);

  const handleToggleBookmark = (lessonId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLessons((prev) =>
      prev.map((item) => item.id === lessonId ? { ...item, isBookmarked: !item.isBookmarked } : item)
    );
  };

  const handleResetFilters = () => {
    setActiveCategory('All');
    setSearchQuery('');
    setSelectedLevel('All');
    setSelectedTheme('All Themes');
    setSelectedInstructor('All Instructors');
    setSortBy('popular');
  };

  const hasActiveFilters =
    activeCategory !== 'All' || searchQuery.trim() !== '' || selectedLevel !== 'All' ||
    selectedTheme !== 'All Themes' || selectedInstructor !== 'All Instructors' || sortBy !== 'popular';

  const categoryCounts = useMemo(() => {
    const counts: Record<LessonCategory, number> = {
      All: lessons.length, Openings: 0, Strategy: 0, Tactics: 0, Endgames: 0, 'Master Games': 0,
    };
    lessons.forEach((l) => { if (counts[l.category] !== undefined) counts[l.category] += 1; });
    return counts;
  }, [lessons]);

  const filteredLessons = useMemo(() => {
    return lessons
      .filter((lesson) => {
        if (activeCategory !== 'All' && lesson.category !== activeCategory) return false;
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          if (
            !lesson.title.toLowerCase().includes(q) &&
            !lesson.description.toLowerCase().includes(q) &&
            !lesson.instructor.toLowerCase().includes(q) &&
            !lesson.theme?.toLowerCase().includes(q)
          ) return false;
        }
        if (selectedLevel !== 'All' && lesson.level !== selectedLevel) return false;
        if (selectedTheme !== 'All Themes' && lesson.theme !== selectedTheme) return false;
        if (selectedInstructor !== 'All Instructors' && lesson.instructor !== selectedInstructor) return false;
        return true;
      })
      .sort((a, b) => {
        const lvl: Record<LessonLevel, number> = { All: 0, Beginner: 1, Intermediate: 2, Advanced: 3, Master: 4 };
        if (sortBy === 'newest') return b.id.localeCompare(a.id);
        if (sortBy === 'level_asc') return lvl[a.level] - lvl[b.level];
        if (sortBy === 'level_desc') return lvl[b.level] - lvl[a.level];
        return b.lessonCount - a.lessonCount;
      });
  }, [lessons, activeCategory, searchQuery, selectedLevel, selectedTheme, selectedInstructor, sortBy]);

  return (
    <main className="min-h-screen bg-brand-bg text-brand-text">
      {/* ── PAGE HEADER ── */}
      <div className="px-4 md:px-8 py-6 border-b border-brand-border/30 bg-gradient-to-b from-[#0A0E1C] to-brand-bg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-brand-accent/12 border border-brand-accent/25 text-brand-accent">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-wide">
                Chess Lessons
              </h1>
              <p className="text-xs sm:text-sm text-brand-secondary mt-0.5">
                Learn from grandmasters — tactics, openings, strategy, and endgames.
              </p>
            </div>
          </div>

          {/* Stats pills */}
          <div className="flex items-center gap-3 text-xs flex-wrap">
            <div className="px-3.5 py-2 rounded-xl bg-brand-surface/70 border border-brand-border/40 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand-accent" />
              <span className="text-brand-secondary">Available:</span>
              <span className="font-bold text-white">{lessons.length} Lessons</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-brand-surface/70 border border-brand-border/40 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-brand-secondary">Completed:</span>
              <span className="font-bold text-emerald-400">{MOCK_USER_STATS.lessonsCompleted}</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-amber-400">{MOCK_USER_STATS.streakDays} Day Streak 🔥</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ── LEFT COLUMN (8 cols) ── */}
          <section className="lg:col-span-8 space-y-8">

            {/* 1. Hero */}
            <HeroLessonCard lesson={HERO_LESSON} />

            {/* 2. Course Carousel */}
            <FeaturedCourseCarousel courses={MOCK_COURSES} />

            {/* 3. Category Tabs + Search + Filters */}
            <div className="space-y-4">
              <LessonCategoryTabs
                activeCategory={activeCategory}
                onSelectCategory={setActiveCategory}
                categoryCounts={categoryCounts}
              />
              <LessonSearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search lessons by title, opening, instructor, or tactic..."
              />
              <LessonFilters
                level={selectedLevel}
                onLevelChange={setSelectedLevel}
                theme={selectedTheme}
                onThemeChange={setSelectedTheme}
                instructor={selectedInstructor}
                onInstructorChange={setSelectedInstructor}
                sortBy={sortBy}
                onSortByChange={setSortBy}
                onResetFilters={handleResetFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </div>

            {/* 4. Lesson Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  {activeCategory === 'All' ? 'All Lessons' : `${activeCategory} Lessons`}
                  <span className="ml-2 text-sm text-brand-secondary font-normal">({filteredLessons.length})</span>
                </h2>
                {hasActiveFilters && (
                  <button onClick={handleResetFilters} className="text-xs text-brand-accent hover:underline font-medium cursor-pointer">
                    Clear all filters
                  </button>
                )}
              </div>
              <LessonGrid
                lessons={filteredLessons}
                onToggleBookmark={handleToggleBookmark}
                onResetSearch={handleResetFilters}
              />
            </div>
          </section>

          {/* ── RIGHT SIDEBAR (4 cols) ── */}
          <aside className="lg:col-span-4 lg:sticky lg:top-20 space-y-5">
            {/* Daily Challenge */}
            <DailyChallengeCard onSolve={() => navigate('/puzzles')} />
            {/* Weekly Lessons */}
            <WeeklyLessonCard
              remaining={MOCK_USER_STATS.weeklyRemaining}
              max={MOCK_USER_STATS.weeklyMax}
              resetDaysLeft={MOCK_USER_STATS.resetDaysLeft}
            />
            {/* Learning Rank */}
            <LearningRankCard
              currentRank={MOCK_USER_STATS.currentRank}
              currentXP={MOCK_USER_STATS.currentXP}
              nextRankXP={MOCK_USER_STATS.nextRankXP}
              ranks={MOCK_RANKS}
            />
            {/* Progress */}
            <LessonProgressCard stats={MOCK_USER_STATS} />
          </aside>
        </div>
      </div>
    </main>
  );
}
