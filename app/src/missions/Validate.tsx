// Phase 4 (F2, RF-08): five mini-interviews by voice. The model tags each one; code counts and finds
// the price range. This phase can never be skipped: first we look, then we decide.

import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Mascot } from "../components/Mascot";
import { Body, Card, ErrorNote, Field, Stat } from "../components/ui";
import { VoiceInput } from "../components/VoiceInput";
import { fill, t } from "../i18n/en";
import { post, request } from "../lib/api";
import { useSession } from "../lib/session";
import { colors, font, peso, type } from "../lib/theme";
import { useCall } from "../lib/useCall";
import { useFooter, useLesson, type StepDef } from "../lesson/engine";
import { MissionHead, useBusiness } from "./kit";

interface Summary {
  interviews: number;
  interested: number;
  notInterested: number;
  unclear: number;
  priceRange: { min: number; max: number; median: number } | null;
  decision: "keep_going" | "adjust_idea" | "need_more_interviews";
}

function Script() {
  const lesson = useLesson();
  const business = useBusiness();
  const m = t.missions.validate;
  useFooter({ label: t.common.continue }, lesson.next);
  return (
    <>
      <MissionHead title={m.scriptTitle} say={m.say} />
      <Card>
        {m.script.map((line, i) => (
          <Text key={line} style={[type.body, { marginBottom: 6 }]}>
            <Text style={{ color: colors.blue, fontFamily: font.black }}>{i + 1}. </Text>
            {fill(line, { idea: business.idea ?? "my product" })}
          </Text>
        ))}
      </Card>
      <Body muted>🛡️ {m.safety}</Body>
    </>
  );
}

function Interviews() {
  const lesson = useLesson();
  const [done, setDone] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const [round, setRound] = useState(0);
  const m = t.missions.validate;
  const full = done.length >= 5;

  // While something is being said, the button saves it; once 3+ are saved it moves on.
  const saving = current.length >= 3 && !full;
  useFooter(
    { label: saving ? fill(m.save, { n: done.length + 1 }) : t.common.continue, disabled: !saving && done.length < 3, tone: saving ? "blue" : "primary" },
    () => {
      if (saving) {
        setDone([...done, current]);
        setCurrent("");
        setRound(round + 1);
        return;
      }
      lesson.set({ transcripts: done });
      lesson.next();
    },
  );

  return (
    <>
      <MissionHead title={fill(m.record, { n: Math.min(done.length + 1, 5) })} />
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={{ flex: 1, height: 12, borderRadius: 6, backgroundColor: i < done.length ? colors.primary : i < 3 ? colors.surfaceHi : colors.surface }} />
        ))}
      </View>
      {!full ? <VoiceInput key={round} onText={setCurrent} placeholder={m.placeholder} /> : null}
      {current ? <Body muted>“{current}”</Body> : null}
      {done.map((d, i) => (
        <Body key={i} muted>
          ✅ {i + 1}. “{d}”
        </Body>
      ))}
      <Body muted>{m.minimum}</Body>
    </>
  );
}

function Results() {
  const lesson = useLesson();
  const business = useBusiness();
  const { refresh } = useSession();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [newIdea, setNewIdea] = useState(business.idea ?? "");
  const { busy, error, run, retry } = useCall();
  const m = t.missions.validate;
  const idea = business.idea ?? "my product";

  useEffect(() => {
    run(async () => setSummary((await post<{ summary: Summary }>("/api/ai/interviews", { idea, transcripts: lesson.state.transcripts })).summary));
    // Summarizes the interviews collected in the previous step, once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const keep = summary?.decision === "keep_going";
  useFooter(
    summary ? { label: keep ? t.common.continue : m.tryNew, disabled: !keep && newIdea.trim().length < 2, tone: keep ? "primary" : "blue" } : { label: t.common.continue, disabled: true, busy },
    async () => {
      if (!summary) return;
      if (keep) {
        lesson.set({ result: { ...summary, transcripts: (lesson.state.transcripts as string[]).length } });
        return lesson.check(true, { title: m.keepGoing });
      }
      const ok = await run(async () => {
        await request(`/api/businesses/${business.id}`, "PATCH", { idea: newIdea.trim() });
        await post(`/api/businesses/${business.id}/learnings`, { kind: "stumble", text: `Few people wanted "${idea}"`, hint: `Trying "${newIdea.trim()}" instead` });
        await refresh();
        return true;
      });
      if (ok) lesson.goTo("interviews");
    },
  );

  if (!summary) return <MissionHead title={t.common.loading} />;
  const total = Math.max(summary.interviews, 1);
  return (
    <>
      <MissionHead title={fill(m.results, { n: summary.interviews })} />
      <Mascot text={keep ? m.keepGoing : m.adjust} mood={keep ? "happy" : "stumble"} size={70} />
      {[
        { label: m.wouldBuy, n: summary.interested, color: colors.primary },
        { label: m.wouldNot, n: summary.notInterested, color: colors.retry },
        { label: m.notSure, n: summary.unclear, color: colors.faint },
      ].map((row) => (
        <View key={row.label} style={{ marginBottom: 12 }}>
          <Text style={[type.small, { color: colors.ink }]}>
            {row.label}: <Text style={{ fontFamily: font.black }}>{row.n}</Text>
          </Text>
          <View style={{ height: 14, borderRadius: 7, backgroundColor: colors.surfaceHi, overflow: "hidden" }}>
            <View style={{ width: `${(row.n / total) * 100}%`, height: "100%", backgroundColor: row.color }} />
          </View>
        </View>
      ))}
      {summary.priceRange ? (
        <View style={{ flexDirection: "row", gap: 8, marginVertical: 8 }}>
          <Stat label={m.lowest} value={peso(summary.priceRange.min)} />
          <Stat label={m.middle} value={peso(summary.priceRange.median)} color={colors.good} />
          <Stat label={m.highest} value={peso(summary.priceRange.max)} />
        </View>
      ) : null}
      {!keep ? <Field label={m.adjustLabel} value={newIdea} onChangeText={setNewIdea} /> : null}
      <ErrorNote error={error} onRetry={retry} />
    </>
  );
}

export const validateSteps: StepDef[] = [
  { id: "script", Component: Script },
  { id: "interviews", Component: Interviews },
  { id: "results", Component: Results },
];
