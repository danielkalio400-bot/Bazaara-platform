import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

// Node 22 strips erasable TypeScript in this isolated pure-rules module.
const rules = await import(pathToFileURL(resolve(root, "services/platform-api/src/social/rules.ts")).href);
test("direct conversation identity is order-independent and collision-resistant for separators", () => {
  assert.equal(rules.directKey("userA", "userB"), rules.directKey("userB", "userA"));
  assert.notEqual(rules.directKey("a:b", "c"), rules.directKey("a", "b:c"));
  assert.throws(() => rules.directKey("same", "same"));
});
test("handles are canonical, length-checked and reserve platform identifiers", () => {
  assert.equal(rules.normalizeHandle(" @Daniel_99 "), "daniel_99");
  for (const value of ["ab", "admin", "support", "bazchat", "not-allowed", "9first", "  ", "a".repeat(31)]) {
    assert.throws(() => rules.normalizeHandle(value), `unsafe handle: ${value}`);
  }
});
test("all seven product workspaces include app entrypoints and responsive design imports", () => {
  for (const slug of ["bazchat", "bazclips", "baztune", "bazforum", "bazcircle", "bazcut", "bazsend"]) {
    assert.ok(existsSync(resolve(root, `apps/${slug}-web/app/page.tsx`)), `Missing ${slug} app`);
    assert.match(read(`apps/${slug}-web/app/layout.tsx`), /social-ui\/styles\.css/);
    assert.match(read(`apps/${slug}-web/package.json`), /@bazaara\/social-ui/);
  }
  const sharedCss = read("packages/social-ui/src/styles.css");
  assert.match(sharedCss, /max-width:700px/);
  assert.match(sharedCss, /prefers-reduced-motion/);
  assert.doesNotMatch(sharedCss, /fonts\.googleapis\.com/i);
});
test("all social routes require authentication and native social scope", () => {
  const common = read("services/platform-api/src/social/common.ts");
  assert.match(common, /requireAuth\(request\)/);
  assert.match(common, /social\.basic/);
  for (const file of ["routes.ts", "chat-routes.ts", "circle-routes.ts", "forum-routes.ts", "clips-routes.ts", "tune-routes.ts", "cut-routes.ts", "send-routes.ts"]) {
    const text = read(`services/platform-api/src/social/${file}`);
    assert.match(text, /requireSocialAuth\(request\)/, `Missing auth: ${file}`);
  }
  const app = read("services/platform-api/src/app.ts");
  for (const name of ["socialRoutes", "bazchatRoutes", "bazcircleRoutes", "bazforumRoutes", "bazclipsRoutes", "baztuneRoutes", "bazcutRoutes", "bazsendRoutes"]) assert.match(app, new RegExp(`app\\.register\\(${name}\\)`));
});
test("message writes check membership, both block directions and support idempotency", () => {
  const text = read("services/platform-api/src/social/chat-routes.ts");
  assert.match(text, /ownMembership\(userId, conversationId\)/);
  assert.match(text, /senderUserId_clientNonce/);
  assert.match(text, /socialBlock\.findFirst/);
  assert.match(text, /text\/event-stream/);
  assert.match(text, /conversationId: string; messageId: string/); // no private bodies in SSE
});
test("social and media schemas define the Ecosystem 2 persistence layer", () => {
  const schema = read("packages/db/prisma/schema.prisma");
  const socialMigration = read("packages/db/prisma/migrations/20260925000000_ecosystem2_social_foundation/migration.sql");
  const mediaMigration = read("packages/db/prisma/migrations/20260927093000_ecosystem2_media_core/migration.sql");
  for (const name of ["SocialProfile","SocialBlock","SocialFollow","SocialReport","ChatConversation","ChatParticipant","ChatMessage","CirclePost","CircleLike","ForumTopic","ForumThread","ForumReply"]) {
    assert.ok(schema.includes(`model ${name} {`), `missing Prisma model ${name}`);
    assert.ok(socialMigration.includes(`CREATE TABLE "${name}"`), `missing migration table ${name}`);
  }
  for (const name of ["ClipPost","ClipLike","TuneTrack","TunePlaylist","TunePlaylistItem","CutProject","SendTransfer"]) {
    assert.ok(schema.includes(`model ${name} {`), `missing Prisma model ${name}`);
    assert.ok(mediaMigration.includes(`CREATE TABLE "${name}"`), `missing migration table ${name}`);
  }
  assert.match(socialMigration, /"CirclePost_audience_check"/);
  assert.match(schema, /discoverable\s+Boolean\s+@default\(false\)/);
  assert.match(socialMigration, /"discoverable" BOOLEAN NOT NULL DEFAULT false/);
  assert.match(read("apps/bazid-web/app/bazid/register/page.tsx"), /sport: process\.env\.NEXT_PUBLIC_SPORT_BASE_URL \?\? "http:\/\/localhost:3012"/);
  assert.match(schema, /@@unique\(\[senderUserId, clientNonce\]\)/);
});
test("CORS and BazID return origin defaults include seven E2 localhost ports", () => {
  const config = read("services/platform-api/src/config.ts");
  const signIn = read("apps/bazid-web/app/bazid/sign-in/page.tsx");
  const register = read("apps/bazid-web/app/bazid/register/page.tsx");
  for (const port of [3013,3014,3015,3016,3017,3018,3019]) {
    for (const value of [config,signIn,register]) assert.ok(value.includes(`http://localhost:${port}`), `port ${port} missing`);
  }
});
test("all seven products now have API-backed alpha capabilities", () => {
  const app = read("services/platform-api/src/app.ts");
  for (const route of ["bazclipsRoutes","baztuneRoutes","bazcutRoutes","bazsendRoutes"]) assert.match(app, new RegExp(`app\\.register\\(${route}\\)`));
  assert.match(read("apps/bazclips-web/app/page.tsx"), /\/v1\/bazclips\/clips/);
  assert.match(read("apps/baztune-web/app/page.tsx"), /\/v1\/baztune\/tracks/);
  assert.match(read("apps/bazcut-web/app/page.tsx"), /\/v1\/bazcut\/projects/);
  assert.match(read("apps/bazsend-web/app/page.tsx"), /\/v1\/bazsend\/transfers/);
  assert.match(read("apps/bazchat-web/app/page.tsx"), /uploadMedia/);
  assert.match(read("apps/bazcircle-web/app/page.tsx"), /mediaAssetId/);
  assert.match(read("services/platform-api/src/social/send-routes.ts"), /expiresAt/);
  assert.match(read("services/platform-api/src/social/chat-routes.ts"), /attachmentBytes/);
});
