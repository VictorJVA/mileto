import { Nunito_600SemiBold, Nunito_800ExtraBold, Nunito_900Black, useFonts } from "@expo-google-fonts/nunito";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SessionProvider } from "../lib/session";
import { colors } from "../lib/theme";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [loaded, failed] = useFonts({ Nunito_600SemiBold, Nunito_800ExtraBold, Nunito_900Black });

  useEffect(() => {
    if (loaded || failed) SplashScreen.hideAsync().catch(() => undefined);
  }, [loaded, failed]);

  if (!loaded && !failed) return null;

  return (
    <SessionProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: "slide_from_right" }}>
        <Stack.Screen name="consent" options={{ presentation: "modal" }} />
        <Stack.Screen name="phase/[id]" options={{ animation: "slide_from_bottom", gestureEnabled: false }} />
      </Stack>
    </SessionProvider>
  );
}
