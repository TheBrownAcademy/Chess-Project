import type {
  CuratedPuzzle,
  PuzzleFilters,
  GetPuzzlesResponse,
  GetThemesResponse,
} from "../types/puzzle";

/**
 * PuzzleApiService
 * ----------------
 * Client-side service for fetching custom puzzles from the backend API.
 * All methods are static and return typed responses.
 */
export class PuzzleApiService {
  /**
   * Fetches all distinct puzzle themes from the database.
   * Used to populate the theme picker in the Custom Puzzle modal.
   */
  static async getThemes(): Promise<string[]> {
    try {
      const res = await fetch("/api/puzzles/themes");

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message || "Failed to fetch themes.");
      }

      const json: GetThemesResponse = await res.json();
      return json.data?.themes ?? [];
    } catch (error: any) {
      console.error("[PuzzleApiService.getThemes] Error:", error);
      return [];
    }
  }

  /**
   * Fetches puzzles filtered by themes and rating range.
   * Results are already sorted by rating ASC from the server.
   */
  static async getPuzzles(filters: PuzzleFilters = {}): Promise<CuratedPuzzle[]> {
    try {
      const params = new URLSearchParams();

      if (filters.themes && filters.themes.length > 0) {
        params.set("themes", filters.themes.join(","));
      }
      if (filters.minRating !== undefined) {
        params.set("minRating", String(filters.minRating));
      }
      if (filters.maxRating !== undefined) {
        params.set("maxRating", String(filters.maxRating));
      }
      if (filters.limit !== undefined) {
        params.set("limit", String(filters.limit));
      }

      const res = await fetch(`/api/puzzles?${params.toString()}`);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message || "Failed to fetch puzzles.");
      }

      const json: GetPuzzlesResponse = await res.json();
      return json.data?.puzzles ?? [];
    } catch (error: any) {
      console.error("[PuzzleApiService.getPuzzles] Error:", error);
      return [];
    }
  }
}
