import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "@bazaara/db";
import { AppError } from "../errors.js";
import { requireSocialAuth } from "./common.js";
import { CallStore, type CallRecord } from "./chat-call-store.js";

const store = new CallStore();
const callId = z.object({ callId: z.string().uuid() });
const sig = z.discriminatedUnion("type", [
  z.object({ type: z.literal("description"), sdpType: z.enum(["offer", "answer"]), sdp: z.string().min(1).max(250000) }).strict(),
  z.object({ type: z.literal("candidate"), candidate: z.string().max(12000), sdpMid: z.string().max(200).nullable().optional(),
    sdpMLineIndex: z.number().int().min(0).max(500).nullable().optional() }).strict(),
]);
const err = (message: string, code: 400 | 403 | 404 | 409 = 400) => new AppError(code === 404 ? "NOT_FOUND" : code === 403 ? "FORBIDDEN" : "BAD_REQUEST", message, code);
const publicCall = (c: CallRecord) => ({ id: c.id, conversationId: c.conversationId, callerUserId: c.callerUserId,
  recipientUserId: c.recipientUserId, mode: c.mode, status: c.status,
  createdAt: new Date(c.createdAt).toISOString(), updatedAt: new Date(c.updatedAt).toISOString() });

async function getParticipants(conversationId: string, userId: string): Promise<[string, string]> {
  const participants = await db.chatParticipant.findMany({ where: { conversationId }, select: { userId: true } });
  if (!participants.some(p=>p.userId === userId)) throw err("Conversation not found",404);
  if (participants.length !== 2) throw err("This calling preview supports one-to-one conversations only",409);
  const other = participants.find(p => p.userId !== userId)?.userId;
  if (!other) throw err("Conversation recipient unavailable",409);
  const blocked = await db.socialBlock.findFirst({ where: { OR: [
    { blockerUserId: userId, blockedUserId: other }, { blockerUserId: other, blockedUserId: userId },
  ] }, select: { blockerUserId:true } });
  if (blocked) throw err("Calling is unavailable for this conversation",403);
  return [userId, other];
}

/** Authenticated WebRTC signaling; media travels browser-to-browser and is never carried by the API. */
export async function bchatCallsRoutes(app: FastifyInstance) {
  app.get("/v1/bchat/calls/inbox", { config: { rateLimit: { max: 90, timeWindow: "1 minute" } } }, async (request) => {
    const { userId } = await requireSocialAuth(request);
    return {calls:store.list(userId).map(publicCall), transport:"webrtc", deployment:"single-process-development"};
  });
  app.post("/v1/bchat/calls", { config: { rateLimit: { max: 12, timeWindow: "1 minute" } } }, async (request, reply) => {
    const { userId } = await requireSocialAuth(request);
    const { conversationId, mode } = z.object({ conversationId:z.string().min(5).max(64), mode:z.enum(["audio","video"]) }).strict().parse(request.body);
    const [, recipient] = await getParticipants(conversationId,userId);
    try {return reply.code(201).send({call:publicCall(store.create(conversationId,userId,recipient,mode))});}
    catch (e) {throw err(e instanceof Error && e.message === "CALL_BUSY" ? "A participant is already in a call" : "Calling is temporarily unavailable",409);}
  });
  app.post("/v1/bchat/calls/:callId/accept", { config: { rateLimit: { max: 15, timeWindow: "1 minute" } } }, async (request) => {
    const { userId }=await requireSocialAuth(request);
    const { callId:id }=callId.parse(request.params);
    const call=store.get(id,userId);
    if (!call) throw err("Call not found",404);
    await getParticipants(call.conversationId,userId);
    const accepted=store.accept(id,userId);
    if (!accepted) throw err("This call is no longer ringing",409);
    return {call:publicCall(accepted)};
  });
  app.post("/v1/bchat/calls/:callId/decline", async (request) => {
    const { userId }=await requireSocialAuth(request);
    const { callId:id }=callId.parse(request.params);
    const call=store.get(id,userId);
    if (!call) throw err("Call not found",404);
    const declined=store.decline(id,userId);
    if (!declined) throw err("This call cannot be declined",409);
    return {call:publicCall(declined)};
  });
  app.post("/v1/bchat/calls/:callId/end", async (request) => {
    const { userId }=await requireSocialAuth(request);
    const {callId:id}=callId.parse(request.params);
    const call=store.get(id,userId);
    if (!call) throw err("Call not found",404);
    return {call:publicCall(store.finish(id,"ENDED") ?? call)};
  });
  app.post("/v1/bchat/calls/:callId/signals", { config: { rateLimit: { max: 250, timeWindow: "1 minute" } } }, async (request) => {
    const { userId }=await requireSocialAuth(request);
    const {callId:id}=callId.parse(request.params);
    const parsed=sig.parse(request.body);
    const result=store.signal(id,userId,parsed);
    if (!result) throw err("Call has ended or has not been accepted",409);
    return {accepted:true,sequence:result.sequence};
  });
  app.get("/v1/bchat/calls/:callId/signals", { config: { rateLimit: { max: 130, timeWindow: "1 minute" } } }, async (request) => {
    const { userId }=await requireSocialAuth(request);
    const {callId:id}=callId.parse(request.params);
    const {after}=z.object({after:z.coerce.number().int().min(0).max(1_000_000).default(0)}).parse(request.query);
    const result=store.signals(id,userId,after);
    if (!result) throw err("Call unavailable",404);
    if (result.overflow) throw err("Signaling history expired; restart the call",409);
    return result;
  });
}
