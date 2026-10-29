// RF-01: play without an account, one question per screen. Nickname, avatar, age range and an optional
// class code. No real names, emails or locations.

import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Mascot, Olive, say, type Mood } from "../components/Mascot";
import { Body, ErrorNote, Field, Option, Title } from "../components/ui";
import { t } from "../i18n/en";
import { post, type Student } from "../lib/api";
import { useSession } from "../lib/session";
import { colors, type } from "../lib/theme";
import { useCall } from "../lib/useCall";
import { Lesson, useFooter, useLesson, type StepDef } from "../lesson/engine";

const AVATARS: Array<{ id: string; mood: Mood }> = [
  { id: "olive-1", mood: "curious" },
  { id: "olive-2", mood: "happy" },
  { id: "olive-3", mood: "proud" },
  { id: "olive-4", mood: "stumble" },
];

const NICKNAME = /^[\p{L} _-]{2,20}$/u;

function Hello() {
  const lesson = useLesson();
  useFooter({ label: t.common.continue }, lesson.next);
  useEffect(() => say(t.onboarding.hello), []);
  return (
    <View style={{ alignItems: "center", paddingTop: 32 }}>
      <View style={styles.bigBubble}>
        <Text style={[type.body, { textAlign: "center" }]}>{t.onboarding.hello}</Text>
      </View>
      <View style={styles.bigTail} />
      <Olive mood="happy" size={150} />
    </View>
  );
}

function Nickname() {
  const lesson = useLesson();
  const [nickname, setNickname] = useState("");
  const valid = NICKNAME.test(nickname.trim());
  useFooter({ label: t.common.continue, disabled: !valid }, () => {
    lesson.set({ nickname: nickname.trim() });
    lesson.next();
  });
  return (
    <>
      <Mascot text={t.onboarding.nickname} />
      <Field value={nickname} onChangeText={setNickname} placeholder={t.onboarding.nicknamePlaceholder} autoCapitalize="words" maxLength={20} autoFocus hint={t.onboarding.nicknameSay} />
    </>
  );
}

function Avatar() {
  const lesson = useLesson();
  const [avatar, setAvatar] = useState<string | null>(null);
  useFooter({ label: t.common.continue, disabled: !avatar }, () => {
    lesson.set({ avatar });
    lesson.next();
  });
  return (
    <>
      <Mascot text={t.onboarding.avatarSay} />
      <Title>{t.onboarding.avatar}</Title>
      <View style={styles.grid}>
        {AVATARS.map((a) => (
          <Pressable
            key={a.id}
            onPress={() => setAvatar(a.id)}
            style={[styles.avatar, avatar === a.id && styles.avatarOn]}
            accessibilityRole="radio"
            accessibilityState={{ selected: avatar === a.id }}
          >
            <Olive mood={a.mood} size={70} />
          </Pressable>
        ))}
      </View>
    </>
  );
}

function Age() {
  const lesson = useLesson();
  const [age, setAge] = useState<string | null>(null);
  useFooter({ label: t.common.continue, disabled: !age }, () => {
    lesson.set({ ageRange: age });
    lesson.next();
  });
  return (
    <>
      <Mascot text={t.onboarding.age} />
      <Body muted>{t.onboarding.ageSay}</Body>
      <View style={{ height: 16 }} />
      {(["8-12", "13-18"] as const).map((a, i) => (
        <Option key={a} badge={i + 1} label={t.onboarding.ages[a]} selected={age === a} onPress={() => setAge(a)} icon={<Text style={{ fontSize: 26 }}>{a === "8-12" ? "🌱" : "🌿"}</Text>} />
      ))}
    </>
  );
}

function ClassCode() {
  const lesson = useLesson();
  const { signIn } = useSession();
  const [code, setCode] = useState("");
  const { busy, error, run } = useCall();
  useFooter({ label: code ? t.common.continue : t.common.skip, busy }, async () => {
    const s = await run(() =>
      post<Student>("/api/students", {
        nickname: lesson.state.nickname,
        avatar: lesson.state.avatar,
        ageRange: lesson.state.ageRange,
        classCode: code.trim() || null,
      }),
    );
    if (!s) return;
    await signIn(s);
    lesson.next();
  });
  return (
    <>
      <Mascot text={t.onboarding.classCode} />
      <Field value={code} onChangeText={(s) => setCode(s.toUpperCase())} placeholder="DEMO1" autoCapitalize="characters" maxLength={8} hint={t.onboarding.classCodeSay} />
      <Body muted>🔒 {t.onboarding.privacy}</Body>
      <ErrorNote error={error} />
    </>
  );
}

const STEPS: StepDef[] = [
  { id: "hello", Component: Hello },
  { id: "nickname", Component: Nickname },
  { id: "avatar", Component: Avatar },
  { id: "age", Component: Age },
  { id: "class", Component: ClassCode },
];

export default function Welcome() {
  return <Lesson steps={STEPS} onClose={() => router.replace("/welcome")} onDone={() => router.replace("/consent")} />;
}

const styles = StyleSheet.create({
  bigBubble: { borderWidth: 2, borderColor: colors.line, borderRadius: 18, padding: 18, maxWidth: 340 },
  bigTail: { width: 16, height: 16, marginTop: -9, marginBottom: 12, backgroundColor: colors.bg, borderRightWidth: 2, borderBottomWidth: 2, borderColor: colors.line, transform: [{ rotate: "45deg" }] },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center" },
  avatar: { width: "46%", alignItems: "center", paddingVertical: 16, borderRadius: 18, borderWidth: 2, borderBottomWidth: 4, borderColor: colors.line },
  avatarOn: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
});
