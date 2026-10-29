// Phase 4 (F2, RF-08): five mini-interviews by voice. The model tags each one; code counts and finds the price range.
// This phase can never be skipped: first we look, then we decide.

import { useState } from "react";
import { View } from "react-native";
import { Mascot } from "../components/Mascot";
import { Body, Button, Card, ErrorNote, Field, H2, Stat } from "../components/ui";
import { VoiceInput } from "../components/VoiceInput";
import { fill, t } from "../i18n/en";
import { post, request } from "../lib/api";
import { useSession } from "../lib/session";
import { peso } from "../lib/theme";
import { useCall } from "../lib/useCall";
import type { MissionProps } from "./types";

interface Summary {
  interviews: number;
  interested: number;
  notInterested: number;
  unclear: number;
  interestRate: number;
  priceRange: { min: number; max: number; median: number } | null;
  decision: "keep_going" | "adjust_idea" | "need_more_interviews";
}

export function Validate({ business, complete }: MissionProps) {
  const { refresh } = useSession();
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [newIdea, setNewIdea] = useState(business.idea ?? "");
  const { busy, error, run } = useCall();
  const m = t.missions.validate;
  const idea = business.idea ?? "my product";

  async function summarize() {
    const r = await run(() => post<{ summary: Summary }>("/api/ai/interviews", { idea, transcripts }));
    if (r) setSummary(r.summary);
  }

  async function adjust() {
    await run(async () => {
      await request(`/api/businesses/${business.id}`, "PATCH", { idea: newIdea.trim() });
      await post(`/api/businesses/${business.id}/learnings`, { kind: "stumble", text: `Few people wanted "${idea}"`, hint: `Trying "${newIdea.trim()}" instead` });
      await refresh();
    });
    setTranscripts([]);
    setSummary(null);
  }

  const say = !summary ? m.say : summary.decision === "keep_going" ? m.keepGoing : m.adjust;

  return (
    <>
      <Mascot text={say} mood={summary ? (summary.decision === "keep_going" ? "happy" : "stumble") : "curious"} />
      <Card>
        {m.script.map((line, i) => (
          <Body key={line}>{i + 1}. {fill(line, { idea })}</Body>
        ))}
      </Card>

      {!summary ? (
        <>
          {transcripts.map((tr, i) => (
            <Body key={i} muted>🎙️ {i + 1}: “{tr}”</Body>
          ))}
          {transcripts.length < 5 ? (
            <VoiceInput buttonLabel={fill(m.record, { n: transcripts.length + 1 })} onText={(tx) => setTranscripts([...transcripts, tx])} />
          ) : null}
          <Body muted>{m.minimum}</Body>
          <Button label={m.summarize} onPress={summarize} disabled={transcripts.length < 3} busy={busy} />
        </>
      ) : (
        <>
          <H2>🔍 {summary.interviews} interviews</H2>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
            <Stat label="Would buy" value={`👍 ${summary.interested}`} tone="good" />
            <Stat label="Would not" value={`👎 ${summary.notInterested}`} />
            <Stat label="Not sure" value={`🤷 ${summary.unclear}`} />
          </View>
          {summary.priceRange ? (
            <Body>
              They would pay {peso(summary.priceRange.min)} to {peso(summary.priceRange.max)} (middle: {peso(summary.priceRange.median)}).
            </Body>
          ) : null}
          {summary.decision === "keep_going" ? (
            <Button label={t.common.done} busy={busy} onPress={() => run(() => complete({ ...summary, transcripts: transcripts.length }))} />
          ) : (
            <>
              <Field label="Adjust your idea" value={newIdea} onChangeText={setNewIdea} />
              <Button label="Try the new idea" onPress={adjust} disabled={newIdea.trim().length < 2} busy={busy} />
              <Button label={t.common.retry} variant="secondary" onPress={() => { setTranscripts([]); setSummary(null); }} />
            </>
          )}
        </>
      )}
      <ErrorNote error={error} />
    </>
  );
}
