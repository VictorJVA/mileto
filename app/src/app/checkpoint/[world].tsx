// World checkpoint: a short mixed test at the end of each world, built from the world's practice
// questions. It measures what the kid knows on their own: no tutor, no repeats, first try counts.

import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { Celebration } from "../../components/Celebration";
import { Mascot } from "../../components/Mascot";
import { ErrorNote, Tag, Title } from "../../components/ui";
import { fill, t } from "../../i18n/en";
import { post, type Progress } from "../../lib/api";
import { useSession } from "../../lib/session";
import { colors } from "../../lib/theme";
import { useCall } from "../../lib/useCall";
import { LESSONS, WORLD_PHASES } from "../../lesson/content";
import { Lesson, useFooter, useLesson, type StepDef } from "../../lesson/engine";

type World = keyof typeof WORLD_PHASES;
const QUESTIONS = 8;

function Intro({ world }: { world: string }) {
  const lesson = useLesson();
  useFooter({ label: t.checkpoint.start }, lesson.next);
  return (
    <>
      <Tag color={colors.gold}>🏆 {t.checkpoint.title}</Tag>
      <Title>{world}</Title>
      <View style={{ alignItems: "center", marginVertical: 20 }}>
        <Text style={{ fontSize: 96 }}>🏆</Text>
      </View>
      <Mascot text={t.checkpoint.intro} />
    </>
  );
}

export default function Checkpoint() {
  const { world } = useLocalSearchParams<{ world: World }>();
  const { business, path, refresh } = useSession();
  const [result, setResult] = useState<{ correct: number; total: number; passed: boolean; seeds: number; badges: string[] } | null>(null);
  const { error, run } = useCall();
  const title = path?.worlds[world]?.title ?? "";

  const steps = useMemo<StepDef[]>(() => {
    const pool = (WORLD_PHASES[world] ?? []).flatMap((key) => (LESSONS[key] ?? []).filter((s) => s.checkable));
    const picked = [...pool].sort(() => Math.random() - 0.5).slice(0, QUESTIONS);
    const IntroStep = () => <Intro world={title} />;
    return [{ id: "intro", Component: IntroStep }, ...picked.map((s, i) => ({ ...s, id: `${s.id}-${i}` }))];
  }, [world, title]);

  if (!business) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  if (result) {
    return (
      <Celebration
        title={result.passed ? t.checkpoint.passed : t.checkpoint.notYet}
        subtitle={result.passed ? fill(t.checkpoint.score, { n: result.correct, total: result.total }) : `${fill(t.checkpoint.score, { n: result.correct, total: result.total })}. ${t.checkpoint.retry}`}
        mood={result.passed ? "proud" : "happy"}
        confetti={result.passed}
        tiles={[
          { label: t.lesson.seedsEarned, value: `+${result.seeds}`, icon: "🌱", color: colors.good },
          { label: t.lesson.accuracy, value: `${Math.round((result.correct / result.total) * 100)}%`, icon: "🎯", color: colors.blue },
        ]}
        badges={result.badges}
        onContinue={() => router.back()}
      />
    );
  }

  return (
    <>
      <Lesson
        steps={steps}
        topic={`${t.checkpoint.title}: ${title}`}
        requeueMistakes={false}
        tutor={false}
        onClose={() => router.back()}
        onDone={async (_state, stats) => {
          const total = Math.max(stats.checked, 1);
          const r = await run(() =>
            post<{ seeds: number; passed: boolean; progress: Progress; newBadges: string[] }>(`/api/businesses/${business.id}/checkpoints/${world}`, { correct: stats.firstTry, total }),
          );
          if (!r) return;
          await refresh();
          setResult({ correct: stats.firstTry, total, passed: r.passed, seeds: r.seeds, badges: r.newBadges });
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
