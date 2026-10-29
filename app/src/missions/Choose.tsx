// Phase 2 (RF-06): four questions about the idea. The rules live in server code, not in the model.

import { useState } from "react";
import { View } from "react-native";
import { Mascot } from "../components/Mascot";
import { Body, Button, Card, Choice, ErrorNote } from "../components/ui";
import { t } from "../i18n/en";
import { post } from "../lib/api";
import { useCall } from "../lib/useCall";
import type { MissionProps } from "./types";

type Key = "canMakeIt" | "someoneWantsIt" | "isSafe" | "cheapToStart";
const KEYS: Key[] = ["canMakeIt", "someoneWantsIt", "isSafe", "cheapToStart"];

interface CheckResult {
  passed: boolean;
  score: number;
  needsAdult: boolean;
  concerns: Key[];
}

export function Choose({ business, complete }: MissionProps) {
  const [answers, setAnswers] = useState<Partial<Record<Key, boolean>>>({});
  const [result, setResult] = useState<CheckResult | null>(null);
  const { busy, error, run } = useCall();
  const allAnswered = KEYS.every((k) => answers[k] !== undefined);

  async function check() {
    const r = await run(() => post<CheckResult>("/api/calc/idea-check", answers));
    if (r) setResult(r);
  }

  const m = t.missions.choose;
  const say = !result ? m.say : result.needsAdult ? m.unsafe : result.passed ? m.pass : m.fail;

  return (
    <>
      <Mascot text={say} mood={result && !result.passed ? "stumble" : result?.passed ? "happy" : "curious"} />
      {business.idea ? <Body muted>💡 {business.idea}</Body> : null}
      {KEYS.map((k) => (
        <Card key={k}>
          <Body>{m.questions[k]}</Body>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
            <View style={{ flex: 1 }}>
              <Choice label={t.common.yes} selected={answers[k] === true} onPress={() => { setAnswers({ ...answers, [k]: true }); setResult(null); }} />
            </View>
            <View style={{ flex: 1 }}>
              <Choice label={t.common.no} selected={answers[k] === false} onPress={() => { setAnswers({ ...answers, [k]: false }); setResult(null); }} />
            </View>
          </View>
        </Card>
      ))}
      <ErrorNote error={error} />
      {result?.passed ? (
        <Button label={t.common.done} onPress={() => run(() => complete({ ...answers, score: result.score }))} busy={busy} />
      ) : (
        <Button label={t.common.next} onPress={check} disabled={!allAnswered} busy={busy} />
      )}
    </>
  );
}
