// Who is playing and which business they are building. Only ids are kept on the phone.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { get, post, setApiStudent, type Business, type PathInfo, type Progress, type Student } from "./api";

const KEY = "mileto.session.v1";

interface CompleteResult {
  progress: Progress;
  newBadges: string[];
}

interface SessionValue {
  ready: boolean;
  student: Student | null;
  business: Business | null;
  path: PathInfo | null;
  /** Badges earned by the last action, shown once as a celebration. */
  celebrate: string[];
  clearCelebrate: () => void;
  signIn: (student: Student) => Promise<void>;
  setBusiness: (business: Business) => Promise<void>;
  refresh: () => Promise<void>;
  completePhase: (phaseId: number, result: Record<string, unknown>) => Promise<CompleteResult>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

async function safeStorage<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [business, setBusinessState] = useState<Business | null>(null);
  const [path, setPath] = useState<PathInfo | null>(null);
  const [celebrate, setCelebrate] = useState<string[]>([]);

  const load = useCallback(async (studentId: string, businessId: string | null) => {
    setApiStudent(studentId);
    const s = await get<Student>(`/api/students/${studentId}`);
    setStudent(s);
    const bId = businessId ?? s.businesses?.[0]?.id ?? null;
    setBusinessState(bId ? await get<Business>(`/api/businesses/${bId}`) : null);
  }, []);

  useEffect(() => {
    (async () => {
      get<PathInfo>("/api/path").then(setPath).catch(() => undefined);
      const saved = await safeStorage(() => AsyncStorage.getItem(KEY), null);
      if (saved) {
        const { studentId, businessId } = JSON.parse(saved) as { studentId: string; businessId: string | null };
        await load(studentId, businessId).catch(() => undefined);
      }
      setReady(true);
    })();
  }, [load]);

  const persist = (studentId: string, businessId: string | null) =>
    safeStorage(() => AsyncStorage.setItem(KEY, JSON.stringify({ studentId, businessId })), undefined);

  const value = useMemo<SessionValue>(
    () => ({
      ready,
      student,
      business,
      path,
      celebrate,
      clearCelebrate: () => setCelebrate([]),
      async signIn(s) {
        setApiStudent(s.id);
        setStudent(s);
        setBusinessState(null);
        await persist(s.id, null);
      },
      async setBusiness(b) {
        setBusinessState(b);
        if (student) await persist(student.id, b.id);
      },
      async refresh() {
        if (student) await load(student.id, business?.id ?? null);
      },
      async completePhase(phaseId, result) {
        if (!business || !student) throw new Error("no business");
        const r = await post<{ business: Business; progress: Progress; newBadges: string[] }>(
          `/api/businesses/${business.id}/phases/${phaseId}/complete`,
          { result },
        );
        setBusinessState({ ...business, ...r.business });
        setStudent({ ...student, progress: r.progress });
        if (r.newBadges.length) setCelebrate(r.newBadges);
        return { progress: r.progress, newBadges: r.newBadges };
      },
      async signOut() {
        setApiStudent(null);
        setStudent(null);
        setBusinessState(null);
        await safeStorage(() => AsyncStorage.removeItem(KEY), undefined);
      },
    }),
    [ready, student, business, path, celebrate, load],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession outside SessionProvider");
  return ctx;
}
