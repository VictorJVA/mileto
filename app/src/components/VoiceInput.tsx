// Big microphone button for mission answers (interviews, opinions, sales replies).
// Typing is always available as a fallback (web, Android, or a noisy room).

import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { t } from "../i18n/en";
import { colors, font, type } from "../lib/theme";
import { useVoice } from "../lib/useVoice";
import { Field } from "./ui";
import { Waveform } from "./Waveform";

/** Calls `onText` with the transcript, or live as the kid types. The step's bottom button decides what to do. */
export function VoiceInput({ onText, placeholder, label }: { onText: (text: string) => void; placeholder?: string; label?: string }) {
  const [typed, setTyped] = useState("");
  const voice = useVoice((text) => {
    setTyped(text);
    onText(text);
  });
  const [typing, setTyping] = useState(!voice.canRecord);

  return (
    <View style={{ marginVertical: 8 }}>
      {voice.canRecord ? (
        <View style={{ alignItems: "center", marginVertical: 8 }}>
          <Pressable
            onPress={async () => {
              if ((await voice.toggle()) === "denied") setTyping(true);
            }}
            disabled={voice.transcribing}
            accessibilityRole="button"
            accessibilityLabel={voice.recording ? t.voice.stop : label ?? t.voice.hold}
            style={({ pressed }) => [styles.mic, voice.recording && styles.micOn, voice.transcribing && { opacity: 0.5 }, pressed && { borderBottomWidth: 2, marginTop: 4 }]}
          >
            <Text style={{ fontSize: 40 }}>{voice.recording ? "⏹" : "🎙️"}</Text>
          </Pressable>
          {voice.recording ? <Waveform levels={voice.levels} color={colors.retry} /> : null}
          <Text style={[type.tag, { color: voice.recording ? colors.retry : colors.blue, marginTop: 12 }]}>
            {voice.transcribing ? t.voice.sending : voice.recording ? `${t.voice.stop} · ${voice.seconds}s` : label ?? t.voice.hold}
          </Text>
          {!typing ? (
            <Pressable onPress={() => setTyping(true)} hitSlop={8}>
              <Text style={[type.small, { textDecorationLine: "underline", marginTop: 10 }]}>{t.voice.type}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {voice.error ? <Text style={[type.small, { color: colors.retry, textAlign: "center" }]}>{voice.error}</Text> : null}
      {typing || voice.error ? (
        <Field
          value={typed}
          onChangeText={(s) => {
            setTyped(s);
            onText(s.trim());
          }}
          placeholder={placeholder ?? t.voice.type}
          multiline
          style={{ minHeight: 96, textAlignVertical: "top", fontFamily: font.regular }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  mic: { width: 112, height: 112, borderRadius: 56, backgroundColor: colors.blue, borderBottomWidth: 6, borderColor: colors.blueEdge, alignItems: "center", justifyContent: "center" },
  micOn: { backgroundColor: colors.retry, borderColor: "#C0702C" },
});
