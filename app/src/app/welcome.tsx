// RF-01: play without an account. Nickname, avatar, age range and an optional class code. No real names.

import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Mascot, Olive, type Mood } from "../components/Mascot";
import { Body, Button, Choice, ErrorNote, Field, H2, Screen } from "../components/ui";
import { t } from "../i18n/en";
import { post, type Student } from "../lib/api";
import { useSession } from "../lib/session";
import { colors } from "../lib/theme";

const AVATARS: Array<{ id: string; mood: Mood }> = [
  { id: "olive-1", mood: "curious" },
  { id: "olive-2", mood: "happy" },
  { id: "olive-3", mood: "proud" },
  { id: "olive-4", mood: "stumble" },
];

export default function Welcome() {
  const { signIn } = useSession();
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState("olive-1");
  const [ageRange, setAgeRange] = useState<"8-12" | "13-18" | null>(null);
  const [classCode, setClassCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const valid = /^[\p{L} _-]{2,20}$/u.test(nickname.trim()) && ageRange !== null;

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const s = await post<Student>("/api/students", {
        nickname: nickname.trim(),
        avatar,
        ageRange,
        classCode: classCode.trim() || null,
      });
      await signIn(s);
      router.replace("/consent");
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <View style={{ height: 40 }} />
      <Mascot text={t.welcome.hello} mood="happy" />
      <Field label={t.welcome.nickname} hint={t.welcome.nicknameHint} value={nickname} onChangeText={setNickname} autoCapitalize="words" maxLength={20} />
      <H2>{t.welcome.avatar}</H2>
      <View style={styles.avatars}>
        {AVATARS.map((a) => (
          <Pressable key={a.id} onPress={() => setAvatar(a.id)} style={[styles.avatar, avatar === a.id && styles.avatarOn]} accessibilityRole="radio" accessibilityState={{ selected: avatar === a.id }}>
            <Olive mood={a.mood} size={48} />
          </Pressable>
        ))}
      </View>
      <H2>{t.welcome.age}</H2>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Choice label="8 – 12" selected={ageRange === "8-12"} onPress={() => setAgeRange("8-12")} />
        </View>
        <View style={{ flex: 1 }}>
          <Choice label="13 – 18" selected={ageRange === "13-18"} onPress={() => setAgeRange("13-18")} />
        </View>
      </View>
      <Field label={t.welcome.classCode} value={classCode} onChangeText={(s) => setClassCode(s.toUpperCase())} autoCapitalize="characters" maxLength={8} />
      <ErrorNote error={error} />
      <Button label={t.welcome.start} onPress={start} disabled={!valid} busy={busy} />
      <Body muted>Mileto never asks for your real name, email or where you live.</Body>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatars: { flexDirection: "row", gap: 10, marginBottom: 8 },
  avatar: { padding: 8, borderRadius: 16, borderWidth: 2, borderColor: colors.line, backgroundColor: colors.card },
  avatarOn: { borderColor: colors.olive, backgroundColor: "#F1F6E6" },
});
