import { EventEmitter } from "node:events";

export type SupportLiveEvent = {
  caseId: string;
  type: "CASE_UPDATED" | "MESSAGE_ADDED" | "CONTACT_UPDATED";
  at: string;
};

const emitter = new EventEmitter();
emitter.setMaxListeners(1000);

export function publishSupportLiveEvent(caseId: string, type: SupportLiveEvent["type"] = "CASE_UPDATED") {
  const event: SupportLiveEvent = { caseId, type, at: new Date().toISOString() };
  emitter.emit(caseId, event);
}

export function subscribeSupportLiveEvent(caseId: string, listener: (event: SupportLiveEvent) => void) {
  emitter.on(caseId, listener);
  return () => emitter.off(caseId, listener);
}
