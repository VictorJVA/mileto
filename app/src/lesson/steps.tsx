// Reusable step types. Each builder returns a StepDef; content lives in content.ts.

import * as Haptics from "expo-haptics";
import { useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Mascot, type Mood } from "../components/Mascot";
import { Card, Option, Tag, Title } from "../components/ui";
import { t } from "../i18n/en";
import { colors, font, peso, type } from "../lib/theme";
import { useFooter, useLesson, type StepDef } from "./engine";

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

// ── Teach: a new idea explained with a picture and an analogy ─────────────────────────────

export interface TeachSpec {
  emoji: string;
  title: string;
  say: string;
  analogy?: string;
  mood?: Mood;
}

export function teach(id: string, spec: TeachSpec): StepDef {
  function Teach() {
    const lesson = useLesson();
    useFooter({ label: t.common.continue }, lesson.next);
    return (
      <>
        <Tag>💡 {t.lesson.newIdea}</Tag>
        <Title>{spec.title}</Title>
        <Mascot text={spec.say} mood={spec.mood ?? "curious"} />
        <View style={styles.hero}>
          <Text style={{ fontSize: 88 }}>{spec.emoji}</Text>
        </View>
        {spec.analogy ? (
          <Card style={{ borderColor: colors.blueEdge, backgroundColor: colors.blueSoft }}>
            <Text style={[type.tag, { color: colors.blue, marginBottom: 6 }]}>🫒 {t.lesson.thinkOfIt}</Text>
            <Text style={type.body}>{spec.analogy}</Text>
          </Card>
        ) : null}
      </>
    );
  }
  return { id, Component: Teach };
}

// ── Quiz: pick the right answer ────────────────────────────────────────────────────────────

export interface QuizSpec {
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
    useFooter({ label: t.common.check, disabled: picked === null }, () => {
      const ok = picked === spec.answer;
      lesson.check(ok, ok ? { detail: spec.explain } : { title: t.lesson.notQuite, detail: `${t.lesson.answerWas} ${spec.options[spec.answer]}. ${spec.explain}` });
    });
    return (
      <>
        <Tag color={colors.blue}>🎯 {t.lesson.practice}</Tag>
        <Title>{spec.prompt}</Title>
        {spec.say ? <Mascot text={spec.say} size={70} /> : null}
        {order.map((i, n) => (
          <Option key={i} badge={n + 1} label={spec.options[i]} selected={picked === i} onPress={() => { tap(); setPicked(i); }} />
        ))}
      </>
    );
  }
  return { id, Component: Quiz };
}

// ── Pairs: tap matching pairs (concept ↔ analogy) ─────────────────────────────────────────

export function pairs(id: string, spec: { prompt: string; pairs: Array<[string, string]> }): StepDef {
  function Pairs() {
    const lesson = useLesson();
    const right = useMemo(() => shuffle(spec.pairs.map((_, i) => i)), []);
    const [left, setLeft] = useState<number | null>(null);
    const [done, setDone] = useState<number[]>([]);
    const [miss, setMiss] = useState<number | null>(null);
    const finished = done.length === spec.pairs.length;
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
              <Option key={l} center label={l} selected={left === i} state={done.includes(i) ? "done" : undefined} onPress={() => { tap(); setLeft(i); }} />
            ))}
          </View>
          <View style={{ flex: 1 }}>
            {right.map((i) => (
              <Option key={spec.pairs[i][1]} center label={spec.pairs[i][1]} state={done.includes(i) ? "done" : miss === i ? "retry" : undefined} onPress={() => pickRight(i)} />
            ))}
          </View>
        </View>
      </>
    );
  }
  return { id, Component: Pairs };
}

// ── Sort: drop each card into the right bin (two jars, fact or guess…) ───────────────────

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
    useFooter({ label: t.common.continue, disabled: !finished }, () =>
      lesson.check(true, { title: mistakes === 0 ? t.lesson.perfect : t.lesson.allSorted }),
    );

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
      }, ok ? 450 : 1400);
    }

    return (
      <>
        <Tag color={colors.gold}>🧩 {t.lesson.game}</Tag>
        <Title>{spec.prompt}</Title>
        {spec.say ? <Mascot text={spec.say} size={70} /> : null}
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
  return { id, Component: Sort };
}

// ── Balance: move the price until the scale tips toward profit ──────────────────────────

export function balance(id: string, spec: { prompt: string; unitCost: number; maxPrice: number; start: number; stepSize: number }): StepDef {
  function Balance() {
    const lesson = useLesson();
    const [price, setPrice] = useState(spec.start);
    const profit = price - spec.unitCost;
    const tilt = Math.max(-14, Math.min(14, (profit / spec.unitCost) * 14));
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
          {profit > 0 ? `+${peso(profit)} ${t.lesson.perCup}` : `${peso(profit)} ${t.lesson.perCup}`}
        </Text>
        <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
          <View style={{ flex: 1 }}>
            <Option center label={`− ${peso(spec.stepSize)}`} onPress={() => { tap(); setPrice(Math.max(spec.stepSize, price - spec.stepSize)); }} />
          </View>
          <View style={{ flex: 1 }}>
            <Option center label={`+ ${peso(spec.stepSize)}`} onPress={() => { tap(); setPrice(price + spec.stepSize); }} />
          </View>
        </View>
        <Text style={[type.small, { textAlign: "center" }]}>{t.lesson.customersPay} {peso(spec.maxPrice)}</Text>
      </>
    );
  }
  return { id, Component: Balance };
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", justifyContent: "center", paddingVertical: 12, marginBottom: 16 },
  sortCard: { borderWidth: 2, borderBottomWidth: 4, borderColor: colors.line, borderRadius: 18, padding: 28, marginBottom: 20, backgroundColor: colors.surface },
  bin: { flex: 1, alignItems: "center", gap: 6, borderWidth: 2, borderBottomWidth: 4, borderColor: colors.line, borderRadius: 18, paddingVertical: 18, paddingHorizontal: 8 },
  pan: { borderWidth: 2, borderColor: colors.line, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12, alignItems: "center", backgroundColor: colors.surface },
});
