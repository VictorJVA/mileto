// Phase 2 (RF-06): four questions about the idea, one per screen. The rules live in server code.

import { useEffect, useState } from "react";
import { Mascot } from "../components/Mascot";
import { Body, ErrorNote, Option } from "../components/ui";
import { t } from "../i18n/en";
import { post } from "../lib/api";
import { useCall } from "../lib/useCall";
import { useFooter, useLesson, type StepDef } from "../lesson/engine";
import { MissionHead, useBusiness } from "./kit";

type Key = "canMakeIt" | "someoneWantsIt" | "isSafe" | "cheapToStart";
const KEYS: Key[] = ["canMakeIt", "someoneWantsIt", "isSafe", "cheapToStart"];
const EMOJI: Record<Key, string> = { canMakeIt: "🛠️", someoneWantsIt: "🙋", isSafe: "🦺", cheapToStart: "🪙" };

function question(key: Key, n: number): StepDef {
  function Question() {
    const lesson = useLesson();
    const business = useBusiness();
    const [answer, setAnswer] = useState<boolean | null>(null);
    useFooter({ label: t.common.continue, disabled: answer === null }, () => {
      lesson.set({ [key]: answer });
      lesson.next();
    });
    return (
      <>
        <MissionHead title={`${EMOJI[key]} ${t.missions.choose.questions[key]}`} />
        <Body muted>
          💡 {business.idea} · {n} / 4
        </Body>
        <Option label={`👍  ${t.common.yes}`} selected={answer === true} onPress={() => setAnswer(true)} />
        <Option label={`👎  ${t.common.no}`} selected={answer === false} onPress={() => setAnswer(false)} />
      </>
    );
  }
  return { id: `q-${key}`, Component: Question };
}

interface CheckResult {
  passed: boolean;
  score: number;
  needsAdult: boolean;
}

function Verdict() {
  const lesson = useLesson();
  const [result, setResult] = useState<CheckResult | null>(null);
  const { busy, error, run, retry } = useCall();
  const answers = Object.fromEntries(KEYS.map((k) => [k, lesson.state[k]]));
  const m = t.missions.choose;

  useEffect(() => {
    run(async () => setResult(await post<CheckResult>("/api/calc/idea-check", answers)));
    // Runs once with the answers collected so far.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFooter(
    result ? { label: result.passed ? t.common.continue : m.change, tone: result.passed ? "primary" : "blue" } : { label: t.common.continue, disabled: true, busy },
    () => {
      if (!result) return;
      if (!result.passed) return lesson.goTo(`q-${KEYS[0]}`);
      lesson.set({ result: { ...answers, score: result.score } });
      lesson.next();
    },
  );

  const say = !result ? t.common.loading : result.needsAdult ? m.unsafe : result.passed ? m.pass : m.fail;
  return (
    <>
      <MissionHead title={result ? `${result.score} / 4 ✓` : "…"} />
      <Mascot text={say} mood={result ? (result.passed ? "happy" : "stumble") : "curious"} />
      <ErrorNote error={error} onRetry={retry} />
    </>
  );
}

export const chooseSteps: StepDef[] = [...KEYS.map((k, i) => question(k, i + 1)), { id: "verdict", Component: Verdict }];
