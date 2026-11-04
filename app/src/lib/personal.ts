// "Now with YOUR idea" lessons. Requested when the lesson opens, so it is ready by the time the kid
// reaches that step; the server caches it per phase and idea.

import { post } from "./api";

export interface PersonalLesson {
  example: { title: string; steps: string[]; result: string };
  question: { prompt: string; options: string[]; answer: number; explain: string };
}

const pending = new Map<string, Promise<PersonalLesson | null>>();

export function loadPersonal(businessId: string, phase: string, idea: string): Promise<PersonalLesson | null> {
  const key = `${businessId}:${phase}:${idea}`;
  let p = pending.get(key);
  if (!p) {
    p = post<{ lesson: PersonalLesson | null }>("/api/ai/personalize", { businessId, phase })
      .then((r) => r.lesson)
      .catch(() => {
        // Let a later visit try again.
        pending.delete(key);
        return null;
      });
    pending.set(key, p);
  }
  return p;
}

// Practice games reworded around the kid's idea, by phase and step id. Read once when a game mounts,
// so a game never changes while the kid is playing it.
const gameSpecs = new Map<string, object>();
const pendingGames = new Map<string, Promise<void>>();

export function loadPersonalGames(businessId: string, phase: string, idea: string, games: Array<{ id: string; kind: string; spec: object }>): Promise<void> {
  const key = `${businessId}:${phase}:${idea}`;
  let p = pendingGames.get(key);
  if (!p && games.length) {
    p = post<{ games: Record<string, object> }>("/api/ai/personalize-games", { businessId, phase, games })
      .then((r) => {
        for (const [id, spec] of Object.entries(r.games)) gameSpecs.set(`${key}:${id}`, spec);
      })
      .catch(() => {
        pendingGames.delete(key);
      });
    pendingGames.set(key, p);
  }
  return p ?? Promise.resolve();
}

export function personalGameSpec(businessId: string, phase: string, idea: string, id: string): object | undefined {
  return gameSpecs.get(`${businessId}:${phase}:${idea}:${id}`);
}
