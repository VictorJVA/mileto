// Thin client for the Meta Model API (https://dev.meta.ai/docs). Keys live only on the server (RNF-07).
// When MODEL_API_KEY is missing, or META_MOCK=1, every call returns deterministic fixtures so the
// app and tests run offline and without spending credits.

import { mock } from "./mock.js";

export const MODELS = {
  spark: process.env.META_SPARK_MODEL ?? "muse-spark-1.3",
  // 1.3 does not fully support audio input; 1.2 is the documented choice for audio.
  sparkAudio: process.env.META_SPARK_AUDIO_MODEL ?? "muse-spark-1.2",
  transcribe: process.env.META_TRANSCRIBE_MODEL ?? "muse-voice-transcribe-1.0",
  sam: process.env.META_SAM_MODEL ?? "sam-3.1",
  image: process.env.META_IMAGE_MODEL ?? "muse-image-1.0",
} as const;

const BASE_URL = process.env.META_API_BASE_URL ?? "https://api.meta.ai/v1";
const TIMEOUT_MS = Number(process.env.META_TIMEOUT_MS ?? 20_000);

export function isMockMode(): boolean {
  return process.env.META_MOCK === "1" || !process.env.MODEL_API_KEY;
}

export class MetaApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request(path: string, init: RequestInit & { accept?: string }): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${process.env.MODEL_API_KEY}`);
  headers.set("Accept", init.accept ?? "application/json");
  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new MetaApiError(res.status, `Meta API ${path} failed with ${res.status}: ${body.slice(0, 300)}`);
  }
  return res;
}

export type ChatContent =
  | string
  | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: ChatContent;
}

/** Chat Completions with a JSON schema response format. Returns the raw JSON text for the caller to validate. */
export async function chatJson(opts: {
  messages: ChatMessage[];
  schemaName: string;
  schema: Record<string, unknown>;
  model?: string;
  maxTokens?: number;
}): Promise<string> {
  if (isMockMode()) return mock.chatJson(opts.schemaName, opts.messages);
  const res = await request("/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: opts.model ?? MODELS.spark,
      messages: opts.messages,
      max_completion_tokens: opts.maxTokens ?? 600,
      response_format: { type: "json_schema", json_schema: { name: opts.schemaName, schema: opts.schema } },
    }),
  });
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new MetaApiError(502, "Meta API returned no message content");
  return content;
}

/** Speech to text. Audio must be WAV, mono, 16-bit PCM at 16 or 24 kHz, at most 10 minutes. */
export async function transcribe(wav: Buffer): Promise<{ transcript: string; audioDurationMs: number | null }> {
  if (isMockMode()) return mock.transcribe(wav);
  const form = new FormData();
  form.append(
    "request",
    new Blob([JSON.stringify({ model: MODELS.transcribe, audioEncoding: "WAV", mode: "PUSH_TO_TALK", languageBias: ["es", "en"] })], {
      type: "application/json",
    }),
  );
  form.append("audio", new Blob([new Uint8Array(wav)], { type: "audio/wav" }), "recording.wav");
  const res = await request("/asr/transcribe", { method: "POST", body: form });
  const data = (await res.json()) as { transcript?: string; audioDurationMs?: number };
  return { transcript: data.transcript ?? "", audioDurationMs: data.audioDurationMs ?? null };
}

export interface SamBox {
  id: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  confidence: number | null;
}

/** Segments every instance of `noun` in an image with SAM 3.1 and returns one box per match. */
export async function segment(imageUrl: string, noun: string): Promise<SamBox[]> {
  if (isMockMode()) return mock.segment(noun);
  const res = await request("/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    accept: "text/event-stream",
    body: JSON.stringify({
      model: MODELS.sam,
      include_confidence: "true",
      stream: true,
      input: [
        {
          type: "message",
          role: "user",
          content: [
            { type: "input_text", text: noun },
            { type: "input_image", image_url: imageUrl },
          ],
        },
      ],
    }),
  });
  return parseSamOutput(collectOutputText(await res.text()));
}

/** Joins `response.output_text.delta` events from a server-sent event stream. */
export function collectOutputText(sse: string): string {
  let text = "";
  for (const line of sse.split("\n")) {
    if (!line.startsWith("data:")) continue;
    const payload = line.slice(5).trim();
    if (!payload || payload === "[DONE]") continue;
    try {
      const event = JSON.parse(payload) as { type?: string; delta?: string };
      if (event.type === "response.output_text.delta" && typeof event.delta === "string") text += event.delta;
    } catch {
      // Ignore keep-alive or non-JSON frames.
    }
  }
  return text;
}

const BOX_RE = /(\d+)<\|box;([^|]*)\|>/g;

/** Parses SAM special-token output. Only frame 0 matters for still images; masks are not needed to count. */
export function parseSamOutput(text: string): SamBox[] {
  const firstFrame = text.split("\n").find((l) => /^<\d+f>/.test(l)) ?? "";
  const boxes: SamBox[] = [];
  for (const [, id, fields] of firstFrame.matchAll(BOX_RE)) {
    const kv = Object.fromEntries(fields.split(";").map((p) => p.split("=", 2) as [string, string]));
    boxes.push({
      id: Number(id),
      x1: Number(kv.x1),
      y1: Number(kv.y1),
      x2: Number(kv.x2),
      y2: Number(kv.y2),
      confidence: kv.c === undefined ? null : Number(kv.c),
    });
  }
  return boxes;
}

/** Single-shot image generation with Muse Image. Returns base64 image bytes. */
export async function generateImage(prompt: string, size = "1024x1536"): Promise<{ b64: string; mimeType: string }> {
  if (isMockMode()) return mock.generateImage();
  const res = await request("/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODELS.image, prompt, n: 1, size, response_format: "b64_json" }),
  });
  const data = (await res.json()) as { data?: Array<{ b64_json?: string }>; output_format?: string };
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new MetaApiError(502, "Meta API returned no image");
  return { b64, mimeType: `image/${data.output_format ?? "png"}` };
}
