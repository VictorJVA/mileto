// Step types. Each builder returns a StepDef; the words live in content.ts.
// Learn: story (hook), explain (bite-size cards + worked example), recap.
// Practice: quiz, pictures, blank, order, lightning, pairs, sort, balance.

import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Mascot, Olive, say, type Mood } from "../components/Mascot";
import { Option, Tag, Title } from "../components/ui";
import { t } from "../i18n/en";
import { useSession } from "../lib/session";
import { loadPersonal, personalGameSpec, type PersonalLesson } from "../lib/personal";
import { colors, font, peso, type } from "../lib/theme";
import { useFooter, useLesson, useTutorStep, type GameKind, type StepDef } from "./engine";

const tap = () => {
  if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => undefined);
};

function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Fades and lifts content in when it appears. */
function Appear({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 260, delay, useNativeDriver: true }).start();
  }, [v, delay]);
  return <Animated.View style={{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>{children}</Animated.View>;
}

/** Calculation questions keep their code-checked numbers and are never reworded by the model. */
const numeric = (spec: object) => (spec as { numeric?: boolean }).numeric === true;

/** Feedback for a wrong answer: a nudge on the first miss, the answer and why on the second. */
function miss(attempt: number, answer: string, explain: string, prefix: string = t.lesson.answerWas) {
  return attempt === 0 ? { title: t.lesson.notQuite, detail: t.lesson.firstMiss } : { title: t.lesson.notQuite, detail: `${prefix} ${answer}. ${explain}` };
}

/** After CHECK, the chosen option turns green or orange and the right one turns green. */
function optionState(i: number, picked: number | null, answer: number, feedback: "good" | "retry" | null) {
  if (!feedback) return undefined;
  if (i === answer && feedback === "good") return "good" as const;
  // On a miss, only the kid's choice is marked: the right one stays hidden for the retry.
  if (i === picked && feedback === "retry") return "retry" as const;
  return undefined;
}

// ── Story: a short scene with characters, line by line (the hook) ──────────────────────

export interface Character {
  name: string;
  emoji: string;
}

export interface StorySpec {
  title: string;
  cast: Record<string, Character>;
  lines: Array<{ who: string; text: string }>;
  question?: { prompt: string; options: string[]; answer: number; explain: string };
}

export function story(id: string, spec: StorySpec): StepDef {
  function Story() {
    const lesson = useLesson();
    const [shown, setShown] = useState(1);
    const [picked, setPicked] = useState<number | null>(null);
    const [answered, setAnswered] = useState(false);
    const allShown = shown >= spec.lines.length;
    const q = spec.question;

    useEffect(() => say(spec.lines[shown - 1].text), [shown]);
    useTutorStep(
      allShown && q
        ? { prompt: `${spec.title}: ${q.prompt}`, options: q.options, answer: q.options[q.answer], explain: q.explain }
        : { prompt: `Story: ${spec.title}. ${spec.lines.slice(0, shown).map((l) => `${spec.cast[l.who]?.name}: ${l.text}`).join(" ")}` },
    );

    const label = !allShown ? t.common.continue : q && !answered ? t.common.check : t.common.continue;
    useFooter({ label, disabled: allShown && !!q && !answered && picked === null }, () => {
      if (!allShown) return setShown(shown + 1);
      if (q && !answered) {
        setAnswered(true);
        return lesson.check(picked === q.answer, picked === q.answer ? { detail: q.explain } : miss(1, q.options[q.answer], q.explain));
      }
      lesson.next();
    });

    return (
      <>
        <Tag color={colors.purple}>📖 {t.lesson.story}</Tag>
        <Title>{spec.title}</Title>
        {spec.lines.slice(0, shown).map((line, i) => {
          const c = spec.cast[line.who] ?? { name: line.who, emoji: "🙂" };
          const mileto = line.who === "mileto";
          return (
            <Appear key={i}>
              <View style={styles.line}>
                {mileto ? <Olive size={44} mood="curious" /> : <Text style={{ fontSize: 40 }}>{c.emoji}</Text>}
                <View style={{ flex: 1 }}>
                  <Text style={[type.tag, { color: mileto ? colors.primary : colors.blue, fontSize: 12 }]}>{mileto ? "Mileto" : c.name}</Text>
                  <Pressable onPress={() => say(line.text)}>
                    <Text style={type.body}>{line.text}</Text>
                  </Pressable>
                </View>
              </View>
            </Appear>
          );
        })}
        {allShown && q ? (
          <Appear>
            <Text style={[type.h2, { marginVertical: 12 }]}>{q.prompt}</Text>
            {q.options.map((o, i) => (
              <Option key={o} label={o} selected={picked === i} state={optionState(i, picked, q.answer, lesson.feedback)} onPress={() => !answered && (tap(), setPicked(i))} />
            ))}
          </Appear>
        ) : null}
      </>
    );
  }
  return { id, Component: Story };
}

// ── Explain: bite-size cards, revealed one at a time, then a worked example ────────────

export interface ExplainSpec {
  title: string;
  cards: Array<{ emoji: string; text: string }>;
  analogy?: string;
  example?: { title: string; steps: string[]; result: string };
  mood?: Mood;
}

export function explain(id: string, spec: ExplainSpec): StepDef {
  const total = spec.cards.length + (spec.analogy ? 1 : 0) + (spec.example ? 1 : 0);
  function Explain() {
    const lesson = useLesson();
    const [shown, setShown] = useState(1);
    const done = shown >= total;
    const current = spec.cards[shown - 1]?.text ?? (shown === spec.cards.length + 1 && spec.analogy ? spec.analogy : spec.example?.title ?? "");
    useEffect(() => say(current), [current]);
    useTutorStep({ prompt: `Explanation: ${spec.title}. ${spec.cards.map((c) => c.text).join(" ")} ${spec.analogy ?? ""}` });
    useFooter({ label: done ? t.lesson.gotIt : t.lesson.tellMore, tone: done ? "primary" : "blue" }, () => (done ? lesson.next() : setShown(shown + 1)));

    return (
      <>
        <Tag>💡 {t.lesson.newIdea}</Tag>
        <Title>{spec.title}</Title>
        {spec.cards.slice(0, shown).map((c, i) => (
          <Appear key={i}>
            <View style={[styles.card, i === shown - 1 && { borderColor: colors.purple }]}>
              <Text style={{ fontSize: 40 }}>{c.emoji}</Text>
              <Text style={[type.body, { flex: 1 }]}>{c.text}</Text>
            </View>
          </Appear>
        ))}
        {spec.analogy && shown > spec.cards.length ? (
          <Appear>
            <View style={[styles.card, { borderColor: colors.blueEdge, backgroundColor: colors.blueSoft }]}>
              <Olive size={44} mood={spec.mood ?? "happy"} />
              <View style={{ flex: 1 }}>
                <Text style={[type.tag, { color: colors.blue, marginBottom: 4 }]}>{t.lesson.thinkOfIt}</Text>
                <Text style={type.body}>{spec.analogy}</Text>
              </View>
            </View>
          </Appear>
        ) : null}
        {spec.example && done ? (
          <Appear>
            <View style={[styles.example]}>
              <Text style={[type.tag, { color: colors.gold, marginBottom: 8 }]}>✏️ {t.lesson.example}</Text>
              <Text style={[type.h2, { marginBottom: 10 }]}>{spec.example.title}</Text>
              {spec.example.steps.map((s, i) => (
                <Appear key={s} delay={i * 350}>
                  <View style={{ flexDirection: "row", gap: 10, marginBottom: 8 }}>
                    <View style={styles.stepNum}>
                      <Text style={{ fontFamily: font.black, color: colors.bg, fontSize: 13 }}>{i + 1}</Text>
                    </View>
                    <Text style={[type.body, { flex: 1 }]}>{s}</Text>
                  </View>
                </Appear>
              ))}
              <Appear delay={spec.example.steps.length * 350}>
                <Text style={[type.body, { fontFamily: font.black, color: colors.gold, marginTop: 4 }]}>= {spec.example.result}</Text>
              </Appear>
            </View>
          </Appear>
        ) : null}
        <Text style={[type.small, { textAlign: "center", marginTop: 8 }]}>
          {shown} / {total}
        </Text>
      </>
    );
  }
  return { id, Component: Explain };
}

// ── Quiz: pick the right answer ────────────────────────────────────────────────────────

export interface QuizSpec {
  /** A calculation: never reworded by the model, because its numbers must stay code-checked. */
  numeric?: boolean;
  prompt: string;
  say?: string;
  options: string[];
  answer: number;
  explain: string;
}

export function quiz(id: string, spec: QuizSpec): StepDef {
  function Quiz() {
    const lesson = useLesson();
    const order = useMemo(() => shuffle(spec.options.map((_, i) => i)), []);
    const [picked, setPicked] = useState<number | null>(null);
    useTutorStep({ prompt: spec.prompt, options: spec.options, answer: spec.options[spec.answer], explain: spec.explain });
    useFooter({ label: t.common.check, disabled: picked === null }, () => {
      const ok = picked === spec.answer;
      lesson.check(ok, ok ? { detail: spec.explain } : miss(lesson.attempt, spec.options[spec.answer], spec.explain));
    });
    return (
      <>
        <Tag color={colors.blue}>🎯 {t.lesson.practice}</Tag>
        <Title>{spec.prompt}</Title>
        {spec.say ? <Mascot text={spec.say} size={64} /> : null}
        {order.map((i, n) => (
          <Option key={i} badge={n + 1} label={spec.options[i]} selected={picked === i} state={optionState(i, picked, spec.answer, lesson.feedback)} onPress={() => !lesson.feedback && (tap(), setPicked(i))} />
        ))}
      </>
    );
  }
  return { id, Component: Quiz, checkable: true, game: numeric(spec) ? undefined : { kind: "quiz", spec } };
}

// ── Pictures: choose the right picture card (2x2 grid) ────────────────────────────────

export function pictures(id: string, spec: { prompt: string; say?: string; options: Array<{ emoji: string; label: string }>; answer: number; explain: string }): StepDef {
  function Pictures() {
    const lesson = useLesson();
    const order = useMemo(() => shuffle(spec.options.map((_, i) => i)), []);
    const [picked, setPicked] = useState<number | null>(null);
    useTutorStep({ prompt: spec.prompt, options: spec.options.map((o) => o.label), answer: spec.options[spec.answer].label, explain: spec.explain });
    useFooter({ label: t.common.check, disabled: picked === null }, () => {
      const ok = picked === spec.answer;
      lesson.check(ok, ok ? { detail: spec.explain } : miss(lesson.attempt, spec.options[spec.answer].label, spec.explain));
    });
    return (
      <>
        <Tag color={colors.blue}>🖼️ {t.lesson.pickPicture}</Tag>
        <Title>{spec.prompt}</Title>
        {spec.say ? <Mascot text={spec.say} size={64} /> : null}
        <View style={styles.grid}>
          {order.map((i) => {
            const st = optionState(i, picked, spec.answer, lesson.feedback);
            const border = st === "good" ? colors.good : st === "retry" ? colors.retry : picked === i ? colors.blue : colors.line;
            return (
              <Pressable
                key={i}
                onPress={() => !lesson.feedback && (tap(), setPicked(i))}
                style={({ pressed }) => [styles.picture, { borderColor: border }, picked === i && { backgroundColor: colors.blueSoft }, pressed && { borderBottomWidth: 2, marginTop: 2 }]}
                accessibilityRole="radio"
                accessibilityState={{ selected: picked === i }}
              >
                <Text style={{ fontSize: 56 }}>{spec.options[i].emoji}</Text>
                <Text style={[type.body, { fontFamily: font.bold, textAlign: "center", color: picked === i ? colors.blue : colors.ink }]}>{spec.options[i].label}</Text>
              </Pressable>
            );
          })}
        </View>
      </>
    );
  }
  return { id, Component: Pictures, checkable: true, game: numeric(spec) ? undefined : { kind: "pictures", spec } };
}

// ── Blank: complete the sentence with the right word ──────────────────────────────────

export function blank(id: string, spec: { numeric?: boolean; prompt: string; before: string; after: string; options: string[]; answer: number; explain: string }): StepDef {
  function Blank() {
    const lesson = useLesson();
    const order = useMemo(() => shuffle(spec.options.map((_, i) => i)), []);
    const [picked, setPicked] = useState<number | null>(null);
    useTutorStep({ prompt: `${spec.prompt}: ${spec.before} ___ ${spec.after}`, options: spec.options, answer: spec.options[spec.answer], explain: spec.explain });
    useFooter({ label: t.common.check, disabled: picked === null }, () => {
      const ok = picked === spec.answer;
      lesson.check(ok, ok ? { detail: spec.explain } : miss(lesson.attempt, `“${spec.options[spec.answer]}”`, spec.explain));
    });
    const st = picked === null ? undefined : optionState(picked, picked, spec.answer, lesson.feedback);
    return (
      <>
        <Tag color={colors.blue}>✍️ {t.lesson.fillBlank}</Tag>
        <Title>{spec.prompt}</Title>
        <View style={styles.sentence}>
          <Text style={[type.body, { fontSize: 22, lineHeight: 40 }]}>
            {spec.before}{" "}
            <Text style={[styles.slot, { color: st === "good" ? colors.good : st === "retry" ? colors.retry : colors.blue }]}>{picked === null ? "　　　　" : spec.options[picked]}</Text> {spec.after}
          </Text>
        </View>
        <View style={styles.chips}>
          {order.map((i) => (
            <Pressable
              key={i}
              onPress={() => !lesson.feedback && (tap(), setPicked(picked === i ? null : i))}
              style={({ pressed }) => [styles.chip, picked === i && { opacity: 0.3 }, pressed && { borderBottomWidth: 2, marginTop: 2 }]}
              accessibilityRole="button"
            >
              <Text style={[type.body, { fontFamily: font.bold }]}>{spec.options[i]}</Text>
            </Pressable>
          ))}
        </View>
      </>
    );
  }
  return { id, Component: Blank, checkable: true, game: numeric(spec) ? undefined : { kind: "blank", spec } };
}

// ── Order: tap the steps in the right order ───────────────────────────────────────────

export function order(id: string, spec: { prompt: string; items: string[]; explain: string }): StepDef {
  function Order() {
    const lesson = useLesson();
    const bank = useMemo(() => shuffle(spec.items.map((_, i) => i)), []);
    const [chosen, setChosen] = useState<number[]>([]);
    useTutorStep({ prompt: `${spec.prompt} Steps: ${spec.items.join("; ")}`, answer: spec.items.join(" → "), explain: spec.explain });
    useFooter({ label: t.common.check, disabled: chosen.length < spec.items.length }, () => {
      const ok = chosen.every((v, i) => v === i);
      lesson.check(ok, ok ? { detail: spec.explain } : miss(lesson.attempt, spec.items.join(" → "), spec.explain, t.lesson.rightOrder));
    });
    return (
      <>
        <Tag color={colors.gold}>🔢 {t.lesson.putInOrder}</Tag>
        <Title>{spec.prompt}</Title>
        <View style={styles.answerArea}>
          {chosen.length === 0 ? <Text style={[type.small, { textAlign: "center" }]}>{t.lesson.tapInOrder}</Text> : null}
          {chosen.map((i, n) => (
            <Appear key={i}>
              <Pressable onPress={() => !lesson.feedback && setChosen(chosen.filter((x) => x !== i))} style={[styles.orderRow, lesson.feedback && { borderColor: chosen[n] === n ? colors.good : colors.retry }]}>
                <View style={styles.stepNum}>
                  <Text style={{ fontFamily: font.black, color: colors.bg, fontSize: 13 }}>{n + 1}</Text>
                </View>
                <Text style={[type.body, { flex: 1, fontFamily: font.bold }]}>{spec.items[i]}</Text>
              </Pressable>
            </Appear>
          ))}
        </View>
        <View style={styles.chips}>
          {bank.map((i) =>
            chosen.includes(i) ? null : (
              <Pressable key={i} onPress={() => (tap(), setChosen([...chosen, i]))} style={({ pressed }) => [styles.chip, pressed && { borderBottomWidth: 2, marginTop: 2 }]} accessibilityRole="button">
                <Text style={[type.body, { fontFamily: font.bold }]}>{spec.items[i]}</Text>
              </Pressable>
            ),
          )}
        </View>
      </>
    );
  }
  return { id, Component: Order, checkable: true, game: numeric(spec) ? undefined : { kind: "order", spec } };
}

// ── Lightning: a fast round of true or false ──────────────────────────────────────────

export function lightning(id: string, spec: { prompt: string; statements: Array<{ text: string; truth: boolean; why: string }> }): StepDef {
  function Lightning() {
    const lesson = useLesson();
    const items = useMemo(() => shuffle(spec.statements), []);
    const [n, setN] = useState(0);
    const [right, setRight] = useState(0);
    const [flash, setFlash] = useState<{ ok: boolean; why: string } | null>(null);
    const finished = n >= items.length;
    useTutorStep(finished ? { prompt: spec.prompt } : { prompt: `True or false: ${items[n].text}`, answer: items[n].truth ? "True" : "False", explain: items[n].why });
    useFooter({ label: t.common.continue, disabled: !finished }, () =>
      lesson.check(right === items.length, { title: right === items.length ? t.lesson.perfect : `${right} / ${items.length}`, detail: right === items.length ? undefined : t.lesson.lightningRetry }),
    );

    function answer(value: boolean) {
      if (finished || flash) return;
      const ok = items[n].truth === value;
      tap();
      if (ok) setRight(right + 1);
      setFlash({ ok, why: items[n].why });
      setTimeout(() => {
        setFlash(null);
        setN(n + 1);
      }, ok ? 700 : 1800);
    }

    return (
      <>
        <Tag color={colors.gold}>⚡ {t.lesson.lightning}</Tag>
        <Title>{spec.prompt}</Title>
        <View style={{ flexDirection: "row", gap: 6, marginBottom: 16 }}>
          {items.map((_, i) => (
            <View key={i} style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: i < n ? colors.gold : colors.surfaceHi }} />
          ))}
        </View>
        <View style={[styles.sortCard, flash && { borderColor: flash.ok ? colors.good : colors.retry }]}>
          <Text style={[type.h2, { textAlign: "center", fontSize: 22, lineHeight: 30 }]}>{finished ? `⚡ ${right} / ${items.length}` : items[n].text}</Text>
          {flash ? <Text style={[type.small, { textAlign: "center", marginTop: 10, color: flash.ok ? colors.good : colors.retry }]}>{flash.ok ? "✓ " : "↻ "}{flash.why}</Text> : null}
        </View>
        {!finished ? (
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable onPress={() => answer(true)} style={({ pressed }) => [styles.tf, { backgroundColor: colors.good, borderBottomColor: colors.primaryEdge }, pressed && { borderBottomWidth: 0, marginTop: 6 }]} accessibilityRole="button">
              <Text style={[type.button, { color: colors.onPrimary, fontSize: 18 }]}>👍 {t.lesson.true}</Text>
            </Pressable>
            <Pressable onPress={() => answer(false)} style={({ pressed }) => [styles.tf, { backgroundColor: colors.retry, borderBottomColor: "#C0702C" }, pressed && { borderBottomWidth: 0, marginTop: 6 }]} accessibilityRole="button">
              <Text style={[type.button, { color: "#2A1606", fontSize: 18 }]}>👎 {t.lesson.false}</Text>
            </Pressable>
          </View>
        ) : null}
      </>
    );
  }
  return { id, Component: Lightning, game: numeric(spec) ? undefined : { kind: "lightning", spec } };
}

