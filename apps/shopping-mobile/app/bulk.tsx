import { Redirect } from "expo-router";

/** Existing bookmarks land on retail Shopping; no wholesale storefront. */
export default function LegacyBulkRedirect() { return <Redirect href="/(tabs)" />; }
