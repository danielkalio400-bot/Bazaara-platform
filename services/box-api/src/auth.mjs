import {createHmac, timingSafeEqual} from 'node:crypto';
import {BoxError} from './store.mjs';
export function createAssertion(secret, sub, method, path, now=Date.now()) {
  if (typeof secret!=='string'||secret.length<32) throw new Error('BOX_INTERNAL_SECRET must contain at least 32 characters');
  const body=Buffer.from(JSON.stringify({aud:'bazaara-box-v1',sub,method,path,exp:Math.floor(now/1000)+20})).toString('base64url');
  const sig=createHmac('sha256',secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}
export function verifyAssertion(secret, token, method, path, now=Date.now()) {
  if(typeof token!=='string'||token.length>1400||!token.includes('.'))throw new BoxError('Unauthorized.',401);
  const parts=token.split('.'); if(parts.length!==2)throw new BoxError('Unauthorized.',401);
  const [body,sig]=parts;
  const expected=createHmac('sha256',secret).update(body).digest();
  let supplied;try{supplied=Buffer.from(sig,'base64url');}catch{throw new BoxError('Unauthorized.',401);}
  if(supplied.length!==expected.length||!timingSafeEqual(supplied,expected))throw new BoxError('Unauthorized.',401);
  let value;try{value=JSON.parse(Buffer.from(body,'base64url').toString('utf8'));}catch{throw new BoxError('Unauthorized.',401);}
  const sec=Math.floor(now/1000);
  if(value.aud!=='bazaara-box-v1'||value.method!==method||value.path!==path||!Number.isInteger(value.exp)||value.exp<sec||value.exp>sec+20||typeof value.sub!=='string'||!value.sub||value.sub.length>128)throw new BoxError('Unauthorized.',401);
  return value.sub;
}
