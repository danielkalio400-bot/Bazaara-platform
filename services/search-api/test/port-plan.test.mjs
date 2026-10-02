import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const checker = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../scripts/check-e3-ports.mjs');
const e2Names = ['bazchat', 'bazclips', 'baztune', 'bazforum', 'bazcircle', 'bazcut', 'bazsend'];
function fixture(fn) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'e3-port-check-'));
  try {
    fs.mkdirSync(path.join(root, 'ecosystems'), { recursive: true });
    const map = { '4000': { workspace: 'services/platform-api' } };
    for (let i = 0; i < e2Names.length; i += 1) {
      map[String(3013 + i)] = { workspace: `apps/${e2Names[i]}` };
    }
    fs.writeFileSync(path.join(root, 'ecosystems/port-map.json'), JSON.stringify(map));
    return fn(root, map);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}
function run(root) { return spawnSync(process.execPath, [checker, '--repo', root], { encoding: 'utf8' }); }

test('E2 proposed ports 3013–3019 coexist with E3 Search 3020/4020', () => fixture((root) => {
  const result = run(root);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /PASS: 3020.*4020/);
}));

test('existing port-map allocation of 3020 rejects E3 installation', () => fixture((root, map) => {
  map['3020'] = { workspace: 'apps/other-web' };
  fs.writeFileSync(path.join(root, 'ecosystems/port-map.json'), JSON.stringify(map));
  const result = run(root);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /PORT CONFLICT: Port 3020/);
}));

test('an E2 workspace referencing E3 API port 4020 rejects installation', () => fixture((root) => {
  const app = path.join(root, 'apps/bazchat');
  fs.mkdirSync(app, { recursive: true });
  fs.writeFileSync(path.join(app, 'package.json'), JSON.stringify({ scripts: { dev: 'node server.js --port 4020' } }));
  const result = run(root);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /bazchat\/package.json mentions E3 port 4020/);
}));

test('old E3 Search workspace files are ignored during an E3-only upgrade', () => fixture((root) => {
  for (const workspace of ['apps/search-web', 'services/search-api']) {
    const folder = path.join(root, workspace);
    fs.mkdirSync(folder, { recursive: true });
    fs.writeFileSync(path.join(folder, 'package.json'), JSON.stringify({ scripts: { dev: `old service --port ${workspace.startsWith('apps') ? '3020' : '4020'}` } }));
  }
  assert.equal(run(root).status, 0);
}));
