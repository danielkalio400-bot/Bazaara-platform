#!/usr/bin/env node
// Surgical lockfile registration. No existing package records are rewritten.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const lockPath = path.join(root,'package-lock.json');
const manifestPath = path.join(root,'apps/workspace-web/package.json');
const lock = JSON.parse(fs.readFileSync(lockPath,'utf8'));
const manifest = JSON.parse(fs.readFileSync(manifestPath,'utf8'));
if(lock.lockfileVersion!==3||lock.name!=='bazaara-platform'||!lock.packages?.['']?.workspaces?.includes('apps/*'))throw Error('Unexpected root npm lockfile: refusing modification.');
if(manifest.name!=='@bazaara/workspace-web'||manifest.scripts?.dev?.includes('3021')!==true)throw Error('Workspace manifest mismatch.');
const rel='apps/workspace-web';const linkKey=`node_modules/${manifest.name}`;
const expected=Object.fromEntries(['name','version','dependencies','devDependencies','peerDependencies','optionalDependencies','engines'].filter(key=>manifest[key]!==undefined).map(key=>[key,manifest[key]]));
const linkExpected={resolved:rel,link:true};
function stable(value){if(Array.isArray(value))return value.map(stable);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,v])=>[key,stable(v)]));return value;}
for(const [key,record] of [[rel,expected],[linkKey,linkExpected]]){
  if(lock.packages[key] && JSON.stringify(stable(lock.packages[key]))!==JSON.stringify(stable(record)))throw Error(`Conflicting lockfile entry ${key}; manual reconciliation required.`);
}
if(lock.packages[rel]&&lock.packages[linkKey]){console.log('PASS: Workspace already registered; no lockfile changes.');process.exit(0);}
const backups=path.join(root,'.bazaara-e3-backups');fs.mkdirSync(backups,{recursive:true});
const backup=path.join(backups,`package-lock-workspace-${new Date().toISOString().replace(/[:.]/g,'-')}.json`);
fs.copyFileSync(lockPath,backup,fs.constants.COPYFILE_EXCL);
lock.packages[rel]=expected;lock.packages[linkKey]=linkExpected;
const tmp=lockPath+'.e3-workspace.tmp';
try{fs.writeFileSync(tmp,JSON.stringify(lock,null,2)+'\n',{flag:'wx'});fs.renameSync(tmp,lockPath);}finally{if(fs.existsSync(tmp))fs.rmSync(tmp);}
console.log(`PASS: Workspace lockfile records registered; original records preserved. Backup: ${backup}`);
