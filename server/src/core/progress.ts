// Gentle Duolingo-style progress (F6, RF-15): seeds, a forgiving streak, garden stages and badges.

export const SEEDS_PER_MISSION = 10;
export const GRACE_DAYS_PER_WEEK = 2;

export type GardenStage = "seed" | "sprout" | "plant" | "tree";
export type BadgeType = "customer_detective" | "clear_accounts" | "brave_stumble" | "first_sale" | "good_host";

export interface ProgressState {
  seeds: number;
  streak: number;
  /** ISO date (YYYY-MM-DD) of the last day with at least one mission. */
  lastActiveDate: string | null;
  graceDaysLeft: number;
  /** ISO date of the Monday the grace allowance belongs to. */
  graceWeek: string | null;
  missionsCompleted: number;
  badges: BadgeType[];
}

export const initialProgress = (): ProgressState => ({
  seeds: 0,
  streak: 0,
  lastActiveDate: null,
  graceDaysLeft: GRACE_DAYS_PER_WEEK,
  graceWeek: null,
  missionsCompleted: 0,
  badges: [],
});

export type ProgressEvent =
  | { type: "mission_completed"; date: string; phase: number }
  | { type: "badge_earned"; badge: BadgeType };

export function applyEvent(state: ProgressState, event: ProgressEvent): ProgressState {
  if (event.type === "badge_earned") {
    return state.badges.includes(event.badge) ? state : { ...state, badges: [...state.badges, event.badge] };
  }
  const next = { ...state, seeds: state.seeds + SEEDS_PER_MISSION, missionsCompleted: state.missionsCompleted + 1 };
  return { ...next, ...updateStreak(state, event.date) };
}

/**
 * Counts days with at least one mission. Missed days are covered by grace days (two per week).
 * When grace runs out the streak quietly restarts at 1; nothing else is ever taken away.
 */
export function updateStreak(
  state: Pick<ProgressState, "streak" | "lastActiveDate" | "graceDaysLeft" | "graceWeek">,
  date: string,
): Pick<ProgressState, "streak" | "lastActiveDate" | "graceDaysLeft" | "graceWeek"> {
  const week = mondayOf(date);
  let graceDaysLeft = state.graceWeek === week ? state.graceDaysLeft : GRACE_DAYS_PER_WEEK;

  if (state.lastActiveDate === null) {
    return { streak: 1, lastActiveDate: date, graceDaysLeft, graceWeek: week };
  }
  const gap = daysBetween(state.lastActiveDate, date);
  if (gap <= 0) return { ...state, graceDaysLeft, graceWeek: week };

  const missed = gap - 1;
  let streak: number;
  if (missed === 0) streak = state.streak + 1;
  else if (missed <= graceDaysLeft) {
    graceDaysLeft -= missed;
    streak = state.streak + 1;
  } else streak = 1;
  return { streak, lastActiveDate: date, graceDaysLeft, graceWeek: week };
}

export function gardenStage(missionsCompleted: number): GardenStage {
  if (missionsCompleted >= 10) return "tree";
  if (missionsCompleted >= 6) return "plant";
  if (missionsCompleted >= 3) return "sprout";
  return "seed";
}

function toUtc(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) throw new RangeError(`invalid date ${date}`);
  return Date.UTC(y, m - 1, d);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((toUtc(to) - toUtc(from)) / 86_400_000);
}

export function mondayOf(date: string): string {
  const t = new Date(toUtc(date));
  const offset = (t.getUTCDay() + 6) % 7;
  t.setUTCDate(t.getUTCDate() - offset);
  return t.toISOString().slice(0, 10);
}
