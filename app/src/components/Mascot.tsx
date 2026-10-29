// Mileto, the olive. The leaf shows the mood: up for an idea, drooping after a stumble, sprouting on a win.
// Every line is also spoken aloud so kids can follow with minimal reading (RNF-02).

import * as Speech from "expo-speech";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../lib/theme";

export type Mood = "curious" | "happy" | "stumble" | "proud";

const LEAF_ROTATION: Record<Mood, string> = { curious: "-20deg", happy: "-45deg", stumble: "35deg", proud: "-60deg" };

export function say(text: string) {
  Speech.stop();
  Speech.speak(text, { language: "en-US", rate: 0.95, pitch: 1.15 });
}

export function Olive({ mood = "curious", size = 72 }: { mood?: Mood; size?: number }) {
  const s = size / 72;
  return (
    <View style={{ width: size, height: size * 1.15, alignItems: "center", justifyContent: "flex-end" }}>
      <View
        style={[
          styles.leaf,
          { width: 30 * s, height: 13 * s, top: 0, left: size / 2 - 2 * s, transform: [{ rotate: LEAF_ROTATION[mood] }] },
          mood === "proud" && { backgroundColor: colors.leaf },
        ]}
      />
      <View style={[styles.body, { width: size * 0.8, height: size, borderRadius: size / 2 }]}>
        <View style={[styles.eyes, { gap: 14 * s, marginTop: size * 0.32 }]}>
          <View style={[styles.eye, { width: 8 * s, height: mood === "happy" || mood === "proud" ? 5 * s : 9 * s }]} />
          <View style={[styles.eye, { width: 8 * s, height: mood === "happy" || mood === "proud" ? 5 * s : 9 * s }]} />
        </View>
        <View
          style={[
            styles.mouth,
            { width: 16 * s, height: 8 * s, marginTop: 6 * s },
            mood === "stumble" ? { borderTopWidth: 2.5 * s, borderBottomWidth: 0, borderTopLeftRadius: 8 * s, borderTopRightRadius: 8 * s } : null,
          ]}
        />
      </View>
    </View>
  );
}

export function Mascot({ text, mood = "curious", speak = true }: { text: string; mood?: Mood; speak?: boolean }) {
  useEffect(() => {
    if (speak) say(text);
    return () => {
      Speech.stop();
    };
  }, [text, speak]);

  return (
    <View style={styles.row}>
      <Olive mood={mood} />
      <Pressable style={styles.bubble} onPress={() => say(text)} accessibilityRole="button" accessibilityLabel={`Mileto says: ${text}. Tap to hear again.`}>
        <Text style={styles.text}>{text}</Text>
        <Text style={styles.replay}>🔊</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end", gap: 10, marginBottom: 16 },
  body: { backgroundColor: colors.olive, alignItems: "center" },
  leaf: { position: "absolute", backgroundColor: colors.leaf, borderTopLeftRadius: 20, borderBottomRightRadius: 20, zIndex: 1 },
  eyes: { flexDirection: "row" },
  eye: { backgroundColor: "#1B2412", borderRadius: 5 },
  mouth: { borderBottomWidth: 2.5, borderColor: "#1B2412", borderBottomLeftRadius: 10, borderBottomRightRadius: 10 },
  bubble: { flex: 1, backgroundColor: colors.card, borderRadius: radius, borderBottomLeftRadius: 4, padding: 14, borderWidth: 1, borderColor: colors.line },
  text: { fontSize: 18, lineHeight: 25, color: colors.ink },
  replay: { position: "absolute", right: 8, bottom: 4, fontSize: 14, opacity: 0.6 },
});
