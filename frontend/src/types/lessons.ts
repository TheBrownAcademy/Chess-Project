export type LessonCategory =
  | 'All'
  | 'Openings'
  | 'Strategy'
  | 'Tactics'
  | 'Endgames'
  | 'Master Games';

export type LessonLevel =
  | 'All'
  | 'Beginner'
  | 'Intermediate'
  | 'Advanced'
  | 'Master';

export type SortOption =
  | 'popular'
  | 'newest'
  | 'level_asc'
  | 'level_desc';

export interface Lesson {
  id: string;
  title: string;
  description: string;
  category: LessonCategory;
  level: LessonLevel;
  instructor: string;
  durationMinutes: number;
  lessonCount: number;
  completedCount?: number;
  fen?: string;
  isBookmarked?: boolean;
  isFeatured?: boolean;
  progressPercent?: number;
  theme?: string;
  thumbnailGradient?: string;
}

export type LearningRankName =
  | 'Pawn'
  | 'Knight'
  | 'Bishop'
  | 'Rook'
  | 'Queen'
  | 'King';

export interface LearningRankInfo {
  name: LearningRankName;
  minXP: number;
  description: string;
  iconName: string;
  isAchieved: boolean;
  isCurrent: boolean;
}

export interface UserLessonStats {
  lessonsCompleted: number;
  hoursStudied: number;
  streakDays: number;
  weeklyRemaining: number;
  weeklyMax: number;
  currentRank: LearningRankName;
  currentXP: number;
  nextRankXP: number;
  resetDaysLeft: number;
}

export interface FilterOptions {
  category: LessonCategory;
  level: LessonLevel;
  theme: string;
  instructor: string;
  sortBy: SortOption;
  searchQuery: string;
}

export const LESSON_TYPES_VERSION = '1.0.0';

