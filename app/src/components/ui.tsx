import { type ReactNode } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { t } from "../i18n/en";
import { colors, radius, type } from "../lib/theme";

export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.safe} edges={["bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={[type.title, { marginBottom: 12 }]}>{children}</Text>;
}

export function H2({ children }: { children: ReactNode }) {
  return <Text style={[type.h2, { marginTop: 16, marginBottom: 8 }]}>{children}</Text>;
}

export function Body({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return <Text style={muted ? type.small : type.body}>{children}</Text>;
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
  busy,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  busy?: boolean;
}) {
  const primary = variant === "primary";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        primary ? styles.primary : styles.secondary,
        (disabled || busy) && { opacity: 0.45 },
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
    >
      {busy ? <ActivityIndicator color={primary ? "#fff" : colors.olive} /> : <Text style={[styles.buttonText, !primary && { color: colors.oliveDark }]}>{label}</Text>}
    </Pressable>
  );
}

export function Choice({ label, selected, onPress, sub }: { label: string; selected: boolean; onPress: () => void; sub?: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected }} style={[styles.choice, selected && styles.choiceOn]}>
      <Text style={[type.body, selected && { fontWeight: "700" }]}>{label}</Text>
      {sub ? <Text style={type.small}>{sub}</Text> : null}
    </Pressable>
  );
}

export function Field(props: TextInputProps & { label: string; hint?: string }) {
  const { label, hint, style, ...rest } = props;
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={[type.small, { marginBottom: 4, color: colors.ink, fontWeight: "600" }]}>{label}</Text>
      <TextInput placeholderTextColor={colors.muted} style={[styles.input, style]} {...rest} />
      {hint ? <Text style={[type.small, { marginTop: 4 }]}>{hint}</Text> : null}
    </View>
  );
}

export function NumberField({ label, value, onChange, hint }: { label: string; value: number | null; onChange: (n: number | null) => void; hint?: string }) {
  return (
    <Field
      label={label}
      hint={hint}
      keyboardType="number-pad"
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
      <Text style={[type.title, { minWidth: 60, textAlign: "center" }]}>{value}</Text>
      <Pressable style={styles.stepBtn} onPress={() => onChange(value + 1)} accessibilityLabel="More">
        <Text style={styles.stepText}>+</Text>
      </Pressable>
    </View>
  );
}

export function Stat({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  return (
    <View style={styles.stat}>
      <Text style={type.small}>{label}</Text>
      <Text style={[type.h2, tone === "good" && { color: colors.olive }, tone === "bad" && { color: colors.warn }]}>{value}</Text>
    </View>
  );
}

export function ErrorNote({ error }: { error: unknown }) {
  if (!error) return null;
  return <Text style={[type.small, { color: colors.warn, marginVertical: 8 }]}>{t.common.offline}</Text>;
}

export const Gap = ({ h = 12 }: { h?: number }) => <View style={{ height: h }} />;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, paddingBottom: 48, maxWidth: 640, width: "100%", alignSelf: "center" },
  card: { backgroundColor: colors.card, borderRadius: radius, borderWidth: 1, borderColor: colors.line, padding: 16, marginBottom: 12 },
  button: { minHeight: 56, borderRadius: radius, alignItems: "center", justifyContent: "center", paddingHorizontal: 20, marginVertical: 6 },
  primary: { backgroundColor: colors.olive },
  secondary: { backgroundColor: colors.card, borderWidth: 2, borderColor: colors.olive },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  choice: { backgroundColor: colors.card, borderRadius: radius, borderWidth: 2, borderColor: colors.line, padding: 16, marginBottom: 10 },
  choiceOn: { borderColor: colors.olive, backgroundColor: "#F1F6E6" },
  input: { backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14, paddingVertical: 12, fontSize: 18, color: colors.ink },
  stepper: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16, marginVertical: 8 },
  stepBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.olive, alignItems: "center", justifyContent: "center" },
  stepText: { fontSize: 28, color: colors.olive, fontWeight: "700" },
  stat: { flex: 1, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.line, padding: 12 },
});
