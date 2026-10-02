import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAuth } from "../auth.js";
import { AppError } from "../errors.js";
import { env } from "../config.js";
import { createPayFundingIntent, listPayFundingIntents, reconcilePayFundingIntent } from "./funding.js";
import { addBankAccount, cancelLoanApplication, cancelMoneyRequest, createFixedSavings, createLoanApplication, createMoneyRequest, createWalletTransfer, createWithdrawal, getMoneyRequestByCode, listActivity, listBankAccounts, listBanks, listBeneficiaries, listFixedSavings, listLoanApplications, listMoneyRequests, listTransfers, listWithdrawals, payMoneyRequest, payOverview, payProfileContract, quotePayTransferFee, reconcileWithdrawal, releaseFixedSavings, removeBeneficiary, resetTestWallet, resolveRecipient, saveBeneficiary, setPayPin, walletContract } from "./service.js";

const money = z.number().int().positive().max(100_000_000);
const currency = z.string().regex(/^[A-Z]{3}$/).default("NGN");
const fundingSchema=z.object({amountMinor:z.number().int().min(10_000).max(100_000_000),currency,paymentMethod:z.enum(["PAYSTACK_CARD","PAYSTACK_BANK"])});
const transferSchema=z.object({toWalletId:z.string().min(1).optional(),recipient:z.string().trim().min(2).max(180).optional(),amountMinor:money,currency,note:z.string().trim().max(180).optional(),pin:z.string().regex(/^\d{6}$/)}).refine(v=>Boolean(v.toWalletId||v.recipient),{message:"Recipient is required"});
const requestSchema=z.object({recipient:z.string().trim().max(180).optional(),amountMinor:money,currency,note:z.string().trim().max(180).optional()});
const pinSchema=z.object({password:z.string().min(8).max(200),pin:z.string().regex(/^\d{6}$/)});
const bankSchema=z.object({bankCode:z.string().min(2).max(20),bankName:z.string().min(2).max(120),accountNumber:z.string().regex(/^\d{10}$/)});
const withdrawalSchema=z.object({bankAccountId:z.string().min(1),amountMinor:z.number().int().min(10_000).max(100_000_000),currency,pin:z.string().regex(/^\d{6}$/)});
const savingsSchema=z.object({name:z.string().trim().min(1).max(80),amountMinor:z.number().int().positive().max(100_000_000_000),currency,durationDays:z.number().int().min(7).max(730),pin:z.string().regex(/^\d{6}$/)});
const loanSchema=z.object({requestedMinor:z.number().int().positive().max(100_000_000_000),currency,termDays:z.number().int().min(7).max(1095),purpose:z.string().trim().max(180).optional(),pledgedSavingsId:z.string().min(1).optional()});
function key(request:any){const value=request.headers["idempotency-key"]?.toString().trim();if(!value||value.length<8)throw new AppError("BAD_REQUEST","Idempotency-Key is required",400);return value;}

