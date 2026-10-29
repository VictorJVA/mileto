// RF-03: three ways in. All of them lead to the same 12-phase path; validation is never skipped.

import { router } from "expo-router";
import { useState } from "react";
import { Mascot } from "../components/Mascot";
import { Button, Choice, ErrorNote, Field, Screen, Title } from "../components/ui";
import { t } from "../i18n/en";
import { post, type Business, type EntryPoint } from "../lib/api";
import { useSession } from "../lib/session";

const ENTRIES: EntryPoint[] = ["no_idea", "has_idea", "already_selling"];

export default function Entry() {
  const { student, setBusiness } = useSession();
  const [entry, setEntry] = useState<EntryPoint | null>(null);
  const [idea, setIdea] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const needsIdea = entry === "has_idea" || entry === "already_selling";

  async function go() {
    if (!student || !entry) return;
    setBusy(true);
    try {
      const b = await post<Business>("/api/businesses", { studentId: student.id, entry, idea: needsIdea ? idea.trim() : null });
      await setBusiness(b);
      router.replace("/map");
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Title>{t.entry.title}</Title>
      <Mascot text={t.entry.say} />
      {ENTRIES.map((e) => (
        <Choice key={e} label={t.entry[e]} selected={entry === e} onPress={() => setEntry(e)} />
      ))}
      {needsIdea ? <Field label={t.entry.ideaPrompt} value={idea} onChangeText={setIdea} maxLength={200} placeholder="Orange juice" /> : null}
      <ErrorNote error={error} />
      <Button label={t.common.next} onPress={go} disabled={!entry || (needsIdea && idea.trim().length < 2)} busy={busy} />
    </Screen>
  );
}
