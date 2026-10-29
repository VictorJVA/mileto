// RF-04: the path map. Three worlds, twelve round lesson buttons on a winding trail, and a garden that grows.

import { Link, router } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Olive } from "../components/Mascot";
import { fill, t } from "../i18n/en";
import type { Phase, PhaseStatus } from "../lib/api";
import { useSession } from "../lib/session";
import { colors, font, type } from "../lib/theme";

const GARDEN_EMOJI: Record<string, string> = { seed: "🌰", sprout: "🌱", plant: "🌿", tree: "🌳" };
const PHASE_ICON: Record<string, string> = {
  discover: "💡",
  choose: "🪴",
  golden_circle: "🎯",
  validate: "🔍",
  shopping: "🛒",
  capital: "🫙",
  test_batch: "🍲",
  price: "⚖️",
  brand: "📣",
  sales: "🤝",
  cashbox: "🧮",
  decide: "🌾",
};
// Horizontal offsets that make the trail wind left and right.
const WIGGLE = [0, -48, -72, -48, 0, 48, 72, 48];
const WORLD_ORDER: Phase["world"][] = ["seed", "saddlebag", "plaza"];

function Bounce({ children }: { children: React.ReactNode }) {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(y, { toValue: -6, duration: 600, useNativeDriver: true }),
        Animated.timing(y, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [y]);
  return <Animated.View style={{ transform: [{ translateY: y }] }}>{children}</Animated.View>;
}

function Node({ phase, status, current, offset }: { phase: Phase; status: PhaseStatus; current: boolean; offset: number }) {
  const open = status !== "locked";
  const color = status === "locked" ? colors.locked : status === "skipped" ? colors.surfaceHi : colors.world[phase.world];
  const edge = status === "locked" ? colors.lockedEdge : status === "skipped" ? colors.line : colors.worldEdge[phase.world];
  return (
    <View style={{ alignItems: "center", transform: [{ translateX: offset }], marginBottom: 18 }}>
      {current ? (
        <Bounce>
          <View style={styles.startTip}>
            <Text style={[type.tag, { color: colors.world[phase.world], fontSize: 15 }]}>{status === "done" ? t.map.review : t.map.start}</Text>
          </View>
          <View style={[styles.startTail, { borderTopColor: colors.line }]} />
        </Bounce>
      ) : null}
      <View style={[styles.ring, current && { borderColor: colors.surfaceHi }]}>
        <Pressable
          disabled={!open}
          onPress={() => router.push({ pathname: "/phase/[id]", params: { id: String(phase.id) } })}
          style={({ pressed }) => [styles.node, { backgroundColor: color, borderBottomColor: edge }, pressed && { borderBottomWidth: 2, marginTop: 6 }]}
          accessibilityRole="button"
          accessibilityLabel={`${phase.id}. ${phase.title}${open ? "" : ", locked"}`}
        >
          <Text style={{ fontSize: 30, opacity: open ? 1 : 0.4 }}>{status === "locked" ? "🔒" : PHASE_ICON[phase.key] ?? "⭐"}</Text>
          {status === "done" ? (
            <View style={styles.doneBadge}>
              <Text style={{ fontSize: 12, color: colors.onPrimary, fontFamily: font.black }}>✓</Text>
            </View>
          ) : null}
        </Pressable>
      </View>
      <Text style={[type.small, { marginTop: 4, color: open ? colors.ink : colors.faint, fontFamily: font.bold }]}>{phase.title}</Text>
    </View>
  );
}

