import { db } from "../src/index";

const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
  console.error("Usage: tsx prisma/grant-local-go-courier.ts <bazid-email>");
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
  console.error(`No BazID user was found for ${email}. Sign in/register that BazID first.`);
  process.exit(3);
}

const permission = await db.permission.upsert({
  where: { key: "courier.manage" },
  create: {
    key: "courier.manage",
    description: "Use GO courier dispatch surfaces.",
  },
  update: {
    description: "Use GO courier dispatch surfaces.",
  },
});

const role = await db.role.upsert({
  where: { key: "platform.go.courier" },
  create: {
    key: "platform.go.courier",
    name: "GO Courier",
    description: "Courier access to GO web dispatch.",
  },
  update: {
    name: "GO Courier",
    description: "Courier access to GO web dispatch.",
  },
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
  `Granted GO Courier to ${account.email}` +
    (account.user.displayName ? ` (${account.user.displayName})` : ""),
);

await db.$disconnect();