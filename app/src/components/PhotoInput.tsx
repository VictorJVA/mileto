// Takes a photo for the server to read (prices, counts, coins). Photos are never stored (privacy rules).

import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { t } from "../i18n/en";
import { ApiError, upload } from "../lib/api";
import { useSession } from "../lib/session";
import { colors, type } from "../lib/theme";

export function PhotoInput<T>({
  label,
  endpoint,
  fields = {},
  onResult,
}: {
  label?: string;
  endpoint: string;
  fields?: Record<string, string>;
  onResult: (result: T) => void;
}) {
  const { student } = useSession();
  const [uri, setUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function take() {
    setError(null);
    // The camera is unavailable on web and in the iOS simulator; the photo library is the fallback.
    const perm = Platform.OS === "web" ? { granted: false } : await ImagePicker.requestCameraPermissionsAsync();
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 0.6 };
    const result = perm.granted ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled) return;
    const asset = result.assets[0];
    setUri(asset.uri);
    setBusy(true);
    try {
      onResult(await upload<T>(endpoint, "image", { uri: asset.uri, name: "photo.jpg", type: asset.mimeType ?? "image/jpeg" }, fields));
    } catch (e) {
      setError(e instanceof ApiError && e.code === "adult_consent_required" ? t.photo.needsAdult : t.common.offline);
    } finally {
      setBusy(false);
    }
  }

  if (!student?.adultConsent) return <Text style={[type.small, { marginVertical: 8 }]}>{t.photo.needsAdult}</Text>;

  return (
    <View style={{ marginVertical: 8 }}>
      <Pressable onPress={take} disabled={busy} style={({ pressed }) => [styles.frame, pressed && { borderBottomWidth: 2, marginTop: 2 }]} accessibilityRole="button">
        {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
        <View style={[styles.label, uri ? styles.labelOnPhoto : null]}>
          <Text style={{ fontSize: uri ? 20 : 44 }}>📷</Text>
          <Text style={[type.tag, { color: colors.blue }]}>{busy ? t.common.loading : uri ? t.photo.retake : label ?? t.photo.take}</Text>
        </View>
      </Pressable>
      {error ? <Text style={[type.small, { color: colors.retry }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { height: 180, borderRadius: 18, borderWidth: 2, borderBottomWidth: 4, borderStyle: "dashed", borderColor: colors.blueEdge, alignItems: "center", justifyContent: "center", overflow: "hidden", backgroundColor: colors.blueSoft },
  label: { alignItems: "center", gap: 6 },
  labelOnPhoto: { position: "absolute", bottom: 10, flexDirection: "row", backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
});
