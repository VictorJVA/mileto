import { Mascot, type Mood } from "../components/Mascot";
import { Tag, Title } from "../components/ui";
import { t } from "../i18n/en";
import type { Business } from "../lib/api";
import { useSession } from "../lib/session";
import { colors } from "../lib/theme";
import { useTutorStep } from "../lesson/engine";

/** Header for a real-world mission step: tag, title and Mileto's line. */
export function MissionHead({ title, say, mood }: { title: string; say?: string; mood?: Mood }) {
  // The tutor helps with real missions too, using what this screen asks.
  useTutorStep({ prompt: `Real mission step: ${title}. ${say ?? ""}` });
  return (
    <>
      <Tag color={colors.gold}>🌍 {t.lesson.mission}</Tag>
      <Title>{title}</Title>
      {say ? <Mascot text={say} mood={mood} size={70} /> : null}
    </>
  );
}

export function useBusiness(): Business {
  const { business } = useSession();
  if (!business) throw new Error("no business");
  return business;
}

/** Reads a stored result from an earlier phase, e.g. the price set in phase 8. */
export function earlier<T = Record<string, unknown>>(business: Business, key: string): Partial<T> {
  return (business.data[key] ?? {}) as Partial<T>;
}
