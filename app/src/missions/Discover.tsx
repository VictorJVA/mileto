// Phase 1: say what you know how to do and what you have; Mileto proposes three seed ideas.

import { useState } from "react";
import { Mascot } from "../components/Mascot";
import { Body, ErrorNote, Option } from "../components/ui";
import { VoiceInput } from "../components/VoiceInput";
import { t } from "../i18n/en";
import { post, request } from "../lib/api";
import { useCall } from "../lib/useCall";
import { useFooter, useLesson, type StepDef } from "../lesson/engine";
import { MissionHead, useBusiness } from "./kit";

interface Idea {
  title: string;
  why: string;
}

function Talk() {
  const lesson = useLesson();
  const [said, setSaid] = useState("");
  const [blocked, setBlocked] = useState<string | null>(null);
  const { busy, error, run } = useCall();
  const m = t.missions.discover;

  useFooter({ label: t.common.continue, disabled: said.length < 3, busy }, async () => {
    const r = await run(() => post<{ ideas: Idea[]; blocked?: string }>("/api/ai/ideas", { kidSaid: said }));
    if (!r) return;
    if (r.blocked) return setBlocked(r.blocked);
    lesson.set({ said, ideas: r.ideas });
    lesson.next();
  });

  return (
    <>
      <MissionHead title={m.title} />
      <Mascot text={blocked ?? m.say} mood={blocked ? "stumble" : "curious"} size={70} />
      <VoiceInput onText={setSaid} placeholder={m.placeholder} />
      {said ? <Body muted>“{said}”</Body> : null}
      <ErrorNote error={error} />
    </>
  );
}

function Pick() {
  const lesson = useLesson();
  const business = useBusiness();
  const ideas = (lesson.state.ideas as Idea[]) ?? [];
  const [picked, setPicked] = useState<number | null>(null);
  const { busy, error, run } = useCall();

  useFooter({ label: t.common.check, disabled: picked === null, busy }, async () => {
    if (picked === null) return;
    const idea = ideas[picked];
    const ok = await run(() => request(`/api/businesses/${business.id}`, "PATCH", { idea: idea.title }));
    if (ok === undefined) return;
    lesson.set({ result: { said: lesson.state.said, idea: idea.title, why: idea.why } });
    lesson.check(true, { title: t.missions.discover.planted, detail: idea.title });
  });

  return (
    <>
      <MissionHead title={t.missions.discover.pick} say={t.missions.discover.pickSay} />
      {ideas.map((idea, i) => (
        <Option key={idea.title} badge={i + 1} label={`🌱 ${idea.title}`} sub={idea.why} selected={picked === i} onPress={() => setPicked(i)} />
      ))}
      <ErrorNote error={error} />
    </>
  );
}

export const discoverSteps: StepDef[] = [
  { id: "talk", Component: Talk },
  { id: "pick", Component: Pick },
];
