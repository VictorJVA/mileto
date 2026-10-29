// SQLite persistence (node:sqlite, no native build step). Only minimal data about minors (RNF-04):
// nickname, avatar and age range; photos and audio are never stored, only the confirmed results.

import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { initialProgress, startingStatuses, type EntryPoint, type PhaseStatus, type ProgressState } from "../core/index.js";

export type AgeRange = "8-12" | "13-18";

export interface Student {
  id: string;
  nickname: string;
  avatar: string;
  ageRange: AgeRange;
  classCode: string | null;
  adultConsent: boolean;
  progress: ProgressState;
  createdAt: string;
}

export interface Business {
  id: string;
  studentId: string;
  entry: EntryPoint;
  idea: string | null;
  statuses: Record<number, PhaseStatus>;
  /** Phase results keyed by phase key (business card, interview summary, costs, brand, cashbox...). */
  data: Record<string, unknown>;
  jars: { business: number; personal: number };
  updatedAt: string;
}

export interface Learning {
  id: string;
  businessId: string;
  kind: "stumble" | "win";
  text: string;
  hint: string | null;
  createdAt: string;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY, nickname TEXT NOT NULL, avatar TEXT NOT NULL, age_range TEXT NOT NULL,
  class_code TEXT, adult_consent INTEGER NOT NULL DEFAULT 0, progress TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS businesses (
  id TEXT PRIMARY KEY, student_id TEXT NOT NULL REFERENCES students(id), entry TEXT NOT NULL, idea TEXT,
  statuses TEXT NOT NULL, data TEXT NOT NULL, jars TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS learnings (
  id TEXT PRIMARY KEY, business_id TEXT NOT NULL REFERENCES businesses(id), kind TEXT NOT NULL,
  text TEXT NOT NULL, hint TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS classes (code TEXT PRIMARY KEY, teacher_label TEXT);
`;

type Row = Record<string, unknown>;

export class Store {
  readonly db: DatabaseSync;

  constructor(path = process.env.DB_PATH ?? "mileto.db") {
    this.db = new DatabaseSync(path);
    this.db.exec("PRAGMA foreign_keys = ON;");
    this.db.exec(SCHEMA);
  }

  createStudent(input: { nickname: string; avatar: string; ageRange: AgeRange; classCode?: string | null }): Student {
    const student: Student = {
      id: randomUUID(),
      nickname: input.nickname,
      avatar: input.avatar,
      ageRange: input.ageRange,
      classCode: input.classCode ?? null,
      adultConsent: false,
      progress: initialProgress(),
      createdAt: new Date().toISOString(),
    };
    this.db
      .prepare("INSERT INTO students VALUES (?, ?, ?, ?, ?, 0, ?, ?)")
      .run(student.id, student.nickname, student.avatar, student.ageRange, student.classCode, JSON.stringify(student.progress), student.createdAt);
    return student;
  }

  getStudent(id: string): Student | null {
    const row = this.db.prepare("SELECT * FROM students WHERE id = ?").get(id) as Row | undefined;
    return row ? toStudent(row) : null;
  }

  setConsent(id: string, consent: boolean): void {
    this.db.prepare("UPDATE students SET adult_consent = ? WHERE id = ?").run(consent ? 1 : 0, id);
  }

  saveProgress(id: string, progress: ProgressState): void {
    this.db.prepare("UPDATE students SET progress = ? WHERE id = ?").run(JSON.stringify(progress), id);
  }

  studentsInClass(code: string): Student[] {
    return (this.db.prepare("SELECT * FROM students WHERE class_code = ? ORDER BY nickname").all(code) as Row[]).map(toStudent);
  }

  createBusiness(studentId: string, entry: EntryPoint, idea: string | null): Business {
    const business: Business = {
      id: randomUUID(),
      studentId,
      entry,
      idea,
      statuses: startingStatuses(entry),
      data: {},
      jars: { business: 0, personal: 0 },
      updatedAt: new Date().toISOString(),
    };
    this.db
      .prepare("INSERT INTO businesses VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(business.id, studentId, entry, idea, JSON.stringify(business.statuses), "{}", JSON.stringify(business.jars), business.updatedAt);
    return business;
  }

  getBusiness(id: string): Business | null {
    const row = this.db.prepare("SELECT * FROM businesses WHERE id = ?").get(id) as Row | undefined;
    return row ? toBusiness(row) : null;
  }

  businessesOf(studentId: string): Business[] {
    return (this.db.prepare("SELECT * FROM businesses WHERE student_id = ? ORDER BY updated_at DESC").all(studentId) as Row[]).map(toBusiness);
  }

  updateBusiness(b: Business): Business {
    const updated = { ...b, updatedAt: new Date().toISOString() };
    this.db
      .prepare("UPDATE businesses SET idea = ?, statuses = ?, data = ?, jars = ?, updated_at = ? WHERE id = ?")
      .run(updated.idea, JSON.stringify(updated.statuses), JSON.stringify(updated.data), JSON.stringify(updated.jars), updated.updatedAt, updated.id);
    return updated;
  }

  addLearning(businessId: string, kind: Learning["kind"], text: string, hint: string | null): Learning {
    const learning: Learning = { id: randomUUID(), businessId, kind, text, hint, createdAt: new Date().toISOString() };
    this.db.prepare("INSERT INTO learnings VALUES (?, ?, ?, ?, ?, ?)").run(learning.id, businessId, kind, text, hint, learning.createdAt);
    return learning;
  }

  learningsOf(businessId: string): Learning[] {
    return (this.db.prepare("SELECT * FROM learnings WHERE business_id = ? ORDER BY created_at").all(businessId) as Row[]).map((r) => ({
      id: String(r.id),
      businessId: String(r.business_id),
      kind: r.kind as Learning["kind"],
      text: String(r.text),
      hint: r.hint === null ? null : String(r.hint),
      createdAt: String(r.created_at),
    }));
  }
}

function toStudent(r: Row): Student {
  return {
    id: String(r.id),
    nickname: String(r.nickname),
    avatar: String(r.avatar),
    ageRange: r.age_range as AgeRange,
    classCode: r.class_code === null ? null : String(r.class_code),
    adultConsent: r.adult_consent === 1,
    progress: JSON.parse(String(r.progress)),
    createdAt: String(r.created_at),
  };
}

function toBusiness(r: Row): Business {
  return {
    id: String(r.id),
    studentId: String(r.student_id),
    entry: r.entry as EntryPoint,
    idea: r.idea === null ? null : String(r.idea),
    statuses: JSON.parse(String(r.statuses)),
    data: JSON.parse(String(r.data)),
    jars: JSON.parse(String(r.jars)),
    updatedAt: String(r.updated_at),
  };
}
