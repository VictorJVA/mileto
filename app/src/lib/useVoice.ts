// Records a voice note and turns it into text through the server (Meta Voice Transcribe).
// Meta's transcription takes WAV mono 16-bit PCM at 16 kHz, which iOS can record directly.

import {
  AudioQuality,
  IOSOutputFormat,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
  type RecordingOptions,
} from "expo-audio";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { errorMessage } from "../components/ui";
import { t } from "../i18n/en";
import { upload } from "./api";
import { useSession } from "./session";

const WAV_16K_MONO: RecordingOptions = {
  extension: ".wav",
  sampleRate: 16000,
  numberOfChannels: 1,
  bitRate: 256000,
  // Live mic level for the waveform while the kid talks.
  isMeteringEnabled: true,
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
 * Tap once to record, tap again to stop and transcribe. `canRecord` is false on web, Android,
 * or until an adult unlocks the microphone; callers fall back to typing.
 */
export function useVoice(onTranscript: (text: string) => void) {
  const { student } = useSession();
  const recorder = useAudioRecorder(WAV_16K_MONO);
  const state = useAudioRecorderState(recorder, 80);
  // The last few mic levels (0..1), newest last, to draw a live waveform.
  const [levels, setLevels] = useState<number[]>([]);
  const last = useRef(0);
  useEffect(() => {
    if (!state.isRecording) return void (last.current = 0);
    const db = state.metering ?? -60;
    const level = Math.max(0.05, Math.min(1, (db + 55) / 50));
    if (state.durationMillis === last.current) return;
    last.current = state.durationMillis;
    setLevels((l) => [...l.slice(-27), level]);
  }, [state.isRecording, state.metering, state.durationMillis]);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canRecord = Platform.OS === "ios" && !!student?.adultConsent;

  async function toggle(): Promise<"recording" | "stopped" | "denied"> {
    setError(null);
    if (state.isRecording) {
      await recorder.stop();
      // Leave recording mode so Mileto's voice plays from the speaker, not the earpiece.
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => undefined);
      if (!recorder.uri) {
        setError(t.voice.notHeard);
        return "stopped";
      }
      setTranscribing(true);
      try {
        const r = await upload<{ transcript: string }>("/api/ai/transcribe", "audio", { uri: recorder.uri, name: "note.wav", type: "audio/wav" });
        if (r.transcript.trim()) onTranscript(r.transcript.trim());
        else setError(t.voice.notHeard);
      } catch (e) {
        setError(errorMessage(e));
      } finally {
        setTranscribing(false);
      }
      return "stopped";
    }
    const perm = await requestRecordingPermissionsAsync();
    if (!perm.granted) return "denied";
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    setLevels([]);
    recorder.record();
    return "recording";
  }

  return { levels, canRecord, recording: state.isRecording, seconds: Math.round(state.durationMillis / 1000), transcribing, error, toggle };
}
