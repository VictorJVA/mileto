// Demo branch: ready-made scenes for recording the video. The server prepares the player's history;
// the scene itself runs the real app and the real models.

import { post, type Business, type Student } from "./api";

let pendingState: Record<string, unknown> | null = null;

/** Lesson state handed to the next lesson that opens (e.g. the brand for the poster scene). */
export function takeDemoState(): Record<string, unknown> {
  const s = pendingState ?? {};
  pendingState = null;
  return s;
}

export async function startScene(scene: string) {
  const r = await post<{ student: Student; business: Business | null; route: { pathname: string; params?: Record<string, string> }; lessonState: Record<string, unknown> | null }>(
    `/api/demo/scenes/${scene}`,
  );
  pendingState = r.lessonState;
  return r;
}
