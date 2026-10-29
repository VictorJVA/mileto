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
import { colors, font, type } from "../lib/theme";
import { Field } from "./ui";

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

/**
 * Big microphone button. Calls `onText` with the transcript, or live as the kid types.
 * The step's bottom button decides what to do with the text.
 */
export function VoiceInput({ onText, placeholder, label }: { onText: (text: string) => void; placeholder?: string; label?: string }) {
  const { student } = useSession();
  const recorder = useAudioRecorder(WAV_16K_MONO);
  const state = useAudioRecorderState(recorder);
  const [busy, setBusy] = useState(false);
  const [typing, setTyping] = useState(Platform.OS !== "ios" || !student?.adultConsent);
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
        <View style={{ alignItems: "center", marginVertical: 8 }}>
          <Pressable
            onPress={toggle}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={state.isRecording ? t.voice.stop : label ?? t.voice.hold}
            style={({ pressed }) => [styles.mic, state.isRecording && styles.micOn, busy && { opacity: 0.5 }, pressed && { borderBottomWidth: 2, marginTop: 4 }]}
          >
            <Text style={{ fontSize: 40 }}>{state.isRecording ? "⏹" : "🎙️"}</Text>
          </Pressable>
          <Text style={[type.tag, { color: state.isRecording ? colors.retry : colors.blue, marginTop: 12 }]}>
            {busy ? t.voice.sending : state.isRecording ? `${t.voice.stop} · ${Math.round(state.durationMillis / 1000)}s` : label ?? t.voice.hold}
          </Text>
          {!typing ? (
            <Pressable onPress={() => setTyping(true)} hitSlop={8}>
              <Text style={[type.small, { textDecorationLine: "underline", marginTop: 10 }]}>{t.voice.type}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {error ? <Text style={[type.small, { color: colors.retry, textAlign: "center" }]}>{error}</Text> : null}
      {typing ? (
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