// ── Pairs: tap matching pairs (concept ↔ meaning) ─────────────────────────────────────

export function pairs(id: string, spec: { prompt: string; pairs: Array<[string, string]> }): StepDef {
  function Pairs() {
    const lesson = useLesson();
    const right = useMemo(() => shuffle(spec.pairs.map((_, i) => i)), []);
    const [left, setLeft] = useState<number | null>(null);
    const [done, setDone] = useState<number[]>([]);
    const [miss, setMiss] = useState<number | null>(null);
    const finished = done.length === spec.pairs.length;
    useTutorStep({ prompt: `Match the pairs: ${spec.pairs.map((p) => p[0]).join(", ")}`, explain: spec.pairs.map((p) => `${p[0]} = ${p[1]}`).join("; ") });
    useFooter({ label: t.common.continue, disabled: !finished }, () => lesson.check(true, { title: t.lesson.allMatched }));

    function pickRight(i: number) {
      if (left === null) return;
      if (left === i) {
        tap();
        setDone([...done, i]);
        setLeft(null);
      } else {
        setMiss(i);
        setTimeout(() => setMiss(null), 500);
      }
    }

    return (
      <>
        <Tag color={colors.gold}>🧩 {t.lesson.game}</Tag>
        <Title>{spec.prompt}</Title>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            {spec.pairs.map(([l], i) => (
              <Option key={l} center label={l} selected={left === i} state={done.includes(i) ? "done" : undefined} onPress={() => (tap(), setLeft(i))} />
            ))}
          </View>
          <View style={{ flex: 1.4 }}>
            {right.map((i) => (
              <Option key={spec.pairs[i][1]} center label={spec.pairs[i][1]} state={done.includes(i) ? "done" : miss === i ? "retry" : undefined} onPress={() => pickRight(i)} />
            ))}
          </View>
        </View>
      </>
    );
  }
  return { id, Component: Pairs, game: numeric(spec) ? undefined : { kind: "pairs", spec } };
}

