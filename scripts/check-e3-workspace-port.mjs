#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const argv = process.argv;
const repoIndex = argv.indexOf('--repo');
const root = repoIndex === -1 ? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..') : path.resolve(argv[repoIndex + 1] || '.');
const port = '3021';
const mapPath = path.join(root, 'ecosystems/port-map.json');
if (!fs.existsSync(mapPath)) { console.error(`Missing port map: ${mapPath}`); process.exit(2); }
const map = JSON.parse(fs.readFileSync(mapPath,'utf8'));
const errors = [];
if (map[port] && map[port].workspace !== 'apps/workspace-web') errors.push(`Port ${port} allocated to ${map[port].workspace || map[port].name}`);
for (const rootDir of ['apps','services']) {
  const dir = path.join(root, rootDir);
  if (!fs.existsSync(dir)) continue;
  for (const item of fs.readdirSync(dir,{withFileTypes:true})) {
    if (!item.isDirectory()) continue;
    const rel = `${rootDir}/${item.name}`;
    if (rel==='apps/workspace-web') continue;
    for (const file of ['package.json','.env.example']) {
      const target = path.join(dir,item.name,file);
      if (!fs.existsSync(target)) continue;
      if (/(^|\D)3021(\D|$)/.test(fs.readFileSync(target,'utf8'))) errors.push(`${rel}/${file} also references ${port}`);
    }
  }
}
if(errors.length){for(const error of errors)console.error('PORT CONFLICT:',error);process.exit(2);}
console.log('PASS: E3 Workspace port 3021 is not assigned in the supplied repository.');
console.log('Runtime listeners must still be checked on the target Windows computer.');
