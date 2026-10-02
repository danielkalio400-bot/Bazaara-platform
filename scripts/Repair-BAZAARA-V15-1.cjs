/** Targeted V14->V15 validator compatibility repair; no broad regex overwrite. */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(process.argv[2] || process.cwd());
const check=process.argv.includes('--check');
const file=path.join(root,'scripts/validate-shopping-retail-v14.mjs');
const source=fs.readFileSync(file,'utf8');
const compatibilityMarker='BAZAARA_V15_1_PALETTE_COMPAT';
if(source.includes(compatibilityMarker)) {
  if(!source.includes('BAZAARA_SHOPPING_RESTORED_BLUE_V15')) throw Error('Existing compatibility marker has unexpected content. Refusing to modify.');
  console.log('V14/V15 compatibility check: already repaired.');
  process.exit(0);
}
const lines=source.split(/\r?\n/);
const matches=lines.map((line,index)=>({line,index})).filter(row=>row.line.includes('Native Shopping home and deals opt into retail cards'));
if(matches.length!==1) throw Error('Expected exactly one known V14 native-card assertion. No modifications.');
const candidate=matches[0];
if(!/\bcheck\(/.test(candidate.line) || !/mobileHome\.includes\(['"]retail['"]\)/.test(candidate.line) || !/mobileDeal\.includes\(['"]retail['"]\)/.test(candidate.line)) {
  throw Error('V14 validator content differs from reviewed assertion. No modifications.');
}
if(!source.includes('const layout') || !source.includes('mobileHome') || !source.includes('mobileDeal')) {
  throw Error('V14 validator prerequisites missing. No modifications.');
}
const replacement=[
  '// BAZAARA_V15_1_PALETTE_COMPAT: V14 retail cards are deliberately disabled by V15 blue restoration.',
  'const bazaaraV15BlueInstalled = layout.includes(\'import "./shopping-restored-v15.css";\');',
  'check(bazaaraV15BlueInstalled',
  '  ? [mobileHome, mobileDeal].every((file) => file.includes("BAZAARA_SHOPPING_RESTORED_BLUE_V15")',
  '      && !/<(?:ProductCard|Screen|SectionTitle)\\b[^>]*\\sretail(?:\\s|>)/.test(file))',
  '  : mobileHome.includes("retail") && mobileDeal.includes("retail"),',
  '  "Native Shopping cards match the installed V14 retail or V15 restored-blue theme");',
];
const eol=source.includes('\r\n')?'\r\n':'\n';
lines.splice(candidate.index,1,...replacement);
const output=lines.join(eol);
if(check){ console.log('V14/V15 compatibility check: repair needed; reviewed assertion located.');process.exit(0);}
fs.writeFileSync(file,output,'utf8');
console.log('V14/V15 compatibility check: theme-aware native-card assertion repaired.');
