#!/usr/bin/env node
// Conflict detection for proposed E3 Search Web 3020 / API 4020. Does NOT reserve ports.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv;
const option = args.indexOf('--repo');
const root = option < 0 ? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..') : path.resolve(args[option + 1] ?? '.');
const proposed = new Map([['3020', 'apps/search-web'], ['4020', 'services/search-api']]);
const failures = [];
const portsFile = path.join(root, 'ecosystems/port-map.json');
if (!fs.existsSync(portsFile)) {
  console.error(`Missing canonical port map: ${portsFile}`);
  process.exit(2);
}
const assignments = JSON.parse(fs.readFileSync(portsFile, 'utf8'));
for (const [port, workspace] of proposed) {
  const occupant = assignments[port];
  if (occupant && occupant.workspace !== workspace) failures.push(`Port ${port} belongs to ${occupant.workspace ?? occupant.name ?? 'unknown'}`);
}
// Check workspace start scripts and common example env files in parallel branches before integration.
for (const kind of ['apps', 'services']) {
  const directory = path.join(root, kind);
  if (!fs.existsSync(directory)) continue;
  for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
    if (!item.isDirectory()) continue;
    const workspace = `${kind}/${item.name}`;
    if ([...proposed.values()].includes(workspace)) continue; // Old E3 files are allowed when upgrading E3 only.
    for (const filename of ['package.json', '.env.example']) {
      const filepath = path.join(directory, item.name, filename);
      if (!fs.existsSync(filepath)) continue;
      const content = fs.readFileSync(filepath, 'utf8');
      for (const port of proposed.keys()) {
        if (new RegExp(`(^|[^0-9])${port}([^0-9]|$)`).test(content)) {
          failures.push(`${workspace}/${filename} mentions E3 port ${port}`);
        }
      }
    }
  }
}
if (failures.length) {
  for (const failure of failures) console.error(`PORT CONFLICT: ${failure}`);
  process.exit(2);
}
console.log('E3 proposed port check PASS: 3020 (Search Web) and 4020 (Search API) have no detected repository conflicts.');
console.log('This static check cannot prove the Windows ports are free at runtime; the launcher checks active listeners.');
