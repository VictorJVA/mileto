import { router, Stack, useLocalSearchParams } from "expo-router";
import type { ComponentType } from "react";
import { Body, Screen } from "../../components/ui";
import { t } from "../../i18n/en";
import { useSession } from "../../lib/session";
import { Capital } from "../../missions/Capital";
import { Cashbox } from "../../missions/Cashbox";
import { Choose } from "../../missions/Choose";
import { Decide } from "../../missions/Decide";
import { Discover } from "../../missions/Discover";
import { GoldenCircle } from "../../missions/GoldenCircle";
import { Brand } from "../../missions/Brand";
import { Price } from "../../missions/Price";
import { Sales } from "../../missions/Sales";
import { Shopping } from "../../missions/Shopping";
import { TestBatch } from "../../missions/TestBatch";
import { Validate } from "../../missions/Validate";
import type { MissionProps } from "../../missions/types";

const MISSIONS: Record<string, ComponentType<MissionProps>> = {
  discover: Discover,
  choose: Choose,
  golden_circle: GoldenCircle,
  validate: Validate,
  shopping: Shopping,
  capital: Capital,
  test_batch: TestBatch,
  price: Price,
  brand: Brand,
  sales: Sales,
  cashbox: Cashbox,
  decide: Decide,
};

export default function PhaseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { path, business, completePhase } = useSession();
  const phase = path?.phases.find((p) => String(p.id) === id);
  const Mission = phase ? MISSIONS[phase.key] : undefined;

  if (!phase || !business || !Mission) return <Screen><Body>{t.common.loading}</Body></Screen>;

  return (
    <Screen>
      <Stack.Screen options={{ title: `${phase.id}. ${phase.title}` }} />
      <Mission
        phase={phase}
        business={business}
        complete={async (result) => {
          await completePhase(phase.id, result);
          router.back();
        }}
      />
    </Screen>
  );
}
