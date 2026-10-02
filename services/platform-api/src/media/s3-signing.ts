import { createHash, createHmac } from "node:crypto";
import { env } from "../config.js";
import { AppError } from "../errors.js";

function hmac(key: Buffer | string, value: string) { return createHmac("sha256", key).update(value).digest(); }
function sha256(value: string) { return createHash("sha256").update(value).digest("hex"); }
function encodePath(path: string) { return path.split("/").map((part) => encodeURIComponent(part).replace(/%2F/gi,"/")).join("/"); }
function credentials() {
  if (!env.MINIO_ENDPOINT || !env.MINIO_ACCESS_KEY || !env.MINIO_SECRET_KEY) throw new AppError("CONFIGURATION_REQUIRED", "Media storage is not configured", 503);
  return { endpoint:new URL(env.MINIO_ENDPOINT), accessKey:env.MINIO_ACCESS_KEY, secretKey:env.MINIO_SECRET_KEY, bucket:env.MINIO_BUCKET, region:env.MINIO_REGION };
}
function amzDate(date:Date){return date.toISOString().replace(/[:-]|\.\d{3}/g,"");}
function dateStamp(date:Date){return amzDate(date).slice(0,8);}
function signKey(secret:string,date:string,region:string){const kDate=hmac(`AWS4${secret}`,date);const kRegion=hmac(kDate,region);const kService=hmac(kRegion,"s3");return hmac(kService,"aws4_request");}
export function presignObject(input:{method:"PUT"|"GET"|"HEAD";objectKey:string;expiresSeconds?:number}){
  const c=credentials();const now=new Date();const stamp=dateStamp(now);const iso=amzDate(now);const scope=`${stamp}/${c.region}/s3/aws4_request`;const pathBase=c.endpoint.pathname.replace(/\/$/,"");const canonicalUri=`${pathBase}/${encodeURIComponent(c.bucket)}/${encodePath(input.objectKey)}`.replace(/\/+/g,"/");const expires=Math.max(60,Math.min(3600,input.expiresSeconds??900));
  const params=new URLSearchParams({"X-Amz-Algorithm":"AWS4-HMAC-SHA256","X-Amz-Credential":`${c.accessKey}/${scope}`,"X-Amz-Date":iso,"X-Amz-Expires":String(expires),"X-Amz-SignedHeaders":"host"});
  const canonicalQuery=[...params.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");const canonicalHeaders=`host:${c.endpoint.host}\n`;const request=[input.method,canonicalUri,canonicalQuery,canonicalHeaders,"host","UNSIGNED-PAYLOAD"].join("\n");const stringToSign=["AWS4-HMAC-SHA256",iso,scope,sha256(request)].join("\n");const signature=createHmac("sha256",signKey(c.secretKey,stamp,c.region)).update(stringToSign).digest("hex");params.set("X-Amz-Signature",signature);return `${c.endpoint.origin}${canonicalUri}?${params.toString()}`;
}
