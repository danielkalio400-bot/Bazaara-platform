import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');

test('engagement migration is present and additive', () => {
  const sql = read('packages/db/prisma/migrations/20260927113000_ecosystem2_engagement_core/migration.sql');
  for (const marker of ['CircleComment','ClipComment','TuneFavorite','ForumThreadVote','replyToMessageId','downloadCount','maxDownloads']) {
    assert.match(sql, new RegExp(marker));
  }
  assert.doesNotMatch(sql, /DROP\s+TABLE|TRUNCATE|DELETE\s+FROM/i);
});

test('BazChat supports message replies', () => {
  const api = read('services/platform-api/src/social/chat-routes.ts');
  const ui = read('apps/bazchat-web/app/page.tsx');
  assert.match(api, /replyToMessageId/);
  assert.match(api, /replyTarget/);
  assert.match(ui, /chat-replyPreview/);
  assert.match(ui, /setReplying/);
});

test('BazCircle has persistent comments', () => {
  const api = read('services/platform-api/src/social/circle-routes.ts');
  const ui = read('apps/bazcircle-web/app/page.tsx');
  assert.match(api, /circleComment\.create/);
  assert.match(api, /posts\/:postId\/comments/);
  assert.match(ui, /toggleComments/);
});

test('BazClips tracks views and comments', () => {
  const api = read('services/platform-api/src/social/clips-routes.ts');
  const ui = read('apps/bazclips-web/app/page.tsx');
  assert.match(api, /viewCount:\s*\{\s*increment:\s*1/);
  assert.match(api, /clipComment\.create/);
  assert.match(ui, /markView/);
  assert.match(ui, /clips-comments/);
});

test('BazTune supports favorites and play counts', () => {
  const api = read('services/platform-api/src/social/tune-routes.ts');
  const ui = read('apps/baztune-web/app/page.tsx');
  assert.match(api, /tuneFavorite\.upsert/);
  assert.match(api, /playCount:\s*\{\s*increment:\s*1/);
  assert.match(ui, /toggleFavorite/);
  assert.match(ui, /markPlay/);
});

test('BazForum supports community voting', () => {
  const api = read('services/platform-api/src/social/forum-routes.ts');
  const ui = read('apps/bazforum-web/app/page.tsx');
  assert.match(api, /forumThreadVote\.upsert/);
  assert.match(api, /voteScore/);
  assert.match(ui, /forum-voteBar/);
});

test('BazCut persists advanced edit-plan controls', () => {
  const api = read('services/platform-api/src/social/cut-routes.ts');
  const ui = read('apps/bazcut-web/app/page.tsx');
  for (const marker of ['aspectRatio','playbackRate','muted']) {
    assert.match(api, new RegExp(marker));
    assert.match(ui, new RegExp(marker));
  }
});

test('BazSend enforces recipient download controls', () => {
  const api = read('services/platform-api/src/social/send-routes.ts');
  const ui = read('apps/bazsend-web/app/page.tsx');
  assert.match(api, /maxDownloads/);
  assert.match(api, /downloadCount:\s*\{\s*increment:\s*1/);
  assert.match(ui, /Download limit/);
  assert.match(ui, /send-note/);
});
