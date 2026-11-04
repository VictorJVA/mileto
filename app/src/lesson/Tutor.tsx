// Mileto the tutor lives on the lesson screen, not in a chat window.
// At rest he is just the olive, floating in the corner. Tap him and his tools unfold: the mic
// (red = muted, blue = listening), the keyboard and quick questions. When he answers, he moves to
// the top of the board with his full clue, so the kid can reread it while answering.
// Socratic by design: the server's tutor gives guiding questions and a hint ladder (nudge, pointer,
// similar example), and a code guard blocks replies that give the answer away.

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Olive, say } from "../components/Mascot";
import { errorMessage } from "../components/ui";
import { t } from "../i18n/en";
import { post } from "../lib/api";
import { colors, font, type } from "../lib/theme";
import { useVoice } from "../lib/useVoice";

export interface TutorStep {
  prompt?: string;
  options?: string[];
  answer?: string;
  explain?: string;
}

export interface Clue {
  text: string;
  /** 1-3 on the hint ladder; 0 for a message that isn't a clue (an error, a safety reply). */
  level: number;
}

type Turn = { role: "kid" | "mileto"; text: string };

/** A gentle up-and-down while Mileto listens or thinks. */
function useBob(active: boolean) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) return void v.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: -5, duration: 320, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 320, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, v]);
  return v;
}

