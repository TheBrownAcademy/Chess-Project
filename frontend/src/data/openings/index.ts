/**
 * data/openings/index.ts
 *
 * Central registry of all available openings.
 * To add a new opening: import it and add one entry to openingsRegistry.
 */

import type { Opening } from "../../types/opening";
import { italianGame } from "./italianGame";

/** All registered openings, keyed by their slug. */
export const openingsRegistry: Record<string, Opening> = {
  [italianGame.slug]: italianGame,
};

/** Ordered list of openings for listing pages. */
export const openingsList: Opening[] = Object.values(openingsRegistry);
