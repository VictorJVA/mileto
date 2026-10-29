// Client for the Mileto server. The app never talks to Meta directly; keys stay on the server (RNF-07).

import Constants from "expo-constants";
import { Platform } from "react-native";

const API_PORT = 4000;

/**
 * The server runs on the same computer as the Expo dev server, so its address is derived from where
 * the app was loaded. This keeps working when the Wi-Fi hands the computer a new IP.
 * EXPO_PUBLIC_API_URL overrides it (e.g. a deployed server).
 */
function resolveApiUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  if (Platform.OS === "web" && typeof window !== "undefined") return `http://${window.location.hostname}:${API_PORT}`;
  const host = Constants.expoConfig?.hostUri?.split(":")[0];
  return `http://${host ?? "localhost"}:${API_PORT}`;
}

export const API_URL = resolveApiUrl();

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code);
  }
}

let studentId: string | null = null;
export const setApiStudent = (id: string | null) => {
  studentId = id;
};

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (studentId) headers.set("x-student-id", studentId);
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string }).error ?? "unknown");
  return data as T;
}

export const get = <T>(path: string) => call<T>(path);
export const post = <T>(path: string, body: unknown = {}) => call<T>(path, { method: "POST", body: JSON.stringify(body) });
export const request = <T>(path: string, method: "PATCH" | "PUT" | "DELETE", body: unknown = {}) =>
  call<T>(path, { method, body: JSON.stringify(body) });

/** Uploads a local file (photo or recording) as multipart form data. */
export async function upload<T>(path: string, field: string, file: { uri: string; name: string; type: string }, extra: Record<string, string> = {}) {
  const form = new FormData();
  if (Platform.OS === "web") {
    const blob = await (await fetch(file.uri)).blob();
    form.append(field, blob, file.name);
  } else {
    // React Native's FormData accepts {uri, name, type} file descriptors.
    form.append(field, file as unknown as Blob);
  }
  for (const [k, v] of Object.entries(extra)) form.append(k, v);
  return call<T>(path, { method: "POST", body: form });
}

// Shared response types (mirror server/src).
export type PhaseStatus = "locked" | "available" | "done" | "skipped";
export type EntryPoint = "no_idea" | "has_idea" | "already_selling";

export interface Progress {
  seeds: number;
  streak: number;
  graceDaysLeft: number;
  missionsCompleted: number;
  badges: string[];
  garden: "seed" | "sprout" | "plant" | "tree";
}

export interface Student {
  id: string;
  nickname: string;
  avatar: string;
  ageRange: "8-12" | "13-18";
  classCode: string | null;
  adultConsent: boolean;
  progress: Progress;
  businesses?: Business[];
}

export interface Business {
  id: string;
  entry: EntryPoint;
  idea: string | null;
  statuses: Record<string, PhaseStatus>;
  data: Record<string, Record<string, unknown>>;
  jars: { business: number; personal: number };
  learnings?: Array<{ id: string; kind: "stumble" | "win"; text: string; hint: string | null }>;
}

export interface Phase {
  id: number;
  key: string;
  title: string;
  world: "seed" | "saddlebag" | "plaza";
  mission: string;
}

export interface PathInfo {
  worlds: Record<Phase["world"], { title: string; learns: string }>;
  phases: Phase[];
  growthModules: string[];
}
