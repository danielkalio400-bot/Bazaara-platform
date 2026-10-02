import * as WebBrowser from "expo-web-browser";

const SHOPPING_WEB = (process.env.EXPO_PUBLIC_SHOPPING_WEB_BASE_URL ?? "http://10.0.2.2:3003").replace(/\/$/, "");

export async function openBazLens() {
  // Use the exact Shopping Web Baz Lens entry point so native and web share one
  // visual-search implementation and result semantics.
  return WebBrowser.openBrowserAsync(`${SHOPPING_WEB}/bazlens`, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
  });
}
