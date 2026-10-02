#!/usr/bin/env node
// Adds ONLY the two E3 workspace records/links to the canonical npm lockfile.
// Leaves root package.json, all existing lock records and E1/E2 source untouched.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'package-lock.json');
const lock = JSON.parse(fs.readFileSync(source, 'utf8'));
if (lock.lockfileVersion !== 3 || lock.name !== 'bazaara-platform' || !lock.packages?.['']) {
  throw new Error('Unexpected root lockfile; refusing changes.');
}
if (!lock.packages[''].workspaces?.includes('apps/*') || !lock.packages[''].workspaces?.includes('services/*')) {
  throw new Error('Workspace configuration mismatch; refusing changes.');
}
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, stable(v)]));
  return value;
}
for (const rel of ['apps/search-web', 'services/search-api']) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, rel, 'package.json'), 'utf8'));
  const workspaceRecord = Object.fromEntries(
    ['name', 'version', 'dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies', 'engines']
      .filter((name) => manifest[name] !== undefined)
      .map((name) => [name, manifest[name]]),
  );
  const linkKey = `node_modules/${manifest.name}`;
  const linkRecord = { resolved: rel, link: true };
  for (const [key, expected] of [[rel, workspaceRecord], [linkKey, linkRecord]]) {
    if (lock.packages[key] && JSON.stringify(stable(lock.packages[key])) !== JSON.stringify(stable(expected))) {
      // Existing E3 manifest changes must be reconciled explicitly, never overwritten.
      throw new Error(`Conflicting lockfile entry ${key}; manual review required.`);
    }
  }
  lock.packages[rel] = workspaceRecord;
  lock.packages[linkKey] = linkRecord;
}
const backupDir = path.join(root, '.bazaara-e3-backups');
fs.mkdirSync(backupDir, { recursive: true });
const backup = path.join(backupDir, `package-lock-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
fs.copyFileSync(source, backup, fs.constants.COPYFILE_EXCL);
const temporary = `${source}.e3.tmp`;
try {
  fs.writeFileSync(temporary, JSON.stringify(lock, null, 2) + '\n', { flag: 'wx' });
  fs.renameSync(temporary, source);
} finally {
  if (fs.existsSync(temporary)) fs.rmSync(temporary);
}
console.log(`Registered 2 E3 npm workspaces. All preexisting lock records preserved. Backup: ${backup}`);
