import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SessionProvider } from "../lib/session";
import { colors } from "../lib/theme";

export default function RootLayout() {
  return (
    <SessionProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerShadowVisible: false,
          headerTintColor: colors.oliveDark,
          headerTitleStyle: { fontWeight: "700" },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="consent" options={{ title: "", presentation: "modal" }} />
        <Stack.Screen name="entry" options={{ title: "" }} />
        <Stack.Screen name="map" options={{ title: "Mileto", headerBackVisible: false }} />
        <Stack.Screen name="garden" options={{ title: "" }} />
        <Stack.Screen name="phase/[id]" options={{ title: "" }} />
      </Stack>
    </SessionProvider>
  );
}
