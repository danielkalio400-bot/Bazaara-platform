import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { router, type Href, useLocalSearchParams } from "expo-router";
import { Screen, colors } from "@bazaara/mobile-ui";
import {
  BAZAARA_FOOD_REDIRECT_URI,
  completeBazIdCallback,
} from "../../src/lib/auth";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function AuthCallback() {
  const params = useLocalSearchParams<{
    code?: string | string[];
    state?: string | string[];
    error?: string | string[];
    error_description?: string | string[];
  }>();
  const [message, setMessage] = useState("Completing secure BazID sign-in...");
  const [failed, setFailed] = useState(false);

  const callbackUrl = useMemo(() => {
    const url = new URL(BAZAARA_FOOD_REDIRECT_URI);
    const code = first(params.code);
    const state = first(params.state);
    const error = first(params.error);
    const errorDescription = first(params.error_description);
    if (code) url.searchParams.set("code", code);
    if (state) url.searchParams.set("state", state);
    if (error) url.searchParams.set("error", error);
    if (errorDescription) url.searchParams.set("error_description", errorDescription);
    return url.toString();
  }, [params.code, params.error, params.error_description, params.state]);

  useEffect(() => {
    const code = first(params.code);
    const state = first(params.state);
    const callbackError = first(params.error);

    // Expo Router can mount the callback route before Android has populated all
    // query parameters. Do not consume or reject the persisted PKCE transaction
    // until either a complete code+state pair or an OAuth error is actually present.
    if (!callbackError && (!code || !state)) {
      setFailed(false);
      setMessage("Waiting for BazID callback...");
      return;
    }

    let active = true;

    void (async () => {
      try {
        const result = await completeBazIdCallback(callbackUrl);
        if (!active) return;
        if (!result.ok) {
          setFailed(true);
          setMessage("BazID sign-in did not complete. Please try again.");
          return;
        }

        setMessage("BazID connected. Returning to Food...");
        router.replace(result.returnTo as Href);
      } catch (cause) {
        if (!active) return;
        setFailed(true);
        setMessage(cause instanceof Error ? cause.message : "BazID sign-in failed");
      }
    })();

    return () => {
      active = false;
    };
  }, [callbackUrl, params.code, params.error, params.state]);

  return (
    <Screen>
      <View style={{ marginTop: 48, paddingHorizontal: 24, alignItems: "center", gap: 16 }}>
        {!failed ? <ActivityIndicator size="large" /> : null}
        <Text style={{ color: failed ? "#FCA5A5" : colors.muted, textAlign: "center", lineHeight: 22 }}>
          {message}
        </Text>
        {failed ? (
          <Text
            accessibilityRole="button"
            onPress={() => router.replace("/(tabs)/account")}
            style={{ color: "#8B7CFF", fontWeight: "700", paddingVertical: 12 }}
          >
            Return to Account
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}
