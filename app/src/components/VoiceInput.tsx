// Records a voice note and turns it into text through the server (Meta Voice Transcribe).
// Meta's transcription takes WAV mono 16-bit PCM at 16 kHz, which iOS can record directly.
// Typing is always available as a fallback (web, Android, or a noisy room).

import {
  AudioQuality,
  IOSOutputFormat,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
  type RecordingOptions,
} from "expo-audio";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { t } from "../i18n/en";
import { ApiError, upload } from "../lib/api";
import { useSession } from "../lib/session";
import { colors, type } from "../lib/theme";
import { Button, Field } from "./ui";

const WAV_16K_MONO: RecordingOptions = {
  extension: ".wav",
  sampleRate: 16000,
  numberOfChannels: 1,
  bitRate: 256000,
  ios: {
    outputFormat: IOSOutputFormat.LINEARPCM,
    audioQuality: AudioQuality.HIGH,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  // Android is out of the MVP; it records AAC and the kid types instead if transcription rejects it.
  android: { outputFormat: "mpeg4", audioEncoder: "aac" },
  web: { mimeType: "audio/webm" },
};

export function VoiceInput({ onText, placeholder, buttonLabel }: { onText: (text: string) => void; placeholder?: string; buttonLabel?: string }) {
  const { student } = useSession();
  const recorder = useAudioRecorder(WAV_16K_MONO);
  const state = useAudioRecorderState(recorder);
  const [busy, setBusy] = useState(false);
  const [typing, setTyping] = useState(Platform.OS !== "ios");
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canRecord = Platform.OS === "ios" && !!student?.adultConsent;

  async function toggle() {
    setError(null);
    if (state.isRecording) {
      await recorder.stop();
      if (!recorder.uri) return;
      setBusy(true);
      try {
        const r = await upload<{ transcript: string }>("/api/ai/transcribe", "audio", { uri: recorder.uri, name: "note.wav", type: "audio/wav" });
        if (r.transcript) onText(r.transcript);
        else setTyping(true);
      } catch (e) {
        setError(e instanceof ApiError && e.code === "adult_consent_required" ? t.voice.needsAdult : t.common.offline);
        setTyping(true);
      } finally {
        setBusy(false);
      }
      return;
    }
    const perm = await requestRecordingPermissionsAsync();
    if (!perm.granted) return setTyping(true);
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
  }

  return (
    <View style={{ marginVertical: 8 }}>
      {canRecord ? (
        <Pressable
          onPress={toggle}
          disabled={busy}
          accessibilityRole="button"
          style={[styles.mic, state.isRecording && styles.micOn, busy && { opacity: 0.5 }]}
        >
          <Text style={styles.micIcon}>{state.isRecording ? "⏹" : "🎙️"}</Text>
          <Text style={[type.body, { fontWeight: "700", color: state.isRecording ? "#fff" : colors.oliveDark }]}>
            {busy ? t.voice.sending : state.isRecording ? `${t.voice.stop} · ${Math.round(state.durationMillis / 1000)}s` : buttonLabel ?? t.voice.hold}
          </Text>
        </Pressable>
      ) : !student?.adultConsent && Platform.OS === "ios" ? (
        <Text style={type.small}>{t.voice.needsAdult}</Text>
      ) : null}
      {error ? <Text style={[type.small, { color: colors.warn }]}>{error}</Text> : null}
      {canRecord && !typing ? (
        <Pressable onPress={() => setTyping(true)}>
          <Text style={[type.small, styles.link]}>{t.voice.type}</Text>
        </Pressable>
      ) : null}
      {typing ? (
        <View>
          <Field label={t.voice.type} value={typed} onChangeText={setTyped} placeholder={placeholder} multiline />
          <Button
            label={t.common.next}
            variant="secondary"
            disabled={!typed.trim()}
            onPress={() => {
              onText(typed.trim());
              setTyped("");
            }}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  mic: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, minHeight: 64, borderRadius: 32, borderWidth: 2, borderColor: colors.olive, backgroundColor: colors.card },
  micOn: { backgroundColor: colors.warn, borderColor: colors.warn },
  micIcon: { fontSize: 24 },
  link: { textAlign: "center", textDecorationLine: "underline", marginTop: 8 },
});
