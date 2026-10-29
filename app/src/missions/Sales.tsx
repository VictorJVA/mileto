// Phase 10 (F9, RF-21, RF-20): practice by voice with a simulated customer (max 3 turns), scored by a
// fixed rubric in code. Then log real sales and how each customer heard about the business.

import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Mascot, Olive, say } from "../components/Mascot";
import { Button, ErrorNote, Option, Stepper } from "../components/ui";
import { VoiceInput } from "../components/VoiceInput";
import { t } from "../i18n/en";
import { get, post } from "../lib/api";
import { colors, font, type } from "../lib/theme";
import { useCall } from "../lib/useCall";
import { useFooter, useLesson, type StepDef } from "../lesson/engine";
import { earlier, MissionHead, useBusiness } from "./kit";

type Turn = { role: "kid" | "customer"; text: string };
type Source = "word_of_mouth" | "free_sample" | "poster" | "other";
const SOURCES: Source[] = ["word_of_mouth", "free_sample", "poster", "other"];

interface Feedback {
  score: number;
  maxScore: number;
  highlight: string;
  improvement: string | null;
}

function Scenario() {
  const lesson = useLesson();
  const [scenarios, setScenarios] = useState<Array<{ id: string; opening: string }>>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const { error, run, retry } = useCall();
  useEffect(() => {
    run(async () => setScenarios((await get<{ scenarios: Array<{ id: string; opening: string }> }>("/api/ai/sales-scenarios")).scenarios));
  }, [run]);
  useFooter({ label: t.common.start, disabled: picked === null }, () => {
    lesson.set({ scenario: scenarios[picked ?? 0] });
    lesson.next();
  });
  return (
    <>
      <MissionHead title={t.missions.sales.pickScenario} say={t.missions.sales.say} />
      {scenarios.map((s, i) => (
        <Option key={s.id} badge={i + 1} label={`“${s.opening}”`} selected={picked === i} onPress={() => setPicked(i)} />
      ))}
      <ErrorNote error={error} onRetry={retry} />
    </>
  );
}

/** A chat between the kid (olive) and the customer, one bubble per turn. */
function Bubble({ turn }: { turn: Turn }) {
  const kid = turn.role === "kid";
  return (
    <View style={{ flexDirection: kid ? "row-reverse" : "row", alignItems: "flex-end", gap: 8, marginBottom: 12 }}>
      {kid ? <Olive size={40} mood="happy" /> : <Text style={{ fontSize: 40 }}>🧑‍🌾</Text>}
      <View style={{ maxWidth: "78%", borderWidth: 2, borderColor: kid ? colors.blueEdge : colors.line, backgroundColor: kid ? colors.blueSoft : "transparent", borderRadius: 16, padding: 12 }}>
        <Text style={type.body}>{turn.text}</Text>
      </View>
    </View>
  );
}

function Chat() {
  const lesson = useLesson();
  const business = useBusiness();
  const scenario = lesson.state.scenario as { id: string; opening: string };
  const price = earlier<{ price: number }>(business, "price").price ?? 1500;
  const [history, setHistory] = useState<Turn[]>([{ role: "customer", text: scenario.opening }]);
  const [reply, setReply] = useState("");
  const [round, setRound] = useState(0);
  const [ended, setEnded] = useState(false);
  const { busy, error, run } = useCall();

  useEffect(() => say(scenario.opening), [scenario.opening]);

  useFooter({ label: ended ? t.common.continue : t.missions.sales.send, disabled: !ended && reply.length < 2, busy, tone: ended ? "primary" : "blue" }, async () => {
    if (ended) {
      lesson.set({ history });
      return lesson.next();
    }
    const next: Turn[] = [...history, { role: "kid", text: reply }];
    setHistory(next);
    setReply("");
    setRound(round + 1);
    const r = await run(() => post<{ reply: string; endConversation: boolean }>("/api/ai/customer", { scenario: scenario.opening, product: business.idea ?? "my product", price, history: next }));
    if (!r) return;
    if (r.reply) {
      setHistory([...next, { role: "customer", text: r.reply }]);
      say(r.reply);
    }
    if (r.endConversation) setEnded(true);
  });

  return (
    <>
      <MissionHead title={t.missions.sales.yourTurn} />
      {history.map((h, i) => (
        <Bubble key={i} turn={h} />
      ))}
      {!ended ? <VoiceInput key={round} onText={setReply} placeholder={t.missions.sales.placeholder} /> : null}
      <ErrorNote error={error} />
    </>
  );
}

