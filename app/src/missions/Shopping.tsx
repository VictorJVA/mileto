// Phase 5 (F3, RF-09): photo of prices at two stores. The kid confirms every value; code finds the better deal.

import { useState } from "react";
import { View } from "react-native";
import { Mascot } from "../components/Mascot";
import { PhotoInput } from "../components/PhotoInput";
import { Body, Button, Card, ErrorNote, Field, H2, NumberField } from "../components/ui";
import { fill, t } from "../i18n/en";
import { post } from "../lib/api";
import { peso } from "../lib/theme";
import { useCall } from "../lib/useCall";
import type { MissionProps } from "./types";

interface Quote {
  store: string;
  price: number | null;
  packSize: number | null;
  needsCheck: boolean;
}

interface ReadResult {
  store: string | null;
  items: Array<{ name: string; price: number; packSize: number; needsVoiceConfirmation: boolean }>;
}

interface Comparison {
  quotes: Array<{ store: string; pricePerUnit: number }>;
  cheapestStore: string | null;
  savingsPerUnit: number;
}

const emptyQuote = (n: number): Quote => ({ store: fill(t.missions.shopping.store, { n }), price: null, packSize: null, needsCheck: false });

export function Shopping({ complete }: MissionProps) {
  const [item, setItem] = useState("oranges");
  const [quotes, setQuotes] = useState<Quote[]>([emptyQuote(1), emptyQuote(2)]);
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const { busy, error, run } = useCall();
  const m = t.missions.shopping;

  const setQuote = (i: number, q: Partial<Quote>) => {
    setComparison(null);
    setQuotes((qs) => qs.map((x, j) => (j === i ? { ...x, ...q } : x)));
  };

  const ready = quotes.every((q) => q.price !== null && q.packSize);

  async function compare() {
    const r = await run(() =>
      post<Comparison>("/api/calc/compare-prices", { quotes: quotes.map((q) => ({ store: q.store, item, price: q.price, packSize: q.packSize })) }),
    );
    if (r) setComparison(r);
  }

  const verdict = comparison
    ? comparison.cheapestStore
      ? fill(m.cheaper, { store: comparison.cheapestStore, savings: peso(comparison.savingsPerUnit) })
      : m.tie
    : m.say;

  return (
    <>
      <Mascot text={verdict} mood={comparison ? "happy" : "curious"} />
      <Field label={m.item} value={item} onChangeText={setItem} />
      {quotes.map((q, i) => (
        <Card key={i}>
          <H2>🏪 {q.store}</H2>
          <PhotoInput<ReadResult>
            endpoint="/api/ai/read-prices"
            fields={{ lookingFor: item }}
            onResult={(r) => {
              const found = r.items[0];
              setQuote(i, {
                store: r.store ?? q.store,
                price: found?.price ?? null,
                packSize: found?.packSize ?? 1,
                needsCheck: !found || found.needsVoiceConfirmation,
              });
            }}
          />
          {q.needsCheck ? <Body muted>🤔 I couldn't read it well. Please check the price.</Body> : null}
          <Field label="Store name" value={q.store} onChangeText={(store) => setQuote(i, { store })} />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1 }}>
              <NumberField label="Price (pesos)" value={q.price} onChange={(price) => setQuote(i, { price, needsCheck: false })} />
            </View>
            <View style={{ flex: 1 }}>
              <NumberField label="How many for that price" value={q.packSize} onChange={(packSize) => setQuote(i, { packSize })} />
            </View>
          </View>
        </Card>
      ))}
      {comparison ? (
        <Card>
          {comparison.quotes.map((q) => (
            <Body key={q.store}>
              {q.store === comparison.cheapestStore ? "✅" : "▫️"} {q.store}: {peso(q.pricePerUnit)} each
            </Body>
          ))}
        </Card>
      ) : null}
      <ErrorNote error={error} />
      {comparison ? (
        <Button
          label={t.common.done}
          busy={busy}
          onPress={() => run(() => complete({ item, quotes: comparison.quotes, cheapestStore: comparison.cheapestStore, bestUnitPrice: Math.min(...comparison.quotes.map((q) => q.pricePerUnit)) }))}
        />
      ) : (
        <Button label={t.common.confirm} onPress={compare} disabled={!ready} busy={busy} />
      )}
    </>
  );
}
