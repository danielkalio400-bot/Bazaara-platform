#!/usr/bin/env node
// Optional, conservative integration with the unmodified Workspace V1.2 catalog/test.
// No rewrites if the existing catalog diverged or is currently modified by parallel work.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const args=process.argv, idx=args.indexOf('--repo');
if(idx<0||!args[idx+1])throw Error('Usage: node enable-box-workspace.mjs --repo <repository>');
const root=path.resolve(args[idx+1]);
const catalog=path.join(root,'apps/workspace-web/lib/products.ts');
const tests=path.join(root,'apps/workspace-web/test/session.test.mjs');
const ui=path.join(root,'apps/workspace-web/components/Workspace.tsx');
const files=[catalog,tests,ui];for(const file of files)if(!fs.existsSync(file))throw Error(`Workspace V1.2 file missing: ${file}`);
const oldBox="{ id:'box', name:'Box', description:'File storage with controlled sharing.', category:'Storage & Security', icon:'□', status:'planned', color:'purple' }";
const newBox="{ id:'box', name:'Box', description:'Private local development storage for your files.', category:'Storage & Security', icon:'□', status:'available', href:process.env.NEXT_PUBLIC_BOX_ORIGIN || 'http://localhost:3022', color:'purple' }";
const oldTest="test('all 31 products have unique IDs; only existing Search and Workspace advertised as available',()=>{";
const oldCount="assert.equal((source.match(/status:'available'/g)||[]).length,2);";
const oldBanner="<span>Docs & Box <b>In development</b></span>";
const oldCard='<div className="feature-card upcoming"><span className="feature-icon gold">▤</span><div><h3>Docs + Box</h3><p>The next connected productivity milestone.</p><span>In development</span></div></div>';
const c=fs.readFileSync(catalog,'utf8'),t=fs.readFileSync(tests,'utf8'),u=fs.readFileSync(ui,'utf8');
if(c.includes(newBox)&&t.includes('Search, Workspace and Box advertised')&&u.includes('Box <b>Available')){console.log('PASS: Box already enabled in Workspace.');process.exit(0)}
for(const [source,needle,filename] of [[c,oldBox,'catalog'],[t,oldTest,'unit test'],[t,oldCount,'unit test'],[u,oldBanner,'UI banner'],[u,oldCard,'featured card']])if(source.split(needle).length!==2)throw Error(`Workspace ${filename} diverged from V1.2. No changes made; please integrate Box manually.`);
const newC=c.replace(oldBox,newBox);
const newT=t.replace(oldTest,"test('all 31 products have unique IDs; Search, Workspace and Box advertised as available',()=>{").replace(oldCount,"assert.equal((source.match(/status:'available'/g)||[]).length,3);\n  assert.match(source,/id:'box'.*status:'available'/);");
const newU=u.replace(oldBanner,'<span>Box <b>Available</b></span><span>Docs <b>In development</b></span>').replace(oldCard,'<a className="feature-card" href="http://localhost:3022"><span className="feature-icon teal">□</span><div><h3>Box</h3><p>Organize your private files.</p><span>Open Box ↗</span></div></a>');
const backup=path.join(root,'.bazaara-e3-backups',`workspace-box-integration-${new Date().toISOString().replace(/[:.]/g,'-')}`);
fs.mkdirSync(backup,{recursive:true});for(const file of files)fs.copyFileSync(file,path.join(backup,path.basename(file)),fs.constants.COPYFILE_EXCL);
// Atomic one-file writes; backups retained for recovery.
for(const [file,content] of [[catalog,newC],[tests,newT],[ui,newU]]){
 const tmp=file+`.e3-box-${process.pid}.tmp`;
 try{fs.writeFileSync(tmp,content,{flag:'wx'});fs.renameSync(tmp,file);}finally{if(fs.existsSync(tmp))fs.rmSync(tmp)}
}
console.log(`PASS: Workspace catalog, UI and test updated for Box; backups: ${backup}`);
