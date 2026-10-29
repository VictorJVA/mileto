// Phase 8 (RF-10): what you buy, how many you make, then the price on a live balance.
// Every number on screen comes from the server's cost calculator.

import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Mascot } from "../components/Mascot";
import { Body, ErrorNote, Field, NumberField, Stat, Stepper } from "../components/ui";
import { fill, t } from "../i18n/en";
import { post } from "../lib/api";
import { colors, font, peso, type } from "../lib/theme";
import { useCall } from "../lib/useCall";
import { useFooter, useLesson, type StepDef } from "../lesson/engine";
import { earlier, MissionHead, useBusiness } from "./kit";

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
  breakEvenUnits: number | null;
}

function Items() {
  const lesson = useLesson();
  const business = useBusiness();
  const shopping = earlier<{ item: string; bestUnitPrice: number }>(business, "shopping");
  const [items, setItems] = useState<Item[]>([
    { name: shopping.item ?? "", quantity: null, unitCost: shopping.bestUnitPrice ?? null },
  ]);
  const m = t.missions.price;
  const valid = items.every((i) => i.name.trim() && i.quantity && i.unitCost !== null);
  const setItem = (i: number, patch: Partial<Item>) => setItems(items.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  useFooter({ label: t.common.continue, disabled: !valid }, () => {
    lesson.set({ items });
    lesson.next();
  });

  return (
    <>
      <MissionHead title={m.itemsTitle} say={m.itemsSay} />
      {items.map((it, i) => (
        <View key={i} style={{ borderWidth: 2, borderColor: colors.line, borderRadius: 16, padding: 14, marginBottom: 12 }}>
          <Field label={m.item} value={it.name} onChangeText={(name) => setItem(i, { name })} placeholder={i === 0 ? "oranges" : "cups"} />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <NumberField label={m.howMany} value={it.quantity} onChange={(quantity) => setItem(i, { quantity })} />
            </View>
            <View style={{ flex: 1 }}>
              <NumberField label={m.costEach} value={it.unitCost} onChange={(unitCost) => setItem(i, { unitCost })} />
            </View>
          </View>
        </View>
      ))}
      <Pressable onPress={() => setItems([...items, { name: "", quantity: null, unitCost: null }])} hitSlop={8}>
        <Text style={[type.tag, { color: colors.blue, textAlign: "center" }]}>+ {m.addItem}</Text>
      </Pressable>
    </>
  );
}

function Units() {
  const lesson = useLesson();
  const business = useBusiness();
  const test = earlier<{ units: number }>(business, "test_batch");
  const [units, setUnits] = useState(test.units ?? 20);
  useFooter({ label: t.common.continue }, () => {
    lesson.set({ units });
    lesson.next();
  });
  return (
    <>
      <MissionHead title={t.missions.price.units} say={t.missions.price.unitsSay} />
      <Stepper value={units} onChange={setUnits} min={1} />
    </>
  );
}

function SetPrice() {
  const lesson = useLesson();
  const business = useBusiness();
  const validate = earlier<{ priceRange: { median: number } | null }>(business, "validate");
  const [price, setPrice] = useState<number | null>(validate.priceRange?.median ?? null);
  const [costs, setCosts] = useState<Costs | null>(null);
  const { busy, error, run } = useCall();
  const m = t.missions.price;

  // Recalculate on the server whenever the price changes, so the balance always shows code-computed numbers.
  useEffect(() => {
    if (price === null) return setCosts(null);
    const timer = setTimeout(() => {
      run(async () => setCosts(await post<Costs>("/api/calc/costs", { items: lesson.state.items, units: lesson.state.units, price })));
    }, 250);
    return () => clearTimeout(timer);
    // Items and units are fixed by the previous steps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [price, run]);

  const losing = costs !== null && costs.profitPerUnit <= 0;
  useFooter({ label: t.common.check, disabled: !costs || busy }, () => {
    if (!costs || price === null) return;
    if (losing) return lesson.check(false, { detail: m.loss });
    lesson.set({ result: { items: lesson.state.items, units: lesson.state.units, price, ...costs } });
    lesson.check(true, { title: m.balanced, detail: fill(m.breakEven, { n: costs.breakEvenUnits ?? 0 }) });
  });

  const tilt = costs ? Math.max(-14, Math.min(14, (costs.profitPerUnit / Math.max(costs.unitCost, 1)) * 14)) : 0;
  return (
    <>
      <MissionHead title={m.price} />
      <Mascot text={losing ? m.loss : m.say} mood={losing ? "stumble" : "curious"} size={70} />
      <NumberField big value={price} onChange={setPrice} hint={validate.priceRange ? fill(m.peopleSaid, { price: peso(validate.priceRange.median) }) : undefined} />
      {costs ? (
        <>
          <View style={{ alignItems: "center", marginVertical: 8 }}>
            <View style={{ width: "80%", height: 8, borderRadius: 4, backgroundColor: colors.gold, transform: [{ rotate: `${tilt}deg` }] }} />
            <View style={{ width: 0, height: 0, borderLeftWidth: 16, borderRightWidth: 16, borderBottomWidth: 26, borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: colors.goldEdge }} />
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Stat label={m.unitCost} value={peso(costs.unitCost)} color={colors.retry} />
            <Stat label={m.profit} value={peso(costs.profitPerUnit)} color={losing ? colors.retry : colors.good} />
          </View>
          <Body muted>
            {m.allCups}: <Text style={{ fontFamily: font.black, color: colors.ink }}>{peso(costs.totalProfit)}</Text>
          </Body>
        </>
      ) : null}
      <ErrorNote error={error} />
    </>
  );
}

export const priceSteps: StepDef[] = [
  { id: "items", Component: Items },
  { id: "units", Component: Units },
  { id: "set-price", Component: SetPrice },
];
