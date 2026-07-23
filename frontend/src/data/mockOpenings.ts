export interface Opening {
  id: string;
  eco: string;
  name: string;
  moves: string[];       // UCI move sequence e.g. ['e2e4','e7e5','g1f3']
  fen: string;           // resulting FEN after moves
  whiteWinPct: number;
  drawPct: number;
  blackWinPct: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Master';
  description: string;
  keyIdeas: string[];
  category: OpeningCategory;
}

export type OpeningCategory =
  | "King's Pawn"
  | "Sicilian Defense"
  | "French Defense"
  | "Queen's Pawn"
  | "English Opening"
  | "Indian Defense";

export const OPENING_CATEGORIES: OpeningCategory[] = [
  "King's Pawn",
  "Sicilian Defense",
  "French Defense",
  "Queen's Pawn",
  "English Opening",
  "Indian Defense",
];

export const MOCK_OPENINGS: Opening[] = [
  {
    id: 'italian-game',
    eco: 'C50',
    name: 'Italian Game',
    moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4'],
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3',
    whiteWinPct: 38,
    drawPct: 33,
    blackWinPct: 29,
    difficulty: 'Beginner',
    description: 'A classical opening aiming at rapid development and control of the center.',
    keyIdeas: ['Control center with e4 & d4', 'Develop pieces quickly', 'Castle early', 'Giuoco Piano or Evan\'s Gambit'],
    category: "King's Pawn",
  },
  {
    id: 'ruy-lopez',
    eco: 'C60',
    name: 'Ruy Lopez (Spanish Game)',
    moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1b5'],
    fen: 'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3',
    whiteWinPct: 40,
    drawPct: 35,
    blackWinPct: 25,
    difficulty: 'Intermediate',
    description: 'The most ambitious and historically rich open-game weapon for White.',
    keyIdeas: ['Pin the Nc6 to pressurize e5', 'Slow build-up with d3 or d4', 'Queenside expansion', 'Many sub-variations: Marshall, Berlin, Breyer'],
    category: "King's Pawn",
  },
  {
    id: 'sicilian-najdorf',
    eco: 'B90',
    name: 'Sicilian Najdorf',
    moves: ['e2e4', 'c7c5', 'g1f3', 'd7d6', 'd2d4', 'c5d4', 'f3d4', 'g8f6', 'b1c3', 'a7a6'],
    fen: 'rnbqkb1r/1p2pppp/p2p1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 6',
    whiteWinPct: 36,
    drawPct: 29,
    blackWinPct: 35,
    difficulty: 'Advanced',
    description: 'The most popular and combative reply to 1.e4, favored by Fischer and Kasparov.',
    keyIdeas: ['...a6 prevents Nb5', 'Active counterplay on queenside', 'Sharp double-edged positions', 'Black fights for equality and more'],
    category: 'Sicilian Defense',
  },
  {
    id: 'sicilian-dragon',
    eco: 'B70',
    name: 'Sicilian Dragon',
    moves: ['e2e4', 'c7c5', 'g1f3', 'd7d6', 'd2d4', 'c5d4', 'f3d4', 'g8f6', 'b1c3', 'g7g6'],
    fen: 'rnbqkb1r/pp2pp1p/3p1np1/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 6',
    whiteWinPct: 35,
    drawPct: 27,
    blackWinPct: 38,
    difficulty: 'Advanced',
    description: "One of the sharpest openings in chess — White attacks kingside, Black counters queenside.",
    keyIdeas: ['Fianchetto bishop on g7', 'Open c-file for counterplay', 'Yugoslav Attack with h4-h5', 'Race for initiative on opposite wings'],
    category: 'Sicilian Defense',
  },
  {
    id: 'french-defense',
    eco: 'C00',
    name: 'French Defense',
    moves: ['e2e4', 'e7e6', 'd2d4', 'd7d5'],
    fen: 'rnbqkbnr/ppp2ppp/4p3/3p4/3PP3/8/PPP2PPP/RNBQKBNR w KQkq d6 0 3',
    whiteWinPct: 37,
    drawPct: 32,
    blackWinPct: 31,
    difficulty: 'Intermediate',
    description: 'A solid, strategic defense creating pawn tension in the center.',
    keyIdeas: ['Solid pawn structure with e6/d5', 'Bad bishop on c8 to activate', 'Counterplay with ...c5', 'Exchange, Advance, Winawer variations'],
    category: 'French Defense',
  },
  {
    id: "queens-gambit",
    eco: 'D06',
    name: "Queen's Gambit",
    moves: ['d2d4', 'd7d5', 'c2c4'],
    fen: 'rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq c3 0 2',
    whiteWinPct: 39,
    drawPct: 37,
    blackWinPct: 24,
    difficulty: 'Intermediate',
    description: "One of the oldest and most respected openings. White offers a pawn to seize the center.",
    keyIdeas: ['Gambit to control d5 square', 'QGD: ...e6 — solid but passive', 'QGA: ...dxc4 — fighting for counterplay', 'Exchange: massive structure battle'],
    category: "Queen's Pawn",
  },
  {
    id: 'kings-indian-defense',
    eco: 'E60',
    name: "King's Indian Defense",
    moves: ['d2d4', 'g8f6', 'c2c4', 'g7g6', 'b1c3', 'f8g7', 'e2e4', 'd7d6'],
    fen: 'rnbqk2r/ppp1ppbp/3p1np1/8/2PPP3/2N5/PP3PPP/R1BQKBNR w KQkq - 0 5',
    whiteWinPct: 34,
    drawPct: 28,
    blackWinPct: 38,
    difficulty: 'Advanced',
    description: 'A hyper-modern defense — Black lets White take the center, then attacks it.',
    keyIdeas: ['Fianchetto the King bishop', 'Allow White center then counter with ...e5 or ...c5', 'Sämisch, Classical, and Four Pawns Attack', 'Complex counterplay — Fisher and Kasparov favorite'],
    category: 'Indian Defense',
  },
  {
    id: 'english-opening',
    eco: 'A10',
    name: 'English Opening',
    moves: ['c2c4'],
    fen: 'rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR b KQkq c3 0 1',
    whiteWinPct: 37,
    drawPct: 38,
    blackWinPct: 25,
    difficulty: 'Intermediate',
    description: 'A flexible flank opening — White controls d5 without committing to a pawn center immediately.',
    keyIdeas: ['Flexible piece development', 'Transition to Queen\'s pawn structures', 'Symmetrical variation with ...c5', 'Reversed Sicilian setups'],
    category: 'English Opening',
  },
];
