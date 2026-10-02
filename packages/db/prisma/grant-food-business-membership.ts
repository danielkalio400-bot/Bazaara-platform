import { db } from "../src/index";

const email = process.argv[2]?.trim().toLowerCase();
const restaurantSlug = process.argv[3]?.trim();

if (!email || !restaurantSlug) {
  console.error("Usage: tsx prisma/grant-food-business-membership.ts <email> <restaurant-slug>");
  process.exit(2);
}

async function main() {
  const account = await db.userEmail.findUnique({
    where: { normalized: email },
    select: {
      userId: true,
      email: true,
      user: { select: { displayName: true } },
    },
  });

  if (!account) {
    console.error(`No BazID account was found for ${email}. Sign in/register that BazID first.`);
    process.exit(3);
  }

  const merchant = await db.merchant.findFirst({
    where: {
      vertical: "FOOD",
      slug: restaurantSlug,
    },
    select: {
      id: true,
      slug: true,
      organizationId: true,
    },
  });

  if (!merchant) {
    console.error(`No Food merchant was found for slug ${restaurantSlug}.`);
    process.exit(4);
  }

  const existing = await db.organizationMember.findFirst({
    where: {
      userId: account.userId,
      organizationId: merchant.organizationId,
    },
    select: {
      id: true,
      status: true,
      userId: true,
      organizationId: true,
    },
  });

  let membership;

  if (existing) {
    membership = await db.organizationMember.update({
      where: { id: existing.id },
      data: { status: "ACTIVE" },
      select: {
        id: true,
        userId: true,
        organizationId: true,
        status: true,
      },
    });
  } else {
    membership = await db.organizationMember.create({
      data: {
        userId: account.userId,
        organizationId: merchant.organizationId,
        status: "ACTIVE",
      } as any,
      select: {
        id: true,
        userId: true,
        organizationId: true,
        status: true,
      },
    });
  }

  console.log("\nFOOD BUSINESS MEMBERSHIP ACTIVE");
  console.table([{
    email: account.email,
    displayName: account.user.displayName ?? "",
    restaurant: merchant.slug,
    merchantId: merchant.id,
    organizationId: merchant.organizationId,
    membershipId: membership.id,
    status: membership.status,
  }]);

  const visibleMemberships = await db.organizationMember.findMany({
    where: {
      userId: account.userId,
      status: "ACTIVE",
    },
    select: {
      organizationId: true,
      status: true,
    },
  });

  console.log("\nACTIVE ORGANIZATIONS FOR THIS BAZID");
  console.table(visibleMemberships);
}

main()
  .catch((error) => {
    console.error("\nMembership repair failed:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });