import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { publicApi } from "./api";
import { getNativeDeviceId } from "./auth";

let configured = false;

function projectId() {
  return Constants.easConfig?.projectId ??
    (Constants.expoConfig?.extra?.eas as { projectId?: string } | undefined)?.projectId;
}

export function configureForegroundNotifications() {
  if (configured) return;
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function registerPushNotifications() {
  if (Platform.OS !== "android" && Platform.OS !== "ios") return { registered: false as const, reason: "unsupported-platform" };

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("orders", {
      name: "Orders and payments",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 150, 250],
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  const permission = existing.granted ? existing : await Notifications.requestPermissionsAsync();
  if (!permission.granted) return { registered: false as const, reason: "permission-denied" };

  const easProjectId = projectId();
  if (!easProjectId) return { registered: false as const, reason: "missing-eas-project-id" };

  const token = await Notifications.getExpoPushTokenAsync({ projectId: easProjectId });
  const deviceId = await getNativeDeviceId();
  const result = await publicApi.post<{ token: { id: string; enabled: boolean } }>("/v1/notifications/push-tokens", {
    token: token.data,
    platform: Platform.OS,
    deviceId,
  });
  return { registered: true as const, id: result.token.id };
}

export function notificationHref(data: Record<string, unknown> | undefined) {
  const resourceType = typeof data?.resourceType === "string" ? data.resourceType : "";
  const resourceId = typeof data?.resourceId === "string" ? data.resourceId : "";
  if (resourceType === "ShoppingOrder" && resourceId) return `/order/${encodeURIComponent(resourceId)}` as const;
  if (resourceType === "SupportCase" && resourceId) return `/support?case=${encodeURIComponent(resourceId)}` as const;
  return "/notifications" as const;
}

export function installNotificationResponseListener() {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as Record<string, unknown> | undefined;
    router.push(notificationHref(data));
  });
}
