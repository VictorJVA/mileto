// Phase 11 (F4, RF-11, RF-12): opening and closing photos counted by SAM 3.1 and confirmed by the kid,
// crossed with what the kid says they sold. Sales = open - close; revenue = sales x price, in code.

import { useEffect, useState } from "react";
import { View } from "react-native";
import { Mascot } from "../components/Mascot";
import { PhotoInput } from "../components/PhotoInput";
import { Body, ErrorNote, Field, Stat, Stepper } from "../components/ui";
import { VoiceInput } from "../components/VoiceInput";
import { fill, t } from "../i18n/en";
import { post } from "../lib/api";
import { colors, peso } from "../lib/theme";
import { useCall } from "../lib/useCall";
import { useFooter, useLesson, type StepDef } from "../lesson/engine";
import { earlier, MissionHead, useBusiness } from "./kit";

interface CashResult {
  soldByCount: number;
  soldByVoice: number | null;
  matches: boolean | null;
  revenue: number;
  coinsTotal: number | null;
  cashDifference: number | null;
}

/** Finds the first number a kid said ("I sold 13", "vendí trece"). Returns null if none. */
export function parseSpokenCount(text: string): number | null {
  const digits = text.match(/\d+/);
  if (digits) return Number(digits[0]);
  const words: Record<string, number> = {
    zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
    cero: 0, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
    once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciséis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19, veinte: 20,
  };
  for (const w of text.toLowerCase().split(/[^\p{L}]+/u)) if (w in words) return words[w];
  return null;
}

function count(which: "open" | "close"): StepDef {
  function Count() {
    const lesson = useLesson();
    const [noun, setNoun] = useState(String(lesson.state.noun ?? "cup"));
    const [n, setN] = useState<number | null>(null);
    const m = t.missions.cashbox;
    const tooMany = which === "close" && n !== null && n > Number(lesson.state.open);
    useFooter({ label: t.common.confirm, disabled: n === null || tooMany }, () => {
      lesson.set({ noun, [which]: n });
      lesson.next();
    });
    return (
      <>
        <MissionHead title={which === "open" ? `☀️ ${m.open}` : `🌙 ${m.close}`} say={which === "open" ? m.say : m.closeSay} />
        {which === "open" ? <Field label={m.what} value={noun} onChangeText={setNoun} /> : null}
        <PhotoInput<{ count: number }> endpoint="/api/ai/count" fields={{ noun }} onResult={(r) => setN(r.count)} />
        {n !== null ? (
          <>
            <Mascot text={fill(m.iSee, { n })} size={60} />
            <Stepper value={n} onChange={setN} />
          </>
        ) : (
          <Body muted>{m.orCount}</Body>
        )}
        {n === null ? <Stepper value={0} onChange={setN} /> : null}
        {tooMany ? <Body muted>🤔 {m.moreAtClose}</Body> : null}
      </>
    );
  }
  return { id: `count-${which}`, Component: Count };
}

function Voice() {
  const lesson = useLesson();
  const [said, setSaid] = useState<number | null>(null);
  const m = t.missions.cashbox;
  useFooter({ label: t.common.continue, disabled: said === null }, () => {
    lesson.set({ voice: said });
    lesson.next();
  });
  return (
    <>
      <MissionHead title={`🗣️ ${m.voice}`} say={m.voiceSay} />
      <VoiceInput onText={(text) => setSaid(parseSpokenCount(text))} placeholder="I sold 13" />
      {said !== null ? <Stepper value={said} onChange={setSaid} /> : null}
    </>
  );
}

function Result() {
  const lesson = useLesson();
  const business = useBusiness();
  const price = earlier<{ price: number }>(business, "price").price ?? 0;
  const [r, setR] = useState<CashResult | null>(null);
  const { busy, error, run, retry } = useCall();
  const m = t.missions.cashbox;

  useEffect(() => {
    run(async () =>
      setR(await post<CashResult>("/api/calc/cashbox", { unitsAtOpen: lesson.state.open, unitsAtClose: lesson.state.close, price, soldByVoice: lesson.state.voice })),
    );
    // Closes the box once with the confirmed counts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFooter({ label: t.common.continue, disabled: !r, busy }, () => {
    if (!r) return;
    lesson.set({ result: { ...r, unitsAtOpen: lesson.state.open, unitsAtClose: lesson.state.close, price } });
    lesson.check(true, { title: r.matches ? m.matchTitle : m.mismatchTitle, detail: r.matches ? undefined : m.mismatch });
  });

  return (
    <>
      <MissionHead title={m.resultTitle} />
      {r ? (
        <>
          <Mascot text={r.matches ? m.match : m.mismatch} mood={r.matches ? "proud" : "stumble"} size={70} />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Stat label={m.sold} value={String(r.soldByCount)} />
            <Stat label={m.youSaid} value={String(r.soldByVoice ?? "–")} color={r.matches ? colors.good : colors.retry} />
          </View>
          <View style={{ height: 8 }} />
          <Stat label={m.moneyIn} value={peso(r.revenue)} color={colors.good} />
        </>
      ) : null}
      {!price ? <Body muted>{m.noPrice}</Body> : null}
      <ErrorNote error={error} onRetry={retry} />
    </>
  );
}

export const cashboxSteps: StepDef[] = [count("open"), count("close"), { id: "voice", Component: Voice }, { id: "result", Component: Result }];
