import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db, Prisma } from "@bazaara/db";
import type { PublicPlatformConfigContract } from "@bazaara/contracts";
import { requireAuth, resolveAuth } from "../auth.js";
import { requirePermission } from "../authorization.js";
import { AppError } from "../errors.js";
import { env } from "../config.js";
import { presignObject } from "../media/s3-signing.js";

const analyticsSchema=z.object({eventName:z.string().trim().min(2).max(120),sessionId:z.string().trim().max(200).optional(),vertical:z.string().trim().max(40).optional(),region:z.string().trim().max(32).optional(),properties:z.unknown().optional(),occurredAt:z.string().datetime().optional()});
const consentSchema=z.object({purpose:z.string().trim().min(2).max(120),granted:z.boolean(),policyVersion:z.string().trim().min(1).max(80),source:z.string().trim().min(1).max(80),region:z.string().trim().max(32).optional(),evidence:z.unknown().optional()});
const dataRequestSchema=z.object({type:z.enum(["ACCESS","EXPORT","DELETE","RECTIFY","RESTRICT"]),region:z.string().trim().max(32).optional(),notes:z.string().trim().max(2000).optional()});
const mediaSchema=z.object({contentType:z.string().trim().regex(/^[\w.+-]+\/[\w.+-]+$/),byteSize:z.number().int().positive().max(250*1024*1024),visibility:z.enum(["PRIVATE","PUBLIC"]).default("PRIVATE")});
const completeMediaSchema=z.object({checksumSha256:z.string().regex(/^[a-fA-F0-9]{64}$/).optional()});

