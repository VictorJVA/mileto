// Phase 7: make a small batch and collect opinions by voice before making more.

import { useState } from "react";
import { Mascot } from "../components/Mascot";
import { Body, Button, ErrorNote, H2, Stepper } from "../components/ui";
import { VoiceInput } from "../components/VoiceInput";
import { t } from "../i18n/en";
import { useCall } from "../lib/useCall";
import type { MissionProps } from "./types";

export function TestBatch({ complete }: MissionProps) {
  const [units, setUnits] = useState(5);
  const [opinions, setOpinions] = useState<string[]>([]);
  const { busy, error, run } = useCall();
  const m = t.missions.testBatch;

  return (
    <>
      <Mascot text={m.say} />
      <H2>{m.units}</H2>
      <Stepper value={units} onChange={setUnits} min={1} />
      <H2>💬 {opinions.length} / 3</H2>
      {opinions.map((o, i) => (
        <Body key={i} muted>“{o}”</Body>
      ))}
      <VoiceInput buttonLabel={m.opinion} onText={(o) => setOpinions([...opinions, o])} />
      <ErrorNote error={error} />
      <Button label={t.common.done} disabled={opinions.length < 1} busy={busy} onPress={() => run(() => complete({ units, opinions }))} />
    </>
  );
}
