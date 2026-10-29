// Phase 9 (F8, RF-17, RF-20): name, slogan, a Muse Image poster and three actions to get known.
// Posters never carry phone numbers, addresses, schools or real names (checked on the server).

import { useEffect, useState } from "react";
import { Image, Text, View } from "react-native";
import { Mascot } from "../components/Mascot";
import { Body, Button, Card, Choice, ErrorNote, Field, H2 } from "../components/ui";
import { t } from "../i18n/en";
import { post } from "../lib/api";
import { colors, peso, type } from "../lib/theme";
import { useCall } from "../lib/useCall";
import { earlier, type MissionProps } from "./types";

interface Option {
  name: string;
  slogan: string;
  colors: string[];
}

const ACTIONS = ["word_of_mouth", "free_sample", "poster"] as const;

export function Brand({ business, complete }: MissionProps) {
  const card = earlier<{ why: string; what: string }>(business, "golden_circle");
  const price = earlier<{ price: number }>(business, "price").price;
  const [options, setOptions] = useState<Option[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [slogan, setSlogan] = useState("");
  const [poster, setPoster] = useState<{ b64: string; mimeType: string } | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);
  const { busy, error, run } = useCall();
  const m = t.missions.brand;
  const palette = picked !== null ? options[picked].colors : [colors.sun, colors.olive];

  useEffect(() => {
    run(async () => {
      const r = await post<{ options: Option[] }>("/api/ai/brand", {
        idea: business.idea ?? "",
        why: card.why ?? "",
        what: card.what ?? business.idea ?? "",
      });
      setOptions(r.options);
    });
  }, [business.idea, card.why, card.what, run]);

  function pick(i: number) {
    setPicked(i);
    setName(options[i].name);
    setSlogan(options[i].slogan);
    setPoster(null);
  }

  async function makePoster() {
    const r = await run(() =>
      post<{ b64?: string; mimeType?: string; blocked?: string }>("/api/ai/poster", {
        name,
        slogan,
        product: business.idea ?? "product",
        price,
        colors: palette,
      }),
    );
    if (!r) return;
    setBlocked(r.blocked ?? null);
    if (r.b64 && r.mimeType) setPoster({ b64: r.b64, mimeType: r.mimeType });
  }

  return (
    <>
      <Mascot text={blocked ?? m.say} mood={blocked ? "stumble" : "curious"} />
      <H2>{m.choose}</H2>
      {options.map((o, i) => (
        <Choice key={o.name} label={o.name} sub={o.slogan} selected={picked === i} onPress={() => pick(i)} />
      ))}
      <Field label="Name" value={name} onChangeText={(s) => { setName(s); setPoster(null); }} maxLength={40} />
      <Field label="Slogan" value={slogan} onChangeText={(s) => { setSlogan(s); setPoster(null); }} maxLength={80} />
      <Button label={`🎨 ${m.poster}`} onPress={makePoster} disabled={!name.trim()} busy={busy && !poster} variant={poster ? "secondary" : "primary"} />

      {poster ? (
        // The text is drawn by the app on top of the generated art, so it is always legible and checked.
        <View style={{ borderRadius: 16, overflow: "hidden", marginVertical: 12, backgroundColor: palette[0] }}>
          <Image source={{ uri: `data:${poster.mimeType};base64,${poster.b64}` }} style={{ width: "100%", aspectRatio: 2 / 3 }} resizeMode="cover" />
          <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 16, backgroundColor: "rgba(0,0,0,0.45)" }}>
            <Text style={[type.title, { color: "#fff" }]}>{name}</Text>
            <Text style={[type.body, { color: "#fff" }]}>{slogan}</Text>
            {price ? <Text style={[type.h2, { color: palette[1] ?? "#fff" }]}>{peso(price)}</Text> : null}
          </View>
        </View>
      ) : null}

      <H2>📣 {m.actions}</H2>
      <Card>
        {ACTIONS.map((a) => (
          <Body key={a}>✓ {m.actionNames[a]}</Body>
        ))}
      </Card>
      <Body muted>{m.noSocial}</Body>
      <ErrorNote error={error} />
      <Button
        label={t.common.done}
        disabled={!poster}
        busy={busy && !!poster}
        onPress={() => run(() => complete({ name, slogan, colors: palette, actions: ACTIONS, poster: true }))}
      />
    </>
  );
}
