import { randomBytes } from "node:crypto";
import { db, Prisma } from "@bazaara/db";
import { postJournal } from "@bazaara/ledger";
import { AppError } from "../errors.js";
import { ensureUserWallet, verifyPayPin } from "../pay/service.js";

function minor(v: bigint) {
  const n = Number(v);
  if (!Number.isSafeInteger(n)) throw new Error("Monetary value exceeds transport range");
  return n;
}
async function balance(accountId: string, tx: Prisma.TransactionClient | typeof db = db) {
  const rows = await tx.ledgerEntry.groupBy({ by:["direction"], where:{accountId}, _sum:{amountMinor:true} });
  let c=0n,d=0n;
  for(const r of rows){ if(r.direction==="CREDIT") c=r._sum.amountMinor??0n; else d=r._sum.amountMinor??0n; }
  return c-d;
}
async function ensureOrgWalletTx(tx: Prisma.TransactionClient, organizationId:string, currency="NGN"){
  const ownerKey=`organization:${organizationId}`;
  let wallet=await tx.wallet.findUnique({where:{ownerKey_currency:{ownerKey,currency}}});
  if(!wallet) wallet=await tx.wallet.create({data:{organizationId,ownerKey,currency,status:"ACTIVE"}});
  let account=await tx.ledgerAccount.findFirst({where:{walletId:wallet.id,currency,kind:"WALLET_LIABILITY"}});
  if(!account) account=await tx.ledgerAccount.create({data:{walletId:wallet.id,code:`wallet:${wallet.id}:${currency}`,currency,kind:"WALLET_LIABILITY"}});
  return {wallet,account};
}
export async function ensureOrganizationWallet(organizationId:string,currency="NGN"){
  return db.$transaction(tx=>ensureOrgWalletTx(tx,organizationId,currency));
}
export async function getOrganizationPaySummary(organizationId:string,currency="NGN"){
  const wallet=await db.wallet.findUnique({where:{ownerKey_currency:{ownerKey:`organization:${organizationId}`,currency}}});
  if(!wallet) return {linked:false,wallet:null,availableMinor:0,currency,activity:[]};
  const account=await db.ledgerAccount.findFirst({where:{walletId:wallet.id,currency,kind:"WALLET_LIABILITY"}});
  const available=account?await balance(account.id):0n;
  const entries=account?await db.ledgerEntry.findMany({where:{accountId:account.id},include:{transaction:true},orderBy:{createdAt:"desc"},take:40}):[];
  return {
    linked:true,
    wallet:{id:wallet.id,ownerKey:wallet.ownerKey,status:wallet.status,currency:wallet.currency},
    availableMinor:minor(available),
    currency:wallet.currency,
    activity:entries.map(e=>({id:e.id,direction:e.direction==="CREDIT"?"IN":"OUT",amountMinor:minor(e.amountMinor),reference:e.transaction.reference,kind:e.transaction.kind,description:e.transaction.description,createdAt:e.createdAt.toISOString()}))
  };
}
export async function listUserBusinessPayAccounts(userId:string){
  const memberships=await db.organizationMember.findMany({
    where:{userId,status:"ACTIVE"},
    select:{organizationId:true,roleKey:true,permissions:true,organization:{select:{id:true,displayName:true,legalName:true,status:true,businessNumber:true}}},
    orderBy:{createdAt:"asc"}
  });
  const out=[];
  for(const m of memberships){
    const pay=await getOrganizationPaySummary(m.organizationId);
    out.push({organizationId:m.organizationId,organizationName:m.organization.displayName,legalName:m.organization.legalName,businessNumber:m.organization.businessNumber,organizationStatus:m.organization.status,roleKey:m.roleKey,permissions:m.permissions,linked:pay.linked,wallet:pay.wallet,availableMinor:pay.availableMinor,currency:pay.currency});
  }
  return out;
}
export async function payoutBusinessToPersonal(input:{organizationId:string;userId:string;amountMinor:number;pin:string;idempotencyKey:string}){
  await verifyPayPin(input.userId,input.pin);
  const member=await db.organizationMember.findUnique({where:{organizationId_userId:{organizationId:input.organizationId,userId:input.userId}},select:{status:true,roleKey:true,permissions:true}});
  if(!member||member.status!=="ACTIVE") throw new AppError("FORBIDDEN","Active business membership required",403);
  if(!(["OWNER","ADMIN"].includes(member.roleKey)||member.permissions.includes("payout.manage")||member.permissions.includes("finance.manage"))) throw new AppError("FORBIDDEN","You do not have permission to withdraw business funds",403);
  if(input.amountMinor<10000) throw new AppError("BAD_REQUEST","Minimum payout is ₦100",400);
  const prior=await db.payTransfer.findFirst({where:{actorUserId:input.userId,idempotencyKey:input.idempotencyKey}});
  if(prior) return {replayed:true,transferId:prior.id,reference:prior.reference,amountMinor:minor(prior.amountMinor),status:prior.status};
  const personal=await ensureUserWallet(input.userId,"NGN");
  const row=await db.$transaction(async tx=>{
    const org=await tx.organization.findUnique({where:{id:input.organizationId},select:{displayName:true}});
    if(!org) throw new AppError("NOT_FOUND","Business organization not found",404);
    const biz=await ensureOrgWalletTx(tx,input.organizationId,"NGN");
    const amount=BigInt(input.amountMinor);
    if(await balance(biz.account.id,tx)<amount) throw new AppError("CONFLICT","Insufficient Business Pay balance",409);
    const reference=`BIZPAY-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;
    const pending=await tx.payTransfer.create({data:{reference,actorUserId:input.userId,fromWalletId:biz.wallet.id,toWalletId:personal.wallet.id,amountMinor:amount,feeMinor:0n,currency:"NGN",status:"PENDING",idempotencyKey:input.idempotencyKey,note:`Business payout from ${org.displayName}`}});
    const journal=await postJournal(tx,{reference:`business-pay-payout:${pending.id}`,kind:"BUSINESS_OWNER_PAYOUT",currency:"NGN",description:`Business Pay payout from ${org.displayName}`,lines:[{accountId:biz.account.id,direction:"DEBIT",amountMinor:amount},{accountId:personal.account.id,direction:"CREDIT",amountMinor:amount}]});
    return tx.payTransfer.update({where:{id:pending.id},data:{status:"COMPLETED",ledgerTransactionId:journal.id,completedAt:new Date()}});
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
  return {replayed:false,transferId:row.id,reference:row.reference,amountMinor:minor(row.amountMinor),status:row.status};
}
export async function settleBusinessSettlementToPay(settlementId:string){
  return db.$transaction(async tx=>{
    const s=await tx.businessSettlement.findUnique({where:{id:settlementId}});
    if(!s) throw new AppError("NOT_FOUND","Business settlement not found",404);
    if(s.status==="SETTLED") return {replayed:true,settlement:{id:s.id,reference:s.reference,status:s.status,netMinor:minor(s.netMinor),currency:s.currency}};
    if(s.netMinor<=0n) throw new AppError("CONFLICT","Settlement has no positive payable amount",409);
    const biz=await ensureOrgWalletTx(tx,s.organizationId,s.currency);
    const ref=`business-settlement:${s.id}`;
    let journal=await tx.ledgerTransaction.findUnique({where:{reference:ref}});
    if(!journal){
      const code=`business:settlement:clearing:${s.currency}`;
      let clearing=await tx.ledgerAccount.findUnique({where:{code}});
      if(!clearing) clearing=await tx.ledgerAccount.create({data:{code,currency:s.currency,kind:"BUSINESS_SETTLEMENT_CLEARING"}});
      journal=await postJournal(tx,{reference:ref,kind:"BUSINESS_SETTLEMENT",currency:s.currency,description:`Settlement ${s.reference} to Business Pay`,lines:[{accountId:clearing.id,direction:"DEBIT",amountMinor:s.netMinor},{accountId:biz.account.id,direction:"CREDIT",amountMinor:s.netMinor}]});
    }
    const updated=await tx.businessSettlement.update({where:{id:s.id},data:{status:"SETTLED",provider:"BAZAARA_PAY",providerRef:journal.id,settledAt:s.settledAt??new Date()}});
    return {replayed:false,walletId:biz.wallet.id,settlement:{id:updated.id,reference:updated.reference,status:updated.status,netMinor:minor(updated.netMinor),currency:updated.currency,provider:updated.provider,providerRef:updated.providerRef,settledAt:updated.settledAt?.toISOString()??null}};
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
}
