import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useSession } from "../lib/session";
import { colors } from "../lib/theme";

export default function Index() {
  const { ready, student, business } = useSession();
  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!student) return <Redirect href="/welcome" />;
  if (!business) return <Redirect href="/entry" />;
  return <Redirect href="/map" />;
}
