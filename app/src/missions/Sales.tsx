// Phase 10 (F9, RF-21, RF-20): practice by voice with a simulated customer (max 3 turns), scored by a
// fixed rubric in code. Then log real sales and how each customer heard about the business.

import { useEffect, useState } from "react";
import { View } from "react-native";
import { Mascot, say } from "../components/Mascot";
import { Body, Button, Card, Choice, ErrorNote, H2, Stepper } from "../components/ui";
import { VoiceInput } from "../components/VoiceInput";
import { t } from "../i18n/en";
import { get, post } from "../lib/api";
import { useCall } from "../lib/useCall";
import { earlier, type MissionProps } from "./types";

type Turn = { role: "kid" | "customer"; text: string };
type Source = "word_of_mouth" | "free_sample" | "poster" | "other";

interface Feedback {
  score: number;
  maxScore: number;
  highlight: string;
  improvement: string | null;
}

const SOURCES: Source[] = ["word_of_mouth", "free_sample", "poster", "other"];

export function Sales({ business, complete }: MissionProps) {
  const price = earlier<{ price: number }>(business, "price").price ?? 1500;
  const product = business.idea ?? "my product";
  const [scenarios, setScenarios] = useState<Array<{ id: string; opening: string }>>([]);
  const [scenario, setScenario] = useState<{ id: string; opening: string } | null>(null);
  const [history, setHistory] = useState<Turn[]>([]);
  const [ended, setEnded] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [bySource, setBySource] = useState<Record<Source, number>>({ word_of_mouth: 0, free_sample: 0, poster: 0, other: 0 });
  const { busy, error, run } = useCall();
  const m = t.missions.sales;

  useEffect(() => {
    run(async () => setScenarios((await get<{ scenarios: Array<{ id: string; opening: string }> }>("/api/ai/sales-scenarios")).scenarios));
  }, [run]);

  function start(s: { id: string; opening: string }) {
    setScenario(s);
    setHistory([{ role: "customer", text: s.opening }]);
    setEnded(false);
    setFeedback(null);
    say(s.opening);
  }

  async function reply(text: string) {
    if (!scenario) return;
    const next: Turn[] = [...history, { role: "kid", text }];
    setHistory(next);
    const r = await run(() =>
      post<{ reply: string; endConversation: boolean }>("/api/ai/customer", { scenario: scenario.opening, product, price, history: next }),
    );
    if (!r) return;
    const withReply = r.reply ? [...next, { role: "customer" as const, text: r.reply }] : next;
    setHistory(withReply);
    if (r.reply) say(r.reply);
    if (r.endConversation) {
      setEnded(true);
      const ev = await run(() => post<{ feedback: Feedback }>("/api/ai/evaluate-sale", { objection: scenario.opening, history: withReply }));
      if (ev) setFeedback(ev.feedback);
    }
  }

  const realSales = Object.values(bySource).reduce((a, b) => a + b, 0);

  async function finish() {
    const sources = SOURCES.flatMap((s) => Array<Source>(bySource[s]).fill(s));
    await run(async () => {
      const counted = await post<{ best: string | null }>("/api/calc/customer-sources", { sources });
      await complete({ scenario: scenario?.id, ...feedback, realSales, bySource, bestAction: counted.best });
    });
  }

  return (
    <>
      <Mascot
        text={feedback ? `${feedback.highlight} ${feedback.improvement ?? ""}` : m.say}
        mood={feedback ? "happy" : "curious"}
      />
      {!scenario ? (
        <>
          <H2>{m.pickScenario}</H2>
          {scenarios.map((s) => (
            <Choice key={s.id} label={`🧑 “${s.opening}”`} selected={false} onPress={() => start(s)} />
          ))}
        </>
      ) : (
        <>
          <Card>
            {history.map((h, i) => (
              <Body key={i} muted={h.role === "kid"}>
                {h.role === "customer" ? "🧑" : "🫒"} {h.text}
              </Body>
            ))}
          </Card>
          {!ended ? (
            <>
              <H2>{m.yourTurn}</H2>
              <VoiceInput onText={reply} placeholder="Hi! It's fresh from today…" />
              {busy ? <Body muted>{t.common.loading}</Body> : null}
            </>
          ) : null}
          {feedback ? (
            <>
              <H2>
                {m.feedback}: {"⭐".repeat(feedback.score)}
                {"☆".repeat(feedback.maxScore - feedback.score)}
              </H2>
              <Button label={m.again} variant="secondary" onPress={() => start(scenario)} />
              <H2>{m.realSales}</H2>
              {SOURCES.map((s) => (
                <View key={s} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Body>{t.missions.brand.actionNames[s] ?? "Other"}</Body>
                  <Stepper value={bySource[s]} onChange={(n) => setBySource({ ...bySource, [s]: n })} />
                </View>
              ))}
              <Button label={t.common.done} onPress={finish} busy={busy} />
            </>
          ) : null}
        </>
      )}
      <ErrorNote error={error} />
    </>
  );
}
