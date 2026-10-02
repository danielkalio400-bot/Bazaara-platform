import { db } from "../src/index";

const presets: Record<string, { name: string; description: string; permissions: string[] }> = {
  "platform.operations.admin": {
    name: "Operations Super Admin",
    description: "Full Operations control-plane access.",
    permissions: [
      "merchant.read","merchant.manage","catalog.read","catalog.manage","inventory.manage",
      "order.read","order.manage","courier.manage","payment.read","payment.refund","payout.manage",
      "promotion.manage","support.manage","risk.read","risk.manage","audit.read","admin.feature_flags",
      "operations.command.read","operations.business.manage","operations.shopping.manage",
      "operations.grocery.manage","operations.food.manage","operations.pharmacy.manage",
      "operations.mobility.manage","operations.pay.manage","operations.risk.manage",
      "operations.support.manage","operations.roles.manage","operations.audit.read",
    ],
  },
  "platform.operations.platform-admin": {
    name: "Platform Admin",
    description: "Platform configuration, command center and business administration without direct money movement.",
    permissions: ["merchant.read","merchant.manage","audit.read","admin.feature_flags","operations.command.read","operations.business.manage","operations.audit.read"],
  },
  "platform.operations.business-kyb": {
    name: "Business & KYB Officer",
    description: "Business verification, activation and merchant administration.",
    permissions: ["merchant.read","merchant.manage","audit.read","operations.business.manage","operations.audit.read"],
  },
  "platform.operations.shopping-grocery": {
    name: "Shopping & Grocery Operations",
    description: "Shopping and Grocery orders, catalog, fulfillment, picking and exception work.",
    permissions: ["merchant.read","catalog.read","catalog.manage","inventory.manage","order.read","order.manage","support.manage","operations.shopping.manage","operations.grocery.manage"],
  },
  "platform.operations.food": {
    name: "Food Operations",
    description: "Restaurant orders, preparation, courier handoff and Food exception resolution.",
    permissions: ["merchant.read","order.read","order.manage","courier.manage","support.manage","operations.food.manage"],
  },
  "platform.operations.pharmacy": {
    name: "Pharmacy Compliance",
    description: "Pharmacy verification, regulated catalog, prescriptions and Pharmacy exceptions.",
    permissions: ["merchant.read","merchant.manage","catalog.read","catalog.manage","inventory.manage","order.read","order.manage","support.manage","operations.pharmacy.manage"],
  },
  "platform.operations.mobility": {
    name: "Mobility & Logistics Operations",
    description: "Drive, GO, courier and Logistics operations.",
    permissions: ["order.read","order.manage","courier.manage","support.manage","operations.mobility.manage"],
  },
  "platform.operations.pay": {
    name: "Pay & Finance Operations",
    description: "Wallet, settlement, refund, withdrawal and approved finance workflows.",
    permissions: ["payment.read","payment.refund","payout.manage","audit.read","operations.pay.manage","operations.audit.read"],
  },
  "platform.operations.risk": {
    name: "Risk & Fraud",
    description: "Risk signals, holds and investigations without settlement authority.",
    permissions: ["merchant.read","order.read","payment.read","risk.read","risk.manage","audit.read","operations.risk.manage","operations.audit.read"],
  },
  "platform.operations.support": {
    name: "Customer & Business Support",
    description: "Customer, merchant, courier and delivery support case resolution.",
    permissions: ["merchant.read","order.read","payment.read","support.manage","operations.support.manage"],
  },
  "platform.operations.auditor": {
    name: "Operations Auditor",
    description: "Read-only oversight of Operations and audit history.",
    permissions: ["merchant.read","catalog.read","order.read","payment.read","risk.read","audit.read","operations.command.read","operations.audit.read"],
  },
};

for (const [key, preset] of Object.entries(presets)) {
  const role = await db.role.upsert({
    where: { key },
    create: { key, name: preset.name, description: preset.description },
    update: { name: preset.name, description: preset.description },
  });

  for (const permissionKey of preset.permissions) {
    const permission = await db.permission.upsert({
      where: { key: permissionKey },
      create: {
        key: permissionKey,
        description: `Operations V4 permission: ${permissionKey}`,
      },
      update: {},
    });

    await db.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId: permission.id,
        },
      },
      create: { roleId: role.id, permissionId: permission.id },
      update: {},
    });
  }
}

console.log(`Seeded ${Object.keys(presets).length} Operations roles.`);
await db.$disconnect();
