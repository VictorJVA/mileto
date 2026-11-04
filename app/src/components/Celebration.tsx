// End-of-lesson celebration: confetti, the proud olive, what was earned, and one big button.

import { useEffect, useMemo, useRef } from "react";
import { Animated, Dimensions, Easing, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { t } from "../i18n/en";
import { colors, font, type } from "../lib/theme";
import { Olive, say, type Mood } from "./Mascot";
import { Button } from "./ui";

const CONFETTI = [colors.primary, colors.gold, colors.blue, colors.retry, colors.purple];

function Confetti() {
  const { width, height } = Dimensions.get("window");
  const pieces = useMemo(
    () => Array.from({ length: 36 }, (_, i) => ({ x: Math.random() * width, delay: Math.random() * 600, spin: Math.random() * 720 - 360, color: CONFETTI[i % CONFETTI.length], w: 6 + Math.random() * 6 })),
    [width],
  );
  const fall = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fall, { toValue: 1, duration: 2600, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [fall]);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: "absolute",
            left: p.x,
            top: -20,
            width: p.w,
            height: p.w * 1.6,
            borderRadius: 2,
            backgroundColor: p.color,
            opacity: fall.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] }),
            transform: [
              { translateY: fall.interpolate({ inputRange: [0, 1], outputRange: [0, height * (0.6 + (i % 5) * 0.08)] }) },
              { rotate: fall.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${p.spin}deg`] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}

export interface Tile {
  label: string;
  value: string;
  icon: string;
  color: string;
}

export function Celebration({ title, subtitle, tiles, badges = [], mood = "proud", onContinue, confetti = true }: { title: string; subtitle?: string; tiles: Tile[]; badges?: string[]; mood?: Mood; onContinue: () => void; confetti?: boolean }) {
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    say(subtitle ? `${title} ${subtitle}` : title);
    Animated.spring(pop, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  }, [pop, title, subtitle]);

  return (
    <SafeAreaView style={styles.safe}>
      {confetti ? <Confetti /> : null}
      <View style={styles.center}>
        <Animated.View style={{ transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }] }}>
          <Olive mood={mood} size={150} />
        </Animated.View>
        <Text style={[type.title, { color: colors.gold, fontFamily: font.black, fontSize: 32, marginTop: 24, textAlign: "center" }]}>{title}</Text>
        {subtitle ? <Text style={[type.body, { color: colors.muted, textAlign: "center", marginTop: 6 }]}>{subtitle}</Text> : null}
        <View style={{ flexDirection: "row", gap: 12, marginTop: 24, flexWrap: "wrap", justifyContent: "center" }}>
          {tiles.map((tile) => (
            <View key={tile.label} style={[styles.tile, { borderColor: tile.color, backgroundColor: tile.color }]}>
              <Text style={[type.tag, { color: colors.bg, fontSize: 12, textAlign: "center", paddingVertical: 4 }]}>{tile.label}</Text>
              <View style={styles.tileInner}>
                <Text style={[type.h2, { color: tile.color, fontFamily: font.black, fontSize: 24 }]}>
                  {tile.icon} {tile.value}
                </Text>
              </View>
            </View>
          ))}
        </View>
        {badges.map((b) => (
          <View key={b} style={styles.badge}>
            <Text style={{ fontSize: 36 }}>{t.badgeEmoji[b] ?? "🏅"}</Text>
            <View>
              <Text style={[type.tag, { color: colors.gold }]}>{t.lesson.newBadge}</Text>
              <Text style={[type.h2, { fontFamily: font.black }]}>{t.badges[b] ?? b}</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.footer}>
        <Button label={t.common.continue} onPress={onContinue} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  tile: { width: 130, borderRadius: 16, borderWidth: 2, overflow: "hidden" },
  tileInner: { backgroundColor: colors.bg, borderRadius: 14, alignItems: "center", paddingVertical: 14 },
  badge: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 20, borderWidth: 2, borderColor: colors.gold, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 12 },
  footer: { borderTopWidth: 2, borderColor: colors.line, padding: 16, maxWidth: 640, width: "100%", alignSelf: "center" },
});
