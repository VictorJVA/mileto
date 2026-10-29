// Phase 3 (RF-07): why, how and what, turned into a business card the kid confirms or edits.

import { useState } from "react";
import { Mascot } from "../components/Mascot";
import { Body, Button, Card, ErrorNote, Field, H2 } from "../components/ui";
import { VoiceInput } from "../components/VoiceInput";
import { t } from "../i18n/en";
import { post } from "../lib/api";
import { useCall } from "../lib/useCall";
import type { MissionProps } from "./types";

interface CardData {
  why: string;
  how: string;
  what: string;
}

export function GoldenCircle({ business, complete }: MissionProps) {
  const [card, setCard] = useState<CardData | null>(null);
  const { busy, error, run } = useCall();

  async function onSaid(text: string) {
    const r = await run(() => post<CardData>("/api/ai/golden-circle", { kidSaid: text, idea: business.idea ?? "my idea" }));
    if (r) setCard(r);
  }

  const m = t.missions.golden;
  return (
    <>
      <Mascot text={card ? m.confirm : m.say} mood={card ? "happy" : "curious"} />
      {!card ? <VoiceInput onText={onSaid} placeholder="Why: … How: … What: …" /> : null}
      {busy && !card ? <Body muted>{t.common.loading}</Body> : null}
      {card ? (
        <>
          <H2>🪪 {m.card}</H2>
          <Card>
            <Body muted>{business.idea}</Body>
            <Field label="Why" value={card.why} onChangeText={(why) => setCard({ ...card, why })} multiline />
            <Field label="How" value={card.how} onChangeText={(how) => setCard({ ...card, how })} multiline />
            <Field label="What" value={card.what} onChangeText={(what) => setCard({ ...card, what })} multiline />
          </Card>
          <Button label={t.common.confirm} onPress={() => run(() => complete({ ...card }))} busy={busy} />
          <Button label={t.common.retry} variant="secondary" onPress={() => setCard(null)} />
        </>
      ) : null}
      <ErrorNote error={error} />
    </>
  );
}
