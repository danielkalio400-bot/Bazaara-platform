/** Pure safety gate shared by the local fixture seeder and isolated unit tests. */
export function assertLocalFixtureTarget(input: { nodeEnv?: string; ack?: string; databaseUrl?: string }) {
  if (input.nodeEnv === "production" || input.ack !== "LOCAL_TEST_ONLY") {
    throw new Error("Demo fixtures require NODE_ENV != production and BAZAARA_DEMO_SEED_ACK=LOCAL_TEST_ONLY.");
  }
  let parsed: URL;
  try { parsed = new URL(input.databaseUrl ?? ""); }
  catch { throw new Error("DATABASE_URL is not a valid local PostgreSQL URL."); }
  if (!["postgresql:", "postgres:"].includes(parsed.protocol) || !["localhost","127.0.0.1","[::1]"].includes(parsed.hostname.toLowerCase())) {
    throw new Error("Demo seed refused: PostgreSQL must be running on localhost, not a remote or production server.");
  }
  if (!parsed.pathname || parsed.pathname === "/") {
    throw new Error("Demo seed requires an explicit local database name.");
  }
  return true;
}
