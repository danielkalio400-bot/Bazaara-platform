import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db, Prisma } from "@bazaara/db";
import { AppError } from "../errors.js";
import { requireSocialAuth } from "./common.js";
import { mediaUrl, ownedReadyAsset, readyAsset, serializeAsset } from "../media/access.js";

const id = z.string().min(5).max(64);
const editPlanSchema = z.object({
  startMs: z.number().int().min(0).default(0),
  endMs: z.number().int().positive(),
  brightness: z.number().int().min(50).max(150).default(100),
  contrast: z.number().int().min(50).max(150).default(100),
  aspectRatio: z.enum(["ORIGINAL", "9:16", "1:1", "16:9"]).default("ORIGINAL"),
  playbackRate: z.number().min(0.25).max(2).default(1),
  muted: z.boolean().default(false),
  captions: z.array(z.object({ startMs: z.number().int().min(0), endMs: z.number().int().positive(), text: z.string().trim().min(1).max(300) }).strict()).max(200).default([]),
}).strict().refine((value) => value.endMs > value.startMs, { message: "End must be after start", path: ["endMs"] });

async function projectContract(row: { id:string; ownerUserId:string; sourceAssetId:string|null; title:string; editPlan:Prisma.JsonValue; status:string; createdAt:Date; updatedAt:Date }) {
  let source: { id:string; mediaType:string; contentType:string; byteSize:number; visibility:string; url:string } | null = null;
  if (row.sourceAssetId) {
    try {
      const asset = await readyAsset(row.sourceAssetId);
      if (asset.ownerUserId === row.ownerUserId) source = { ...serializeAsset(asset), url: mediaUrl(asset, 1200) };
    } catch { source = null; }
  }
  return { ...row, source };
}

export async function bazcutRoutes(app: FastifyInstance) {
  app.get("/v1/bazcut/projects", async (request) => {
    const { userId } = await requireSocialAuth(request);
    const rows = await db.cutProject.findMany({ where: { ownerUserId: userId, status: { not: "ARCHIVED" } }, orderBy: { updatedAt: "desc" }, take: 100 });
    return { projects: await Promise.all(rows.map(projectContract)) };
  });

  app.post("/v1/bazcut/projects", { config: { rateLimit: { max: 30, timeWindow: "1 hour" } } }, async (request, reply) => {
    const { userId } = await requireSocialAuth(request);
    const input = z.object({ sourceAssetId: id.optional(), title: z.string().trim().min(1).max(160), editPlan: editPlanSchema }).strict().parse(request.body);
    if (input.sourceAssetId) await ownedReadyAsset(userId, input.sourceAssetId, ["video/"]);
    const row = await db.cutProject.create({ data: { ownerUserId: userId, sourceAssetId: input.sourceAssetId, title: input.title, editPlan: input.editPlan as Prisma.InputJsonValue } });
    return reply.code(201).send({ project: await projectContract(row) });
  });

  app.patch("/v1/bazcut/projects/:projectId", async (request) => {
    const { userId } = await requireSocialAuth(request);
    const { projectId } = z.object({ projectId: id }).parse(request.params);
    const input = z.object({ title: z.string().trim().min(1).max(160).optional(), editPlan: editPlanSchema.optional(), status: z.enum(["DRAFT", "READY", "ARCHIVED"]).optional() }).strict().parse(request.body);
    const existing = await db.cutProject.findFirst({ where: { id: projectId, ownerUserId: userId }, select: { id: true } });
    if (!existing) throw new AppError("NOT_FOUND", "Project not found", 404);
    const row = await db.cutProject.update({ where: { id: projectId }, data: { title: input.title, editPlan: input.editPlan as Prisma.InputJsonValue | undefined, status: input.status } });
    return { project: await projectContract(row) };
  });

  app.delete("/v1/bazcut/projects/:projectId", async (request) => {
    const { userId } = await requireSocialAuth(request);
    const { projectId } = z.object({ projectId: id }).parse(request.params);
    const result = await db.cutProject.updateMany({ where: { id: projectId, ownerUserId: userId }, data: { status: "ARCHIVED" } });
    if (!result.count) throw new AppError("NOT_FOUND", "Project not found", 404);
    return { archived: true };
  });
}
