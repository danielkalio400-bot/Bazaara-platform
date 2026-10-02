export type App = {slug:string;name:string;port?:number;group:'Commerce'|'Social'|'Internet'|'Workspace';hint:string};
const rows:[string,string,number,string][]=[
 ['business','Business',3001,'Manage your business'],['operations','Operations',3002,'Coordinate services'],['shopping','Shopping',3003,'Find products'],['bazid','BazID',3004,'Your identity'],['bazaara','Platform Home',3005,'Explore Bazaara'],['grocery','Grocery',3006,'Plan groceries'],['food','Food',3007,'Discover food'],['logistics','Logistics',3008,'Plan deliveries'],['drive','Drive',3009,'Arrange travel'],['pay','Wallet',3010,'Payments'],['pharmacy','Pharmacy',3011,'Pharmacy services'],['bazasport','Bazasport',3012,'Sport services'],
 ['bazchat','BChat',3013,'Messages and voice'],['bazclips','ZimZam',3014,'Short videos'],['baztune','BTune',3015,'Music and playlists'],['bazcircle','Bicord',3017,'Communities and discussions'],['bazcut','BazCut',3018,'Edit and render video'],['bazsend','BSend',3019,'Peer file transfers'],['biflix','Ɓiflix',3055,'Watch films'],
 ['search','Search',3020,'Search the web'],['workspace','Workspace',3021,'Your work hub'],['box','Box',3022,'Files and folders'],['docs','Docs',3023,'Write documents'],['sheets','Sheets',3024,'Calculate and analyze'],['slides','Slides',3025,'Present ideas'],['forms','Forms',3026,'Forms and quizzes'],['notes','Notes',3027,'Capture ideas'],['calendar','Calendar',3028,'Plan your time'],['contacts','Contacts',3029,'Organize people'],['photos','Photos',3030,'Images and albums'],['vault','Vault',3031,'Encrypted vault'],['spaces','Spaces',3032,'Organize spaces'],['boards','Boards',3033,'Visualize tasks'],['projects','Projects',3034,'Plan projects'],['flow','Flow',3035,'Build transformations'],['bmail','Bmail',3036,'Mail and drafts'],['bazmeet','BazMeet',3037,'Camera and meeting studio'],['bmap','BMap',3038,'Explore places'],['translate','Translate',3039,'Understand languages'],['news','News',3040,'Follow stories'],['bazlens','BazLens',3041,'Explore with your camera'],['sites','Sites',3042,'Build pages'],['bcloud','BCloud',3043,'Cloud management'],['admin','Admin',3044,'Administration'],['tasks','Tasks',3045,'Track your next action'],['groups','Groups',3046,'Manage groups'],['marketplace','Marketplace',3047,'Browse the marketplace'],['learn','Learn',3048,'Lessons and flashcards'],['bazstore','BazStore',3049,'Discover apps'],['bazgames','BazGames',3050,'Explore games'],['one','Bazaara One',3051,'Your account plan'],['analytics','Analytics',3052,'Analyze activity'],['bazservices','BazServices',3053,'Service directory'],['bazshield','BazShield',3054,'Security tools']
];
const internet=new Set(['search','bmap','translate','news','bazlens']);
export const APPS:App[]=rows.map(([slug,name,port,hint])=>({slug,name,port,hint,group:port<=3012?'Commerce':port<=3019||slug==='biflix'?'Social':internet.has(slug)?'Internet':'Workspace'}));
APPS.push({slug:'nova',name:'Nova',group:'Internet',hint:'Open your configured Nova app'});
export function validAppURL(raw:unknown):string{
 if(typeof raw!=='string'||raw.length>2048)return '';
 try{const u=new URL(raw);if(!['https:','http:'].includes(u.protocol)||u.username||u.password)return '';return u.href;}catch{return '';}
}
export function appHref(app:App,config:unknown,location?:{hostname:string;protocol:string}):string{
 const urls=config&&typeof config==='object'&&!Array.isArray(config)?config as Record<string,unknown>:{};
 const configured=validAppURL(urls[app.slug]);if(configured)return configured;
 if(!location||!app.port)return '';
 const host=location.hostname.replace(/^\[|\]$/g,'');
 if(!['localhost','127.0.0.1','::1'].includes(host)&&!/^10\.\d+\.\d+\.\d+$/.test(host)&&!/^192\.168\.\d+\.\d+$/.test(host)&&!/^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(host))return '';
 return `${location.protocol}//${host.includes(':')?'['+host+']':host}:${app.port}/`;
}
export function configuration():unknown{try{return JSON.parse(process.env.NEXT_PUBLIC_BAZAARA_APP_URLS||'{}');}catch{return {};}}
