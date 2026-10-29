// Phase 12 (F5, F10, RF-13, RF-14, RF-23): choose what to do with the profit from simulated scenarios
// (guesses, not promises), split it into two jars, then pitch the business by voice.

import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Mascot } from "../components/Mascot";
import { Body, ErrorNote, Option, Stat } from "../components/ui";
import { VoiceInput } from "../components/VoiceInput";
import { fill, t } from "../i18n/en";
import { post } from "../lib/api";
import { useSession } from "../lib/session";
import { colors, font, peso, type } from "../lib/theme";
import { useCall } from "../lib/useCall";
import { useFooter, useLesson, type StepDef } from "../lesson/engine";
import { earlier, MissionHead, useBusiness } from "./kit";

interface Scenario {
  id: string;
  assumptions: string[];
  projectedProfit: number;
}

function useProfit() {
  const business = useBusiness();
  const price = earlier<{ price: number; unitCost: number }>(business, "price");
  const cash = earlier<{ soldByCount: number }>(business, "cashbox");
  const unitsSold = cash.soldByCount ?? 0;
  // Uses the cost and price already computed by the server in phases 8 and 11.
  return { unitsSold, price: price.price ?? 0, unitCost: price.unitCost ?? 0, profit: Math.max(0, Math.round(((price.price ?? 0) - (price.unitCost ?? 0)) * unitsSold)) };
}

function Choose() {
  const lesson = useLesson();
  const week = useProfit();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const { busy, error, run, retry } = useCall();
  const m = t.missions.decide;

  useEffect(() => {
    run(async () => setScenarios((await post<{ scenarios: Scenario[] }>("/api/calc/scenarios", { week })).scenarios));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFooter({ label: t.common.continue, disabled: !picked, busy }, () => {
    lesson.set({ choice: picked, profit: week.profit });
    lesson.next();
  });

  return (
    <>
      <MissionHead title={m.title} />
      <Mascot text={fill(m.say, { profit: peso(week.profit) })} size={70} />
      {scenarios.map((s, i) => (
        <Option
          key={s.id}
          badge={i + 1}
          label={`${m.scenarios[s.id] ?? s.id} → ${peso(s.projectedProfit)}`}
          sub={s.assumptions.join(" · ")}
          selected={picked === s.id}
          onPress={() => setPicked(s.id)}
        />
      ))}
      <Body muted>🔮 {t.common.guess}</Body>
      <ErrorNote error={error} onRetry={retry} />
    </>
  );
}

const SHARES = [0.25, 0.5, 0.75];

function Jars() {
  const lesson = useLesson();
  const business = useBusiness();
  const { refresh } = useSession();
  const profit = Number(lesson.state.profit ?? 0);
  const [share, setShare] = useState<number | null>(null);
  const { busy, error, run } = useCall();
  const m = t.missions.decide;

  useFooter({ label: t.common.check, disabled: share === null, busy }, async () => {
    if (share === null) return;
    // Splitting moves money between jars, so it happens once, on confirm.
    const r = await run(() => post<{ business: number; personal: number; toBusiness: number; toPersonal: number }>(`/api/businesses/${business.id}/jars/split`, { profit, businessShare: share }));
    if (!r) return;
    await refresh();
    lesson.set({ share });
    lesson.check(true, { title: m.splitDone, detail: fill(m.splitDetail, { business: peso(r.toBusiness), personal: peso(r.toPersonal) }) });
  });

  return (
    <>
      <MissionHead title={`🫙 ${m.split}`} say={m.splitSay} />
      {SHARES.map((s) => (
        <Option
          key={s}
          label={`${Math.round(s * 100)}% 🍊  ·  ${Math.round((1 - s) * 100)}% 🍬`}
          sub={`${m.business} ${peso(Math.round(profit * s))} · ${m.mine} ${peso(profit - Math.round(profit * s))}`}
          selected={share === s}
          onPress={() => setShare(s)}
        />
      ))}
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Stat label={m.business} value={peso(business.jars.business)} color={colors.good} />
        <Stat label={m.mine} value={peso(business.jars.personal)} color={colors.gold} />
      </View>
      <ErrorNote error={error} />
    </>
  );
}

function Pitch() {
  const lesson = useLesson();
  const [text, setText] = useState("");
  const [fb, setFb] = useState<{ strength: string; suggestion: string } | null>(null);
  const { busy, error, run } = useCall();
  const m = t.missions.decide;

  useFooter({ label: fb ? t.common.continue : t.common.check, disabled: !fb && text.length < 10, busy }, async () => {
    if (!fb) {
      const r = await run(() => post<{ strength: string; suggestion: string }>("/api/ai/pitch", { transcript: text }));
      if (r) setFb(r);
      return;
    }
    lesson.set({ result: { choice: lesson.state.choice, businessShare: lesson.state.share, profit: lesson.state.profit, pitched: true } });
    lesson.check(true, { title: m.pitchDone });
  });

  return (
    <>
      <MissionHead title={`🎤 ${m.pitch}`} say={m.pitchSay} />
      {fb ? (
        <View style={{ gap: 8 }}>
          <Text style={[type.body, { color: colors.good, fontFamily: font.bold }]}>✓ {fb.strength}</Text>
          <Text style={[type.body, { color: colors.blue, fontFamily: font.bold }]}>➜ {fb.suggestion}</Text>
        </View>
      ) : (
        <VoiceInput onText={setText} placeholder={m.pitchPlaceholder} />
      )}
      <ErrorNote error={error} />
    </>
  );
}

export const decideSteps: StepDef[] = [
  { id: "choose", Component: Choose },
  { id: "jars", Component: Jars },
  { id: "pitch", Component: Pitch },
];