function Score() {
  const lesson = useLesson();
  const scenario = lesson.state.scenario as { opening: string };
  const [fb, setFb] = useState<Feedback | null>(null);
  const { busy, error, run, retry } = useCall();
  const m = t.missions.sales;
  useEffect(() => {
    run(async () => setFb((await post<{ feedback: Feedback }>("/api/ai/evaluate-sale", { objection: scenario.opening, history: lesson.state.history })).feedback));
    // Scores the finished conversation once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useFooter({ label: t.common.continue, disabled: !fb, busy }, () => {
    lesson.set({ feedback: fb });
    lesson.next();
  });
  return (
    <>
      <MissionHead title={m.feedback} />
      {fb ? (
        <>
          <Text style={{ fontSize: 48, textAlign: "center", letterSpacing: 6, marginVertical: 12 }}>
            {"⭐".repeat(fb.score)}
            <Text style={{ opacity: 0.25 }}>{"⭐".repeat(fb.maxScore - fb.score)}</Text>
          </Text>
          <Mascot text={`${fb.highlight} ${fb.improvement ?? ""}`} mood={fb.score === fb.maxScore ? "proud" : "happy"} size={70} />
          <Button label={m.again} tone="ghost" onPress={() => lesson.goTo("scenario")} />
        </>
      ) : null}
      <ErrorNote error={error} onRetry={retry} />
    </>
  );
}

function RealSales() {
  const lesson = useLesson();
  const [bySource, setBySource] = useState<Record<Source, number>>({ word_of_mouth: 0, free_sample: 0, poster: 0, other: 0 });
  const { busy, error, run } = useCall();
  const m = t.missions.sales;
  const realSales = Object.values(bySource).reduce((a, b) => a + b, 0);

  useFooter({ label: t.common.check, busy }, async () => {
    const sources = SOURCES.flatMap((s) => Array<Source>(bySource[s]).fill(s));
    const counted = await run(() => post<{ best: Source | null }>("/api/calc/customer-sources", { sources }));
    if (!counted) return;
    const fb = lesson.state.feedback as Feedback;
    const scenario = lesson.state.scenario as { id: string };
    lesson.set({ result: { scenario: scenario.id, ...fb, realSales, bySource, bestAction: counted.best } });
    lesson.check(true, { title: m.done, detail: counted.best ? `${m.bestAction} ${t.missions.brand.actionNames[counted.best]}` : undefined });
  });

  return (
    <>
      <MissionHead title={m.realSales} say={m.realSay} />
      {SOURCES.map((s) => (
        <View key={s} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 2, borderColor: colors.line }}>
          <Text style={[type.body, { fontFamily: font.bold, flex: 1 }]}>
            {s === "other" ? "❓" : t.missions.brand.actionEmoji[s]} {s === "other" ? m.other : t.missions.brand.actionNames[s]}
          </Text>
          <Stepper value={bySource[s]} onChange={(n) => setBySource({ ...bySource, [s]: n })} />
        </View>
      ))}
      <ErrorNote error={error} />
    </>
  );
}

export const salesSteps: StepDef[] = [
  { id: "scenario", Component: Scenario },
  { id: "chat", Component: Chat },
  { id: "score", Component: Score },
  { id: "real", Component: RealSales },
];
