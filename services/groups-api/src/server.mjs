import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import http from 'node:http';
import {URL} from 'node:url';
import {list,create,remove} from './store.mjs';
const port=Number(process.env.PORT||4046);
function json(res,status,data){res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(data))}
async function body(req){let s='';for await(const c of req){s+=c;if(s.length>32768)throw Object.assign(new Error('payload too large'),{status:413})}return s?JSON.parse(s):{}}
export function createServer(){return http.createServer(async(req,res)=>{try{const u=new URL(req.url||'/',`http://${req.headers.host||'localhost'}`);if(u.pathname==='/health/live')return json(res,200,{ok:true,service:'groups-api'});if(u.pathname==='/health/ready')return json(res,200,{ok:true,service:'groups-api',storage:'local-alpha'});const secret=process.env.PRODUCT_INTERNAL_SECRET||'';if(!secret||req.headers['x-bazaara-internal']!==secret)return json(res,401,{error:'unauthorized'});const user=String(req.headers['x-bazaara-user']||'local-dev');if(req.method==='GET'&&u.pathname==='/api/v1/items')return json(res,200,{items:await list(user)});if(req.method==='POST'&&u.pathname==='/api/v1/items')return json(res,201,{item:await create(user,await body(req))});const m=u.pathname.match(/^\/api\/v1\/items\/([^/]+)$/);if(req.method==='DELETE'&&m)return json(res,(await remove(user,decodeURIComponent(m[1])))?200:404,{ok:true});return json(res,404,{error:'not found'})}catch(e){return json(res,Number(e?.status)||400,{error:e instanceof Error?e.message:'request failed'})}})}
if(import.meta.url===pathToFileURL(resolve(process.argv[1])).href)createServer().listen(port,'127.0.0.1',()=>console.log('[BAZAARA] Groups API listening on http://127.0.0.1:'+port));
