import { Prisma, PrismaClient } from "@prisma/client";
import { seedCategories } from "./seed-categories";
import { seedDemo } from "./seed-demo";
import { seedPlaces } from "./seed-places";
import { seedReferences } from "./seed-references";
import { seedSettings } from "./seed-settings";

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = "Password123!";

export function assertSeedAllowed(nodeEnv = process.env.NODE_ENV): void {
  if (nodeEnv === "production") {
    throw new Error("Refusing to seed: NODE_ENV=production. Seeding is destructive.");
  }
}

// Launch-lead tables are never cleared. Deleting taxonomy fails while leads
// still reference it, which is the intended protection.
async function clearDatabase() {
  console.log("Clearing existing data...");

  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.review.deleteMany();
  await prisma.clientReview.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.report.deleteMany();
  await prisma.block.deleteMany();
  await prisma.placeSuggestion.deleteMany();
  await prisma.address.deleteMany();
  await prisma.contactMessage.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.user.deleteMany();
  await prisma.referenceItem.deleteMany();
  await prisma.subcategory.deleteMany();
  await prisma.category.deleteMany();
  await clearPlaces();
  await prisma.systemSetting.deleteMany();
}

// Place.parentId is ON DELETE RESTRICT, so the tree is removed leaves first.
async function clearPlaces() {
  let deleted: number;
  do {
    ({ count: deleted } = await prisma.place.deleteMany({
      where: { children: { none: {} } },
    }));
  } while (deleted > 0);
}

async function seedSupabaseAuthUsers() {
  if (process.env.SEED_SUPABASE_USERS !== "true") {
    console.log("Skipping Supabase Auth user creation. Set SEED_SUPABASE_USERS=true to enable it.");
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !serviceKey || supabaseUrl.includes("<") || serviceKey.includes("<")) {
    console.log("Skipping Supabase Auth user creation because SUPABASE_URL or SUPABASE_SERVICE_KEY is not configured.");
    return;
  }

  const users = await prisma.user.findMany({
    where: {
      authUserId: { startsWith: "seed:" },
      email: { not: null },
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
    },
  });

  console.log(`Creating ${users.length} Supabase Auth demo users...`);

  for (const user of users) {
    if (!user.email) continue;

    const apiUrl = supabaseUrl.replace(/\/$/, "");
    const response = await fetch(`${apiUrl}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        email: user.email,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: {
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      const existingUserId = await findSupabaseUserIdByEmail(apiUrl, serviceKey, user.email);

      if (!existingUserId) {
        console.warn(`Could not create Supabase Auth user ${user.email}: ${response.status} ${details}`);
        continue;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { authUserId: existingUserId },
      });
      continue;
    }

    const supabaseUser = (await response.json()) as { id?: string };

    if (!supabaseUser.id) {
      console.warn(`Supabase Auth response for ${user.email} did not include an id.`);
      continue;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { authUserId: supabaseUser.id },
    });
  }
}

async function findSupabaseUserIdByEmail(
  apiUrl: string,
  serviceKey: string,
  email: string,
): Promise<string | null> {
  const response = await fetch(`${apiUrl}/auth/v1/admin/users?page=1&per_page=1000`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as {
    users?: Array<{ id?: string; email?: string }>;
  };
  const user = payload.users?.find((candidate) => candidate.email === email);

  return user?.id ?? null;
}

async function printModelCounts() {
  const delegates = prisma as unknown as Record<string, { count(): Promise<number> }>;

  for (const model of Prisma.dmmf.datamodel.models) {
    const delegate = model.name.charAt(0).toLowerCase() + model.name.slice(1);
    console.log(`${model.name}: ${await delegates[delegate].count()}`);
  }
}

async function main() {
  assertSeedAllowed();
  console.log("KAYOU seed starting...");

  await clearDatabase();
  await seedPlaces(prisma);
  await seedCategories(prisma);
  await seedReferences(prisma);
  await seedSettings(prisma);
  await seedDemo(prisma);
  await seedSupabaseAuthUsers();

  console.log("KAYOU seed completed.");
  await printModelCounts();
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error("Seed failed:", error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
