// Lesson engine: one small step per screen, a progress bar on top and one big button at the bottom.
// Steps teach (story, explanation, worked example), practice (games, quizzes) or do (the real mission).
// A wrong answer is never punished: Mileto explains, and the step comes back at the end of the lesson.
// Mileto the tutor stays on screen in a caption bar and guides with questions instead of answers.

import * as Haptics from "expo-haptics";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components/ui";
import { fill, t } from "../i18n/en";
import { colors, font, type } from "../lib/theme";
import { ClueCard, TutorDock, type Clue, type TutorStep } from "./Tutor";

export interface StepDef {
  id: string;
  Component: ComponentType;
  /** Steps with a right answer; world checkpoints are built from these. */
  checkable?: boolean;
  /** Practice games keep their spec so they can be reworded around the kid's idea. */
  game?: { kind: GameKind; spec: object };
}

export type GameKind = "quiz" | "pictures" | "blank" | "order" | "lightning" | "pairs" | "sort";

type FeedbackTone = "good" | "retry";
interface Feedback {
  tone: FeedbackTone;
  title: string;
  detail?: string;
}

interface FooterSpec {
  label: string;
  disabled?: boolean;
  busy?: boolean;
  tone?: "primary" | "blue";
}

export interface LessonStats {
  /** Checkable steps answered right on the first try. */
  firstTry: number;
  /** Checkable steps seen. */
  checked: number;
}

export interface LessonApi {
  /** Shared state for the whole lesson, so later steps can use what earlier steps collected. */
  state: Record<string, unknown>;
  set: (patch: Record<string, unknown>) => void;
  next: () => void;
  goTo: (stepId: string) => void;
  /** Shows the feedback banner. A wrong answer re-queues the step at the end (unless this is a test). */
  check: (ok: boolean, feedback: { title?: string; detail?: string }) => void;
  /** The banner currently shown, so a step can color its options. */
  feedback: FeedbackTone | null;
  /** Wrong tries on this step so far. The answer is only revealed after the second one. */
  attempt: number;
}

interface InternalApi extends LessonApi {
  setFooter: (f: FooterSpec | null, onPress?: () => void) => void;
  setTutorStep: (s: TutorStep | null) => void;
}

const LessonContext = createContext<InternalApi | null>(null);

export function useLesson(): LessonApi {
  const ctx = useContext(LessonContext);
  if (!ctx) throw new Error("useLesson outside Lesson");
  return ctx;
}

