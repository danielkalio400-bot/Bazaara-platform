#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const args=process.argv,idx=args.indexOf('--repo');const root=idx===-1?path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'):path.resolve(args[idx+1]||'.');
const intended=new Map([['3023','apps/docs-web'],['4023','services/docs-api']]),errors=[];const portMap=path.join(root,'ecosystems/port-map.json');
if(!fs.existsSync(portMap)){console.error('Missing required repository port map:',portMap);process.exit(2)}const map=JSON.parse(fs.readFileSync(portMap,'utf8'));
for(const [port,owner] of intended)if(map[port]&&map[port].workspace!==owner)errors.push(`${port} reserved by ${map[port].workspace||map[port].name}`);
for(const kind of ['apps','services']){const dir=path.join(root,kind);if(!fs.existsSync(dir))continue;for(const app of fs.readdirSync(dir,{withFileTypes:true})){if(!app.isDirectory())continue;const rel=`${kind}/${app.name}`;if([...intended.values()].includes(rel))continue;for(const name of ['package.json','.env.example','.env.local','.env']){const file=path.join(dir,app.name,name);if(!fs.existsSync(file))continue;const body=fs.readFileSync(file,'utf8');for(const port of intended.keys())if(new RegExp(`(^|\\D)${port}(\\D|$)`).test(body))errors.push(`${port} referenced by ${rel}/${name}`);}}}
if(errors.length){for(const error of errors)console.error('PORT CONFLICT:',error);process.exit(2)}console.log('PASS: ports 3023 (Docs Web) and 4023 (Docs API) are not assigned by source manifests or the supplied port map.');
