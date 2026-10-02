import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const file=f=>fs.readFileSync(path.join(root,f),'utf8');
const web=file('apps/drive-web/app/page.tsx');
const css=file('apps/drive-web/app/globals.css');
const mobile=file('apps/drive-rider-mobile/app/index.tsx');
let checked=0;
function includes(source,needle,label){assert.ok(source.includes(needle),label);checked++;}
function matches(source,regex,label){assert.match(source,regex,label);checked++;}
function excludes(source,needle,label){assert.ok(!source.includes(needle),label);checked++;}
const homePanel=web.split('className="dv14-start"')[1]?.split('bookingStep === "destination"')[0];
assert.ok(homePanel,'compact home booking panel exists');checked++;
for(const [src,needle,label] of [
 [web,'className="dv14-app"','single booking app shell'],
 [web,'className="dv14-map"','map behind booking sheet'],
 [web,'className={`dv14-sheet','booking sheet'],
 [web,'dv14-search-row','compact pickup/destination entry'],
 [web,'dv14-later','schedule affordance'],
 [web,'className="dv14-tabs"','three-tab navigation'],
 [web,'setView("activity")','activity navigation'],
 [web,'setView("account")','account navigation'],
 [web,'dv14-page dv14-activity','activity list screen'],
 [web,'monthLabel(item.createdAt)','month-grouped history'],
 [web,'dv14-page dv14-account','account screen'],
 [web,'>Payments<small>','payments under account'],
 [web,'&rideId=${encodeURIComponent(activeRideId)}','exact ride payments handoff'],
 [web,'openRideSupport(activeRideId)','ride-attached support'],
 [web,'href="tel:112"','emergency action retained'],
 [web,'api.post("/v1/support/cases"','support API retained'],
 [web,'/v1/drive/pricing','server quotes retained'],
 [web,'/v1/drive/rides','real ride request retained'],
 [web,'quote.fuelDisclosure?.status','fuel evidence retained'],
 [web,'not traffic-aware or verified road routing','honest pilot estimate'],
 [web,'Live address autocomplete is not connected','no false autocomplete claims'],
 [css,'.dv14-home{position:absolute','viewport map layout'],
 [css,'.dv14-tabs{position:absolute','persistent bottom navigation'],
 [css,'@media(max-width:700px)','phone-responsive interface'],
 [css,'.dv14-header{display:none}','phone home excludes brand header'],
 [css,'.dv14-home{top:0;bottom:68px}','map fills phone viewport'],
 [mobile,'const [tab, setTab]','native bottom-tab state'],
 [mobile,'const [sheetStep, setSheetStep]','native staged booking flow'],
 [mobile,'style={n.map}','native full-height map region'],
 [mobile,'style={n.sheet}','native compact bottom sheet'],
 [mobile,'style={n.tabs}','native three-tab navigation'],
 [mobile,'displayedRides.map','native month-grouped activity'],
 [mobile,'style={n.profile}','native account screen'],
 [mobile,'>Payments</Text>','native payments under Account'],
 [mobile,'&rideId=${encodeURIComponent(ride.ride.id)}','native exact ride handoff'],
 [mobile,'SecureStore.setItemAsync','native pickup PIN secure storage'],
 [mobile,'/v1/drive/pricing','native server quote'],
 [mobile,'/v1/drive/rides','native dispatch request'],
 [mobile,'expo-location','native GPS permission'],
 [mobile,'tel:112','native safety number'],
 [mobile,'not live road navigation','native map clearly labelled schematic'],
]) includes(src,needle,label);
excludes(homePanel,'Let\'s go places','remove feature carousel from initial home');
excludes(homePanel,'wallet','no balance widget on compact booking home');
excludes(homePanel,'<h1>Where to?</h1>','avoid redundant heading above search button');
excludes(web,'className="drive-v10-money-rail"','remove prominently displayed dashboard wallet');
excludes(web,'className="drive-v10-book-grid"','remove long form grid');
excludes(mobile,'>BAZAARA WALLET</Text>','native home no wallet banner');
matches(mobile,/\[\['home','⌂','Home'\],\['activity','▤','Activity'\],\['account','◎','Account'\]\]/,'only Home Activity Account native nav');
console.log(`BAZAARA Drive V14 minimal booking UI checks PASS (${checked} assertions; web + native).`);
