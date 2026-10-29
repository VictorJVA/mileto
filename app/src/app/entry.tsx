// RF-03: three ways in. All of them lead to the same 12-phase path; validation is never skipped.

import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Mascot } from "../components/Mascot";
import { ErrorNote, Field, Option } from "../components/ui";
import { t } from "../i18n/en";
import { post, type Business, type EntryPoint } from "../lib/api";
import { useSession } from "../lib/session";
import { colors } from "../lib/theme";
import { useCall } from "../lib/useCall";
import { Lesson, useFooter, type StepDef } from "../lesson/engine";

const ENTRIES: EntryPoint[] = ["no_idea", "has_idea", "already_selling"];

/** Signal-strength bars: how far along the kid already is. */
function Bars({ level }: { level: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 3, width: 34 }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ width: 8, height: 10 + i * 7, borderRadius: 3, backgroundColor: i <= level ? colors.blue : colors.surfaceHi }} />
      ))}
    </View>
  );
}

function Choose() {
  const { student, setBusiness } = useSession();
  const [entry, setEntry] = useState<EntryPoint | null>(null);
  const [idea, setIdea] = useState("");
  const { busy, error, run } = useCall();
  const needsIdea = entry === "has_idea" || entry === "already_selling";

  useFooter({ label: t.common.continue, disabled: !entry || (needsIdea && idea.trim().length < 2), busy }, async () => {
    if (!student || !entry) return;
    const b = await run(() => post<Business>("/api/businesses", { studentId: student.id, entry, idea: needsIdea ? idea.trim() : null }));
    if (!b) return;
    await setBusiness(b);
    router.replace("/map");
  });

  return (
    <>
      <Mascot text={t.entry.title} />
      <Text style={{ height: 4 }} />
      {ENTRIES.map((e, i) => (
        <Option key={e} label={t.entry[e]} selected={entry === e} onPress={() => setEntry(e)} icon={<Bars level={i} />} />
      ))}
      {needsIdea ? <Field label={t.entry.ideaTitle} value={idea} onChangeText={setIdea} maxLength={200} placeholder={t.entry.ideaPlaceholder} autoFocus /> : null}
      <ErrorNote error={error} />
    </>
  );
}

const STEPS: StepDef[] = [{ id: "entry", Component: Choose }];

export default function Entry() {
  return <Lesson steps={STEPS} onClose={() => router.replace("/")} onDone={() => router.replace("/map")} />;
}
