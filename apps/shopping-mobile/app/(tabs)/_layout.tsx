import { StyleSheet, Text, View, type ColorValue } from "react-native";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@bazaara/mobile-ui";

function Glyph({ children, color, size = 21 }: { children: string; color: ColorValue; size?: number }) {
  return <Text maxFontSizeMultiplier={1.05} style={{ color, fontSize: size, lineHeight: size + 2, fontWeight: "800" }}>{children}</Text>;
}

function AiTabIcon({ focused }: { focused: boolean }) {
  return (
    <View style={[styles.aiMark, focused && styles.aiMarkFocused]}>
      <Text style={styles.aiB}>B</Text>
      <Text style={styles.aiSpark}>✦</Text>
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 6);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderStrong,
          borderTopWidth: 1,
          height: 64 + bottom,
          paddingTop: 6,
          paddingBottom: bottom,
        },
        tabBarItemStyle: { paddingTop: 1 },
        tabBarLabelStyle: { fontSize: 9, lineHeight: 11, fontWeight: "800" },
        tabBarActiveTintColor: colors.indigoBright,
        tabBarInactiveTintColor: colors.muted2,
        sceneStyle: { backgroundColor: colors.navy },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color }) => <Glyph color={color}>⌂</Glyph> }} />
      <Tabs.Screen name="explore" options={{ title: "Explore", tabBarIcon: ({ color }) => <Glyph color={color}>⌕</Glyph> }} />
      <Tabs.Screen name="go-ai" options={{ title: "GO AI", tabBarIcon: ({ focused }) => <AiTabIcon focused={focused} /> }} />
      <Tabs.Screen name="orders" options={{ title: "Orders", tabBarIcon: ({ color }) => <Glyph color={color}>▤</Glyph> }} />
      <Tabs.Screen name="account" options={{ title: "Account", tabBarIcon: ({ color }) => <Glyph color={color}>◎</Glyph> }} />
      <Tabs.Screen name="categories" options={{ href: null }} />
      <Tabs.Screen name="cart" options={{ href: null }} />
      <Tabs.Screen name="wishlist" options={{ href: null }} />
      <Tabs.Screen name="search" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  aiMark: {
    width: 38,
    height: 38,
    marginTop: -8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(139,128,255,.88)",
    backgroundColor: colors.indigo,
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 7,
  },
  aiMarkFocused: { transform: [{ scale: 1.06 }], borderColor: colors.white },
  aiB: { color: colors.white, fontSize: 18, lineHeight: 20, fontWeight: "900", fontStyle: "italic", letterSpacing: -1 },
  aiSpark: { position: "absolute", right: 6, top: 4, color: "#D9D5FF", fontSize: 7, lineHeight: 8, fontWeight: "900" },
});
