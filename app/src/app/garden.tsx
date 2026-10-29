// RF-15: gentle progress. Seeds, a streak with grace days, badges for real habits, and the learning book.

import { useState } from "react";
import { Text, View } from "react-native";
import { Mascot } from "../components/Mascot";
import { Body, Button, Card, ErrorNote, Field, H2, Screen, Stat } from "../components/ui";
import { t } from "../i18n/en";
import { post } from "../lib/api";
import { useSession } from "../lib/session";
import { type } from "../lib/theme";

const GARDEN_EMOJI = { seed: "🌰", sprout: "🌱", plant: "🌿", tree: "🌳" } as const;

export default function Garden() {
  const { student, business, refresh } = useSession();
  const [stumble, setStumble] = useState("");
  const [hint, setHint] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [said, setSaid] = useState<string | null>(null);
  if (!student || !business) return null;
  const p = student.progress;

  async function addStumble() {
    if (!business) return;
    setBusy(true);
    try {
      await post(`/api/businesses/${business.id}/learnings`, { kind: "stumble", text: stumble.trim(), hint: hint.trim() || null });
      setStumble("");
      setHint("");
      setSaid(t.garden.stumbleSay);
      await refresh();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <View style={{ alignItems: "center", marginBottom: 12 }}>
        <Text style={{ fontSize: 96 }}>{GARDEN_EMOJI[p.garden]}</Text>
        <Text style={type.title}>{t.stages[p.garden]}</Text>
      </View>
      {said ? <Mascot mood="stumble" text={said} /> : null}
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Stat label={t.garden.seeds} value={`🌱 ${p.seeds}`} />
        <Stat label={t.garden.streak} value={`🔥 ${p.streak}`} />
      </View>
      <Body muted>
        {p.graceDaysLeft} {t.garden.grace}
      </Body>

      <H2>{t.garden.badges}</H2>
      <Card>
        {p.badges.length ? p.badges.map((b) => <Body key={b}>🏅 {t.badges[b] ?? b}</Body>) : <Body muted>{t.garden.noBadges}</Body>}
      </Card>

      <H2>{t.garden.book}</H2>
      <Card>
        {business.learnings?.length ? (
          business.learnings.map((l) => (
            <View key={l.id} style={{ marginBottom: 8 }}>
              <Body>{l.kind === "stumble" ? "🪨" : "⭐"} {l.text}</Body>
              {l.hint ? <Body muted>💡 {l.hint}</Body> : null}
            </View>
          ))
        ) : (
          <Body muted>{t.garden.noLearnings}</Body>
        )}
      </Card>
      <Field label={t.garden.addStumble} value={stumble} onChangeText={setStumble} placeholder="I made too much juice" maxLength={500} />
      <Field label="💡 Clue for next time" value={hint} onChangeText={setHint} placeholder="Start with a small batch" maxLength={300} />
      <ErrorNote error={error} />
      <Button label={t.garden.addStumble} onPress={addStumble} disabled={!stumble.trim()} busy={busy} variant="secondary" />
    </Screen>
  );
}