// ── Sort: drop each card into the right bin ───────────────────────────────────────────

export interface SortSpec {
  prompt: string;
  say?: string;
  bins: Array<{ id: string; label: string; emoji: string }>;
  items: Array<{ label: string; bin: string; why?: string }>;
}

export function sort(id: string, spec: SortSpec): StepDef {
  function Sort() {
    const lesson = useLesson();
    const items = useMemo(() => shuffle(spec.items), []);
    const [n, setN] = useState(0);
    const [mistakes, setMistakes] = useState(0);
    const [flash, setFlash] = useState<{ bin: string; ok: boolean; why?: string } | null>(null);
    const finished = n >= items.length;
    useTutorStep(
      finished
        ? { prompt: spec.prompt }
        : { prompt: `${spec.prompt} Card: "${items[n].label}". Bins: ${spec.bins.map((b) => b.label).join(" or ")}`, answer: spec.bins.find((b) => b.id === items[n].bin)?.label, explain: items[n].why },
    );
    useFooter({ label: t.common.continue, disabled: !finished }, () => lesson.check(true, { title: mistakes === 0 ? t.lesson.perfect : t.lesson.allSorted }));

    function drop(bin: string) {
      if (finished || flash) return;
      const item = items[n];
      const ok = item.bin === bin;
      tap();
      if (!ok) setMistakes(mistakes + 1);
      setFlash({ bin, ok, why: item.why });
      setTimeout(() => {
        setFlash(null);
        if (ok) setN(n + 1);
      }, ok ? 450 : 1600);
    }

    return (
      <>
        <Tag color={colors.gold}>🧩 {t.lesson.game}</Tag>
        <Title>{spec.prompt}</Title>
        {spec.say ? <Mascot text={spec.say} size={64} /> : null}
        <View style={[styles.sortCard, flash && { borderColor: flash.ok ? colors.good : colors.retry }]}>
          <Text style={[type.h2, { textAlign: "center", fontSize: 24 }]}>{finished ? "🎉" : items[n].label}</Text>
          {flash && !flash.ok && flash.why ? <Text style={[type.small, { color: colors.retry, textAlign: "center", marginTop: 8 }]}>{flash.why}</Text> : null}
          <Text style={[type.small, { textAlign: "center", marginTop: 8 }]}>
            {Math.min(n + 1, items.length)} / {items.length}
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          {spec.bins.map((b) => (
            <Pressable
              key={b.id}
              onPress={() => drop(b.id)}
              style={({ pressed }) => [styles.bin, flash?.bin === b.id && { borderColor: flash.ok ? colors.good : colors.retry }, pressed && { borderBottomWidth: 2, marginTop: 2 }]}
              accessibilityRole="button"
            >
              <Text style={{ fontSize: 44 }}>{b.emoji}</Text>
              <Text style={[type.body, { fontFamily: font.bold, textAlign: "center" }]}>{b.label}</Text>
            </Pressable>
          ))}
        </View>
      </>
    );
  }
  return { id, Component: Sort, game: numeric(spec) ? undefined : { kind: "sort", spec } };
}

