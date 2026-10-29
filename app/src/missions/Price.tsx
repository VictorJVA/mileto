// Phase 8 (RF-10): costs, price and profit, all calculated by server code. The balance analogy.

import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Mascot } from "../components/Mascot";
import { Body, Button, Card, ErrorNote, Field, H2, NumberField, Stat } from "../components/ui";
import { fill, t } from "../i18n/en";
import { post } from "../lib/api";
import { colors, peso, type } from "../lib/theme";
import { useCall } from "../lib/useCall";
import { earlier, type MissionProps } from "./types";

interface Item {
  name: string;
  quantity: number | null;
  unitCost: number | null;
}

interface Costs {
  totalCost: number;
  unitCost: number;
  profitPerUnit: number;
  totalProfit: number;
  margin: number;
  breakEvenUnits: number | null;
}

interface Range {
  floor: number;
  low: number;
  high: number;
}

export function Price({ business, complete }: MissionProps) {
  const shopping = earlier<{ item: string; bestUnitPrice: number }>(business, "shopping");
  const validate = earlier<{ priceRange: { median: number } | null }>(business, "validate");
  const [items, setItems] = useState<Item[]>([
    { name: shopping.item ?? "oranges", quantity: 30, unitCost: shopping.bestUnitPrice ?? 300 },
    { name: "cups", quantity: 20, unitCost: 100 },
  ]);
  const [units, setUnits] = useState<number | null>(20);
  const [price, setPrice] = useState<number | null>(validate.priceRange?.median ?? 1500);
  const [competitor, setCompetitor] = useState<number | null>(null);
  const [costs, setCosts] = useState<Costs | null>(null);
  const [range, setRange] = useState<Range | null>(null);
  const { busy, error, run } = useCall();
  const m = t.missions.price;

  const valid = units && price !== null && items.every((i) => i.name && i.quantity !== null && i.unitCost !== null);

  // Recalculate on the server whenever an input changes, so the balance always shows code-computed numbers.
  useEffect(() => {
    if (!valid) return setCosts(null);
    const timer = setTimeout(() => {
      run(async () => {
        const c = await post<Costs>("/api/calc/costs", { items, units, price });
        setCosts(c);
        setRange(await post<Range>("/api/calc/price-range", { unitCost: c.unitCost, competitorPrices: competitor ? [competitor] : [] }));
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [items, units, price, competitor, valid, run]);

  const setItem = (i: number, patch: Partial<Item>) => setItems(items.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const losing = costs !== null && costs.profitPerUnit < 0;

  return (
    <>
      <Mascot text={losing ? m.loss : m.say} mood={losing ? "stumble" : "curious"} />
      <H2>🧺 What you buy</H2>
      {items.map((it, i) => (
        <Card key={i}>
          <Field label="Item" value={it.name} onChangeText={(name) => setItem(i, { name })} />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1 }}>
              <NumberField label="How many" value={it.quantity} onChange={(quantity) => setItem(i, { quantity })} />
            </View>
            <View style={{ flex: 1 }}>
              <NumberField label="Cost each" value={it.unitCost} onChange={(unitCost) => setItem(i, { unitCost })} />
            </View>
          </View>
        </Card>
      ))}
      <Pressable onPress={() => setItems([...items, { name: "", quantity: 1, unitCost: null }])}>
        <Text style={[type.small, { textAlign: "center", textDecorationLine: "underline", marginBottom: 12 }]}>+ Add item</Text>
      </Pressable>
      <NumberField label={m.units} value={units} onChange={setUnits} />
      <NumberField label={m.price} value={price} onChange={setPrice} />
      <NumberField label={m.competitor} value={competitor} onChange={setCompetitor} />

      {costs ? (
        <>
          <H2>⚖️ The balance</H2>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
            <Stat label={m.unitCost} value={peso(costs.unitCost)} />
            <Stat label={m.profit} value={peso(costs.profitPerUnit)} tone={losing ? "bad" : "good"} />
          </View>
          <Balance cost={costs.unitCost} price={price ?? 0} />
          {costs.breakEvenUnits !== null ? <Body>{fill(m.breakEven, { n: costs.breakEvenUnits })}</Body> : null}
          {range ? (
            <Body muted>
              Price idea: {peso(range.low)} – {peso(range.high)}. {t.common.guess}
            </Body>
          ) : null}
        </>
      ) : null}
      <ErrorNote error={error} />
      <Button
        label={t.common.done}
        disabled={!costs || losing}
        busy={busy}
        onPress={() => costs && run(() => complete({ items, units, price, ...costs }))}
      />
    </>
  );
}

/** A simple tilted beam: price on one side, cost on the other. */
function Balance({ cost, price }: { cost: number; price: number }) {
  const diff = price - cost;
  const tilt = Math.max(-12, Math.min(12, (diff / Math.max(price, cost, 1)) * 24));
  return (
    <View style={{ alignItems: "center", marginVertical: 12 }}>
      <View style={{ width: "80%", height: 6, backgroundColor: colors.oliveDark, borderRadius: 3, transform: [{ rotate: `${tilt}deg` }] }} />
      <View style={{ flexDirection: "row", justifyContent: "space-between", width: "80%", marginTop: 6 }}>
        <Text style={type.small}>Cost {peso(cost)}</Text>
        <Text style={type.small}>Price {peso(price)}</Text>
      </View>
    </View>
  );
}
