// Mileto, the olive. An original character: a glossy olive with big eyes and a leaf on a stem.
// The leaf shows the mood: up for an idea, drooping after a stumble, sprouting on a win.
// Every line is also spoken aloud so kids can follow with minimal reading (RNF-02).

import * as Speech from "expo-speech";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, font } from "../lib/theme";

export type Mood = "curious" | "happy" | "stumble" | "proud";

const LEAF: Record<Mood, { rotate: string; color: string }> = {
  curious: { rotate: "-25deg", color: "#7DB23C" },
  happy: { rotate: "-50deg", color: "#8FCB46" },
  stumble: { rotate: "40deg", color: "#6E8F3A" },
  proud: { rotate: "-65deg", color: "#A6E05A" },
};

export function say(text: string) {
  Speech.stop();
  Speech.speak(text, { language: "en-US", rate: 0.95, pitch: 1.15 });
}

export function Olive({ mood = "curious", size = 88 }: { mood?: Mood; size?: number }) {
  const s = size / 88;
  const closed = mood === "happy" || mood === "proud";
  const eye = (
    <View style={{ width: 24 * s, height: closed ? 12 * s : 28 * s, borderRadius: 14 * s, backgroundColor: "#fff", alignItems: "center", justifyContent: closed ? "flex-end" : "center", overflow: "hidden" }}>
      {closed ? (
        <View style={{ width: 24 * s, height: 12 * s, borderTopLeftRadius: 12 * s, borderTopRightRadius: 12 * s, backgroundColor: "#3F5A22", marginBottom: -4 * s }} />
      ) : (
        <View style={{ width: 13 * s, height: 15 * s, borderRadius: 8 * s, backgroundColor: "#141A0E", marginTop: mood === "stumble" ? 8 * s : 2 * s }}>
          <View style={{ width: 5 * s, height: 5 * s, borderRadius: 3 * s, backgroundColor: "#fff", marginLeft: 2 * s, marginTop: 2 * s }} />
        </View>
      )}
    </View>
  );
  return (
    <View style={{ width: size, height: size * 1.25, alignItems: "center", justifyContent: "flex-end" }}>
      {/* Stem and leaf */}
      <View style={{ position: "absolute", top: 2 * s, width: 4 * s, height: 16 * s, backgroundColor: "#5B4325", borderRadius: 2 * s }} />
      <View style={{ position: "absolute", top: 0, left: size / 2, width: 34 * s, height: 15 * s, backgroundColor: LEAF[mood].color, borderTopLeftRadius: 24 * s, borderBottomRightRadius: 24 * s, transform: [{ rotate: LEAF[mood].rotate }] }} />
      {/* Body */}
      <View style={{ width: size * 0.82, height: size, borderRadius: size / 2, backgroundColor: "#5E7F2C", borderBottomWidth: 6 * s, borderColor: "#41591D", alignItems: "center", overflow: "hidden" }}>
        <View style={{ position: "absolute", top: 10 * s, left: 12 * s, width: 14 * s, height: 26 * s, borderRadius: 8 * s, backgroundColor: "rgba(255,255,255,0.22)", transform: [{ rotate: "20deg" }] }} />
        <View style={{ flexDirection: "row", gap: 6 * s, marginTop: 26 * s }}>
          {eye}
          {eye}
        </View>
        {/* Cheeks and mouth */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 * s, marginTop: 5 * s }}>
          <View style={{ width: 8 * s, height: 5 * s, borderRadius: 3 * s, backgroundColor: "rgba(255,150,120,0.55)" }} />
          <View
            style={
              mood === "stumble"
                ? { width: 14 * s, height: 7 * s, borderTopWidth: 3 * s, borderColor: "#141A0E", borderTopLeftRadius: 8 * s, borderTopRightRadius: 8 * s, marginTop: 4 * s }
                : { width: 16 * s, height: 8 * s, backgroundColor: "#2B1A10", borderBottomLeftRadius: 10 * s, borderBottomRightRadius: 10 * s }
            }
          />
          <View style={{ width: 8 * s, height: 5 * s, borderRadius: 3 * s, backgroundColor: "rgba(255,150,120,0.55)" }} />
        </View>
      </View>
    </View>
  );
}

/** Mascot with a speech bubble pointing at it. Tap the bubble to hear the line again. */
export function Mascot({ text, mood = "curious", speak = true, size = 88 }: { text: string; mood?: Mood; speak?: boolean; size?: number }) {
  useEffect(() => {
    if (speak && text) say(text);
    return () => {
      Speech.stop();
    };
  }, [text, speak]);

  return (
    <View style={styles.row}>
      <Olive mood={mood} size={size} />
      <View style={styles.tail} />
      <Pressable style={styles.bubble} onPress={() => say(text)} accessibilityRole="button" accessibilityLabel={`Mileto says: ${text}. Tap to hear again.`}>
        <Text style={styles.text}>{text}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  tail: { width: 14, height: 14, marginLeft: 10, marginRight: -8, backgroundColor: colors.bg, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: colors.line, transform: [{ rotate: "45deg" }], zIndex: 1 },
  bubble: { flex: 1, borderWidth: 2, borderColor: colors.line, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16 },
  text: { fontFamily: font.regular, fontSize: 18, lineHeight: 25, color: colors.ink },
});
