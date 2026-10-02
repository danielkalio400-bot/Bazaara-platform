import { Tabs } from "expo-router";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { groceryPalette } from "@/ui/theme";

function Icon({ value, color }: { value: string; color: string }) {
  return (
    <View style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center", borderRadius: 9 }}>
      <Text style={{ color, fontSize: 18, fontWeight: "900" }}>{value}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          height: 62 + Math.max(insets.bottom, 6),
          paddingTop: 5,
          paddingBottom: Math.max(insets.bottom, 6),
          backgroundColor: "#0F110F",
          borderTopColor: groceryPalette.line,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: groceryPalette.success,
        tabBarInactiveTintColor: groceryPalette.muted2,
        tabBarLabelStyle: { fontSize: 9, fontWeight: "800" },
        sceneStyle: { backgroundColor: groceryPalette.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color }) => <Icon color={String(color)} value="⌂" /> }} />
      <Tabs.Screen name="search" options={{ title: "Search", tabBarIcon: ({ color }) => <Icon color={String(color)} value="⌕" /> }} />
      <Tabs.Screen name="lists" options={{ title: "Lists", tabBarIcon: ({ color }) => <Icon color={String(color)} value="☷" /> }} />
      <Tabs.Screen name="orders" options={{ title: "Orders", tabBarIcon: ({ color }) => <Icon color={String(color)} value="▤" /> }} />
      <Tabs.Screen name="account" options={{ title: "Account", tabBarIcon: ({ color }) => <Icon color={String(color)} value="◎" /> }} />
    </Tabs>
  );
}
