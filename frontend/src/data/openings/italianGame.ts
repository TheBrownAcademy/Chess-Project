/**
 * italianGame.ts
 * Step-by-step data for the Italian Game (Giuoco Piano) opening.
 *
 * Sequence: 1.e4 e5 2.Nf3 Nc6 3.Bc4
 * ECO: C50–C54
 *
 * Each step is either a user move or an opponent auto-play.
 * The coach messages guide the learner through the ideas behind each move.
 */

import type { Opening } from "../../types/opening";

export const italianGame: Opening = {
  slug: "italian-game",
  title: "The Italian Game",
  description:
    "One of the oldest chess openings. White aims to control the center, develop pieces quickly, and target the vulnerable f7 pawn.",
  eco: "C50",
  difficulty: "Beginner",
  steps: [
    {
      move: "e2e4",
      isOpponentMove: false,
      coachMessage:
        "Start by advancing your King's pawn two squares to e4. This immediately stakes a claim in the center and opens lines for your bishop and queen.",
      highlightFrom: "e2",
      highlightTo: "e4",
    },
    {
      move: "e7e5",
      isOpponentMove: true,
      coachMessage:
        "Black mirrors your move with e5, also fighting for the center. This is the most classical response and leads to open, tactical games.",
      highlightFrom: "e7",
      highlightTo: "e5",
    },
    {
      move: "g1f3",
      isOpponentMove: false,
      coachMessage:
        "Develop your King's Knight to f3. It attacks Black's e5 pawn and follows the principle: develop knights before bishops.",
      highlightFrom: "g1",
      highlightTo: "f3",
    },
    {
      move: "b8c6",
      isOpponentMove: true,
      coachMessage:
        "Black brings out the Queen's Knight to c6, defending the e5 pawn and developing a piece. A natural and solid response.",
      highlightFrom: "b8",
      highlightTo: "c6",
    },
    {
      move: "f1c4",
      isOpponentMove: false,
      coachMessage:
        "Place your Bishop on c4 — the key move of the Italian Game! It aims at the center and puts indirect pressure on the f7 pawn, Black's weakest point early in the game.",
      highlightFrom: "f1",
      highlightTo: "c4",
    },
    {
      move: "g8f6",
      isOpponentMove: true,
      coachMessage:
        "Black develops the King's Knight to f6, attacking your e4 pawn and continuing development. This leads to the Two Knights Defense.",
      highlightFrom: "g8",
      highlightTo: "f6",
    },
    {
      move: "d2d3",
      isOpponentMove: false,
      coachMessage:
        "Play d3 to solidify your center and open the diagonal for your dark-squared bishop. This is the Giuoco Pianissimo — a quiet, strategic approach favored at the top level.",
      highlightFrom: "d2",
      highlightTo: "d3",
    },
    {
      move: "f8c5",
      isOpponentMove: true,
      coachMessage:
        "Black mirrors your bishop development with Bc5, creating a symmetrical position. Both sides have developed harmoniously — the middlegame battle begins!",
      highlightFrom: "f8",
      highlightTo: "c5",
    },
  ],
};
