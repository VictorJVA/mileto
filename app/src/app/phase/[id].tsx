// A phase is one lesson: a story hooks the kid, Mileto explains the idea with an analogy and a worked
// example, games practice it, a recap closes the learning, and then comes the real mission.
// When the lesson ends, the confirmed result is saved and the garden grows.

import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { Celebration } from "../../components/Celebration";
import { ErrorNote } from "../../components/ui";
import { t } from "../../i18n/en";
import type { Progress } from "../../lib/api";
import { useSession } from "../../lib/session";
import { colors } from "../../lib/theme";
import { useCall } from "../../lib/useCall";
import { LESSONS } from "../../lesson/content";
import { Lesson, type StepDef } from "../../lesson/engine";
import { personal, withIdea } from "../../lesson/steps";
import { loadPersonal, loadPersonalGames } from "../../lib/personal";
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

export default function PhaseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { path, business, student, completePhase } = useSession();
  const [done, setDone] = useState<{ progress: Progress; before: Progress; badges: string[]; accuracy: string } | null>(null);
  const { error, run } = useCall();
  const phase = path?.phases.find((p) => String(p.id) === id);
  const key = phase?.key ?? "";
  const idea = business?.idea ?? null;

  const steps = useMemo(() => {
    const learn = LESSONS[key] ?? [];
    // After the general example (oranges, cakes), the same idea with the kid's own business.
    const at = learn.findIndex((s) => s.id === "learn") + 1;
    // Practice games use their version reworded around the idea, once it's ready.
    const games = idea ? learn.map((s) => withIdea(s, key)) : learn;
    const lesson = idea && at > 0 ? [...games.slice(0, at), personal("mine", key), ...games.slice(at)] : games;
    return [...lesson, ...(MISSIONS[key] ?? [])];
    // Built once per lesson: an idea change mid-lesson (Validate) must not restart it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Start making the personal example now, so it's ready when the kid reaches it.
  useEffect(() => {
    if (!business || !idea || !key) return;
    void loadPersonal(business.id, key, idea);
    const games = (LESSONS[key] ?? []).flatMap((s) => (s.game ? [{ id: s.id, kind: s.game.kind, spec: s.game.spec }] : []));
    void loadPersonalGames(business.id, key, idea, games);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!phase || !business || !student) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  if (done) {
    return (
      <Celebration
        title={t.lesson.complete}
        tiles={[
          { label: t.lesson.seedsEarned, value: `+${done.progress.seeds - done.before.seeds}`, icon: "🌱", color: colors.good },
          { label: t.lesson.accuracy, value: done.accuracy, icon: "🎯", color: colors.blue },
          { label: t.lesson.streak, value: String(done.progress.streak), icon: "🔥", color: colors.retry },
        ]}
        badges={done.badges}
        onContinue={() => router.back()}
      />
    );
  }

  const before = student.progress;

  return (
    <>
      <Lesson
        steps={steps}
        topic={`${phase.title}: ${phase.mission}`}
        onClose={() => router.back()}
        // Demo/testing only: never shown in a production build, so kids can't skip validation.
        onSkip={
          __DEV__
            ? async () => {
                await run(() => completePhase(phase.id, { skippedForDemo: true }));
                router.back();
              }
            : undefined
        }
        onDone={async (state, stats) => {
          const r = await run(() => completePhase(phase.id, (state.result as Record<string, unknown>) ?? {}));
          const accuracy = stats.checked ? `${Math.round((stats.firstTry / stats.checked) * 100)}%` : "—";
          if (r) setDone({ progress: r.progress, before, badges: r.newBadges, accuracy });
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