// ── Balance: move the price until the scale tips toward profit ──────────────────────────

export function balance(id: string, spec: { prompt: string; unitCost: number; maxPrice: number; start: number; stepSize: number }): StepDef {
  function Balance() {
    const lesson = useLesson();
    const [price, setPrice] = useState(spec.start);
    const profit = price - spec.unitCost;
    const tilt = Math.max(-14, Math.min(14, (profit / spec.unitCost) * 14));
    useTutorStep({ prompt: `${spec.prompt} Current price: ${price}. Cost: ${spec.unitCost}. People pay up to ${spec.maxPrice}.`, explain: "Price must be above cost and not above what people said they'd pay." });
    useFooter({ label: t.common.check }, () => {
      if (profit <= 0) lesson.check(false, { detail: t.lesson.balanceLow });
      else if (price > spec.maxPrice) lesson.check(false, { detail: t.lesson.balanceHigh });
      else lesson.check(true, { detail: `${t.lesson.balanceGood} ${peso(profit)}.` });
    });
    return (
      <>
        <Tag color={colors.gold}>⚖️ {t.lesson.game}</Tag>
        <Title>{spec.prompt}</Title>
        <View style={{ alignItems: "center", marginVertical: 24 }}>
          <View style={{ width: "86%", transform: [{ rotate: `${tilt}deg` }] }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
              <View style={styles.pan}>
                <Text style={[type.tag, { color: colors.retry }]}>{t.lesson.cost}</Text>
                <Text style={[type.h2, { fontFamily: font.black }]}>{peso(spec.unitCost)}</Text>
              </View>
              <View style={[styles.pan, { borderColor: colors.primaryEdge }]}>
                <Text style={[type.tag, { color: colors.good }]}>{t.lesson.price}</Text>
                <Text style={[type.h2, { fontFamily: font.black }]}>{peso(price)}</Text>
              </View>
            </View>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.gold }} />
          </View>
          <View style={{ width: 0, height: 0, borderLeftWidth: 22, borderRightWidth: 22, borderBottomWidth: 36, borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: colors.goldEdge }} />
        </View>
        <Text style={[type.body, { textAlign: "center", color: profit > 0 ? colors.good : colors.retry, fontFamily: font.bold }]}>
          {profit > 0 ? "+" : ""}
          {peso(profit)} {t.lesson.perCup}
        </Text>
        <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
          <View style={{ flex: 1 }}>
            <Option center label={`− ${peso(spec.stepSize)}`} onPress={() => (tap(), setPrice(Math.max(spec.stepSize, price - spec.stepSize)))} />
          </View>
          <View style={{ flex: 1 }}>
            <Option center label={`+ ${peso(spec.stepSize)}`} onPress={() => (tap(), setPrice(price + spec.stepSize))} />
          </View>
        </View>
        <Text style={[type.small, { textAlign: "center" }]}>
          {t.lesson.customersPay} {peso(spec.maxPrice)}
        </Text>
      </>
    );
  }
  return { id, Component: Balance };
}

