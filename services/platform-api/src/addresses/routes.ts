import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "@bazaara/db";
import { requireAuth } from "../auth.js";
import { AppError } from "../errors.js";
import { audit } from "../audit.js";

const addressInput = z.object({
  label: z.string().trim().max(40).nullable().optional(),
  country: z.string().trim().length(2).default("NG"),
  region: z.string().trim().max(100).nullable().optional(),
  city: z.string().trim().min(1).max(120),
  district: z.string().trim().max(120).nullable().optional(),
  street: z.string().trim().max(180).nullable().optional(),
  building: z.string().trim().max(120).nullable().optional(),
  unit: z.string().trim().max(80).nullable().optional(),
  postcode: z.string().trim().max(30).nullable().optional(),
  landmark: z.string().trim().max(180).nullable().optional(),
  deliveryInstructions: z.string().trim().max(500).nullable().optional(),
  latitude: z.coerce.number().min(-90).max(90).nullable().optional(),
  longitude: z.coerce.number().min(-180).max(180).nullable().optional(),
  placeIdentifier: z.string().trim().max(240).nullable().optional(),
  contactPhone: z.string().trim().max(40).nullable().optional(),
  isApproximate: z.boolean().optional(),
});

const addressPatch = addressInput.partial().refine((value) => Object.keys(value).length > 0, "No changes supplied");

function serializeAddress(address: any) {
  return {
    id: address.id,
    label: address.label,
    country: address.country,
    region: address.region,
    city: address.city,
    district: address.district,
    street: address.street,
    building: address.building,
    unit: address.unit,
    postcode: address.postcode,
    landmark: address.landmark,
    deliveryInstructions: address.deliveryInstructions,
    latitude: address.latitude == null ? null : Number(address.latitude),
    longitude: address.longitude == null ? null : Number(address.longitude),
    placeIdentifier: address.placeIdentifier,
    contactPhone: address.contactPhone,
    isApproximate: address.isApproximate,
    createdAt: address.createdAt.toISOString(),
    updatedAt: address.updatedAt.toISOString(),
  };
}

export async function addressRoutes(app: FastifyInstance) {
  app.get("/v1/addresses", async (request) => {
    const auth = await requireAuth(request);
    const addresses = await db.address.findMany({ where: { userId: auth.userId }, orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }], take: 50 });
    return { addresses: addresses.map(serializeAddress) };
  });

  app.post("/v1/addresses", async (request, reply) => {
    const auth = await requireAuth(request);
    const input = addressInput.parse(request.body);
    const address = await db.address.create({
      data: {
        userId: auth.userId,
        label: input.label ?? null,
        country: input.country.toUpperCase(),
        region: input.region ?? null,
        city: input.city,
        district: input.district ?? null,
        street: input.street ?? null,
        building: input.building ?? null,
        unit: input.unit ?? null,
        postcode: input.postcode ?? null,
        landmark: input.landmark ?? null,
        deliveryInstructions: input.deliveryInstructions ?? null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        placeIdentifier: input.placeIdentifier ?? null,
        contactPhone: input.contactPhone ?? null,
        isApproximate: input.isApproximate ?? false,
      },
    });
    await audit({ actorUserId: auth.userId, action: "address.created", resourceType: "Address", resourceId: address.id, requestId: request.id, ipAddress: request.ip });
    return reply.code(201).send({ address: serializeAddress(address) });
  });

  app.patch("/v1/addresses/:addressId", async (request) => {
    const auth = await requireAuth(request);
    const { addressId } = request.params as { addressId: string };
    const input = addressPatch.parse(request.body);
    const existing = await db.address.findFirst({ where: { id: addressId, userId: auth.userId } });
    if (!existing) throw new AppError("NOT_FOUND", "Address not found", 404);
    const address = await db.address.update({ where: { id: existing.id }, data: { ...input, ...(input.country ? { country: input.country.toUpperCase() } : {}) } });
    await audit({ actorUserId: auth.userId, action: "address.updated", resourceType: "Address", resourceId: address.id, requestId: request.id, ipAddress: request.ip });
    return { address: serializeAddress(address) };
  });

  app.delete("/v1/addresses/:addressId", async (request, reply) => {
    const auth = await requireAuth(request);
    const { addressId } = request.params as { addressId: string };
    const existing = await db.address.findFirst({ where: { id: addressId, userId: auth.userId } });
    if (!existing) throw new AppError("NOT_FOUND", "Address not found", 404);
    await db.address.delete({ where: { id: existing.id } });
    await audit({ actorUserId: auth.userId, action: "address.deleted", resourceType: "Address", resourceId: existing.id, requestId: request.id, ipAddress: request.ip });
    return reply.code(204).send();
  });
}
