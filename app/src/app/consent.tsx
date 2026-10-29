// RF-02 / F7: camera and microphone stay locked until an adult confirms they are present.

import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Mascot } from "../components/Mascot";
import { Body, Button, Card, ErrorNote, Screen, Title } from "../components/ui";
import { t } from "../i18n/en";
import { post } from "../lib/api";
import { useSession } from "../lib/session";
import { colors, type } from "../lib/theme";

export default function Consent() {
  const { student, business, refresh } = useSession();
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const next = () => (business ? router.back() : router.replace("/entry"));

  async function accept() {
    if (!student) return;
    setBusy(true);
    try {
      await post(`/api/students/${student.id}/consent`, { adultPresent: true });
      await refresh();
      next();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Title>{t.consent.title}</Title>
      <Mascot text={t.consent.say} />
      <Card>
        {t.consent.rules.map((r) => (
          <Body key={r}>• {r}</Body>
        ))}
      </Card>
      <Pressable style={styles.check} onPress={() => setChecked(!checked)} accessibilityRole="checkbox" accessibilityState={{ checked }}>
        <View style={[styles.box, checked && styles.boxOn]}>{checked ? <Text style={{ color: "#fff", fontWeight: "800" }}>✓</Text> : null}</View>
        <Text style={[type.body, { flex: 1 }]}>{t.consent.check}</Text>
      </Pressable>
      <ErrorNote error={error} />
      <Button label={t.consent.accept} onPress={accept} disabled={!checked} busy={busy} />
      <Button label={t.consent.later} variant="secondary" onPress={next} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  check: { flexDirection: "row", gap: 12, alignItems: "flex-start", marginVertical: 12 },
  box: { width: 28, height: 28, borderRadius: 6, borderWidth: 2, borderColor: colors.olive, alignItems: "center", justifyContent: "center" },
  boxOn: { backgroundColor: colors.olive },
});
