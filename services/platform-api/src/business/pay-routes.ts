import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { db } from "@bazaara/db";
import { requireAuth } from "../auth.js";
import { AppError } from "../errors.js";
import { audit } from "../audit.js";
import { ensureOrganizationWallet,getOrganizationPaySummary,listUserBusinessPayAccounts,payoutBusinessToPersonal } from "./pay-service.js";

async function access(request:FastifyRequest,organizationId:string,write=false){
  const auth=await requireAuth(request);
  const m=await db.organizationMember.findUnique({where:{organizationId_userId:{organizationId,userId:auth.userId}},select:{status:true,roleKey:true,permissions:true}});
  if(!m||m.status!=="ACTIVE") throw new AppError("FORBIDDEN","Active organization membership required",403);
  if(write&&!((["OWNER","ADMIN"].includes(m.roleKey))||m.permissions.includes("payout.manage")||m.permissions.includes("finance.manage"))) throw new AppError("FORBIDDEN","Owner, admin or finance payout permission required",403);
  return auth;
}
export async function businessPayRoutes(app:FastifyInstance){
  app.get("/v1/business/organizations/:organizationId/pay",async request=>{
    const {organizationId}=z.object({organizationId:z.string().min(1)}).parse(request.params);await access(request,organizationId);return getOrganizationPaySummary(organizationId);
  });
  app.post("/v1/business/organizations/:organizationId/pay/link",async request=>{
    const {organizationId}=z.object({organizationId:z.string().min(1)}).parse(request.params);
    const auth=await access(request,organizationId,true);
    const existing=await getOrganizationPaySummary(organizationId);
    if(existing.linked){
      await audit({actorUserId:auth.userId,action:"business.pay.link.noop",resourceType:"Organization",resourceId:organizationId,requestId:request.id,ipAddress:request.ip,metadata:{walletId:existing.wallet?.id??null,actionState:"ALREADY_DONE"}});
      return {...existing,actionState:"ALREADY_DONE" as const};
    }
    const {wallet}=await ensureOrganizationWallet(organizationId);
    await audit({actorUserId:auth.userId,action:"business.pay.linked",resourceType:"Organization",resourceId:organizationId,requestId:request.id,ipAddress:request.ip,metadata:{walletId:wallet.id,actionState:"COMPLETED"}});
    return {...await getOrganizationPaySummary(organizationId),actionState:"COMPLETED" as const};
  });
  app.post("/v1/business/organizations/:organizationId/pay/payout-to-personal",{config:{rateLimit:{max:12,timeWindow:"15 minutes"}}},async request=>{
    const {organizationId}=z.object({organizationId:z.string().min(1)}).parse(request.params);const input=z.object({amountMinor:z.number().int().min(10000).max(500000000),pin:z.string().regex(/^\d{6}$/)}).parse(request.body);const auth=await access(request,organizationId,true);
    const result=await payoutBusinessToPersonal({organizationId,userId:auth.userId,amountMinor:input.amountMinor,pin:input.pin,idempotencyKey:request.headers["idempotency-key"]?.toString()??randomUUID()});
    await audit({actorUserId:auth.userId,action:"business.pay.payout-to-personal",resourceType:"Organization",resourceId:organizationId,requestId:request.id,ipAddress:request.ip,metadata:{amountMinor:input.amountMinor,reference:result.reference}});
    return result;
  });
  app.get("/v1/pay/business-accounts",async request=>{const auth=await requireAuth(request);return{accounts:await listUserBusinessPayAccounts(auth.userId)};});
  app.get("/v1/pay/business-accounts/:organizationId/activity",async request=>{const {organizationId}=z.object({organizationId:z.string().min(1)}).parse(request.params);await access(request,organizationId);return getOrganizationPaySummary(organizationId);});
}
