// Phase 6: decide the starting money and where it comes from. Two jars, no loans by default.

import { useState } from "react";
import { NumberField, Option } from "../components/ui";
import { t } from "../i18n/en";
import { useFooter, useLesson, type StepDef } from "../lesson/engine";
import { MissionHead } from "./kit";

function Amount() {
  const lesson = useLesson();
  const [amount, setAmount] = useState<number | null>(null);
  const m = t.missions.capital;
  useFooter({ label: t.common.continue, disabled: !amount }, () => {
    lesson.set({ amount });
    lesson.next();
  });
  return (
    <>
      <MissionHead title={m.start} say={m.say} />
      <NumberField big value={amount} onChange={setAmount} hint={m.amountHint} />
    </>
  );
}

const SOURCES = ["savings", "gift", "family", "other"] as const;

function Source() {
  const lesson = useLesson();
  const [source, setSource] = useState<string | null>(null);
  const m = t.missions.capital;
  useFooter({ label: t.common.check, disabled: !source }, () => {
    lesson.set({ result: { startingMoney: lesson.state.amount, source, debt: 0 } });
    lesson.check(true, { title: m.jarsReady });
  });
  return (
    <>
      <MissionHead title={m.fromWhere} say={m.noLoans} />
      {SOURCES.map((s, i) => (
        <Option key={s} badge={i + 1} label={m.sources[s]} selected={source === s} onPress={() => setSource(s)} />
      ))}
    </>
  );
}

export const capitalSteps: StepDef[] = [
  { id: "amount", Component: Amount },
  { id: "source", Component: Source },
];
