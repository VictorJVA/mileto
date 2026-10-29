import type { Business, Phase } from "../lib/api";

export interface MissionProps {
  phase: Phase;
  business: Business;
  /** Saves the confirmed result, unlocks the next phase and returns to the map. */
  complete: (result: Record<string, unknown>) => Promise<void>;
}

/** Reads a stored result from an earlier phase, e.g. the price set in phase 8. */
export function earlier<T = Record<string, unknown>>(business: Business, key: string): Partial<T> {
  return (business.data[key] ?? {}) as Partial<T>;
}
