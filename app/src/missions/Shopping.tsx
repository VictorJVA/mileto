// Phase 5 (F3, RF-09): what to buy, a price photo at each of two stores (the kid confirms every value),
// then code finds the better deal per unit.

import { useEffect, useState } from "react";
import { View } from "react-native";
import { Mascot } from "../components/Mascot";
import { PhotoInput } from "../components/PhotoInput";
import { Body, ErrorNote, Field, NumberField, Option } from "../components/ui";
import { fill, t } from "../i18n/en";
import { post } from "../lib/api";
import { peso } from "../lib/theme";
import { useCall } from "../lib/useCall";
import { useFooter, useLesson, type StepDef } from "../lesson/engine";
import { MissionHead } from "./kit";

interface Quote {
  store: string;
  price: number;
  packSize: number;
}

interface ReadResult {
  store: string | null;
  items: Array<{ price: number; packSize: number; needsVoiceConfirmation: boolean }>;
}

interface Comparison {
  quotes: Array<{ store: string; pricePerUnit: number }>;
  cheapestStore: string | null;
  savingsPerUnit: number;
}

function Item() {
  const lesson = useLesson();
  const [item, setItem] = useState("");
  const m = t.missions.shopping;
  useFooter({ label: t.common.continue, disabled: item.trim().length < 2 }, () => {
    lesson.set({ item: item.trim() });
    lesson.next();
  });
  return (
    <>
      <MissionHead title={m.item} say={m.itemSay} />
      <Field value={item} onChangeText={setItem} placeholder="oranges" autoFocus />
    </>
  );
}

function store(n: 1 | 2): StepDef {
  function Store() {
    const lesson = useLesson();
    const [name, setName] = useState(fill(t.missions.shopping.store, { n }));
    const [price, setPrice] = useState<number | null>(null);
    const [pack, setPack] = useState<number | null>(null);
    const [doubt, setDoubt] = useState(false);
    const m = t.missions.shopping;
    useFooter({ label: t.common.confirm, disabled: price === null || !pack }, () => {
      const quotes = ((lesson.state.quotes as Quote[]) ?? []).slice(0, n - 1);
      lesson.set({ quotes: [...quotes, { store: name.trim() || `Store ${n}`, price, packSize: pack }] });
      lesson.next();
    });
    return (
      <>
        <MissionHead title={`🏪 ${fill(m.store, { n })}`} say={n === 1 ? m.say : m.secondSay} />
        <PhotoInput<ReadResult>
          endpoint="/api/ai/read-prices"
          fields={{ lookingFor: String(lesson.state.item) }}
          onResult={(r) => {
            const found = r.items[0];
            if (r.store) setName(r.store);
            setPrice(found?.price ?? null);
            setPack(found?.packSize ?? 1);
            setDoubt(!found || found.needsVoiceConfirmation);
          }}
        />
        {doubt ? <Body muted>🤔 {m.doubt}</Body> : price !== null ? <Body muted>👀 {m.checkIt}</Body> : null}
        <Field label={m.storeName} value={name} onChangeText={setName} />
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <NumberField label={m.price} value={price} onChange={(v) => { setPrice(v); setDoubt(false); }} />
          </View>
          <View style={{ flex: 1 }}>
            <NumberField label={fill(m.howMany, { item: String(lesson.state.item) })} value={pack} onChange={setPack} />
          </View>
        </View>
      </>
    );
  }
  return { id: `store-${n}`, Component: Store };
}

function Compare() {
  const lesson = useLesson();
  const [c, setC] = useState<Comparison | null>(null);
  const { busy, error, run, retry } = useCall();
  const m = t.missions.shopping;
  const item = String(lesson.state.item);

  useEffect(() => {
    const quotes = (lesson.state.quotes as Quote[]).map((q) => ({ ...q, item }));
    run(async () => setC(await post<Comparison>("/api/calc/compare-prices", { quotes })));
    // Compares the two confirmed quotes once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFooter({ label: t.common.continue, disabled: !c, busy }, () => {
    if (!c) return;
    lesson.set({ result: { item, quotes: c.quotes, cheapestStore: c.cheapestStore, bestUnitPrice: Math.min(...c.quotes.map((q) => q.pricePerUnit)) } });
    lesson.check(true, { title: m.smartShopper });
  });

  return (
    <>
      <MissionHead title={m.compareTitle} />
      {c ? <Mascot text={c.cheapestStore ? fill(m.cheaper, { store: c.cheapestStore, savings: peso(c.savingsPerUnit) }) : m.tie} mood="happy" size={70} /> : null}
      {c?.quotes.map((q) => (
        <Option key={q.store} label={`${q.store === c.cheapestStore ? "🏆 " : ""}${q.store}`} sub={`${peso(q.pricePerUnit)} ${fill(m.each, { item })}`} state={q.store === c.cheapestStore ? "good" : undefined} onPress={() => undefined} />
      ))}
      <ErrorNote error={error} onRetry={retry} />
    </>
  );
}

export const shoppingSteps: StepDef[] = [{ id: "item", Component: Item }, store(1), store(2), { id: "compare", Component: Compare }];
