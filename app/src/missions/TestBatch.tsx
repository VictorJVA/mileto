// Phase 7: make a small batch, then collect opinions by voice before making more.

import { useState } from "react";
import { Body, Stepper } from "../components/ui";
import { VoiceInput } from "../components/VoiceInput";
import { fill, t } from "../i18n/en";
import { useFooter, useLesson, type StepDef } from "../lesson/engine";
import { MissionHead } from "./kit";

function Units() {
  const lesson = useLesson();
  const [units, setUnits] = useState(10);
  const m = t.missions.testBatch;
  useFooter({ label: t.common.continue }, () => {
    lesson.set({ units });
    lesson.next();
  });
  return (
    <>
      <MissionHead title={m.units} say={m.say} />
      <Stepper value={units} onChange={setUnits} min={1} />
      {units > 30 ? <Body muted>🍲 {m.tooMany}</Body> : null}
    </>
  );
}

function Opinions() {
  const lesson = useLesson();
  const [done, setDone] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const [round, setRound] = useState(0);
  const m = t.missions.testBatch;
  const saving = current.length >= 3;
  useFooter({ label: saving ? m.save : t.common.continue, disabled: !saving && done.length < 1, tone: saving ? "blue" : "primary" }, () => {
    if (saving) {
      setDone([...done, current]);
      setCurrent("");
      setRound(round + 1);
      return;
    }
    lesson.set({ result: { units: lesson.state.units, opinions: done } });
    lesson.check(true, { title: m.tasted });
  });
  return (
    <>
      <MissionHead title={fill(m.opinion, { n: done.length + 1 })} say={m.opinionSay} />
      <VoiceInput key={round} onText={setCurrent} placeholder={m.placeholder} />
      {done.map((o, i) => (
        <Body key={i} muted>
          💬 “{o}”
        </Body>
      ))}
    </>
  );
}

export const testBatchSteps: StepDef[] = [
  { id: "units", Component: Units },
  { id: "opinions", Component: Opinions },
];