// ── Recap: what you learned, before the real mission ──────────────────────────────────

export function recap(id: string, spec: { points: string[]; next: string }): StepDef {
  function Recap() {
    const lesson = useLesson();
    useEffect(() => say(spec.next), []);
    useTutorStep({ prompt: `Recap: ${spec.points.join(" ")}` });
    useFooter({ label: t.lesson.toMission }, lesson.next);
    return (
      <>
        <Tag color={colors.good}>🌟 {t.lesson.youLearned}</Tag>
        {spec.points.map((p, i) => (
          <Appear key={p} delay={i * 200}>
            <View style={styles.recapRow}>
              <View style={[styles.stepNum, { backgroundColor: colors.good }]}>
                <Text style={{ fontFamily: font.black, color: colors.bg }}>✓</Text>
              </View>
              <Text style={[type.body, { flex: 1 }]}>{p}</Text>
            </View>
          </Appear>
        ))}
        <View style={{ height: 16 }} />
        <Mascot text={spec.next} mood="proud" />
      </>
    );
  }
  return { id, Component: Recap };
}

const styles = StyleSheet.create({
  line: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 10, borderBottomWidth: 2, borderColor: colors.surface },
  card: { flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 2, borderColor: colors.line, borderRadius: 18, padding: 16, marginBottom: 12 },
  example: { borderWidth: 2, borderBottomWidth: 5, borderColor: colors.goldEdge, borderRadius: 18, padding: 16, backgroundColor: colors.surface, marginBottom: 12 },
  stepNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center", marginTop: 2 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  picture: { width: "47%", flexGrow: 1, alignItems: "center", gap: 8, borderWidth: 2, borderBottomWidth: 4, borderRadius: 18, paddingVertical: 20, paddingHorizontal: 8 },
  sentence: { borderBottomWidth: 2, borderTopWidth: 2, borderColor: colors.line, paddingVertical: 20, marginBottom: 24 },
  slot: { fontFamily: font.black, textDecorationLine: "underline" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center" },
  chip: { borderWidth: 2, borderBottomWidth: 4, borderColor: colors.line, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10 },
  answerArea: { minHeight: 120, borderWidth: 2, borderStyle: "dashed", borderColor: colors.line, borderRadius: 18, padding: 12, marginBottom: 20, justifyContent: "center", gap: 8 },
  orderRow: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 2, borderColor: colors.blueEdge, backgroundColor: colors.blueSoft, borderRadius: 14, padding: 12 },
  tf: { flex: 1, minHeight: 64, borderRadius: 18, borderBottomWidth: 6, alignItems: "center", justifyContent: "center" },
  ideaChip: { alignSelf: "flex-start", borderWidth: 2, borderColor: colors.goldEdge, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10 },
  recapRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 14 },
  sortCard: { borderWidth: 2, borderBottomWidth: 4, borderColor: colors.line, borderRadius: 18, padding: 28, marginBottom: 20, backgroundColor: colors.surface },
  bin: { flex: 1, alignItems: "center", gap: 6, borderWidth: 2, borderBottomWidth: 4, borderColor: colors.line, borderRadius: 18, paddingVertical: 18, paddingHorizontal: 8 },
  pan: { borderWidth: 2, borderColor: colors.line, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12, alignItems: "center", backgroundColor: colors.surface },
});

