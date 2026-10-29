import { type ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from "react-native";
import { t } from "../i18n/en";
import { colors, font, radius, type } from "../lib/theme";

type Tone = "primary" | "blue" | "ghost" | "good" | "retry" | "gold";

const TONES: Record<Tone, { bg: string; edge: string; text: string }> = {
  primary: { bg: colors.primary, edge: colors.primaryEdge, text: colors.onPrimary },
  blue: { bg: colors.blue, edge: colors.blueEdge, text: "#0B1E28" },
  ghost: { bg: colors.bg, edge: colors.line, text: colors.blue },
  good: { bg: colors.good, edge: colors.primaryEdge, text: colors.onPrimary },
  retry: { bg: colors.retry, edge: "#C0702C", text: "#2A1606" },
  gold: { bg: colors.gold, edge: colors.goldEdge, text: "#2A1E00" },
};

/** A chunky, pressable 3D button: the thick bottom edge sinks when pressed. */
export function Button({
  label,
  onPress,
  tone = "primary",
  disabled,
  busy,
  style,
}: {
  label: string;
  onPress: () => void;
  tone?: Tone;
  disabled?: boolean;
  busy?: boolean;
  style?: ViewStyle;
}) {
  const c = disabled ? { bg: colors.surfaceHi, edge: colors.surfaceHi, text: colors.faint } : TONES[tone];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: c.bg, borderColor: tone === "ghost" ? colors.line : c.bg, borderBottomColor: c.edge },
        tone === "ghost" && { borderWidth: 2, borderBottomWidth: 4 },
        pressed && !disabled && { borderBottomWidth: tone === "ghost" ? 2 : 0, marginTop: 4 },
        style,
      ]}
    >
      {busy ? <ActivityIndicator color={c.text} /> : <Text style={[type.button, { color: c.text }]}>{label}</Text>}
    </Pressable>
  );
}

/** Answer card like a quiz option, with an optional number badge or icon. */
export function Option({
  label,
  sub,
  selected,
  onPress,
  badge,
  icon,
  state,
  center,
}: {
  label: string;
  sub?: string;
  selected?: boolean;
  onPress: () => void;
  badge?: string | number;
  icon?: ReactNode;
  state?: "good" | "retry" | "done";
  center?: boolean;
}) {
  const border = state === "good" ? colors.good : state === "retry" ? colors.retry : selected ? colors.blue : colors.line;
  return (
    <Pressable
      onPress={onPress}
      disabled={state === "done"}
      accessibilityRole="radio"
      accessibilityState={{ selected: !!selected }}
      style={({ pressed }) => [
        styles.option,
        { borderColor: border, borderBottomColor: border, backgroundColor: selected ? colors.blueSoft : "transparent" },
        state === "done" && { opacity: 0.35 },
        pressed && { borderBottomWidth: 2, marginTop: 2 },
      ]}
    >
      {badge !== undefined ? (
        <View style={[styles.badge, selected && { borderColor: colors.blue }]}>
          <Text style={[styles.badgeText, selected && { color: colors.blue }]}>{badge}</Text>
        </View>
      ) : null}
      {icon}
      <View style={{ flex: 1 }}>
        <Text style={[type.body, { fontFamily: font.bold }, center && { textAlign: "center" }, selected && { color: colors.blue }]}>{label}</Text>
        {sub ? <Text style={[type.small, center && { textAlign: "center" }]}>{sub}</Text> : null}
      </View>
    </Pressable>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={[type.title, { marginBottom: 16 }]}>{children}</Text>;
}

export function Tag({ children, color = colors.purple }: { children: ReactNode; color?: string }) {
  return <Text style={[type.tag, { color, marginBottom: 8 }]}>{children}</Text>;
}

export function Body({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return <Text style={muted ? type.small : type.body}>{children}</Text>;
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Field(props: TextInputProps & { label?: string; hint?: string }) {
  const { label, hint, style, ...rest } = props;
  return (
    <View style={{ marginBottom: 14 }}>
      {label ? <Text style={[type.small, { marginBottom: 6, color: colors.ink, fontFamily: font.bold }]}>{label}</Text> : null}
      <TextInput placeholderTextColor={colors.faint} style={[styles.input, style]} {...rest} />
      {hint ? <Text style={[type.small, { marginTop: 6 }]}>{hint}</Text> : null}
    </View>
  );
}

export function NumberField({ label, value, onChange, hint, big }: { label?: string; value: number | null; onChange: (n: number | null) => void; hint?: string; big?: boolean }) {
  return (
    <Field
      label={label}
      hint={hint}
      keyboardType="number-pad"
      style={big ? { fontSize: 34, fontFamily: font.black, textAlign: "center", paddingVertical: 18 } : undefined}
      value={value === null ? "" : String(value)}
      onChangeText={(s) => {
        const digits = s.replace(/[^\d]/g, "");
        onChange(digits ? Number(digits) : null);
      }}
    />
  );
}

export function Stepper({ value, onChange, min = 0 }: { value: number; onChange: (n: number) => void; min?: number }) {
  return (
    <View style={styles.stepper}>
      <Pressable style={styles.stepBtn} onPress={() => onChange(Math.max(min, value - 1))} accessibilityLabel="Less">
        <Text style={styles.stepText}>−</Text>
      </Pressable>
      <Text style={[type.title, { minWidth: 64, textAlign: "center", fontSize: 32, fontFamily: font.black }]}>{value}</Text>
      <Pressable style={styles.stepBtn} onPress={() => onChange(value + 1)} accessibilityLabel="More">
        <Text style={styles.stepText}>+</Text>
      </Pressable>
    </View>
  );
}

export function Stat({ label, value, color = colors.ink }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[type.tag, { color: colors.muted, fontSize: 12 }]}>{label}</Text>
      <Text style={[type.h2, { color, fontFamily: font.black, fontSize: 22 }]}>{value}</Text>
    </View>
  );
}

export function ErrorNote({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  if (!error) return null;
  return (
    <View style={{ marginVertical: 8 }}>
      <Text style={[type.small, { color: colors.retry, marginBottom: onRetry ? 10 : 0 }]}>{t.common.offline}</Text>
      {onRetry ? <Button label={t.common.tryAgain} tone="ghost" onPress={onRetry} /> : null}
    </View>
  );
}

export const Gap = ({ h = 12 }: { h?: number }) => <View style={{ height: h }} />;

const styles = StyleSheet.create({
  button: { minHeight: 52, borderRadius: radius, borderBottomWidth: 4, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, marginTop: 0 },
  option: { flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 2, borderBottomWidth: 4, borderRadius: radius, paddingVertical: 16, paddingHorizontal: 16, marginBottom: 12 },
  badge: { width: 30, height: 30, borderRadius: 8, borderWidth: 2, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  badgeText: { fontFamily: font.bold, color: colors.muted, fontSize: 14 },
  card: { borderRadius: radius, borderWidth: 2, borderColor: colors.line, padding: 16, marginBottom: 12 },
  input: { backgroundColor: colors.surface, borderRadius: 14, borderWidth: 2, borderColor: colors.line, paddingHorizontal: 16, paddingVertical: 14, fontSize: 18, fontFamily: font.regular, color: colors.ink },
  stepper: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 18, marginVertical: 10 },
  stepBtn: { width: 56, height: 56, borderRadius: 16, borderWidth: 2, borderBottomWidth: 4, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  stepText: { fontSize: 28, color: colors.blue, fontFamily: font.black },
  stat: { flex: 1, borderRadius: 14, borderWidth: 2, borderColor: colors.line, padding: 12 },
});
