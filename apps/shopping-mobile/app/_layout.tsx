import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { colors } from "@bazaara/mobile-ui";
import { CartStateProvider } from "@/state/cart";
import { configureForegroundNotifications, installNotificationResponseListener } from "@/lib/notifications";

export default function RootLayout() {
  useEffect(() => {
    configureForegroundNotifications();
    const subscription = installNotificationResponseListener();
    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <CartStateProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.navy },
            headerTintColor: colors.text,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.navy },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="product/[slug]" options={{ title: "Product" }} />
          <Stack.Screen name="seller/[slug]" options={{ title: "Seller" }} />
          <Stack.Screen name="bazai" options={{ title: "GO AI", headerShown: false }} />
          <Stack.Screen name="smart-shop" options={{ title: "Smart Find" }} />
          <Stack.Screen name="bulk" options={{ title: "Shopping" }} />
          <Stack.Screen name="deals" options={{ title: "Deal Radar" }} />
          <Stack.Screen name="grocery" options={{ title: "Grocery", headerShown: false }} />
          <Stack.Screen name="grocery-lists" options={{ title: "Grocery lists", headerShown: false }} />
          <Stack.Screen name="checkout" options={{ title: "Secure checkout", presentation: "card" }} />
          <Stack.Screen name="order/[id]" options={{ title: "Order" }} />
          <Stack.Screen name="auth/callback" options={{ title: "BazID", headerShown: false }} />
          <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
          <Stack.Screen name="support" options={{ title: "Help & support" }} />
        </Stack>
      </CartStateProvider>
    </SafeAreaProvider>
  );
}
