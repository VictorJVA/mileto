// Merges object detections from several SAM prompts into one honest count (cash box, RF-11/12).
// SAM is asked with a few phrasings ("round sticker", "sticker", "stickers"); each can miss a few
// objects, so their boxes are combined and then cleaned:
//  - giant boxes (a whole sticker sheet, the table) are dropped,
//  - the same object found twice is kept once,
//  - a drawing inside an object is not counted as a second object.

export interface Det {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const area = (b: Det) => Math.max(0, b.x2 - b.x1) * Math.max(0, b.y2 - b.y1);

function intersection(a: Det, b: Det): number {
  const w = Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1);
  const h = Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1);
  return w > 0 && h > 0 ? w * h : 0;
}

const iou = (a: Det, b: Det) => {
  const i = intersection(a, b);
  return i === 0 ? 0 : i / (area(a) + area(b) - i);
};

/** Share of `inner` that lies inside `outer`. */
const containedIn = (inner: Det, outer: Det) => (area(inner) === 0 ? 0 : intersection(inner, outer) / area(inner));

export const MAX_OBJECT_SHARE = 0.25;

export function mergeDetections<T extends Det>(boxes: T[], imageWidth: number, imageHeight: number): T[] {
  const imageArea = imageWidth * imageHeight;
  // 1. Drop boxes that cover a big part of the photo: a sheet of stickers, the table, a tray.
  const sized = boxes.filter((b) => area(b) > 0 && (!imageArea || area(b) / imageArea <= MAX_OBJECT_SHARE));

  // 2. Same object found by several prompts: keep the largest box of each overlapping group.
  const byArea = [...sized].sort((a, b) => area(b) - area(a));
  const unique: T[] = [];
  for (const b of byArea) if (!unique.some((u) => iou(u, b) > 0.5)) unique.push(b);

  // 3. A much smaller box almost fully inside a bigger one is a drawing on the object, not another object.
  return unique.filter((b) => !unique.some((o) => o !== b && area(o) > area(b) * 2.5 && containedIn(b, o) > 0.85));
}

/**
 * Prompt variants for a counting word: the word itself, its last word ("round sticker" → "sticker"),
 * a plural and a "round" form. Extra prompts only add recall: the merge removes their duplicates.
 */
export function countPrompts(noun: string): string[] {
  const clean = noun.trim().toLowerCase().replace(/\s+/g, " ");
  const base = clean.split(" ").pop() ?? clean;
  const singular = base.endsWith("s") && base.length > 3 ? base.slice(0, -1) : base;
  const plural = singular.endsWith("s") ? singular : `${singular}s`;
  return [...new Set([clean, singular, plural, `round ${singular}`].filter(Boolean))];
}
