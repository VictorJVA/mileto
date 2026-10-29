// Sample class for the teacher dashboard and the demo video. Fictional nicknames only, no real kids' data.

import { applyEvent, completePhase, initialProgress, PHASES, type BadgeType } from "../core/index.js";
import { Store } from "./store.js";

const CLASS_CODE = "DEMO1";

const sample: Array<{ nickname: string; avatar: string; idea: string; entry: "no_idea" | "has_idea" | "already_selling"; done: number[]; badges: BadgeType[]; stumbles: string[]; daysAgo: number }> = [
  { nickname: "Mateo", avatar: "olive-1", idea: "Fresh orange juice", entry: "no_idea", done: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], badges: ["customer_detective", "good_host"], stumbles: ["Made 40 cups, sold 13"], daysAgo: 0 },
  { nickname: "Luna", avatar: "olive-2", idea: "Painted bookmarks", entry: "has_idea", done: [4, 5], badges: ["customer_detective"], stumbles: [], daysAgo: 1 },
  { nickname: "Sami", avatar: "olive-3", idea: "Bike cleaning", entry: "no_idea", done: [1, 2, 3], badges: [], stumbles: ["Only 1 of 5 people wanted it"], daysAgo: 5 },
  { nickname: "Vale", avatar: "olive-4", idea: "Arepas with cheese", entry: "already_selling", done: [8, 11], badges: ["clear_accounts"], stumbles: [], daysAgo: 2 },
  { nickname: "Tomi", avatar: "olive-5", idea: "Friendship bracelets", entry: "no_idea", done: [1], badges: [], stumbles: [], daysAgo: 6 },
];

export function seed(store: Store): void {
  store.db.prepare("INSERT OR IGNORE INTO classes VALUES (?, ?)").run(CLASS_CODE, "Demo class");
  for (const s of sample) {
    const student = store.createStudent({ nickname: s.nickname, avatar: s.avatar, ageRange: "8-12", classCode: CLASS_CODE });
    let business = store.createBusiness(student.id, s.entry, s.idea);
    let progress = initialProgress();
    const day = new Date(Date.now() - s.daysAgo * 86_400_000);
    for (const [i, phaseId] of s.done.entries()) {
      business = { ...business, statuses: completePhase(business.statuses, phaseId) };
      const date = new Date(day.getTime() - (s.done.length - 1 - i) * 86_400_000).toISOString().slice(0, 10);
      progress = applyEvent(progress, { type: "mission_completed", phase: phaseId, date });
    }
    for (const badge of s.badges) progress = applyEvent(progress, { type: "badge_earned", badge });
    for (const text of s.stumbles) {
      store.addLearning(business.id, "stumble", text, "Next time, start small and ask first.");
      progress = applyEvent(progress, { type: "badge_earned", badge: "brave_stumble" });
    }
    store.updateBusiness(business);
    store.saveProgress(student.id, progress);
  }
  console.log(`Seeded class ${CLASS_CODE} with ${sample.length} students across ${PHASES.length} phases.`);
}

if (import.meta.url === `file://${process.argv[1]}`) seed(new Store());
