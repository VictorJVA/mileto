// RF-02 / F7: camera and microphone stay locked until an adult confirms they are present.

import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Mascot } from "../components/Mascot";
import { Button, ErrorNote, Title } from "../components/ui";
import { t } from "../i18n/en";
import { post } from "../lib/api";
import { useSession } from "../lib/session";
import { colors, font, type } from "../lib/theme";
import { useCall } from "../lib/useCall";

const ICONS = ["📷", "🤝", "🪙"];

export default function Consent() {
  const { student, business, refresh } = useSession();
  const [checked, setChecked] = useState(false);
  const { busy, error, run } = useCall();

  const next = () => (business ? router.back() : router.replace("/entry"));

  async function accept() {
    if (!student) return;
    const ok = await run(async () => {
      await post(`/api/students/${student.id}/consent`, { adultPresent: true });
      await refresh();
      return true;
    });
    if (ok) next();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={[type.tag, { color: colors.gold, marginBottom: 8 }]}>🧑 {t.consent.tag}</Text>
        <Title>{t.consent.title}</Title>
        <Mascot text={t.consent.say} size={70} />
        {t.consent.rules.map((r, i) => (
          <View key={r} style={styles.rule}>
            <Text style={{ fontSize: 26 }}>{ICONS[i]}</Text>
            <Text style={[type.body, { flex: 1, fontSize: 16 }]}>{r}</Text>
          </View>
        ))}
        <Pressable style={styles.check} onPress={() => setChecked(!checked)} accessibilityRole="checkbox" accessibilityState={{ checked }}>
          <View style={[styles.box, checked && styles.boxOn]}>{checked ? <Text style={{ color: colors.onPrimary, fontFamily: font.black }}>✓</Text> : null}</View>
          <Text style={[type.body, { flex: 1, fontSize: 16 }]}>{t.consent.check}</Text>
        </Pressable>
        <ErrorNote error={error} />
      </View>
      <View style={styles.footer}>
        <Button label={t.consent.accept} onPress={accept} disabled={!checked} busy={busy} />
        <View style={{ height: 12 }} />
        <Button label={t.consent.later} tone="ghost" onPress={next} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, padding: 16, paddingTop: 24, maxWidth: 640, width: "100%", alignSelf: "center" },
  rule: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 10, borderBottomWidth: 2, borderColor: colors.line },
  check: { flexDirection: "row", gap: 14, alignItems: "flex-start", marginTop: 20 },
  box: { width: 30, height: 30, borderRadius: 8, borderWidth: 2, borderColor: colors.primary, alignItems: "center", justifyContent: "center" },
  boxOn: { backgroundColor: colors.primary },
  footer: { borderTopWidth: 2, borderColor: colors.line, padding: 16, maxWidth: 640, width: "100%", alignSelf: "center" },
});
