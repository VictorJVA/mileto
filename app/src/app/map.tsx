// RF-04: the path map. Three worlds, twelve phases that unlock one after another, and a garden that grows.

import { Link, router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Mascot } from "../components/Mascot";
import { Body, Card, H2, Screen } from "../components/ui";
import { t } from "../i18n/en";
import type { Phase, PhaseStatus } from "../lib/api";
import { useSession } from "../lib/session";
import { colors, type } from "../lib/theme";

const GARDEN_EMOJI = { seed: "🌰", sprout: "🌱", plant: "🌿", tree: "🌳" } as const;
const STATUS_ICON: Record<PhaseStatus, string> = { locked: "🔒", available: "▶", done: "✓", skipped: "↷" };

export default function MapScreen() {
  const { student, business, path, celebrate, clearCelebrate } = useSession();
  if (!student || !business || !path) return <Screen><Body>{t.common.loading}</Body></Screen>;

  const p = student.progress;
  const worlds = (Object.keys(path.worlds) as Phase["world"][]).map((w) => ({
    id: w,
    ...path.worlds[w],
    phases: path.phases.filter((ph) => ph.world === w),
  }));

  return (
    <Screen>
      {celebrate.length ? (
        <Pressable onPress={clearCelebrate}>
          <Mascot mood="proud" text={`New badge: ${celebrate.map((b) => t.badges[b] ?? b).join(", ")}!`} />
        </Pressable>
      ) : (
        <Mascot text={t.map.say} speak={false} />
      )}

      <Link href="/garden" asChild>
        <Pressable style={styles.garden} accessibilityRole="button">
          <Text style={{ fontSize: 40 }}>{GARDEN_EMOJI[p.garden]}</Text>
          <View style={{ flex: 1 }}>
            <Text style={type.h2}>{t.map.garden}: {t.stages[p.garden]}</Text>
            <Text style={type.small}>
              🌱 {p.seeds} {t.garden.seeds} · 🔥 {p.streak} {t.garden.streak} · 🏅 {p.badges.length}
            </Text>
          </View>
          <Text style={type.h2}>›</Text>
        </Pressable>
      </Link>

      {business.idea ? <Body muted>💡 {business.idea}</Body> : null}

      {worlds.map((w) => (
        <View key={w.id}>
          <H2>{w.title}</H2>
          <Text style={[type.small, { marginBottom: 8 }]}>{w.learns}</Text>
          {w.phases.map((ph) => {
            const status = business.statuses[String(ph.id)] ?? "locked";
            const open = status !== "locked";
            return (
              <Pressable
                key={ph.id}
                disabled={!open}
                onPress={() => router.push({ pathname: "/phase/[id]", params: { id: String(ph.id) } })}
                style={[styles.node, { borderLeftColor: colors.world[w.id] }, status === "available" && styles.nodeNow, !open && { opacity: 0.5 }]}
                accessibilityRole="button"
                accessibilityState={{ disabled: !open }}
              >
                <Text style={[styles.icon, status === "done" && { color: colors.olive }]}>{STATUS_ICON[status]}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[type.body, { fontWeight: "700" }]}>{ph.id}. {ph.title}</Text>
                  <Text style={type.small}>{ph.mission}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}

      <H2>{t.map.growth}</H2>
      <Card>
        {path.growthModules.map((m) => (
          <Text key={m} style={[type.small, { marginBottom: 4 }]}>🔒 {m}</Text>
        ))}
      </Card>
      {!student.adultConsent ? (
        <Link href="/consent" style={[type.small, { textAlign: "center", textDecorationLine: "underline" }]}>
          {t.consent.title}
        </Link>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  garden: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.line, padding: 14, marginBottom: 12 },
  node: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.line, borderLeftWidth: 6, padding: 14, marginBottom: 8 },
  nodeNow: { borderColor: colors.olive, borderWidth: 2, borderLeftWidth: 6 },
  icon: { fontSize: 20, width: 24, textAlign: "center", color: colors.muted },
});
