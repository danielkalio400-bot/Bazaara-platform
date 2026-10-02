/** Restores Shopping-only mobile blue / charcoal styling after V14's retail palette.
 * V14's layout and cart/search/order interactions remain in place.
 * Called by the guarded V15 installer after it has backed up the source.
 */
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(process.argv[2] || process.cwd());
const verifyOnly = process.argv.includes('--check');
const target = [
  'apps/shopping-mobile/app/(tabs)/index.tsx',
  'apps/shopping-mobile/app/deals.tsx',
];
function transform(relative) {
  const filename=path.join(root,relative);
  const original=fs.readFileSync(filename,'utf8');
  const isHome=relative.includes('(tabs)');
  if (!original.includes('StyleSheet.create({')) throw new Error(`${relative}: style sheet missing. Refusing blind transform.`);
  if (isHome && !original.includes('styles.brandAccent')) throw new Error(`${relative}: expected V14 home marker missing. Review local differences first.`);
  if (!isHome && !original.includes('DEAL RADAR') && !original.includes('CURRENT DEALS')) throw new Error(`${relative}: expected V13/V14 deals marker missing.`);
  if (original.includes('/* BAZAARA_SHOPPING_RESTORED_BLUE_V15 */')) return { filename, original, updated:original, changed:false };
  let s=original;
  // Default shared native cards are the pre-V14 neon Shopping style. The
  // `retail` prop affected only local Shopping Home and Deal Radar.
  s=s.replace(/(<(?:Screen|SectionTitle|ProductCard)\b[^>]*?)\s+retail(?=\s|>)/g,'$1');
  const marker=s.lastIndexOf('const styles = StyleSheet.create({');
  if (marker<0) throw new Error(`${relative}: StyleSheet.create marker not found.`);
  const leading=s.slice(0,marker);
  let styles=s.slice(marker);
  const bg={
    '#F5F5F5':'#030915','#FFFFFF':'#101B2B','#FFF':'#101B2B','#FFF3E0':'#142A3D',
    '#FFF2DD':'#182E49','#FFC979':'#0F2C4C','#FFE5BC':'#14304C','#F7EAD7':'#152F45',
    '#11253A':'#10273C','#F8F8F8':'#101B2B','#FFF8EE':'#15273D','#FFF0DC':'#173654',
    '#FFE2BB':'#142E4C',
  };
  const border={
    '#E8D6BC':'#315877','#EBE2D7':'#294E73','#F4D0A0':'#315A82','#E8E8E8':'#294B67',
    '#DFD6C7':'#294B67','#ECECEC':'#294B67','#F0BC74':'#3F82A7','#E6E6E6':'#294B67',
    '#EED3B0':'#315877','#E7E7E7':'#294B67',
  };
  const ink={
    '#242424':'#F3FBFF','#252525':'#F3FBFF','#282828':'#F3FBFF','#292929':'#F3FBFF',
    '#303030':'#F3FBFF','#333333':'#F3FBFF','#35200F':'#F3FBFF','#382411':'#F3FBFF',
    '#626262':'#A4BBCE','#656565':'#A4BBCE','#666666':'#A4BBCE','#6F6F6F':'#A4BBCE',
    '#777777':'#A4BBCE','#6E4B2F':'#B5CDE1','#765231':'#B5CDE1','#674626':'#B5CDE1',
    '#8F5A2B':'#9CBFDE','#A85B11':'#81D7FF','#A95A0D':'#81D7FF','#A56727':'#81D7FF',
    '#B15D0B':'#7AD8FF','#B27131':'#7AD8FF','#E87D13':'#00B8FF','#A84D07':'#57CCFF',
    '#CF6607':'#00B8FF','#B55D0A':'#7AD8FF','#B65A07':'#7AD8FF',
    '#B65F0C':'#00B8FF','#A6530B':'#6CD2FF','#9A500F':'#76D3FF',
  };
  styles=styles.replace(/\b(backgroundColor|borderColor|color|tintColor):\s*(["'])(#[0-9a-fA-F]{3,8})\2/g,(all,key,q,value)=>{
    const replacement=key==='backgroundColor'?bg[value]:key==='borderColor'?border[value]:ink[value];
    return replacement?`${key}: ${q}${replacement}${q}`:all;
  });
  // V14 uses orange as action/gradient accent; retarget those exact literals,
  // not red warning/error colours or Food's independent styles.
  styles=styles.replace(/#EB831B|#E8841A|#E9861C|#F19A35/gi,'#00B8FF');
  const updated='/* BAZAARA_SHOPPING_RESTORED_BLUE_V15 */\n'+leading+styles;
  if (!verifyOnly) fs.writeFileSync(filename,updated,'utf8');
  return {filename, original, updated, changed:original!==updated};
}
for(const file of target){const result=transform(file);console.log((verifyOnly?'PREFLIGHT':'UPDATED'),file,result.changed?'blue Shopping mobile theme restored':'already blue');}
