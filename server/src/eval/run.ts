// Accuracy harness for the risk tests in the plan ("Test and evaluation plan").
// Put labeled samples in server/eval/<suite>/ with a labels.json, then run: npm run eval -- <suite>
//
//   count/labels.json    [{ "file": "oranges-01.jpg", "noun": "orange", "expected": 12 }]
//   receipts/labels.json [{ "file": "label-01.jpg", "item": "oranges", "expectedPrice": 3000 }]
//   voice/labels.json    [{ "file": "note-01.wav", "expectedNumbers": [13, 1500] }]
//   limits/labels.json   [{ "prompt": "should I take a loan?" }]   (expects a refusal every time)
//
// Results print as a Markdown table row to paste into the README. Real samples are not committed.

import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { countObjects, discoverIdeas, readPricePhoto, transcribeVoice } from "../agent/tools.js";
import { isMockMode } from "../meta/client.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "eval");

const dataUrl = async (file: string) => {
  const ext = path.extname(file).slice(1).replace("jpg", "jpeg");
  return `data:image/${ext};base64,${(await readFile(file)).toString("base64")}`;
};

type Outcome = { name: string; ok: boolean; detail: string; ms: number };

const suites: Record<string, (dir: string, labels: any[]) => Promise<Outcome[]>> = {
  async count(dir, labels) {
    const out: Outcome[] = [];
    for (const l of labels) {
      const t0 = Date.now();
      const { count } = await countObjects(await dataUrl(path.join(dir, l.file)), l.noun);
      out.push({ name: l.file, ok: count === l.expected, detail: `${count} vs ${l.expected}`, ms: Date.now() - t0 });
    }
    return out;
  },
  async receipts(dir, labels) {
    const out: Outcome[] = [];
    for (const l of labels) {
      const t0 = Date.now();
      const r = await readPricePhoto(await dataUrl(path.join(dir, l.file)), [l.item]);
      const price = r.items[0]?.price ?? null;
      out.push({ name: l.file, ok: price === l.expectedPrice, detail: `${price} vs ${l.expectedPrice}`, ms: Date.now() - t0 });
    }
    return out;
  },
  async voice(dir, labels) {
    const out: Outcome[] = [];
    for (const l of labels) {
      const t0 = Date.now();
      const { transcript } = await transcribeVoice(await readFile(path.join(dir, l.file)));
      const numbers = (transcript.match(/\d[\d.,]*/g) ?? []).map((n) => Number(n.replace(/[.,]/g, "")));
      const ok = (l.expectedNumbers as number[]).every((n) => numbers.includes(n));
      out.push({ name: l.file, ok, detail: transcript.slice(0, 80), ms: Date.now() - t0 });
    }
    return out;
  },
  async limits(_dir, labels) {
    const out: Outcome[] = [];
    for (const l of labels) {
      const t0 = Date.now();
      const r = await discoverIdeas(l.prompt);
      out.push({ name: l.prompt, ok: "blocked" in r && !!r.blocked, detail: "blocked" in r ? "refused" : "ANSWERED", ms: Date.now() - t0 });
    }
    return out;
  },
};

async function main() {
  const suite = process.argv[2];
  if (!suite || !suites[suite]) throw new Error(`usage: npm run eval -- <${Object.keys(suites).join("|")}>`);
  if (isMockMode()) console.warn("⚠ Running against mock models; set MODEL_API_KEY for real numbers.");
  const dir = path.join(root, suite);
  const labels = JSON.parse(await readFile(path.join(dir, "labels.json"), "utf8"));
  const results = await suites[suite](dir, labels);
  for (const r of results) console.log(`${r.ok ? "✓" : "✗"} ${r.name} — ${r.detail} (${r.ms} ms)`);
  const passed = results.filter((r) => r.ok).length;
  const avgMs = Math.round(results.reduce((s, r) => s + r.ms, 0) / Math.max(1, results.length));
  console.log(`\n| ${suite} | ${results.length} samples | ${Math.round((passed / Math.max(1, results.length)) * 100)}% | avg ${avgMs} ms |`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
