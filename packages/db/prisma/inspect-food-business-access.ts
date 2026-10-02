import { db } from "../src/index";

async function main() {
  const merchants = await db.merchant.findMany({
    where: { vertical: "FOOD" },
    select: {
      id: true,
      slug: true,
      organizationId: true,
      verifiedAt: true,
    },
    orderBy: { slug: "asc" },
  });

  console.log("\nFOOD MERCHANTS");
  console.table(merchants);

  const members = await db.organizationMember.findMany({
    where: { status: "ACTIVE" },
    select: {
      userId: true,
      organizationId: true,
      status: true,
    },
    orderBy: [
      { organizationId: "asc" },
      { userId: "asc" },
    ],
  });

  console.log("\nACTIVE ORGANIZATION MEMBERS");
  console.table(members);

  const foodOrganizationIds = new Set(merchants.map((merchant) => merchant.organizationId));
  const foodMembers = members.filter((member) => foodOrganizationIds.has(member.organizationId));

  console.log("\nACTIVE MEMBERS ATTACHED TO FOOD MERCHANT ORGANIZATIONS");
  console.table(foodMembers);

  await db.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await db.$disconnect();
  process.exit(1);
});