/** Declares the bottom button for the current step. `onPress` always sees the latest render. */
export function useFooter(spec: FooterSpec | null, onPress: () => void) {
  const ctx = useContext(LessonContext);
  if (!ctx) throw new Error("useFooter outside Lesson");
  const press = useRef(onPress);
  press.current = onPress;
  const { setFooter } = ctx;
  const key = spec ? `${spec.label}|${spec.disabled}|${spec.busy}|${spec.tone}` : "none";
  useEffect(() => {
    setFooter(spec, () => press.current());
    // The key captures every field of spec.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, setFooter]);
}

/** Tells Mileto the tutor what the kid is looking at, so hints fit the exact question. */
export function useTutorStep(step: TutorStep) {
  const ctx = useContext(LessonContext);
  const key = JSON.stringify(step);
  const setTutorStep = ctx?.setTutorStep;
  useEffect(() => {
    setTutorStep?.(step);
    return () => setTutorStep?.(null);
    // The key captures every field of step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, setTutorStep]);
}

const buzz = (tone: FeedbackTone) => {
  if (Platform.OS === "web") return;
  Haptics.notificationAsync(tone === "good" ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
};

export function Lesson({
  steps,
  topic,
  onClose,
  onDone,
  initialState = {},
  requeueMistakes = true,
  tutor = true,
  onSkip,
  startAt,
}: {
  steps: StepDef[];
  /** What the lesson is about, for the tutor. */
  topic: string;
  onClose: () => void;
  /** Called after the last step. */
  onDone: (state: Record<string, unknown>, stats: LessonStats) => void;
  initialState?: Record<string, unknown>;
  /** Tests (checkpoints) score the first try and don't repeat questions. */
  requeueMistakes?: boolean;
  /** Tests show what the kid knows on their own, so the tutor is off. */
  tutor?: boolean;
  /** Demo/testing only: finish the lesson right away. */
  onSkip?: () => void;
  /** Demo scenes start at a given step id instead of the first one. */
  startAt?: string;
}) {
  const [queue, setQueue] = useState<number[]>(() => steps.map((_, i) => i));
  const [pos, setPos] = useState(() => Math.max(0, startAt ? steps.findIndex((s) => s.id === startAt) : 0));
  const [state, setState] = useState<Record<string, unknown>>(initialState);
  const [feedback, setFeedback] = useState<(Feedback & { requeue: boolean }) | null>(null);
  const [footer, setFooterState] = useState<FooterSpec | null>(null);
  const [combo, setCombo] = useState(0);
  const [tutorAsk, setTutorAsk] = useState<{ text: string; n: number } | null>(null);
  const [clue, setClue] = useState<Clue | null>(null);
  const [dockOpen, setDockOpen] = useState(false);
  const [tutorStep, setTutorStep] = useState<TutorStep | null>(null);
  const footerPress = useRef<() => void>(() => undefined);
  // Mirrors `state` synchronously so a step can set() and next() in the same handler.
  const stateRef = useRef(state);
  // First answer for each checkable step, by step index.
  const firstTry = useRef(new Map<number, boolean>());
  const wrongTries = useRef(new Map<number, number>());

  // When a step reveals more (story lines, explanation cards), follow it down.
  const scroll = useRef<ScrollViewInstance>(null);
  const contentHeight = useRef({ step: -1, h: 0 });
  const clueShown = useRef(false);
  const onContentSize = (_w: number, h: number) => {
    const grew = contentHeight.current.step === pos && h > contentHeight.current.h + 4;
    contentHeight.current = { step: pos, h };
    // A new clue is pinned at the top: show it instead of following the content down.
    if (clueShown.current) {
      clueShown.current = false;
      scroll.current?.scrollTo({ y: 0, animated: true });
    } else if (grew) scroll.current?.scrollToEnd({ animated: true });
  };
  const showClue = useCallback((c: Clue | null) => {
    if (c) clueShown.current = true;
    setClue(c);
  }, []);

  const progress = useRef(new Animated.Value(0)).current;
  const banner = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(progress, { toValue: pos / Math.max(queue.length, 1), useNativeDriver: false, friction: 8 }).start();
  }, [pos, queue.length, progress]);
  useEffect(() => {
    banner.setValue(0);
    if (feedback) Animated.timing(banner, { toValue: 1, duration: 220, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }).start();
  }, [feedback, banner]);

  const setFooter = useCallback((f: FooterSpec | null, onPress?: () => void) => {
    setFooterState(f);
    if (onPress) footerPress.current = onPress;
  }, []);

  const finish = () => {
    // Only questions the kid actually answered (a demo scene or a test may skip some).
    const checked = firstTry.current.size;
    const right = [...firstTry.current.values()].filter(Boolean).length;
    onDone(stateRef.current, { firstTry: right, checked });
  };

  const advance = (queueLength = queue.length) => {
    setFeedback(null);
    setFooterState(null);
    if (pos + 1 >= queueLength) finish();
    else setPos(pos + 1);
  };

  const api: InternalApi = {
    state,
    feedback: feedback?.tone ?? null,
    attempt: wrongTries.current.get(queue[pos]) ?? 0,
    set: (patch) => {
      stateRef.current = { ...stateRef.current, ...patch };
      setState(stateRef.current);
    },
    next: () => advance(),
    goTo: (stepId) => {
      const idx = steps.findIndex((s) => s.id === stepId);
      if (idx < 0) return;
      setFeedback(null);
      setFooterState(null);
      // Replay from that step: the rest of the queue is rebuilt after it.
      setQueue([...queue.slice(0, pos + 1), ...steps.map((_, i) => i).slice(idx)]);
      setPos(pos + 1);
    },
    check: (ok, fb) => {
      buzz(ok ? "good" : "retry");
      const idx = queue[pos];
      if (steps[idx]?.checkable && !firstTry.current.has(idx)) firstTry.current.set(idx, ok);
      if (!ok) wrongTries.current.set(idx, (wrongTries.current.get(idx) ?? 0) + 1);
      const nextCombo = ok ? combo + 1 : 0;
      setCombo(nextCombo);
      setFeedback({
        tone: ok ? "good" : "retry",
        title: fb.title ?? (ok ? (nextCombo >= 3 ? fill(t.lesson.combo, { n: nextCombo }) : pick(t.lesson.praise)) : t.lesson.notQuite),
        detail: fb.detail,
        requeue: !ok && requeueMistakes,
      });
    },
    setFooter,
    setTutorStep,
  };

  const continueAfterFeedback = () => {
    if (feedback?.requeue) {
      setQueue([...queue, queue[pos]]);
      advance(queue.length + 1);
    } else advance();
  };

  const askTutor = (text: string) => setTutorAsk({ text, n: (tutorAsk?.n ?? 0) + 1 });

  const step = steps[queue[pos]];
  const width = progress.interpolate({ inputRange: [0, 1], outputRange: ["4%", "100%"] });
  const onFire = combo >= 3;

  return (
    <LessonContext.Provider value={api}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.top}>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel={t.lesson.close}>
            <Text style={styles.close}>✕</Text>
          </Pressable>
          <View style={styles.track}>
            <Animated.View style={[styles.fill, { width, backgroundColor: onFire ? colors.gold : colors.primary }]}>
              <View style={styles.shine} />
            </Animated.View>
          </View>
          {combo >= 2 ? <Text style={[type.tag, { color: colors.gold }]}>🔥{combo}</Text> : null}
          {onSkip ? (
            <Pressable onPress={onSkip} hitSlop={10} style={styles.skip} accessibilityRole="button" accessibilityLabel={t.map.skip}>
              <Text style={[type.tag, { color: colors.muted, fontSize: 11 }]}>⏭ {t.map.skip}</Text>
            </Pressable>
          ) : null}
        </View>
        <View style={{ flex: 1 }}>
        <ScrollView ref={scroll} contentContainerStyle={[styles.body, tutor && { paddingBottom: dockOpen ? 200 : 110 }]} keyboardShouldPersistTaps="handled" onContentSizeChange={onContentSize}>
          {clue ? (
            <ClueCard
              clue={clue}
              onClose={() => setClue(null)}
              onAskMore={() => {
                setClue(null);
                setDockOpen(true);
              }}
            />
          ) : null}
          {/* Remount each step so it starts fresh, including a re-queued one. */}
          <step.Component key={`${pos}-${step.id}`} />
        </ScrollView>
        {tutor ? (
          <TutorDock
            topic={topic}
            step={tutorStep}
            stepKey={`${pos}-${step.id}`}
            ask={tutorAsk}
            open={dockOpen}
            onOpenChange={setDockOpen}
            hidden={!!clue && !dockOpen}
            onClue={showClue}
          />
        ) : null}
        </View>
        {feedback ? (
          <Animated.View
            style={[
              styles.banner,
              { backgroundColor: feedback.tone === "good" ? colors.goodBg : colors.retryBg },
              { transform: [{ translateY: banner.interpolate({ inputRange: [0, 1], outputRange: [80, 0] }) }], opacity: banner },
            ]}
          >
            <View style={styles.inner}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <View style={[styles.bannerIcon, { backgroundColor: feedback.tone === "good" ? colors.good : colors.retry }]}>
                  <Text style={{ fontSize: 22, color: colors.bg, fontFamily: font.black }}>{feedback.tone === "good" ? "✓" : "↻"}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[type.h2, { color: feedback.tone === "good" ? colors.good : colors.retry, fontFamily: font.black }]}>{feedback.title}</Text>
                  {feedback.detail ? <Text style={[type.body, { color: feedback.tone === "good" ? colors.good : colors.retry, fontSize: 16 }]}>{feedback.detail}</Text> : null}
                </View>
              </View>
              {feedback.tone === "retry" && tutor ? (
                <Pressable onPress={() => askTutor(t.tutor.whyWrong)} hitSlop={8} style={{ marginBottom: 12 }}>
                  <Text style={[type.tag, { color: colors.retry, textDecorationLine: "underline" }]}>🫒 {t.tutor.askWhy}</Text>
                </Pressable>
              ) : null}
              <Button label={t.common.continue} tone={feedback.tone === "good" ? "good" : "retry"} onPress={continueAfterFeedback} />
            </View>
          </Animated.View>
        ) : (
          <View style={styles.footer}>
            <View style={styles.inner}>
              {footer ? <Button label={footer.label} disabled={footer.disabled} busy={footer.busy} tone={footer.tone ?? "primary"} onPress={() => footerPress.current()} /> : null}
            </View>
          </View>
        )}
      </SafeAreaView>
    </LessonContext.Provider>
  );
}

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, maxWidth: 720, width: "100%", alignSelf: "center" },
  skip: { borderWidth: 2, borderStyle: "dashed", borderColor: colors.line, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  close: { color: colors.faint, fontSize: 24, fontFamily: font.bold },
  track: { flex: 1, height: 16, borderRadius: 8, backgroundColor: colors.surfaceHi, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 8 },
  shine: { height: 4, marginTop: 3, marginHorizontal: 8, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.3)" },
  body: { padding: 16, paddingTop: 20, paddingBottom: 40, maxWidth: 640, width: "100%", alignSelf: "center" },
  footer: { borderTopWidth: 2, borderColor: colors.line, paddingVertical: 14, paddingHorizontal: 16 },
  banner: { paddingVertical: 18, paddingHorizontal: 16 },
  inner: { maxWidth: 640, width: "100%", alignSelf: "center" },
  bannerIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
});
