import { PrismaClient } from "@prisma/client";
import { seedCategories } from "./seed-categories";
import { seedDemo } from "./seed-demo";

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = "Password123!";

async function clearDatabase() {
  console.log("Clearing existing data...");

  await prisma.providerBadge.deleteMany();
  await prisma.certificationDoc.deleteMany();
  await prisma.certification.deleteMany();
  await prisma.clientReview.deleteMany();
  await prisma.review.deleteMany();
  await prisma.portfolioImage.deleteMany();
  await prisma.portfolioProject.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.portfolioItem.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.serviceZone.deleteMany();
  await prisma.availabilityException.deleteMany();
  await prisma.availabilitySchedule.deleteMany();
  await prisma.trustScore.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.providerTrade.deleteMany();
  await prisma.providerCategory.deleteMany();
  await prisma.service.deleteMany();
  await prisma.trade.deleteMany();
  await prisma.subcategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.visibilitySettings.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.user.deleteMany();
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

async function main() {
  console.log("KAYOU seed starting...");

  await clearDatabase();
  await seedCategories(prisma);
  await seedDemo(prisma);
  await seedSupabaseAuthUsers();

  const [categories, trades, users, providers, bookings, reviews] = await Promise.all([
    prisma.category.count(),
    prisma.trade.count(),
    prisma.user.count(),
    prisma.provider.count(),
    prisma.booking.count(),
    prisma.review.count(),
  ]);

  console.log("KAYOU seed completed.");
  console.log(`Categories: ${categories}`);
  console.log(`Trades: ${trades}`);
  console.log(`Users: ${users}`);
  console.log(`Providers: ${providers}`);
  console.log(`Bookings: ${bookings}`);
  console.log(`Reviews: ${reviews}`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
