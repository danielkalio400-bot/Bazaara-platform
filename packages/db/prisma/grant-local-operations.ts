import { db } from "../src/index";

const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
  console.error("Usage: tsx prisma/grant-local-operations.ts <bazid-email>");
  process.exit(2);
}

const account = await db.userEmail.findUnique({
  where: { normalized: email },
  select: {
    userId: true,
    email: true,
    user: { select: { displayName: true } },
  },
});

if (!account) {
  console.error(`No BazID user was found for ${email}. Sign in/register that account first.`);
  process.exit(3);
}

const keys = [
  "merchant.read",
  "merchant.manage",
  "order.read",
  "order.manage",
  "payment.read",
  "payment.refund",
  "payout.manage",
  "support.manage",
  "risk.read",
  "risk.manage",
  "audit.read",
  "admin.feature_flags",
] as const;

const role = await db.role.upsert({
  where: { key: "platform.operations.admin" },
  create: {
    key: "platform.operations.admin",
    name: "Platform Operations Admin",
    description: "Global Operations control-plane access for Bazaara staff.",
  },
  update: {
    name: "Platform Operations Admin",
    description: "Global Operations control-plane access for Bazaara staff.",
  },
});

for (const key of keys) {
  const permission = await db.permission.upsert({
    where: { key },
    create: { key, description: `Operations permission: ${key}` },
    update: {},
  });

  await db.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: role.id,
        permissionId: permission.id,
      },
    },
    create: {
      roleId: role.id,
      permissionId: permission.id,
    },
    update: {},
  });
}

await db.userRole.upsert({
  where: {
    userId_roleId_scopeKey: {
      userId: account.userId,
      roleId: role.id,
      scopeKey: "platform",
    },
  },
  create: {
    userId: account.userId,
    roleId: role.id,
    organizationId: null,
    scopeKey: "platform",
  },
  update: {
    organizationId: null,
  },
});

console.log(
  `Granted Platform Operations Admin to ${account.email}` +
  (account.user.displayName ? ` (${account.user.displayName})` : ""),
);

await db.$disconnect();