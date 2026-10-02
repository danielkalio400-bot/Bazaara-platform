import { db, Prisma } from "@bazaara/db";

export async function audit(input: {
  actorUserId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  requestId?: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}) {
  const data: Prisma.AuditLogUncheckedCreateInput = {
    actorUserId: input.actorUserId,
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    requestId: input.requestId,
    ipAddress: input.ipAddress,
    metadata: input.metadata as Prisma.InputJsonObject | undefined,
  };
  await db.auditLog.create({ data });
}
