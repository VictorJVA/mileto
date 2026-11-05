// SAM 3.1's detections drawn over the kid's photo, one by one, with the count climbing. The photo
// stays on the phone; the server only returned the box positions.

import { useEffect, useState } from "react";
import { Image, LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import { colors, font } from "../lib/theme";

export interface Box {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const COLORS = ["#86C440", "#4CB5EA", "#FFC93D", "#F29B4B", "#B98CF2"];

export function MaskCount({ uri, boxes, width, height, onDone }: { uri: string; boxes: Box[]; width: number | null; height: number | null; onDone: (count: number) => void }) {
  const [shown, setShown] = useState(0);
  const [w, setW] = useState(0);
  const ratio = width && height ? height / width : 0.75;

  useEffect(() => {
    setShown(0);
    if (!boxes.length) return onDone(0);
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      setShown(i);
      if (i >= boxes.length) {
        clearInterval(timer);
        onDone(boxes.length);
      }
    }, Math.max(60, Math.min(160, 2400 / boxes.length)));
    return () => clearInterval(timer);
    // A new photo restarts the count.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uri, boxes.length]);

  const scale = width ? w / width : 1;
  return (
    <View onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)} style={[styles.frame, { height: w * ratio || 240 }]}>
      <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="stretch" />
      {boxes.slice(0, shown).map((b, i) => (
        <View
          key={i}
          style={[
            styles.mask,
            { left: b.x1 * scale, top: b.y1 * scale, width: (b.x2 - b.x1) * scale, height: (b.y2 - b.y1) * scale, borderColor: COLORS[i % COLORS.length], backgroundColor: `${COLORS[i % COLORS.length]}55` },
          ]}
        >
          <Text style={styles.num}>{i + 1}</Text>
        </View>
      ))}
      <View style={styles.counter}>
        <Text style={{ fontFamily: font.black, fontSize: 28, color: colors.ink }}>{shown}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: "100%", borderRadius: 18, overflow: "hidden", marginVertical: 8, backgroundColor: colors.surface },
  mask: { position: "absolute", borderWidth: 3, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  num: { fontFamily: font.black, fontSize: 12, color: "#fff", textShadowColor: "#000", textShadowRadius: 3 },
  counter: { position: "absolute", top: 10, right: 10, minWidth: 56, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16, backgroundColor: "rgba(19,29,27,0.85)", borderWidth: 2, borderColor: colors.primary, alignItems: "center" },
});
