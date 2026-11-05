// Live waveform from the real mic level while the kid talks.

import { View } from "react-native";
import { colors } from "../lib/theme";

const BARS = 28;

export function Waveform({ levels, color = colors.blue, height = 56 }: { levels: number[]; color?: string; height?: number }) {
  const bars = [...Array(Math.max(0, BARS - levels.length)).fill(0.05), ...levels.slice(-BARS)];
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 3, height }} accessibilityElementsHidden>
      {bars.map((v, i) => (
        <View key={i} style={{ width: 5, borderRadius: 3, height: Math.max(4, v * height), backgroundColor: color, opacity: 0.35 + v * 0.65 }} />
      ))}
    </View>
  );
}
