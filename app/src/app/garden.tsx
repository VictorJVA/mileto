// RF-15: gentle progress. Seeds, a streak with grace days, badges for real habits, and the learning book.

import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Mascot } from "../components/Mascot";
import { Body, Button, ErrorNote, Field, Stat } from "../components/ui";
import { fill, t } from "../i18n/en";
import { post } from "../lib/api";
import { useSession } from "../lib/session";
import { colors, font, type } from "../lib/theme";
import { useCall } from "../lib/useCall";

const GARDEN_EMOJI: Record<string, string> = { seed: "🌰", sprout: "🌱", plant: "🌿", tree: "🌳" };
const ALL_BADGES = ["customer_detective", "clear_accounts", "brave_stumble", "first_sale", "good_host"];

export default function Garden() {
  const { student, business, refresh, signOut } = useSession();
  const [confirmReset, setConfirmReset] = useState(false);
  const [stumble, setStumble] = useState("");
  const [hint, setHint] = useState("");
  const [said, setSaid] = useState<string | null>(null);
  const { busy, error, run } = useCall();
  if (!student || !business) return null;
  const p = student.progress;

  async function addStumble() {
    if (!business) return;
    const ok = await run(async () => {
      await post(`/api/businesses/${business.id}/learnings`, { kind: "stumble", text: stumble.trim(), hint: hint.trim() || null });
      await refresh();
      return true;
    });
    if (!ok) return;
    setStumble("");
    setHint("");
    setSaid(t.garden.stumbleSay);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.top}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={{ color: colors.faint, fontSize: 24, fontFamily: font.bold }}>✕</Text>
        </Pressable>
        <Text style={[type.h2, { fontFamily: font.black }]}>{t.garden.title}</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={{ alignItems: "center", marginBottom: 16 }}>
          <Text style={{ fontSize: 110 }}>{GARDEN_EMOJI[p.garden]}</Text>
          <Text style={[type.title, { fontFamily: font.black, color: colors.good }]}>{t.stages[p.garden]}</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Stat label={t.garden.seeds} value={`🌱 ${p.seeds}`} color={colors.good} />
          <Stat label={t.garden.streak} value={`🔥 ${p.streak}`} color={colors.retry} />
        </View>
        <Body muted>{fill(t.garden.grace, { n: p.graceDaysLeft })}</Body>

        <Text style={[type.h2, styles.h]}>{t.garden.badges}</Text>
        <View style={styles.badges}>
          {ALL_BADGES.map((b) => {
            const has = p.badges.includes(b);
            return (
              <View key={b} style={[styles.badge, has && { borderColor: colors.gold }]}>
                <Text style={{ fontSize: 34, opacity: has ? 1 : 0.25 }}>{t.badgeEmoji[b]}</Text>
                <Text style={[type.small, { textAlign: "center", color: has ? colors.ink : colors.faint, fontFamily: font.bold }]}>{t.badges[b]}</Text>
              </View>
            );
          })}
        </View>

        <Text style={[type.h2, styles.h]}>📖 {t.garden.book}</Text>
        {said ? <Mascot text={said} mood="stumble" size={60} /> : null}
        {business.learnings?.length ? (
          business.learnings.map((l) => (
            <View key={l.id} style={styles.learning}>
              <Body>
                {l.kind === "stumble" ? "🪨" : "⭐"} {l.text}
              </Body>
              {l.hint ? <Text style={[type.small, { color: colors.blue }]}>💡 {l.hint}</Text> : null}
            </View>
          ))
        ) : (
          <Body muted>{t.garden.noLearnings}</Body>
        )}
        <View style={{ height: 12 }} />
        <Field label={t.garden.addStumble} value={stumble} onChangeText={setStumble} placeholder={t.garden.stumblePlaceholder} maxLength={500} />
        <Field label={`💡 ${t.garden.clue}`} value={hint} onChangeText={setHint} placeholder={t.garden.cluePlaceholder} maxLength={300} />
        <ErrorNote error={error} />
        <Button label={t.garden.addStumble} onPress={addStumble} disabled={!stumble.trim()} busy={busy} tone="blue" />

        {/* Starts again from the intro on this phone (handy on a shared phone). Asks twice before forgetting. */}
        <View style={{ height: 40 }} />
        {confirmReset ? <Body muted>{t.garden.startOverConfirm}</Body> : null}
        <Button
          label={confirmReset ? t.garden.startOverYes : t.garden.startOver}
          tone={confirmReset ? "retry" : "ghost"}
          onPress={async () => {
            if (!confirmReset) return setConfirmReset(true);
            await signOut();
            router.replace("/welcome");
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 2, borderColor: colors.line },
  scroll: { padding: 16, paddingBottom: 48, maxWidth: 640, width: "100%", alignSelf: "center" },
  h: { marginTop: 24, marginBottom: 12, fontFamily: font.black },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  badge: { width: "30%", alignItems: "center", gap: 4, borderWidth: 2, borderBottomWidth: 4, borderColor: colors.line, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 4 },
  learning: { borderWidth: 2, borderColor: colors.line, borderRadius: 14, padding: 12, marginBottom: 8 },
});
