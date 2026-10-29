// Phase 11 (F4, RF-11, RF-12): opening and closing photos counted by SAM 3.1, confirmed by the kid,
// crossed with what the kid says they sold. Sales = open - close; revenue = sales x price, in code.

import { useState } from "react";
import { View } from "react-native";
import { Mascot } from "../components/Mascot";
import { PhotoInput } from "../components/PhotoInput";
import { Body, Button, Card, ErrorNote, Field, H2, Stat, Stepper } from "../components/ui";
import { VoiceInput } from "../components/VoiceInput";
import { fill, t } from "../i18n/en";
import { post } from "../lib/api";
import { peso } from "../lib/theme";
import { useCall } from "../lib/useCall";
import { earlier, type MissionProps } from "./types";

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

function CountStep({ label, noun, value, onChange }: { label: string; noun: string; value: number | null; onChange: (n: number) => void }) {
  return (
    <Card>
      <H2>{label}</H2>
      <PhotoInput<{ count: number }> endpoint="/api/ai/count" fields={{ noun }} onResult={(r) => onChange(r.count)} />
      {value !== null ? (
        <>
          <Body>{fill(t.missions.cashbox.iSee, { n: value })}</Body>
          <Stepper value={value} onChange={onChange} />
        </>
      ) : null}
    </Card>
  );
}

export function Cashbox({ business, complete }: MissionProps) {
  const price = earlier<{ price: number }>(business, "price").price ?? null;
  const [noun, setNoun] = useState("cup");
  const [atOpen, setAtOpen] = useState<number | null>(null);
  const [atClose, setAtClose] = useState<number | null>(null);
  const [voice, setVoice] = useState<number | null>(null);
  const [coins, setCoins] = useState<Record<string, number> | null>(null);
  const [result, setResult] = useState<CashResult | null>(null);
  const { busy, error, run } = useCall();
  const m = t.missions.cashbox;

  async function check() {
    const r = await run(() =>
      post<CashResult>("/api/calc/cashbox", { unitsAtOpen: atOpen, unitsAtClose: atClose, price: price ?? 0, soldByVoice: voice, coins: coins ?? undefined }),
    );
    if (r) setResult(r);
  }

  const say = !result ? m.say : result.matches ? m.match : m.mismatch;
  return (
    <>
      <Mascot text={say} mood={result ? (result.matches ? "proud" : "stumble") : "curious"} />
      <Field label="What are you counting? (one word)" value={noun} onChangeText={setNoun} />
      <CountStep label={`☀️ ${m.open}`} noun={noun} value={atOpen} onChange={(n) => { setAtOpen(n); setResult(null); }} />
      <CountStep label={`🌙 ${m.close}`} noun={noun} value={atClose} onChange={(n) => { setAtClose(n); setResult(null); }} />
      <Card>
        <H2>🗣️ {m.voice}</H2>
        <VoiceInput onText={(text) => { setVoice(parseSpokenCount(text)); setResult(null); }} placeholder="I sold 13" />
        {voice !== null ? <Stepper value={voice} onChange={(n) => { setVoice(n); setResult(null); }} /> : null}
      </Card>
      <PhotoInput<{ coins: Record<string, number>; total: number }>
        label={m.coins}
        endpoint="/api/ai/coins"
        onResult={(r) => { setCoins(r.coins); setResult(null); }}
      />
      {coins ? (
        <Body muted>
          🪙 {Object.entries(coins).map(([d, c]) => `${c} × ${peso(Number(d))}`).join(" · ")}
        </Body>
      ) : null}

      {result ? (
        <View style={{ flexDirection: "row", gap: 8, marginVertical: 8 }}>
          <Stat label="Sold" value={String(result.soldByCount)} />
          <Stat label="Money in" value={peso(result.revenue)} tone="good" />
          {result.coinsTotal !== null ? <Stat label="Coins" value={peso(result.coinsTotal)} tone={result.cashDifference === 0 ? "good" : "bad"} /> : null}
        </View>
      ) : null}
      {!price ? <Body muted>Set your price in phase 8 first.</Body> : null}
      <ErrorNote error={error} />
      {result ? (
        <Button label={t.common.done} busy={busy} onPress={() => run(() => complete({ ...result, unitsAtOpen: atOpen, unitsAtClose: atClose, price }))} />
      ) : (
        <Button label={t.common.confirm} onPress={check} disabled={atOpen === null || atClose === null || !price || atClose > atOpen} busy={busy} />
      )}
    </>
  );
}
