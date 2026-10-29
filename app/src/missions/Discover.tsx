// Phase 1: say what you know how to do and what you have; Mileto proposes three seed ideas.

import { useState } from "react";
import { Mascot } from "../components/Mascot";
import { Body, Button, Choice, ErrorNote, H2 } from "../components/ui";
import { VoiceInput } from "../components/VoiceInput";
import { t } from "../i18n/en";
import { post, request } from "../lib/api";
import { useCall } from "../lib/useCall";
import type { MissionProps } from "./types";

interface Idea {
  title: string;
  why: string;
}

export function Discover({ business, complete }: MissionProps) {
  const [said, setSaid] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const { busy, error, run } = useCall();

  async function onSaid(text: string) {
    setSaid(text);
    const r = await run(() => post<{ ideas: Idea[]; blocked?: string }>("/api/ai/ideas", { kidSaid: text }));
    if (!r) return;
    setBlocked(r.blocked ?? null);
    setIdeas(r.ideas);
  }

  async function finish() {
    if (picked === null) return;
    const idea = ideas[picked];
    await run(async () => {
      await request(`/api/businesses/${business.id}`, "PATCH", { idea: idea.title });
      await complete({ said, idea: idea.title, why: idea.why });
    });
  }

  return (
    <>
      <Mascot text={blocked ?? t.missions.discover.say} mood={blocked ? "stumble" : "curious"} />
      <VoiceInput onText={onSaid} placeholder="I like cooking, my aunt has an orange tree…" />
      {said ? <Body muted>“{said}”</Body> : null}
      {busy && !ideas.length ? <Body muted>{t.common.loading}</Body> : null}
      {ideas.length ? <H2>{t.missions.discover.pick}</H2> : null}
      {ideas.map((idea, i) => (
        <Choice key={idea.title} label={`🌱 ${idea.title}`} sub={idea.why} selected={picked === i} onPress={() => setPicked(i)} />
      ))}
      <ErrorNote error={error} />
      {ideas.length ? <Button label={t.common.done} onPress={finish} disabled={picked === null} busy={busy} /> : null}
    </>
  );
}