export default function MapScreen() {
  const { student, business, path, celebrate, clearCelebrate } = useSession();

  useEffect(() => {
    if (celebrate.length) {
      const timer = setTimeout(clearCelebrate, 4000);
      return () => clearTimeout(timer);
    }
  }, [celebrate, clearCelebrate]);

  if (!student || !business || !path) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  const p = student.progress;
  const currentId = path.phases.find((ph) => business.statuses[String(ph.id)] === "available")?.id ?? null;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.topBar}>
        <Link href="/garden" asChild>
          <Pressable style={styles.chip} accessibilityRole="button" accessibilityLabel={t.garden.title}>
            <Text style={styles.chipText}>{GARDEN_EMOJI[p.garden]}</Text>
          </Pressable>
        </Link>
        <View style={styles.chip}>
          <Text style={[styles.chipText, { color: p.streak ? colors.retry : colors.faint }]}>🔥 {p.streak}</Text>
        </View>
        <View style={styles.chip}>
          <Text style={[styles.chipText, { color: colors.good }]}>🌱 {p.seeds}</Text>
        </View>
        <View style={styles.chip}>
          <Text style={[styles.chipText, { color: colors.gold }]}>🏅 {p.badges.length}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {celebrate.length ? (
          <View style={[styles.banner, { backgroundColor: colors.gold, borderBottomColor: colors.goldEdge }]}>
            <Text style={[type.h2, { color: "#2A1E00" }]}>🏅 {t.lesson.newBadge} {celebrate.map((b) => t.badges[b] ?? b).join(", ")}</Text>
          </View>
        ) : null}

        {WORLD_ORDER.map((w, wi) => {
          const phases = path.phases.filter((ph) => ph.world === w);
          return (
            <View key={w}>
              <View style={[styles.banner, { backgroundColor: colors.world[w], borderBottomColor: colors.worldEdge[w] }]}>
                <Text style={[type.tag, { color: "rgba(0,0,0,0.55)" }]}>
                  {fill(t.map.world, { n: wi + 1 })} · {fill(t.map.phases, { from: phases[0].id, to: phases[phases.length - 1].id })}
                </Text>
                <Text style={[type.title, { color: "#0E1A0A", fontFamily: font.black }]}>{path.worlds[w].title}</Text>
                <Text style={[type.small, { color: "rgba(0,0,0,0.65)" }]}>{path.worlds[w].learns}</Text>
              </View>
              <View style={{ paddingVertical: 20 }}>
                {phases.map((ph) => {
                  const offset = WIGGLE[(ph.id - 1) % WIGGLE.length];
                  return (
                    <View key={ph.id}>
                      <Node phase={ph} status={business.statuses[String(ph.id)] ?? "locked"} current={ph.id === currentId} offset={offset} />
                      {/* Mileto sits beside the trail in the middle of each world. */}
                      {ph.id === phases[1]?.id ? (
                        <View style={{ position: "absolute", right: offset > 0 ? undefined : 8, left: offset > 0 ? 8 : undefined, top: 10 }}>
                          <Olive mood={wi === 2 ? "proud" : wi === 1 ? "happy" : "curious"} size={84} />
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}

        <View style={[styles.banner, { backgroundColor: colors.surface, borderBottomColor: colors.line }]}>
          <Text style={[type.tag, { color: colors.purple }]}>🔒 {t.map.growth}</Text>
          <Text style={[type.small, { marginBottom: 8 }]}>{t.map.growthNote}</Text>
          {path.growthModules.map((m) => (
            <Text key={m} style={[type.small, { color: colors.faint }]}>
              • {m}
            </Text>
          ))}
        </View>

        {!student.adultConsent ? (
          <Link href="/consent" style={[type.small, { textAlign: "center", textDecorationLine: "underline", marginTop: 16 }]}>
            {t.map.unlockMedia}
          </Link>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 2, borderColor: colors.line, maxWidth: 640, width: "100%", alignSelf: "center" },
  chip: { paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontFamily: font.black, fontSize: 18, color: colors.ink },
  scroll: { padding: 16, paddingBottom: 60, maxWidth: 640, width: "100%", alignSelf: "center" },
  banner: { borderRadius: 18, borderBottomWidth: 5, padding: 16, marginBottom: 4 },
  ring: { padding: 6, borderRadius: 50, borderWidth: 6, borderColor: "transparent" },
  node: { width: 76, height: 70, borderRadius: 38, borderBottomWidth: 8, alignItems: "center", justifyContent: "center" },
  doneBadge: { position: "absolute", right: -2, top: -2, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
  startTip: { borderWidth: 2, borderColor: colors.line, backgroundColor: colors.bg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  startTail: { alignSelf: "center", width: 0, height: 0, borderLeftWidth: 8, borderRightWidth: 8, borderTopWidth: 8, borderLeftColor: "transparent", borderRightColor: "transparent" },
});