export function TutorDock({
  topic,
  step,
  stepKey,
  ask,
  open,
  onOpenChange,
  hidden,
  onClue,
}: {
  topic: string;
  step: TutorStep | null;
  /** Changes on every new screen: the conversation and hint ladder start over. */
  stepKey: string;
  /** A question to ask right away, e.g. from "Ask Mileto why" on a wrong answer. */
  ask: { text: string; n: number } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** True while Mileto is up on the board showing a clue. */
  hidden: boolean;
  onClue: (clue: Clue | null) => void;
}) {
  const [history, setHistory] = useState<Turn[]>([]);
  const [thinking, setThinking] = useState(false);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const voice = useVoice((text) => void send(text));
  const bob = useBob(thinking || voice.recording);
  const unfold = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(unfold, { toValue: open ? 1 : 0, friction: 7, useNativeDriver: true }).start();
  }, [open, unfold]);

  useEffect(() => {
    setHistory([]);
    setNote(null);
    setTyping(false);
    onClue(null);
    // A new screen resets the conversation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepKey]);

  useEffect(() => {
    if (voice.error) setNote(voice.error);
  }, [voice.error]);

  useEffect(() => {
    if (ask) void send(ask.text);
    // Only when a new ask arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ask?.n]);

  async function send(message: string) {
    const text = message.trim();
    if (!text || thinking) return;
    setTyping(false);
    setDraft("");
    setNote(null);
    setThinking(true);
    const before = history;
    try {
      const r = await post<{ reply: string; hintLevel: number }>("/api/ai/tutor", { topic, step: step ?? undefined, history: before.slice(-10), message: text });
      setHistory([...before, { role: "kid", text }, { role: "mileto", text: r.reply }]);
      say(r.reply);
      // Mileto goes up to the board with his answer.
      onOpenChange(false);
      onClue({ text: r.reply, level: r.hintLevel });
    } catch (e) {
      setNote(errorMessage(e));
    } finally {
      setThinking(false);
    }
  }

  async function talk() {
    if (!voice.canRecord) {
      setNote(t.tutor.noMic);
      setTyping(true);
      return;
    }
    if ((await voice.toggle()) === "denied") setTyping(true);
  }

  if (hidden && !thinking) return null;

  const status = voice.recording ? `${t.tutor.listening} ${voice.seconds}s` : voice.transcribing ? t.voice.sending : thinking ? t.tutor.thinking : note;

  return (
    <View style={styles.dock} pointerEvents="box-none">
      {open ? (
        <Animated.View style={[styles.tray, { opacity: unfold, transform: [{ translateY: unfold.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={styles.chips}>
            {t.tutor.chips.map((c) => (
              <Pressable key={c} onPress={() => send(c)} disabled={thinking} style={({ pressed }) => [styles.chip, pressed && { borderBottomWidth: 2, marginTop: 2 }]} accessibilityRole="button">
                <Text style={[type.small, { color: colors.blue, fontFamily: font.bold }]}>{c}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.controls}>
            {typing ? (
              <>
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder={t.tutor.placeholder}
                  placeholderTextColor={colors.faint}
                  style={styles.input}
                  autoFocus
                  returnKeyType="send"
                  onSubmitEditing={() => send(draft)}
                  accessibilityLabel={t.tutor.placeholder}
                />
                <Pressable onPress={() => send(draft)} disabled={!draft.trim() || thinking} style={[styles.round, styles.send, (!draft.trim() || thinking) && { opacity: 0.4 }]} accessibilityRole="button" accessibilityLabel={t.tutor.send}>
                  <Ionicons name="send" size={18} color="#0B1E28" />
                </Pressable>
              </>
            ) : (
              <>
                <Text style={[type.small, { flex: 1, color: voice.recording ? colors.blue : colors.muted }]} numberOfLines={2}>
                  {status ?? t.tutor.idle}
                </Text>
                <Pressable onPress={() => setTyping(true)} style={styles.round} accessibilityRole="button" accessibilityLabel={t.tutor.keyboard}>
                  <MaterialCommunityIcons name="keyboard-outline" size={22} color={colors.muted} />
                </Pressable>
                <Pressable
                  onPress={talk}
                  disabled={voice.transcribing || thinking}
                  style={({ pressed }) => [styles.mic, voice.recording ? styles.micListening : styles.micMuted, (voice.transcribing || thinking) && { opacity: 0.6 }, pressed && { borderBottomWidth: 1, marginTop: 3 }]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: voice.recording }}
                  accessibilityLabel={voice.recording ? t.tutor.tapToSend : t.tutor.muted}
                >
                  <Ionicons name={voice.recording ? "mic" : "mic-off"} size={24} color={voice.recording ? "#0B1E28" : "#fff"} />
                </Pressable>
              </>
            )}
          </View>
        </Animated.View>
      ) : status ? (
        <View style={styles.status}>
          <Text style={[type.tag, { color: colors.blue, fontSize: 11 }]}>{status}</Text>
        </View>
      ) : null}
      <Animated.View style={{ transform: [{ translateY: bob }] }}>
        <Pressable onPress={() => onOpenChange(!open)} style={({ pressed }) => [styles.olive, pressed && { transform: [{ scale: 0.94 }] }]} accessibilityRole="button" accessibilityLabel={open ? t.tutor.close : t.tutor.ask}>
          <Olive size={52} mood={thinking ? "curious" : "happy"} />
          <View style={[styles.badge, open && { backgroundColor: colors.surfaceHi }]}>
            {open ? <Ionicons name="close" size={14} color={colors.ink} /> : <Text style={{ fontFamily: font.black, fontSize: 12, color: colors.bg }}>?</Text>}
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

/** Mileto up on the board with his clue: full text, never cut off. */
export function ClueCard({ clue, onClose, onAskMore }: { clue: Clue; onClose: () => void; onAskMore: () => void }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    v.setValue(0);
    Animated.spring(v, { toValue: 1, friction: 6, useNativeDriver: true }).start();
  }, [clue.text, v]);
  return (
    <Animated.View style={[styles.clue, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] }]}>
      <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
        <Olive size={50} mood="happy" />
        <View style={{ flex: 1 }}>
          <Text style={[type.tag, { color: colors.gold, fontSize: 12, marginBottom: 4 }]}>
            {t.tutor.clue}
            {clue.level > 0 ? ` · ${"●".repeat(clue.level)}${"○".repeat(Math.max(0, 3 - clue.level))}` : ""}
          </Text>
          <Pressable onPress={() => say(clue.text)} accessibilityRole="button" accessibilityLabel={`Mileto: ${clue.text}`}>
            <Text style={[type.body, { fontSize: 17 }]}>{clue.text}</Text>
          </Pressable>
        </View>
        <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel={t.tutor.close}>
          <Ionicons name="close" size={20} color={colors.muted} />
        </Pressable>
      </View>
      <Pressable onPress={onAskMore} style={({ pressed }) => [styles.askMore, pressed && { borderBottomWidth: 1, marginTop: 11 }]} accessibilityRole="button">
        <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.blue} />
        <Text style={[type.tag, { color: colors.blue, fontSize: 12 }]}>{t.tutor.askMore}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  dock: { position: "absolute", left: 12, right: 12, bottom: 10, alignItems: "flex-start" },
  tray: { alignSelf: "stretch", marginBottom: 10, borderRadius: 20, borderWidth: 2, borderBottomWidth: 4, borderColor: colors.line, backgroundColor: colors.surface, paddingVertical: 10, gap: 8 },
  chips: { gap: 8, paddingHorizontal: 12, alignItems: "flex-start" },
  chip: { borderWidth: 2, borderBottomWidth: 4, borderColor: colors.line, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.bg },
  controls: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12 },
  input: { flex: 1, backgroundColor: colors.bg, borderRadius: 12, borderWidth: 2, borderColor: colors.line, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, fontFamily: font.regular, color: colors.ink },
  round: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderBottomWidth: 3, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  send: { backgroundColor: colors.blue, borderColor: colors.blueEdge },
  mic: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderBottomWidth: 4, alignItems: "center", justifyContent: "center" },
  micListening: { backgroundColor: colors.blue, borderColor: colors.blueEdge },
  micMuted: { backgroundColor: "#E0524A", borderColor: "#A8352F" },
  status: { marginBottom: 6, borderRadius: 12, borderWidth: 2, borderColor: colors.line, backgroundColor: colors.surface, paddingHorizontal: 10, paddingVertical: 4 },
  olive: { width: 68, height: 72, borderRadius: 22, borderWidth: 2, borderBottomWidth: 4, borderColor: colors.line, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.blue, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.bg },
  clue: { borderWidth: 2, borderBottomWidth: 4, borderColor: colors.goldEdge, borderRadius: 18, padding: 14, marginBottom: 16, backgroundColor: "#2A2614" },
  askMore: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", marginTop: 12, borderWidth: 2, borderBottomWidth: 3, borderColor: colors.blueEdge, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
});
