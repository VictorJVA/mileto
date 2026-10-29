// Phase 9 (F8, RF-17, RF-20): pick a name and slogan, make a Muse Image poster, and choose how to get known.
// Posters never carry phone numbers, addresses, schools or real names (checked on the server).

import { useEffect, useState } from "react";
import { Image, Text, View } from "react-native";
import { Mascot } from "../components/Mascot";
import { Body, Button, ErrorNote, Field, Option } from "../components/ui";
import { t } from "../i18n/en";
import { post } from "../lib/api";
import { colors, font, peso, type } from "../lib/theme";
import { useCall } from "../lib/useCall";
import { useFooter, useLesson, type StepDef } from "../lesson/engine";
import { earlier, MissionHead, useBusiness } from "./kit";

interface BrandOption {
  name: string;
  slogan: string;
  colors: string[];
}

function Name() {
  const lesson = useLesson();
  const business = useBusiness();
  const card = earlier<{ why: string; what: string }>(business, "golden_circle");
  const [options, setOptions] = useState<BrandOption[]>([]);
  const [picked, setPicked] = useState<number | "own" | null>(null);
  const [own, setOwn] = useState({ name: "", slogan: "" });
  const { busy, error, run, retry } = useCall();
  const m = t.missions.brand;

  useEffect(() => {
    run(async () => {
      const r = await post<{ options: BrandOption[] }>("/api/ai/brand", { idea: business.idea ?? "", why: card.why ?? "", what: card.what ?? business.idea ?? "" });
      setOptions(r.options);
    });
  }, [business.idea, card.why, card.what, run]);

  const chosen = picked === "own" ? { ...own, colors: [colors.gold, colors.primary] } : picked !== null ? options[picked] : null;
  useFooter({ label: t.common.continue, disabled: !chosen?.name.trim(), busy }, () => {
    lesson.set({ brand: chosen });
    lesson.next();
  });

  return (
    <>
      <MissionHead title={m.choose} say={m.say} />
      {options.map((o, i) => (
        <Option
          key={o.name}
          label={o.name}
          sub={o.slogan}
          selected={picked === i}
          onPress={() => setPicked(i)}
          icon={<View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: o.colors[0], borderWidth: 4, borderColor: o.colors[1] ?? o.colors[0] }} />}
        />
      ))}
      <Option label={`✏️ ${m.own}`} selected={picked === "own"} onPress={() => setPicked("own")} />
      {picked === "own" ? (
        <>
          <Field label={m.name} value={own.name} onChangeText={(name) => setOwn({ ...own, name })} maxLength={40} />
          <Field label={m.slogan} value={own.slogan} onChangeText={(slogan) => setOwn({ ...own, slogan })} maxLength={80} />
        </>
      ) : null}
      <ErrorNote error={error} onRetry={retry} />
    </>
  );
}

function Poster() {
  const lesson = useLesson();
  const business = useBusiness();
  const brand = lesson.state.brand as BrandOption;
  const price = earlier<{ price: number }>(business, "price").price;
  const [poster, setPoster] = useState<{ b64: string; mimeType: string } | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);
  const { busy, error, run } = useCall();
  const m = t.missions.brand;

  async function make() {
    const r = await run(() =>
      post<{ b64?: string; mimeType?: string; blocked?: string }>("/api/ai/poster", { name: brand.name, slogan: brand.slogan, product: business.idea ?? "product", price, colors: brand.colors }),
    );
    if (!r) return;
    setBlocked(r.blocked ?? null);
    if (r.b64 && r.mimeType) setPoster({ b64: r.b64, mimeType: r.mimeType });
  }

  useFooter({ label: t.common.continue, disabled: !poster }, () => lesson.next());

  return (
    <>
      <MissionHead title={m.posterTitle} />
      <Mascot text={blocked ?? m.posterSay} mood={blocked ? "stumble" : "curious"} size={70} />
      {poster ? (
        // The app draws the text over the generated art, so it is always legible and checked.
        <View style={{ borderRadius: 20, overflow: "hidden", marginBottom: 12, backgroundColor: brand.colors[0] }}>
          <Image source={{ uri: `data:${poster.mimeType};base64,${poster.b64}` }} style={{ width: "100%", aspectRatio: 2 / 3 }} resizeMode="cover" />
          <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 18, backgroundColor: "rgba(0,0,0,0.5)" }}>
            <Text style={[type.title, { color: "#fff", fontFamily: font.black }]}>{brand.name}</Text>
            <Text style={[type.body, { color: "#fff" }]}>{brand.slogan}</Text>
            {price ? <Text style={[type.title, { color: brand.colors[1] ?? colors.gold, fontFamily: font.black }]}>{peso(price)}</Text> : null}
          </View>
        </View>
      ) : null}
      <Button label={`🎨 ${poster ? m.again : m.poster}`} tone={poster ? "ghost" : "blue"} onPress={make} busy={busy} />
      <Body muted>{m.noSocial}</Body>
      <ErrorNote error={error} />
    </>
  );
}

const ACTIONS = ["word_of_mouth", "free_sample", "poster"] as const;

function Actions() {
  const lesson = useLesson();
  const [chosen, setChosen] = useState<string[]>([]);
  const m = t.missions.brand;
  const toggle = (a: string) => setChosen(chosen.includes(a) ? chosen.filter((x) => x !== a) : [...chosen, a]);
  useFooter({ label: t.common.check, disabled: chosen.length === 0 }, () => {
    const brand = lesson.state.brand as BrandOption;
    lesson.set({ result: { ...brand, actions: chosen, poster: true } });
    lesson.check(true, { title: m.ready });
  });
  return (
    <>
      <MissionHead title={m.actions} say={m.actionsSay} />
      {ACTIONS.map((a) => (
        <Option key={a} label={`${m.actionEmoji[a]}  ${m.actionNames[a]}`} sub={m.actionHow[a]} selected={chosen.includes(a)} onPress={() => toggle(a)} />
      ))}
    </>
  );
}

export const brandSteps: StepDef[] = [
  { id: "name", Component: Name },
  { id: "poster", Component: Poster },
  { id: "actions", Component: Actions },
];
