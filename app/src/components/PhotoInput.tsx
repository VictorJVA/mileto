// Takes a photo for the server to read (prices, counts, coins). Photos are never stored (privacy rules).

import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { t } from "../i18n/en";
import { upload } from "../lib/api";
import { useSession } from "../lib/session";
import { colors, type } from "../lib/theme";
import { errorMessage } from "./ui";

const MAX_SIDE = 1600;

/**
 * Re-renders the photo upright (phone photos store their rotation as metadata, which vision models
 * may ignore) and at most 1600 px wide, so uploads are fast and SAM's boxes line up with what the
 * kid sees. Falls back to the original photo if anything fails.
 */
async function normalize(asset: ImagePicker.ImagePickerAsset): Promise<string> {
  if (Platform.OS === "web") return asset.uri;
  try {
    const context = ImageManipulator.manipulate(asset.uri);
    if ((asset.width ?? 0) > MAX_SIDE) context.resize({ width: MAX_SIDE, height: null });
    const image = await context.renderAsync();
    const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
    return saved.uri;
  } catch {
    return asset.uri;
  }
}

export function PhotoInput<T>({
  label,
  endpoint,
  fields = {},
  onResult,
  preview = true,
}: {
  /** False when the screen shows the photo itself (e.g. with SAM's masks on top). */
  preview?: boolean;
  label?: string;
  endpoint: string;
  fields?: Record<string, string>;
  /** Receives the server's result and the local photo (it never leaves the phone after the upload). */
  onResult: (result: T, uri: string) => void;
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
    setBusy(true);
    try {
      const photo = await normalize(asset);
      setUri(photo);
      onResult(await upload<T>(endpoint, "image", { uri: photo, name: "photo.jpg", type: "image/jpeg" }, fields), photo);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  if (!student?.adultConsent) return <Text style={[type.small, { marginVertical: 8 }]}>{t.photo.needsAdult}</Text>;

  return (
    <View style={{ marginVertical: 8 }}>
      <Pressable onPress={take} disabled={busy} style={({ pressed }) => [styles.frame, uri && !preview && { height: 64 }, pressed && { borderBottomWidth: 2, marginTop: 2 }]} accessibilityRole="button">
        {uri && preview ? <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
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
