/**
 * opening.ts
 * Shared TypeScript types for the Openings learning feature.
 */

export interface OpeningStep {
  /** UCI move string, e.g. "e2e4" */
  move: string;
  /** If true, the board auto-plays this move without user input */
  isOpponentMove: boolean;
  /** Text shown in the coach panel before/during this step */
  coachMessage: string;
  /** Square to highlight as the expected source (hint) */
  highlightFrom: string;
  /** Square to highlight as the expected destination (hint) */
  highlightTo: string;
}

export interface Opening {
  /** Unique URL-safe identifier */
  slug: string;
  /** Display name */
  title: string;
  /** Short description shown on the page */
  description: string;
  /** ECO code */
  eco?: string;
  /** Difficulty label */
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  /** Ordered list of steps from the starting position */
  steps: OpeningStep[];
}
