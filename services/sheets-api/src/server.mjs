import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {randomBytes} from 'node:crypto';
import {verifyAssertion,AuthError} from './auth.mjs';
import {makeBoxClient,BoxClientError} from './box-client.mjs';
import {createStore,SheetsError,safeId,safeTitle} from './store.mjs';

const WORKBOOK_MAX=2*1024*1024,MAX_SHEETS=10,MAX_CELLS=10000;
const CELL=/^[A-Z]{1,2}(?:[1-9][0-9]{0,2}|1000)$/;
function safeSheetName(input){if(typeof input!=='string')throw new SheetsError('Sheet name must be text.');const name=input.normalize('NFC').replace(/[\\/?*\[\]:\u0000-\u001f]/g,' ').replace(/\s+/g,' ').trim()||'Sheet';if(name.length>50)throw new SheetsError('Sheet name must be 50 characters or fewer.');return name;}
function normalizeWorkbook(value){
  if(!value||typeof value!=='object'||Array.isArray(value)||!Array.isArray(value.sheets))throw new SheetsError('Invalid workbook data.');
  if(value.sheets.length<1||value.sheets.length>MAX_SHEETS)throw new SheetsError(`A workbook must contain 1 to ${MAX_SHEETS} sheets.`);
  const ids=new Set(),names=new Set();let populated=0,formulas=0;
  const sheets=value.sheets.map((sheet,index)=>{
    if(!sheet||typeof sheet!=='object'||Array.isArray(sheet))throw new SheetsError('Invalid sheet data.');
    const id=typeof sheet.id==='string'&&/^[a-z0-9-]{1,32}$/.test(sheet.id)?sheet.id:`sheet-${index+1}`;if(ids.has(id))throw new SheetsError('Sheet identifiers must be unique.');ids.add(id);
    const name=safeSheetName(sheet.name??`Sheet ${index+1}`),nk=name.toLocaleLowerCase();if(names.has(nk))throw new SheetsError('Sheet names must be unique.');names.add(nk);
    if(!sheet.cells||typeof sheet.cells!=='object'||Array.isArray(sheet.cells))throw new SheetsError('Cells must be an object.');const cells={};
    for(const [ref,raw] of Object.entries(sheet.cells)){
      if(!CELL.test(ref))throw new SheetsError(`Invalid cell reference: ${ref}`);if(typeof raw!=='string')throw new SheetsError(`Cell ${ref} must contain text.`);if(raw.length>8000)throw new SheetsError(`Cell ${ref} exceeds 8,000 characters.`);if(!raw.length)continue;
      populated++;if(populated>MAX_CELLS)throw new SheetsError(`Workbook exceeds ${MAX_CELLS.toLocaleString()} populated cells.`,413);if(raw.startsWith('='))formulas++;cells[ref]=raw.replace(/\r\n?/g,'\n');
    }
    return {id,name,cells};
  });
  const activeSheetId=ids.has(value.activeSheetId)?value.activeSheetId:sheets[0].id;
  return {workbook:{sheets,activeSheetId},sheetCount:sheets.length,cellCount:populated,formulaCount:formulas};
}
function encodeWorkbook({id,title,workbook,createdAt,updatedAt}){return Buffer.from(JSON.stringify({format:'bazaara.sheets',schemaVersion:1,id,title,workbook,createdAt,updatedAt}));}
function parseWorkbook(buffer,id){if(buffer.length>WORKBOOK_MAX+8192)throw new SheetsError('Stored workbook is too large.',503);let value;try{value=JSON.parse(buffer.toString('utf8'));}catch{throw new SheetsError('Stored workbook is corrupted.',503);}if(value?.format!=='bazaara.sheets'||value?.schemaVersion!==1||value?.id!==id||typeof value.title!=='string')throw new SheetsError('Stored workbook is corrupted.',503);const normalized=normalizeWorkbook(value.workbook);return {...value,workbook:normalized.workbook};}
async function readBody(req,limit){const declared=Number(req.headers['content-length']??0);if((declared&&(!Number.isSafeInteger(declared)||declared>limit))||declared<0)throw new SheetsError('Request is too large.',413);let len=0;const chunks=[];for await(const part of req){len+=part.length;if(len>limit)throw new SheetsError('Request is too large.',413);chunks.push(part);}return Buffer.concat(chunks);}
async function readJSON(req,limit){const buf=await readBody(req,limit);try{const value=JSON.parse(buf.toString('utf8'));if(!value||typeof value!=='object'||Array.isArray(value))throw Error();return value;}catch{throw new SheetsError('Invalid JSON.');}}
function send(res,status,body){res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(body));}
export function makeServer({secret,boxSecret,boxOrigin='http://127.0.0.1:4022',root=path.join(os.homedir(),'.bazaara','sheets-dev'),port=4024}={}){
  if(!secret||secret.length<32)throw new Error('Missing SHEETS_INTERNAL_SECRET (32+ characters)');if(!boxSecret||boxSecret.length<32)throw new Error('Missing BOX_INTERNAL_SECRET (32+ characters)');
  const store=createStore(root),box=makeBoxClient({origin:boxOrigin,secret:boxSecret});
  const server=http.createServer(async(req,res)=>{const pathname=new URL(req.url??'/','http://localhost').pathname;
    if(req.method==='GET'&&pathname==='/health/live')return send(res,200,{ok:true,service:'sheets-api'});
    if(req.method==='GET'&&pathname==='/health/ready'){const ready=await box.health();return send(res,ready?200:503,{ok:ready,service:'sheets-api',box:ready?'ready':'unavailable'});}
    try{
      const sub=verifyAssertion(secret,req.headers['x-sheets-identity'],req.method,pathname);
      if(req.method==='GET'&&pathname==='/v1/sheets')return send(res,200,await store.list(sub));
      if(req.method==='POST'&&pathname==='/v1/sheets'){
        const input=await readJSON(req,WORKBOOK_MAX+8192),title=safeTitle(input.title??'Untitled spreadsheet'),normalized=normalizeWorkbook(input.workbook??{sheets:[{id:'sheet-1',name:'Sheet 1',cells:{}}],activeSheetId:'sheet-1'}),now=new Date().toISOString();
        const result=await store.update(sub,async(data,commit)=>{if(data.workbooks.length>=store.limit)throw new SheetsError('Workbook limit reached.',413);const id=randomBytes(16).toString('hex'),body=encodeWorkbook({id,title,workbook:normalized.workbook,createdAt:now,updatedAt:now}),uploaded=await box.upload(sub,`bazaara-sheet-${id}.bsheet`,body);const meta={id,title,boxFileId:uploaded.id,revision:1,createdAt:now,updatedAt:now,sheetCount:normalized.sheetCount,cellCount:normalized.cellCount,formulaCount:normalized.formulaCount};data.workbooks.push(meta);try{await commit(data);}catch(e){await box.remove(sub,uploaded.id).catch(()=>{});throw e;}const {boxFileId,...publicMeta}=meta;return publicMeta;});return send(res,201,result);
      }
      const match=pathname.match(/^\/v1\/sheets\/([a-f0-9]{32})$/);
      if(match&&req.method==='GET'){const id=safeId(match[1]),meta=await store.getMeta(sub,id),buffer=await box.download(sub,meta.boxFileId),book=parseWorkbook(buffer,id),{boxFileId,...publicMeta}=meta;return send(res,200,{...publicMeta,workbook:book.workbook});}
      if(match&&req.method==='PUT'){
        const id=safeId(match[1]),input=await readJSON(req,WORKBOOK_MAX+8192),title=safeTitle(input.title??'Untitled spreadsheet'),normalized=normalizeWorkbook(input.workbook);if(!Number.isInteger(input.expectedRevision)||input.expectedRevision<1)throw new SheetsError('expectedRevision is required.');
        const result=await store.update(sub,async(data,commit)=>{const index=data.workbooks.findIndex(d=>d.id===id);if(index<0)throw new SheetsError('Workbook not found.',404);const old=data.workbooks[index];if(old.revision!==input.expectedRevision)throw new SheetsError('Workbook revision conflict.',409);const now=new Date().toISOString(),body=encodeWorkbook({id,title,workbook:normalized.workbook,createdAt:old.createdAt,updatedAt:now}),uploaded=await box.upload(sub,`bazaara-sheet-${id}.bsheet`,body),next={...old,title,boxFileId:uploaded.id,revision:old.revision+1,updatedAt:now,sheetCount:normalized.sheetCount,cellCount:normalized.cellCount,formulaCount:normalized.formulaCount};data.workbooks[index]=next;try{await commit(data);}catch(e){await box.remove(sub,uploaded.id).catch(()=>{});throw e;}await box.remove(sub,old.boxFileId).catch(e=>console.warn('Sheets cleanup warning:',e.message));const {boxFileId,...publicMeta}=next;return publicMeta;});return send(res,200,result);
      }
      if(match&&req.method==='DELETE'){const id=safeId(match[1]),result=await store.update(sub,async(data,commit)=>{const index=data.workbooks.findIndex(d=>d.id===id);if(index<0)throw new SheetsError('Workbook not found.',404);const [old]=data.workbooks.splice(index,1);await commit(data);let cleanup='deleted';try{await box.remove(sub,old.boxFileId);}catch(e){cleanup='pending';console.warn('Sheets orphan cleanup warning:',e.message);}return {deleted:true,cleanup};});return send(res,200,result);}
      return send(res,404,{message:'Not found.'});
    }catch(e){const status=e instanceof SheetsError||e instanceof AuthError||e instanceof BoxClientError?e.status:500;if(status===500)console.error('Sheets API internal error:',e);if(!res.headersSent)send(res,status,{message:status===500?'Spreadsheet service unavailable.':e.message});else res.destroy();}
  });server.requestTimeout=30000;server.headersTimeout=10000;server.maxHeadersCount=40;return {server,store,box,listen(){return new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',()=>{server.off('error',reject);resolve(server.address());});});}};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){const instance=makeServer({secret:process.env.SHEETS_INTERNAL_SECRET,boxSecret:process.env.BOX_INTERNAL_SECRET,boxOrigin:process.env.BOX_API_ORIGIN||'http://127.0.0.1:4022',root:process.env.SHEETS_DATA_DIR||undefined,port:Number(process.env.PORT||4024)});instance.listen().then(addr=>console.log(`BAZAARA Sheets API listening on http://127.0.0.1:${addr.port}`)).catch(e=>{console.error(e);process.exitCode=1;});}
