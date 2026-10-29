// A phase is one lesson: learn the idea (analogy), practice it (mini-games, quiz), then do the real mission.
// When the lesson ends, the confirmed result is saved and the garden grows.

import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Olive, say } from "../../components/Mascot";
import { Button, ErrorNote } from "../../components/ui";
import { t } from "../../i18n/en";
import type { Progress } from "../../lib/api";
import { useSession } from "../../lib/session";
import { colors, font, type } from "../../lib/theme";
import { useCall } from "../../lib/useCall";
import { LESSONS } from "../../lesson/content";
import { Lesson, type StepDef } from "../../lesson/engine";
import { brandSteps } from "../../missions/Brand";
import { capitalSteps } from "../../missions/Capital";
import { cashboxSteps } from "../../missions/Cashbox";
import { chooseSteps } from "../../missions/Choose";
import { decideSteps } from "../../missions/Decide";
import { discoverSteps } from "../../missions/Discover";
import { goldenSteps } from "../../missions/GoldenCircle";
import { priceSteps } from "../../missions/Price";
import { salesSteps } from "../../missions/Sales";
import { shoppingSteps } from "../../missions/Shopping";
import { testBatchSteps } from "../../missions/TestBatch";
import { validateSteps } from "../../missions/Validate";

const MISSIONS: Record<string, StepDef[]> = {
  discover: discoverSteps,
  choose: chooseSteps,
  golden_circle: goldenSteps,
  validate: validateSteps,
  shopping: shoppingSteps,
  capital: capitalSteps,
  test_batch: testBatchSteps,
  price: priceSteps,
  brand: brandSteps,
  sales: salesSteps,
  cashbox: cashboxSteps,
  decide: decideSteps,
};

function Celebration({ progress, before, badges }: { progress: Progress; before: Progress; badges: string[] }) {
  useEffect(() => say(t.lesson.complete), []);
  const tiles = [
    { label: t.lesson.seedsEarned, value: `+${progress.seeds - before.seeds}`, color: colors.good, edge: colors.primaryEdge, icon: "🌱" },
    { label: t.lesson.streak, value: String(progress.streak), color: colors.retry, edge: "#C0702C", icon: "🔥" },
  ];
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <Olive mood="proud" size={150} />
        <Text style={[type.title, { color: colors.gold, fontFamily: font.black, fontSize: 32, marginTop: 24, textAlign: "center" }]}>{t.lesson.complete}</Text>
        <View style={{ flexDirection: "row", gap: 12, marginTop: 24 }}>
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
        <Button label={t.common.continue} onPress={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}

export default function PhaseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { path, business, student, completePhase } = useSession();
  const [done, setDone] = useState<{ progress: Progress; before: Progress; badges: string[] } | null>(null);
  const { error, run } = useCall();
  const phase = path?.phases.find((p) => String(p.id) === id);

  if (!phase || !business || !student) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  if (done) return <Celebration {...done} />;

  const before = student.progress;
  const steps = [...(LESSONS[phase.key] ?? []), ...(MISSIONS[phase.key] ?? [])];

  return (
    <>
      <Lesson
        steps={steps}
        onClose={() => router.back()}
        onDone={async (state) => {
          const r = await run(() => completePhase(phase.id, (state.result as Record<string, unknown>) ?? {}));
          if (r) setDone({ progress: r.progress, before, badges: r.newBadges });
        }}
      />
      {error ? (
        <View style={{ position: "absolute", top: 60, left: 16, right: 16 }}>
          <ErrorNote error={error} />
        </View>
      ) : null}
    </>
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
