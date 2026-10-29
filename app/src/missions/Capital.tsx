// Phase 6: decide the starting money and set up two jars. No loans by default.

import { useState } from "react";
import { View } from "react-native";
import { Mascot } from "../components/Mascot";
import { Button, ErrorNote, Field, NumberField, Stat } from "../components/ui";
import { t } from "../i18n/en";
import { peso } from "../lib/theme";
import { useCall } from "../lib/useCall";
import type { MissionProps } from "./types";

export function Capital({ business, complete }: MissionProps) {
  const [amount, setAmount] = useState<number | null>(null);
  const [source, setSource] = useState("");
  const { busy, error, run } = useCall();
  const m = t.missions.capital;

  return (
    <>
      <Mascot text={m.say} />
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
        <Stat label="🫙 Business jar" value={peso(business.jars.business + (amount ?? 0))} tone="good" />
        <Stat label="🫙 My jar" value={peso(business.jars.personal)} />
      </View>
      <NumberField label={m.start} value={amount} onChange={setAmount} />
      <Field label={m.fromWhere} value={source} onChangeText={setSource} maxLength={120} />
      <ErrorNote error={error} />
      <Button label={t.common.done} disabled={!amount || !source.trim()} busy={busy} onPress={() => run(() => complete({ startingMoney: amount, source: source.trim(), debt: 0 }))} />
    </>
  );
}