export async function payRoutes(app:FastifyInstance){
  app.get("/v1/pay/capabilities",async()=>({walletTransfers:true,ledgerBacked:true,recipientLookup:true,moneyRequests:true,paymentLinks:true,payPin:true,beneficiaries:true,fixedSavings:true,partnerLoans:true,savingsBackedLoanApplications:true,bankWithdrawals:Boolean(env.PAYSTACK_SECRET_KEY&&env.PAYSTACK_TRANSFERS_ENABLED),externalFundingProviderConfigured:Boolean(env.PAYSTACK_SECRET_KEY),fundingMethods:env.PAYSTACK_SECRET_KEY?["PAYSTACK_CARD","PAYSTACK_BANK"]:[],p2pFeeBps:env.PAY_P2P_FEE_BPS,p2pFeeMinMinor:env.PAY_P2P_FEE_MIN_MINOR,p2pFeeMaxMinor:env.PAY_P2P_FEE_MAX_MINOR,testMode:env.PAY_TEST_MODE&&env.NODE_ENV!=="production",testBalanceMinor:env.PAY_TEST_BALANCE_MINOR,productionMoneyMovementRequiresProviderOnboarding:true,realSavingsYieldRequiresLicensedDepositPartner:true,realLoanOffersRequireApprovedLendingPartner:true}));
  app.get("/v1/pay/fees/quote",async request=>{await requireAuth(request);const q=z.object({amountMinor:z.coerce.number().int().positive().max(100_000_000_000),currency:currency.optional()}).parse(request.query);return{quote:quotePayTransferFee(q.amountMinor,q.currency??env.CURRENCY)};});
  app.post("/v1/pay/test-wallet/reset",async request=>{const auth=await requireAuth(request);return{wallet:await resetTestWallet(auth.userId)};});
  app.get("/v1/pay/savings",async request=>{const auth=await requireAuth(request);return{savings:await listFixedSavings(auth.userId)};});
  app.post("/v1/pay/savings",async(request,reply)=>{const auth=await requireAuth(request);return reply.code(201).send({savings:await createFixedSavings({userId:auth.userId,...savingsSchema.parse(request.body)})});});
  app.post("/v1/pay/savings/:id/release",async request=>{const auth=await requireAuth(request);const input=z.object({pin:z.string().regex(/^\d{6}$/)}).parse(request.body);return{savings:await releaseFixedSavings({userId:auth.userId,savingsId:(request.params as any).id,pin:input.pin})};});
  app.get("/v1/pay/loan-applications",async request=>{const auth=await requireAuth(request);return{loans:await listLoanApplications(auth.userId)};});
  app.post("/v1/pay/loan-applications",async(request,reply)=>{const auth=await requireAuth(request);return reply.code(201).send({loan:await createLoanApplication({userId:auth.userId,...loanSchema.parse(request.body)})});});
  app.post("/v1/pay/loan-applications/:id/cancel",async request=>{const auth=await requireAuth(request);return{loan:await cancelLoanApplication(auth.userId,(request.params as any).id)};});
  app.get("/v1/pay/overview",async request=>{const auth=await requireAuth(request);return payOverview(auth.userId);});
  app.get("/v1/pay/wallets",async request=>{const auth=await requireAuth(request);return{wallets:[await walletContract(auth.userId)]};});
  app.get("/v1/pay/profile",async request=>{const auth=await requireAuth(request);return{profile:await payProfileContract(auth.userId)};});
  app.post("/v1/pay/security/pin",{config:{rateLimit:{max:8,timeWindow:"15 minutes"}}},async request=>{const auth=await requireAuth(request);const input=pinSchema.parse(request.body);return{profile:await setPayPin({userId:auth.userId,...input})};});
  app.get("/v1/pay/recipients/resolve",async request=>{await requireAuth(request);const q=z.object({q:z.string().min(2).max(180),currency:currency.optional()}).parse(request.query);return{recipient:await resolveRecipient(q.q,q.currency??env.CURRENCY)};});
  app.post("/v1/pay/transfers",{config:{rateLimit:{max:30,timeWindow:"5 minutes"}}},async(request,reply)=>{const auth=await requireAuth(request);const input=transferSchema.parse(request.body);const recipient=input.toWalletId?{walletId:input.toWalletId}:await resolveRecipient(input.recipient!,input.currency);const transfer=await createWalletTransfer({userId:auth.userId,toWalletId:recipient.walletId,amountMinor:input.amountMinor,currency:input.currency,note:input.note,pin:input.pin,idempotencyKey:key(request)});return reply.code(201).send(transfer);});
  app.get("/v1/pay/transfers",async request=>{const auth=await requireAuth(request);return{transfers:await listTransfers(auth.userId)};});
  app.get("/v1/pay/activity",async request=>{const auth=await requireAuth(request);return{activity:await listActivity(auth.userId)};});
  app.get("/v1/pay/beneficiaries",async request=>{const auth=await requireAuth(request);return{beneficiaries:await listBeneficiaries(auth.userId)};});
  app.post("/v1/pay/beneficiaries",async request=>{const auth=await requireAuth(request);const input=z.object({walletId:z.string().min(1),label:z.string().trim().max(60).optional()}).parse(request.body);return{beneficiaries:await saveBeneficiary({userId:auth.userId,...input})};});
  app.delete("/v1/pay/beneficiaries/:id",async request=>{const auth=await requireAuth(request);return{beneficiaries:await removeBeneficiary(auth.userId,(request.params as any).id)};});
  app.post("/v1/pay/requests",async(request,reply)=>{const auth=await requireAuth(request);const input=requestSchema.parse(request.body);return reply.code(201).send({request:await createMoneyRequest({userId:auth.userId,...input})});});
  app.get("/v1/pay/requests",async request=>{const auth=await requireAuth(request);return{requests:await listMoneyRequests(auth.userId)};});
  app.get("/v1/pay/requests/code/:code",async request=>({request:await getMoneyRequestByCode((request.params as any).code)}));
  app.post("/v1/pay/requests/:id/pay",async request=>{const auth=await requireAuth(request);const input=z.object({pin:z.string().regex(/^\d{6}$/)}).parse(request.body);return{request:await payMoneyRequest({userId:auth.userId,requestId:(request.params as any).id,pin:input.pin,idempotencyKey:key(request)})};});
  app.post("/v1/pay/requests/:id/cancel",async request=>{const auth=await requireAuth(request);return{request:await cancelMoneyRequest(auth.userId,(request.params as any).id)};});
  app.post("/v1/pay/funding-intents",async(request,reply)=>{const auth=await requireAuth(request);const input=fundingSchema.parse(request.body);const result=await createPayFundingIntent({userId:auth.userId,idempotencyKey:key(request),...input});return reply.code(result.replayed?200:201).send(result);});
  app.get("/v1/pay/funding-intents",async request=>{const auth=await requireAuth(request);return listPayFundingIntents(auth.userId);});
  app.post("/v1/pay/funding-intents/:fundingIntentId/reconcile",async request=>{const auth=await requireAuth(request);return reconcilePayFundingIntent({userId:auth.userId,fundingIntentId:(request.params as any).fundingIntentId});});
  app.get("/v1/pay/banks",async request=>{await requireAuth(request);return{banks:await listBanks()};});
  app.get("/v1/pay/bank-accounts",async request=>{const auth=await requireAuth(request);return{bankAccounts:await listBankAccounts(auth.userId)};});
  app.post("/v1/pay/bank-accounts",async(request,reply)=>{const auth=await requireAuth(request);return reply.code(201).send({bankAccount:await addBankAccount({userId:auth.userId,...bankSchema.parse(request.body)})});});
  app.get("/v1/pay/withdrawals",async request=>{const auth=await requireAuth(request);return{withdrawals:await listWithdrawals(auth.userId)};});
  app.post("/v1/pay/withdrawals",async(request,reply)=>{const auth=await requireAuth(request);const input=withdrawalSchema.parse(request.body);return reply.code(201).send({withdrawal:await createWithdrawal({userId:auth.userId,idempotencyKey:key(request),...input})});});
  app.post("/v1/pay/withdrawals/:id/reconcile",async request=>{const auth=await requireAuth(request);return{withdrawal:await reconcileWithdrawal(auth.userId,(request.params as any).id)};});
}