// ── Personal: the same idea, now with the kid's own business ──────────────────────────
// A worked example about their idea (numbers computed on the server by code), then a question.

/** Phases whose personal example uses money numbers (computed by the server, as an example). */
const MONEY_PHASES = new Set(["shopping", "price", "cashbox"]);

export function personal(id: string, phase: string): StepDef {
  function Personal() {
    const lesson = useLesson();
    const { business } = useSession();
    const [data, setData] = useState<PersonalLesson | null | undefined>(undefined);
    // A re-queued step (after a miss) goes straight to the question.
    const [stage, setStage] = useState<"example" | "question">(lesson.attempt > 0 ? "question" : "example");
    const [picked, setPicked] = useState<number | null>(null);
    const order = useMemo(() => shuffle([0, 1, 2]), []);
    const idea = business?.idea ?? "";

    useEffect(() => {
      if (!business?.idea) return setData(null);
      let live = true;
      loadPersonal(business.id, phase, business.idea).then((d) => live && setData(d));
      return () => {
        live = false;
      };
    }, [business?.id, business?.idea]);

    // Nothing to personalize (no idea yet, or the model failed): move on quietly.
    useEffect(() => {
      if (data === null) lesson.next();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data]);

    const q = data?.question;
    useTutorStep(
      stage === "question" && q
        ? { prompt: q.prompt, options: q.options, answer: q.options[q.answer], explain: q.explain }
        : { prompt: data ? `Worked example with the kid's idea (${idea}): ${data.example.title}. ${data.example.steps.join(" ")} ${data.example.result}` : `Example with ${idea}` },
    );

    useFooter(
      !data ? { label: t.common.continue, disabled: true, busy: data === undefined } : stage === "example" ? { label: t.lesson.gotIt } : { label: t.common.check, disabled: picked === null },
      () => {
        if (!data) return;
        if (stage === "example") return setStage("question");
        const ok = picked === data.question.answer;
        lesson.check(ok, ok ? { detail: data.question.explain } : miss(lesson.attempt, data.question.options[data.question.answer], data.question.explain));
      },
    );

    if (!data) {
      return (
        <>
          <Tag color={colors.gold}>✨ {t.lesson.withYourIdea}</Tag>
          <Mascot text={t.lesson.makingExample} mood="curious" />
          <View style={[styles.example, { opacity: 0.5 }]}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={{ height: 14, borderRadius: 7, backgroundColor: colors.surfaceHi, marginBottom: 12, width: `${90 - i * 15}%` }} />
            ))}
          </View>
        </>
      );
    }

    return (
      <>
        <Tag color={colors.gold}>✨ {t.lesson.withYourIdea}</Tag>
        <View style={styles.ideaChip}>
          <Text style={[type.small, { color: colors.gold, fontFamily: font.bold }]}>💡 {idea}</Text>
        </View>
        {stage === "example" ? (
          <>
            <Title>{data.example.title}</Title>
            <View style={styles.example}>
              {data.example.steps.map((s, i) => (
                <Appear key={s} delay={i * 350}>
                  <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
                    <View style={styles.stepNum}>
                      <Text style={{ fontFamily: font.black, color: colors.bg, fontSize: 13 }}>{i + 1}</Text>
                    </View>
                    <Text style={[type.body, { flex: 1 }]}>{s}</Text>
                  </View>
                </Appear>
              ))}
              <Appear delay={data.example.steps.length * 350}>
                <Text style={[type.body, { fontFamily: font.black, color: colors.gold, marginTop: 4 }]}>= {data.example.result}</Text>
              </Appear>
            </View>
            {MONEY_PHASES.has(phase) ? <Text style={[type.small, { textAlign: "center" }]}>{t.lesson.madeUpNumbers}</Text> : null}
          </>
        ) : (
          <>
            <Title>{data.question.prompt}</Title>
            {order.map((i, n) => (
              <Option
                key={i}
                badge={n + 1}
                label={data.question.options[i]}
                selected={picked === i}
                state={optionState(i, picked, data.question.answer, lesson.feedback)}
                onPress={() => !lesson.feedback && (tap(), setPicked(i))}
              />
            ))}
          </>
        )}
      </>
    );
  }
  return { id, Component: Personal };
}

