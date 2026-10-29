// Lesson engine: one small step per screen, a progress bar on top and one big button at the bottom.
// Steps teach (analogy), practice (mini-game or quiz) or do (the real mission). A wrong answer is never
// punished: Mileto explains, and the step comes back at the end of the lesson ("we'll try that again").

import * as Haptics from "expo-haptics";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { Animated, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components/ui";
import { t } from "../i18n/en";
import { colors, font, type } from "../lib/theme";

export interface StepDef {
  id: string;
  Component: ComponentType;
}

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

export interface LessonApi {
  /** Shared state for the whole lesson, so later steps can use what earlier steps collected. */
  state: Record<string, unknown>;
  set: (patch: Record<string, unknown>) => void;
  next: () => void;
  goTo: (stepId: string) => void;
  /** Shows the feedback banner. A wrong answer re-queues the step at the end. */
  check: (ok: boolean, feedback: { title?: string; detail?: string }) => void;
}

const LessonContext = createContext<(LessonApi & { setFooter: (f: FooterSpec | null, onPress?: () => void) => void }) | null>(null);

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

const buzz = (tone: FeedbackTone) => {
  if (Platform.OS === "web") return;
  Haptics.notificationAsync(tone === "good" ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
};

export function Lesson({
  steps,
  onClose,
  onDone,
  initialState = {},
  header,
}: {
  steps: StepDef[];
  onClose: () => void;
  /** Called after the last step. */
  onDone: (state: Record<string, unknown>) => void;
  initialState?: Record<string, unknown>;
  header?: ReactNode;
}) {
  const [queue, setQueue] = useState<number[]>(() => steps.map((_, i) => i));
  const [pos, setPos] = useState(0);
  const [state, setState] = useState<Record<string, unknown>>(initialState);
  const [feedback, setFeedback] = useState<(Feedback & { requeue: boolean }) | null>(null);
  const [footer, setFooterState] = useState<FooterSpec | null>(null);
  const footerPress = useRef<() => void>(() => undefined);
  // Mirrors `state` synchronously so a step can set() and next() in the same handler.
  const stateRef = useRef(state);

  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(progress, { toValue: pos / Math.max(queue.length, 1), useNativeDriver: false, friction: 8 }).start();
  }, [pos, queue.length, progress]);

  const setFooter = useCallback((f: FooterSpec | null, onPress?: () => void) => {
    setFooterState(f);
    if (onPress) footerPress.current = onPress;
  }, []);

  const advance = (queueLength = queue.length) => {
    setFeedback(null);
    setFooterState(null);
    if (pos + 1 >= queueLength) onDone(stateRef.current);
    else setPos(pos + 1);
  };

  const api = {
    state,
    set: (patch: Record<string, unknown>) => {
      stateRef.current = { ...stateRef.current, ...patch };
      setState(stateRef.current);
    },
    next: () => advance(),
    goTo: (stepId: string) => {
      const idx = steps.findIndex((s) => s.id === stepId);
      if (idx < 0) return;
      setFeedback(null);
      setFooterState(null);
      // Replay from that step: the rest of the queue is rebuilt after it.
      setQueue([...queue.slice(0, pos + 1), ...steps.map((_, i) => i).slice(idx)]);
      setPos(pos + 1);
    },
    check: (ok: boolean, fb: { title?: string; detail?: string }) => {
      buzz(ok ? "good" : "retry");
      setFeedback({
        tone: ok ? "good" : "retry",
        title: fb.title ?? (ok ? pick(t.lesson.praise) : t.lesson.notQuite),
        detail: fb.detail,
        requeue: !ok,
      });
    },
    setFooter,
  };

  const continueAfterFeedback = () => {
    if (feedback?.requeue) {
      setQueue([...queue, queue[pos]]);
      advance(queue.length + 1);
    } else advance();
  };

  const step = steps[queue[pos]];
  const width = progress.interpolate({ inputRange: [0, 1], outputRange: ["4%", "100%"] });

  return (
    <LessonContext.Provider value={api}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.top}>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close lesson">
            <Text style={styles.close}>✕</Text>
          </Pressable>
          <View style={styles.track}>
            <Animated.View style={[styles.fill, { width }]}>
              <View style={styles.shine} />
            </Animated.View>
          </View>
          {header}
        </View>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {/* Remount each step so it starts fresh, including a re-queued one. */}
          <step.Component key={`${pos}-${step.id}`} />
        </ScrollView>
        {feedback ? (
          <View style={[styles.banner, { backgroundColor: feedback.tone === "good" ? colors.goodBg : colors.retryBg }]}>
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
              <Button label={t.common.continue} tone={feedback.tone === "good" ? "good" : "retry"} onPress={continueAfterFeedback} />
            </View>
          </View>
        ) : footer ? (
          <View style={styles.footer}>
            <View style={styles.inner}>
              <Button label={footer.label} disabled={footer.disabled} busy={footer.busy} tone={footer.tone ?? "primary"} onPress={() => footerPress.current()} />
            </View>
          </View>
        ) : null}
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
  close: { color: colors.faint, fontSize: 24, fontFamily: font.bold },
  track: { flex: 1, height: 16, borderRadius: 8, backgroundColor: colors.surfaceHi, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 8, backgroundColor: colors.primary },
  shine: { height: 4, marginTop: 3, marginHorizontal: 8, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.3)" },
  body: { padding: 16, paddingTop: 20, paddingBottom: 40, maxWidth: 640, width: "100%", alignSelf: "center" },
  footer: { borderTopWidth: 2, borderColor: colors.line, paddingVertical: 16, paddingHorizontal: 16 },
  banner: { paddingVertical: 18, paddingHorizontal: 16 },
  inner: { maxWidth: 640, width: "100%", alignSelf: "center" },
  bannerIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
});