export async function platformRoutes(app:FastifyInstance){
  app.get("/v1/platform/config",async():Promise<PublicPlatformConfigContract>=>{const flags=await db.featureFlag.findMany();const regional=await db.regionalConfig.findUnique({where:{region_vertical:{region:env.REGION,vertical:"platform"}}});return{region:env.REGION,currency:regional?.currency??env.CURRENCY,locale:regional?.locale??env.LOCALE,timezone:regional?.timezone??env.TIMEZONE,pharmacyPrescriptionEnabled:env.PHARMACY_PRESCRIPTION_ENABLED,sportsRealMoneyBettingEnabled:false,features:Object.fromEntries(flags.map(f=>[f.key,f.enabled]))};});
  app.get("/v1/platform/feature-flags",async()=>({flags:(await db.featureFlag.findMany({orderBy:{key:"asc"}})).map(f=>({key:f.key,description:f.description,enabled:f.enabled,rules:f.rules,updatedAt:f.updatedAt.toISOString()}))}));
  app.patch("/v1/platform/feature-flags/:key",async request=>{await requirePermission(request,"admin.feature_flags");const{key}=z.object({key:z.string().min(2).max(120)}).parse(request.params);const input=z.object({enabled:z.boolean(),description:z.string().max(500).optional(),rules:z.unknown().optional()}).parse(request.body);const flag=await db.featureFlag.upsert({where:{key},create:{key,enabled:input.enabled,description:input.description,rules:input.rules as Prisma.InputJsonValue|undefined},update:{enabled:input.enabled,description:input.description,rules:input.rules as Prisma.InputJsonValue|undefined}});return{flag};});

  app.post("/v1/analytics/events",async(request,reply)=>{if(!env.ANALYTICS_ENABLED)return reply.code(204).send();const input=analyticsSchema.parse(request.body);const auth=await resolveAuth(request);await db.analyticsEvent.create({data:{userId:auth?.userId,sessionId:input.sessionId,eventName:input.eventName,vertical:input.vertical,region:input.region??env.REGION,properties:input.properties as Prisma.InputJsonValue|undefined,occurredAt:input.occurredAt?new Date(input.occurredAt):new Date()}});return reply.code(202).send({accepted:true});});

  app.get("/v1/privacy/consents",async request=>{const auth=await requireAuth(request);const rows=await db.consentRecord.findMany({where:{userId:auth.userId},orderBy:{createdAt:"desc"}});return{consents:rows};});
  app.post("/v1/privacy/consents",async(request,reply)=>{const auth=await requireAuth(request);const input=consentSchema.parse(request.body);const row=await db.consentRecord.create({data:{userId:auth.userId,purpose:input.purpose,granted:input.granted,policyVersion:input.policyVersion,source:input.source,region:input.region??env.REGION,evidence:input.evidence as Prisma.InputJsonValue|undefined}});return reply.code(201).send({consent:row});});
  app.post("/v1/privacy/data-requests",async(request,reply)=>{const auth=await requireAuth(request);const input=dataRequestSchema.parse(request.body);const dueDays=input.type==="DELETE"?30:30;const row=await db.dataSubjectRequest.create({data:{userId:auth.userId,type:input.type,region:input.region??env.REGION,dueAt:new Date(Date.now()+dueDays*86400_000),notes:input.notes}});return reply.code(201).send({request:{...row,dueAt:row.dueAt.toISOString(),createdAt:row.createdAt.toISOString(),updatedAt:row.updatedAt.toISOString()}});});
  app.get("/v1/privacy/data-requests",async request=>{const auth=await requireAuth(request);return{requests:await db.dataSubjectRequest.findMany({where:{userId:auth.userId},orderBy:{createdAt:"desc"}})};});

  app.get("/v1/loyalty/me",async request=>{const auth=await requireAuth(request);const account=await db.loyaltyAccount.upsert({where:{userId:auth.userId},create:{userId:auth.userId},update:{},include:{entries:{orderBy:{createdAt:"desc"},take:50}}});return{account:{id:account.id,points:Number(account.points),tier:account.tier,entries:account.entries.map(e=>({...e,points:Number(e.points)}))}};});

  app.post("/v1/media/uploads",async(request,reply)=>{const auth=await requireAuth(request);const input=mediaSchema.parse(request.body);const ext={"image/jpeg":"jpg","image/png":"png","image/webp":"webp","application/pdf":"pdf","video/mp4":"mp4","video/webm":"webm","video/quicktime":"mov","audio/mpeg":"mp3","audio/mp4":"m4a","audio/wav":"wav","audio/ogg":"ogg"}[input.contentType]??"bin";const objectKey=`users/${auth.userId}/${new Date().toISOString().slice(0,10)}/${crypto.randomUUID()}.${ext}`;const mediaType=input.contentType.startsWith("image/")?"IMAGE":input.contentType.startsWith("video/")?"VIDEO":input.contentType.startsWith("audio/")?"AUDIO":"DOCUMENT";const asset=await db.mediaAsset.create({data:{ownerUserId:auth.userId,bucket:env.MINIO_BUCKET,objectKey,mediaType,contentType:input.contentType,byteSize:BigInt(input.byteSize),visibility:input.visibility}});const uploadUrl=presignObject({method:"PUT",objectKey,expiresSeconds:900});return reply.code(201).send({asset:{id:asset.id,status:asset.status,objectKey:asset.objectKey},upload:{method:"PUT",url:uploadUrl,headers:{"content-type":input.contentType},expiresInSeconds:900}});});

  app.get("/v1/media/public/:id", async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const asset = await db.mediaAsset.findUnique({ where: { id } });
    if (!asset || asset.status !== "READY" || asset.visibility !== "PUBLIC") {
      throw new AppError("NOT_FOUND", "Public media asset not found", 404);
    }
    const url = presignObject({ method: "GET", objectKey: asset.objectKey, expiresSeconds: 300 });
    return reply.redirect(url);
  });

  app.post("/v1/media/:id/complete",async request=>{const auth=await requireAuth(request);const{id}=z.object({id:z.string()}).parse(request.params);const input=completeMediaSchema.parse(request.body);const asset=await db.mediaAsset.findUnique({where:{id}});if(!asset||asset.ownerUserId!==auth.userId)throw new AppError("NOT_FOUND","Media asset not found",404);const headUrl=presignObject({method:"HEAD",objectKey:asset.objectKey,expiresSeconds:60});const head=await fetch(headUrl,{method:"HEAD"});if(!head.ok)throw new AppError("UPLOAD_NOT_FOUND","Uploaded object could not be verified",409);const length=Number(head.headers.get("content-length")??"-1");if(length!==Number(asset.byteSize))throw new AppError("UPLOAD_SIZE_MISMATCH","Uploaded object size does not match the reservation",409);const updated=await db.mediaAsset.update({where:{id},data:{status:"READY",checksumSha256:input.checksumSha256}});const publicUrl=updated.visibility==="PUBLIC"&&env.CDN_BASE_URL?`${env.CDN_BASE_URL.replace(/\/$/,"")}/${updated.objectKey}`:null;return{asset:{id:updated.id,status:updated.status,publicUrl}};});
}
