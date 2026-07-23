export interface Course {
  id: string;
  title: string;
  instructor: string;
  chapterCount: number;
  completedChapters: number;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Master';
  thumbnailGradient: string;
  pieceSymbol: string;
  rating: number;
  studentCount: number;
  isNew?: boolean;
  description: string;
}

export const MOCK_COURSES: Course[] = [
  {
    id: 'course-1',
    title: 'Beat the Rossolimo',
    instructor: 'GM Hikaru Nakamura',
    chapterCount: 5,
    completedChapters: 2,
    category: 'Openings',
    level: 'Intermediate',
    thumbnailGradient: 'from-amber-800 via-orange-900 to-slate-950',
    pieceSymbol: '♞',
    rating: 4.9,
    studentCount: 21432,
    description: 'Crush the Anti-Sicilian with confident, forcing play',
  },
  {
    id: 'course-2',
    title: 'Opening Principles',
    instructor: 'GM Magnus Carlsen',
    chapterCount: 5,
    completedChapters: 5,
    category: 'Openings',
    level: 'Beginner',
    thumbnailGradient: 'from-emerald-900 via-teal-900 to-slate-950',
    pieceSymbol: '♟',
    rating: 4.8,
    studentCount: 48920,
    description: 'The fundamentals every chess player must know',
  },
  {
    id: 'course-3',
    title: 'Tactical Patterns',
    instructor: 'GM Levy Rozman',
    chapterCount: 7,
    completedChapters: 1,
    category: 'Tactics',
    level: 'Intermediate',
    thumbnailGradient: 'from-rose-900 via-red-950 to-slate-950',
    pieceSymbol: '♛',
    rating: 4.7,
    studentCount: 33875,
    isNew: true,
    description: 'Forks, pins, skewers & back rank mates in one course',
  },
  {
    id: 'course-4',
    title: 'Rook Endgames',
    instructor: 'GM Daniel Naroditsky',
    chapterCount: 8,
    completedChapters: 0,
    category: 'Endgames',
    level: 'Intermediate',
    thumbnailGradient: 'from-blue-900 via-indigo-950 to-slate-950',
    pieceSymbol: '♜',
    rating: 4.6,
    studentCount: 18256,
    description: 'Master Lucena, Philidor and the active rook principle',
  },
  {
    id: 'course-5',
    title: "Morphy's Masterpieces",
    instructor: 'GM Magnus Carlsen',
    chapterCount: 6,
    completedChapters: 0,
    category: 'Master Games',
    level: 'Master',
    thumbnailGradient: 'from-purple-900 via-violet-950 to-slate-950',
    pieceSymbol: '♚',
    rating: 4.9,
    studentCount: 12043,
    isNew: true,
    description: "The romantic era's most brilliant combinations",
  },
];
