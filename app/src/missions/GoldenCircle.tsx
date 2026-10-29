// Phase 3 (RF-07): why, how and what, one per screen, turned into a business card the kid confirms.

import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Body, ErrorNote, Field } from "../components/ui";
import { VoiceInput } from "../components/VoiceInput";
import { t } from "../i18n/en";
import { post } from "../lib/api";
import { colors, font, type } from "../lib/theme";
import { useCall } from "../lib/useCall";
import { useFooter, useLesson, type StepDef } from "../lesson/engine";
import { MissionHead, useBusiness } from "./kit";

type Ring = "why" | "how" | "what";
const RINGS: Ring[] = ["why", "how", "what"];

function ask(ring: Ring): StepDef {
  function Ask() {
    const lesson = useLesson();
    const [text, setText] = useState("");
    const m = t.missions.golden;
    useFooter({ label: t.common.continue, disabled: text.length < 3 }, () => {
      lesson.set({ [ring]: text });
      lesson.next();
    });
    return (
      <>
        <MissionHead title={m.ask[ring]} say={m.hint[ring]} />
        <VoiceInput onText={setText} placeholder={m.example[ring]} />
        {text ? <Body muted>“{text}”</Body> : null}
      </>
    );
  }
  return { id: `ask-${ring}`, Component: Ask };
}

interface CardData {
  why: string;
  how: string;
  what: string;
}

function CardStep() {
  const lesson = useLesson();
  const business = useBusiness();
  const [card, setCard] = useState<CardData | null>(null);
  const { busy, error, run, retry } = useCall();
  const m = t.missions.golden;

  useEffect(() => {
    const said = RINGS.map((r) => `${r.toUpperCase()}: ${lesson.state[r]}`).join("\n");
    run(async () => setCard(await post<CardData>("/api/ai/golden-circle", { kidSaid: said, idea: business.idea ?? "my idea" })));
    // Polishes the three answers once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFooter({ label: t.common.confirm, disabled: !card, busy }, () => {
    if (!card) return;
    lesson.set({ result: { ...card } });
    lesson.check(true, { title: m.cardDone });
  });

  return (
    <>
      <MissionHead title={m.card} say={m.confirm} />
      {card ? (
        <View style={{ borderRadius: 20, borderWidth: 2, borderBottomWidth: 6, borderColor: colors.gold, padding: 18, backgroundColor: colors.surface }}>
          <Text style={[type.tag, { color: colors.gold }]}>🪪 {business.idea}</Text>
          {RINGS.map((r) => (
            <View key={r} style={{ marginTop: 12 }}>
              <Text style={[type.tag, { color: colors.muted, fontSize: 12 }]}>{r}</Text>
              <Field value={card[r]} onChangeText={(v) => setCard({ ...card, [r]: v })} multiline style={{ fontFamily: font.bold }} />
            </View>
          ))}
        </View>
      ) : null}
      <ErrorNote error={error} onRetry={retry} />
    </>
  );
}

export const goldenSteps: StepDef[] = [...RINGS.map(ask), { id: "card", Component: CardStep }];
