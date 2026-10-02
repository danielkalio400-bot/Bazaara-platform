import type { Prisma } from "@bazaara/db";

export async function appendOutboxEvent(tx: Prisma.TransactionClient, input: {
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: Prisma.InputJsonValue;
}) {
  return tx.outboxEvent.create({ data: input });
}