/** Builds a game from a spec; used for the versions reworded around the kid's idea. */
export const GAME_BUILDERS: Record<GameKind, (id: string, spec: never) => StepDef> = { quiz, pictures, blank, order, lightning, pairs, sort };

/**
 * Wraps a practice game so it uses the version reworded around the kid's idea when it is ready,
 * and the general version otherwise. The choice is made once, when the game appears.
 */
export function withIdea(step: StepDef, phase: string): StepDef {
  const game = step.game;
  if (!game) return step;
  const built = new Map<string, StepDef>();
  function Personalized() {
    const { business } = useSession();
    const idea = business?.idea ?? null;
    const [spec] = useState(() => (business && idea ? personalGameSpec(business.id, phase, idea, step.id) : undefined));
    if (!spec || !idea) return <step.Component />;
    const key = JSON.stringify(spec);
    let def = built.get(key);
    if (!def) {
      def = GAME_BUILDERS[game!.kind](step.id, spec as never);
      built.set(key, def);
    }
    const Game = def.Component;
    return (
      <>
        <View style={styles.ideaChip}>
          <Text style={[type.small, { color: colors.gold, fontFamily: font.bold, fontSize: 13 }]}>💡 {idea}</Text>
        </View>
        <Game />
      </>
    );
  }
  return { ...step, Component: Personalized };
}
