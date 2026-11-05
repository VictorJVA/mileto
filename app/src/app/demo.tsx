// Demo branch: one button per clip of the video script. Each creates a fresh player (Sofi, who sells
// custom stickers) with the earlier phases done and opens the app right at that scene.

import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ErrorNote } from "../components/ui";
import { API_URL } from "../lib/api";
import { startScene } from "../lib/demo";
import { useSession } from "../lib/session";
import { colors, font, type } from "../lib/theme";
import { useCall } from "../lib/useCall";

const CLIPS: Array<{ clip: string; title: string; hint: string; scenes: Array<{ scene: string; label: string }> }> = [
  { clip: "01", title: "The three doors", hint: "Entry screen with the three starting points.", scenes: [{ scene: "entry", label: "Entry screen" }] },
  { clip: "02", title: "Voice: skills", hint: "Tap the mic, say “I like drawing and I have a tablet”.", scenes: [{ scene: "voice", label: "Tell Mileto" }] },
  {
    clip: "03",
    title: "Ideas, 4 questions, business card",
    hint: "Continue clip 02 to see the 3 ideas; then the check and the card.",
    scenes: [
      { scene: "voice", label: "3 ideas" },
      { scene: "choose", label: "4 questions" },
      { scene: "card", label: "Business card" },
    ],
  },
  { clip: "04", title: "Interviews by voice", hint: "Record 3 to 5 short interviews, then see what people said.", scenes: [{ scene: "interviews", label: "Interviews" }] },
  { clip: "05", title: "Prices by photo", hint: "Photo of two price labels; code finds the price per unit.", scenes: [{ scene: "prices", label: "Two labels" }] },
  {
    clip: "06",
    title: "Poster and sale",
    hint: "Paint the poster; then sell to the customer who says “That's expensive!”.",
    scenes: [
      { scene: "poster", label: "Poster" },
      { scene: "sale", label: "Sale" },
    ],
  },
  { clip: "07", title: "Cash box with SAM", hint: "Opening photo (20), closing photo (6), say “I sold fourteen”.", scenes: [{ scene: "cashbox", label: "Cash box" }] },
  { clip: "08", title: "Tutor", hint: "Open the olive, tap the mic, say “Give me a hint”.", scenes: [{ scene: "tutor", label: "Tutor" }] },
  {
    clip: "09",
    title: "Decide, jars, garden, stumble",
    hint: "Scenarios and two jars; then the garden with the learning book.",
    scenes: [
      { scene: "decide", label: "Decide" },
      { scene: "garden", label: "Garden" },
    ],
  },
];

export default function Demo() {
  const { signIn, setBusiness } = useSession();
  const [busy, setBusy] = useState<string | null>(null);
  const { error, run } = useCall();

  async function open(scene: string) {
    setBusy(scene);
    const r = await run(() => startScene(scene));
    setBusy(null);
    if (!r) return;
    await signIn(r.student);
    if (r.business) await setBusiness(r.business);
    router.push(r.route as never);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.top}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={{ color: colors.faint, fontSize: 24, fontFamily: font.bold }}>✕</Text>
        </Pressable>
        <Text style={[type.h2, { fontFamily: font.black }]}>🎬 Demo scenes</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[type.small, { marginBottom: 12 }]}>Each button makes a fresh player, Sofi (custom stickers), with the earlier phases done. The scene itself uses the real app and the real models.</Text>
        <ErrorNote error={error} />
        {CLIPS.map((c) => (
          <View key={c.clip} style={styles.card}>
            <Text style={[type.tag, { color: colors.gold }]}>Clip {c.clip}</Text>
            <Text style={[type.h2, { fontFamily: font.black }]}>{c.title}</Text>
            <Text style={[type.small, { marginBottom: 10 }]}>{c.hint}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {c.scenes.map((s) => (
                <Pressable key={s.label} onPress={() => open(s.scene)} disabled={!!busy} style={({ pressed }) => [styles.btn, busy === s.scene && { opacity: 0.5 }, pressed && { borderBottomWidth: 1, marginTop: 3 }]} accessibilityRole="button">
                  <Text style={[type.button, { color: colors.onPrimary, fontSize: 13 }]}>{busy === s.scene ? "…" : `▶ ${s.label}`}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
        <View style={styles.card}>
          <Text style={[type.tag, { color: colors.gold }]}>Clip 10</Text>
          <Text style={[type.h2, { fontFamily: font.black }]}>Teacher dashboard</Text>
          <Text style={[type.small, { marginBottom: 10 }]}>Best recorded on the computer: {API_URL}/teacher/ (class DEMO1).</Text>
          <Pressable onPress={() => Linking.openURL(`${API_URL}/teacher/`)} style={styles.btn} accessibilityRole="button">
            <Text style={[type.button, { color: colors.onPrimary, fontSize: 13 }]}>▶ Open dashboard</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 2, borderColor: colors.line },
  scroll: { padding: 16, paddingBottom: 48, maxWidth: 640, width: "100%", alignSelf: "center" },
  card: { borderWidth: 2, borderColor: colors.line, borderRadius: 16, padding: 14, marginBottom: 12 },
  btn: { backgroundColor: colors.primary, borderBottomWidth: 4, borderColor: colors.primaryEdge, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
});
