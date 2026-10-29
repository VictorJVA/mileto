// Phase 12 (F5, F10, RF-13, RF-14, RF-23): choose what to do with the profit from simulated scenarios
// (hypotheses, not promises), split it into two jars, then pitch the business by voice.

import { useEffect, useState } from "react";
import { View } from "react-native";
import { Mascot } from "../components/Mascot";
import { Body, Button, Card, Choice, ErrorNote, H2, Stat } from "../components/ui";
import { VoiceInput } from "../components/VoiceInput";
import { t } from "../i18n/en";
import { post } from "../lib/api";
import { useSession } from "../lib/session";
import { peso } from "../lib/theme";
import { useCall } from "../lib/useCall";
import { earlier, type MissionProps } from "./types";

interface Scenario {
  id: string;
  assumptions: string[];
  projectedUnits: number;
  projectedProfit: number;
  savedNow: number;
}

const SHARES = [0.25, 0.5, 0.75];

export function Decide({ business, complete }: MissionProps) {
  const { refresh } = useSession();
  const price = earlier<{ price: number; unitCost: number }>(business, "price");
  const cash = earlier<{ soldByCount: number }>(business, "cashbox");
  const unitsSold = cash.soldByCount ?? 0;
  const profit = Math.max(0, Math.round(((price.price ?? 0) - (price.unitCost ?? 0)) * unitsSold));

  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [choice, setChoice] = useState<string | null>(null);
  const [share, setShare] = useState<number | null>(null);
  const [jars, setJars] = useState<{ business: number; personal: number } | null>(null);
  const [pitch, setPitch] = useState<{ strength: string; suggestion: string } | null>(null);
  const { busy, error, run } = useCall();
  const m = t.missions.decide;

  useEffect(() => {
    run(async () => {
      const r = await post<{ scenarios: Scenario[] }>("/api/calc/scenarios", {
        week: { unitsSold, price: price.price ?? 0, unitCost: price.unitCost ?? 0, profit },
      });
      setScenarios(r.scenarios);
    });
  }, [unitsSold, price.price, price.unitCost, profit, run]);

  async function split(s: number) {
    // Splitting moves money between jars, so it happens once per round.
    if (jars) return;
    setShare(s);
    const r = await run(() => post<{ business: number; personal: number }>(`/api/businesses/${business.id}/jars/split`, { profit, businessShare: s }));
    if (r) {
      setJars(r);
      await refresh();
    }
  }

  async function onPitch(text: string) {
    const r = await run(() => post<{ strength: string; suggestion: string }>("/api/ai/pitch", { transcript: text }));
    if (r) setPitch(r);
  }

  const say = pitch ? `${pitch.strength} ${pitch.suggestion}` : jars ? m.pitch : m.say;

  return (
    <>
      <Mascot text={say} mood={pitch ? "proud" : "curious"} />
      <Body>Profit this round: {peso(profit)}</Body>
      <H2>🌾 {t.common.guess}</H2>
      {scenarios.map((s) => (
        <Choice
          key={s.id}
          label={`${m.scenarios[s.id] ?? s.id}: ${peso(s.projectedProfit)}`}
          sub={s.assumptions.join(" · ")}
          selected={choice === s.id}
          onPress={() => setChoice(s.id)}
        />
      ))}

      {choice ? (
        <>
          <H2>🫙 {m.split}</H2>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {SHARES.map((s) => (
              <View key={s} style={{ flex: 1 }}>
                <Choice label={`${Math.round(s * 100)}% business`} selected={share === s} onPress={() => split(s)} />
              </View>
            ))}
          </View>
          {jars ? (
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Stat label="🫙 Business jar" value={peso(jars.business)} tone="good" />
              <Stat label="🫙 My jar" value={peso(jars.personal)} />
            </View>
          ) : null}
        </>
      ) : null}

      {jars ? (
        <Card>
          <H2>🎤 {m.pitch}</H2>
          <VoiceInput onText={onPitch} placeholder="My business sells… to… because…" />
        </Card>
      ) : null}
      <ErrorNote error={error} />
      <Button
        label={t.common.done}
        disabled={!choice || !jars}
        busy={busy}
        onPress={() => run(() => complete({ choice, businessShare: share, profit, pitched: !!pitch }))}
      />
    </>
  );
}
