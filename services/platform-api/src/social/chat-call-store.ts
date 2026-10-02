/** Single-process DEVELOPMENT signaling store. No call recordings or media are stored here.
 * A distributed Redis-backed signaling service + TURN is mandatory before production deployment.
 */
export type CallMode = "audio" | "video";
export type CallStatus = "RINGING" | "ACTIVE" | "DECLINED" | "ENDED" | "MISSED";
export type Signal =
  | { type: "description"; sdpType: "offer" | "answer"; sdp: string }
  | { type: "candidate"; candidate: string; sdpMid?: string | null; sdpMLineIndex?: number | null };
export type CallSignal = { sequence: number; senderUserId: string; payload: Signal };
export type CallRecord = {
  id: string; conversationId: string; callerUserId: string; recipientUserId: string;
  mode: CallMode; status: CallStatus; createdAt: number; updatedAt: number;
  endedAt: number | null; sequence: number; signals: CallSignal[];
};
const RINGING_MS = 65_000;
const ACTIVE_IDLE_MS = 2 * 60 * 60_000;
const RETAIN_ENDED_MS = 5 * 60_000;
const MAX_CALLS = 500;
const MAX_SIGNALS = 1200;

export class CallStore {
  private readonly calls = new Map<string, CallRecord>();
  private readonly clock: () => number;
  private readonly id: () => string;
  constructor(clock: () => number = () => Date.now(), id: () => string = () => crypto.randomUUID()) { this.clock = clock; this.id = id; }
  prune(): void {
    const now = this.clock();
    for (const [id, call] of this.calls) {
      if (call.status === "RINGING" && now - call.createdAt > RINGING_MS) this.finish(id, "MISSED");
      if (call.status === "ACTIVE" && now - call.updatedAt > ACTIVE_IDLE_MS) this.finish(id, "ENDED");
      if (call.endedAt !== null && now - call.endedAt > RETAIN_ENDED_MS) this.calls.delete(id);
    }
  }
  create(conversationId: string, callerUserId: string, recipientUserId: string, mode: CallMode): CallRecord {
    this.prune();
    if (this.calls.size >= MAX_CALLS) throw new Error("CALL_CAPACITY");
    if (this.list(callerUserId).some(c => c.status === "RINGING" || c.status === "ACTIVE") ||
        this.list(recipientUserId).some(c => c.status === "RINGING" || c.status === "ACTIVE")) throw new Error("CALL_BUSY");
    if (callerUserId === recipientUserId) throw new Error("SELF_CALL");
    const now = this.clock();
    const call: CallRecord = { id: this.id(), conversationId, callerUserId, recipientUserId, mode,
      status: "RINGING", createdAt: now, updatedAt: now, endedAt: null, sequence: 0, signals: [] };
    this.calls.set(call.id, call);
    return call;
  }
  get(callId: string, userId: string): CallRecord | null {
    this.prune();
    const call = this.calls.get(callId);
    return call && (call.callerUserId === userId || call.recipientUserId === userId) ? call : null;
  }
  list(userId: string): CallRecord[] {
    this.prune();
    return [...this.calls.values()].filter(c => c.callerUserId === userId || c.recipientUserId === userId)
      .sort((a,b)=> b.createdAt-a.createdAt).slice(0,20);
  }
  accept(callId: string, userId: string): CallRecord | null {
    const call = this.get(callId, userId);
    if (!call || call.recipientUserId !== userId || call.status !== "RINGING") return null;
    call.status = "ACTIVE"; call.updatedAt = this.clock();
    return call;
  }
  decline(callId: string, userId: string): CallRecord | null {
    const call = this.get(callId, userId);
    if (!call || call.recipientUserId !== userId || call.status !== "RINGING") return null;
    return this.finish(callId, "DECLINED");
  }
  finish(callId: string, status: Extract<CallStatus,"DECLINED" | "ENDED" | "MISSED">): CallRecord | null {
    const call = this.calls.get(callId);
    if (!call || (call.status !== "RINGING" && call.status !== "ACTIVE")) return null;
    call.status = status; call.endedAt = this.clock(); call.updatedAt = call.endedAt;
    // Session descriptions/ICE candidates contain sensitive network metadata; purge promptly.
    call.signals = [];
    return call;
  }
  signal(callId: string, userId: string, payload: Signal): CallSignal | null {
    const call = this.get(callId, userId);
    if (!call || call.status !== "ACTIVE") return null;
    const item = { sequence: ++call.sequence, senderUserId: userId, payload };
    call.signals.push(item);
    if (call.signals.length > MAX_SIGNALS) call.signals.splice(0,call.signals.length-MAX_SIGNALS);
    call.updatedAt = this.clock();
    return item;
  }
  signals(callId: string, userId: string, after: number): {signals:CallSignal[];cursor:number;overflow:boolean} | null {
    const call = this.get(callId,userId);
    if (!call || call.status !== "ACTIVE") return null;
    call.updatedAt = this.clock();
    const first = call.signals[0]?.sequence ?? call.sequence+1;
    const signals = call.signals.filter(x => x.sequence > after && x.senderUserId !== userId).slice(0,100);
    // The client must catch up by repeatedly querying until the returned array is empty.
    const cursor = signals.at(-1)?.sequence ?? call.sequence;
    return {signals,cursor,overflow:after > 0 && after < first - 1};
  }
}
