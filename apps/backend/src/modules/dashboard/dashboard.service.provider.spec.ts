import { strict as assert } from "node:assert";
import test from "node:test";

import { DashboardService } from "./dashboard.service";
import type { PrismaService } from "../../database/prisma.service";
import type { JobRequestsService } from "../job-requests/job-requests.service";
import type { Actor } from "../../common/auth/types";

type ProviderRow = {
  id: string;
  userId: string;
  profession: string;
  description: string | null;
  experience: number | null;
  hourlyRate: number | null;
  totalReviews: number;
  totalJobs: number;
  rating: number;
  responseTime: number | null;
  isPremium: boolean;
  premiumExpiry: Date | null;
  isAvailable: boolean;
  verificationStatus: string;
  user: { id: string; firstName: string; lastName: string; avatar: string | null; city: string | null; country: string | null; latitude: number | null; longitude: number | null; email: string; phone: string; isVerified: boolean; onboardingStep: number | null };
  categories: Array<{ category: { id: string; name: string; slug: string } }>;
  skills: Array<{ id: string; name: string }>;
  serviceZones: Array<{ id: string; city: string }>;
  portfolio: Array<{ id: string; url: string }>;
  trustScore: { badges: Array<{ id: string; name: string; isVisible: boolean }> } | null;
};

type BookingRow = {
  id: string;
  providerId: string;
  clientId: string;
  status: "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  title: string;
  description: string | null;
  address: string;
  city: string | null;
  scheduledDate: Date;
  duration: number | null;
  price: number;
  createdAt: Date;
  updatedAt: Date;
  client: { id: string; firstName: string; lastName: string; avatar: string | null };
};

type ConversationRow = {
  id: string;
  lastMessageAt: Date | null;
  user1Id: string;
  user1: { id: string; firstName: string; lastName: string };
  user2Id: string;
  user2: { id: string; firstName: string; lastName: string };
  messages: Array<{ id: string; content: string; senderId: string; createdAt: Date; isRead: boolean }>;
  _count: { messages: number };
};

function buildPrismaFake(seed: {
  provider: ProviderRow;
  bookings?: BookingRow[];
  conversations?: ConversationRow[];
}) {
  const bookings = seed.bookings ?? [];
  const conversations = seed.conversations ?? [];

  return {
    provider: {
      findUnique: async ({ where }: { where: { userId: string } }) =>
        where.userId === seed.provider.userId ? seed.provider : null,
    },
    booking: {
      findMany: async ({ where, orderBy, take }: any) => {
        let rows = bookings.filter((b) => {
          if (where.providerId && b.providerId !== where.providerId) return false;
          if (where.status?.in && !where.status.in.includes(b.status)) return false;
          if (where.status && typeof where.status === "string" && b.status !== where.status) return false;
          if (where.scheduledDate?.gte && b.scheduledDate < where.scheduledDate.gte) return false;
          if (where.scheduledDate?.lt && b.scheduledDate >= where.scheduledDate.lt) return false;
          return true;
        });
        if (Array.isArray(orderBy)) {
          // not exercised; sufficient for these specs
        } else if (orderBy?.scheduledDate === "asc") {
          rows = rows.slice().sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
        } else if (orderBy?.scheduledDate === "desc") {
          rows = rows.slice().sort((a, b) => b.scheduledDate.getTime() - a.scheduledDate.getTime());
        } else if (orderBy?.createdAt === "desc") {
          rows = rows.slice().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
        if (take && rows.length > take) rows = rows.slice(0, take);
        return rows;
      },
      count: async ({ where }: any) =>
        bookings.filter((b) => (where?.providerId ? b.providerId === where.providerId : true)).length,
      groupBy: async () => [],
      aggregate: async () => ({ _sum: { price: 0 }, _avg: { price: 0 } }),
    },
    review: {
      findMany: async () => [],
      groupBy: async () => [],
      aggregate: async () => ({ _avg: { overallScore: 0 }, _count: 0 }),
      count: async () => 0,
    },
    notification: {
      count: async () => 0,
      findMany: async () => [],
    },
    certification: {
      groupBy: async () => [],
      count: async () => 0,
    },
    conversation: {
      findMany: async ({ where, take }: any) => {
        const orClauses: Array<{ user1Id?: string; user2Id?: string }> = where?.OR ?? [];
        const user1Match = orClauses.find((c) => c.user1Id)?.user1Id;
        const user2Match = orClauses.find((c) => c.user2Id)?.user2Id;
        let rows = conversations.filter((c) => {
          if (!user1Match && !user2Match) return true;
          return (
            (user1Match !== undefined && c.user1Id === user1Match) ||
            (user2Match !== undefined && c.user2Id === user2Match)
          );
        });
        if (take && rows.length > take) rows = rows.slice(0, take);
        return rows;
      },
    },
  } as unknown as PrismaService;
}

function buildJobRequestsFake(): JobRequestsService {
  return {
    topMatchesForDashboard: async () => [],
  } as unknown as JobRequestsService;
}

function buildActor(userId: string): Actor {
  return {
    id: userId,
    role: "PROVIDER",
    firstName: "Daniel",
    lastName: "Mbuyi",
    email: "daniel@example.test",
    avatar: null,
  } as Actor;
}

function buildProviderRow(overrides: Partial<ProviderRow> = {}): ProviderRow {
  return {
    id: "prov_1",
    userId: "user_1",
    profession: "Coiffeuse",
    description: "Coiffure professionnelle à domicile.",
    experience: 5,
    hourlyRate: 15000,
    totalReviews: 12,
    totalJobs: 32,
    rating: 4.8,
    responseTime: 90,
    isPremium: false,
    premiumExpiry: null,
    isAvailable: true,
    verificationStatus: "VERIFIED",
    user: {
      id: "user_1",
      firstName: "Daniel",
      lastName: "Mbuyi",
      avatar: null,
      city: "Kinshasa",
      country: "CD",
      latitude: null,
      longitude: null,
      email: "daniel@example.test",
      phone: "+243000000000",
      isVerified: true,
      onboardingStep: null,
    },
    categories: [
      { category: { id: "cat_1", name: "Coiffure", slug: "coiffure" } },
    ],
    skills: [{ id: "sk_1", name: "Tresses" }],
    serviceZones: [{ id: "zone_1", city: "Kinshasa" }],
    portfolio: [{ id: "p_1", url: "https://example.test/p1.jpg" }],
    trustScore: { badges: [] },
    ...overrides,
  };
}

test("getProviderDashboard returns hasAnyBookingEver: false and empty todos when the provider has no bookings", async () => {
  const provider = buildProviderRow();
  const prisma = buildPrismaFake({ provider });
  const jobRequests = buildJobRequestsFake();
  const service = new DashboardService(prisma, jobRequests);

  const result = (await service.getProviderDashboard(buildActor("user_1"))) as any;

  assert.equal(result.hasAnyBookingEver, false);
  assert.deepEqual(result.todos.unreadMessages, []);
  assert.deepEqual(result.todos.bookingsToClose, []);
});

test("getProviderDashboard surfaces a bookingsToClose row for CONFIRMED bookings whose scheduledDate is more than 2h in the past", async () => {
  const now = new Date("2026-05-14T12:00:00.000Z");
  const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const provider = buildProviderRow();
  const prisma = buildPrismaFake({
    provider,
    bookings: [
      {
        id: "bk_1",
        providerId: provider.id,
        clientId: "cli_1",
        status: "CONFIRMED",
        title: "Coiffure",
        description: null,
        address: "1, Av. de la République",
        city: "Bandal",
        scheduledDate: threeHoursAgo,
        duration: 90,
        price: 30000,
        createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        updatedAt: now,
        client: { id: "cli_1", firstName: "Jeanne", lastName: "Kabongo", avatar: null },
      },
    ],
  });
  const service = new DashboardService(prisma, buildJobRequestsFake());

  const result = (await service.getProviderDashboard(buildActor("user_1"))) as any;

  assert.equal(result.todos.bookingsToClose.length, 1);
  assert.equal(result.todos.bookingsToClose[0].bookingId, "bk_1");
  assert.equal(result.todos.bookingsToClose[0].client.firstName, "Jeanne");
  assert.equal(result.hasAnyBookingEver, true);
});

test("getProviderDashboard does not surface a CONFIRMED booking whose scheduledDate is in the future", async () => {
  const now = new Date();
  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
  const provider = buildProviderRow();
  const prisma = buildPrismaFake({
    provider,
    bookings: [
      {
        id: "bk_2",
        providerId: provider.id,
        clientId: "cli_2",
        status: "CONFIRMED",
        title: "Tresses",
        description: null,
        address: "14, Av. Kasai",
        city: "Gombe",
        scheduledDate: inOneHour,
        duration: 120,
        price: 35000,
        createdAt: now,
        updatedAt: now,
        client: { id: "cli_2", firstName: "Marie", lastName: "K.", avatar: null },
      },
    ],
  });
  const service = new DashboardService(prisma, buildJobRequestsFake());

  const result = (await service.getProviderDashboard(buildActor("user_1"))) as any;

  assert.deepEqual(result.todos.bookingsToClose, []);
});

test("getProviderDashboard does not surface a CONFIRMED booking scheduled only 30 minutes ago (under the 2h cutoff)", async () => {
  const now = new Date();
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
  const provider = buildProviderRow();
  const prisma = buildPrismaFake({
    provider,
    bookings: [
      {
        id: "bk_threshold",
        providerId: provider.id,
        clientId: "cli_3",
        status: "CONFIRMED",
        title: "Coupe rapide",
        description: null,
        address: "5, Av. Lemba",
        city: "Lemba",
        scheduledDate: thirtyMinutesAgo,
        duration: 30,
        price: 12000,
        createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
        updatedAt: now,
        client: { id: "cli_3", firstName: "Sara", lastName: "M.", avatar: null },
      },
    ],
  });
  const service = new DashboardService(prisma, buildJobRequestsFake());

  const result = (await service.getProviderDashboard(buildActor("user_1"))) as any;

  assert.deepEqual(result.todos.bookingsToClose, []);
});

test("getProviderDashboard does not surface an IN_PROGRESS booking in bookingsToClose (only CONFIRMED qualifies)", async () => {
  const now = new Date();
  const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const provider = buildProviderRow();
  const prisma = buildPrismaFake({
    provider,
    bookings: [
      {
        id: "bk_in_progress",
        providerId: provider.id,
        clientId: "cli_4",
        status: "IN_PROGRESS",
        title: "Tresses longues",
        description: null,
        address: "22, Av. Kasa-Vubu",
        city: "Kasa-Vubu",
        scheduledDate: threeHoursAgo,
        duration: 180,
        price: 45000,
        createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        updatedAt: now,
        client: { id: "cli_4", firstName: "Aline", lastName: "N.", avatar: null },
      },
    ],
  });
  const service = new DashboardService(prisma, buildJobRequestsFake());

  const result = (await service.getProviderDashboard(buildActor("user_1"))) as any;

  assert.deepEqual(result.todos.bookingsToClose, []);
});

test("getProviderDashboard returns unreadMessages todos for conversations with inbound unread messages", async () => {
  const provider = buildProviderRow();
  const prisma = buildPrismaFake({
    provider,
    conversations: [
      {
        id: "conv_1",
        lastMessageAt: new Date("2026-05-14T10:00:00.000Z"),
        user1Id: "user_1",
        user1: { id: "user_1", firstName: "Daniel", lastName: "Mbuyi" },
        user2Id: "user_2",
        user2: { id: "user_2", firstName: "Pierre", lastName: "Ngandu" },
        messages: [
          {
            id: "msg_1",
            content: "À quelle heure tu arrives ?",
            senderId: "user_2",
            createdAt: new Date("2026-05-14T10:00:00.000Z"),
            isRead: false,
          },
        ],
        _count: { messages: 2 },
      },
    ],
  });
  const service = new DashboardService(prisma, buildJobRequestsFake());

  const result = (await service.getProviderDashboard(buildActor("user_1"))) as any;

  assert.equal(result.todos.unreadMessages.length, 1);
  assert.equal(result.todos.unreadMessages[0].conversationId, "conv_1");
  assert.equal(result.todos.unreadMessages[0].unreadCount, 2);
  assert.equal(result.todos.unreadMessages[0].client.firstName, "Pierre");
  assert.equal(result.todos.unreadMessages[0].lastMessagePreview, "À quelle heure tu arrives ?");
});

test("getProviderDashboard does not surface a conversation whose last message is outbound (sent by the provider)", async () => {
  const provider = buildProviderRow();
  const prisma = buildPrismaFake({
    provider,
    conversations: [
      {
        id: "conv_2",
        lastMessageAt: new Date("2026-05-14T10:00:00.000Z"),
        user1Id: "user_1",
        user1: { id: "user_1", firstName: "Daniel", lastName: "Mbuyi" },
        user2Id: "user_2",
        user2: { id: "user_2", firstName: "Pierre", lastName: "Ngandu" },
        messages: [
          {
            id: "msg_2",
            content: "Je passe à 14h.",
            senderId: "user_1",
            createdAt: new Date("2026-05-14T10:00:00.000Z"),
            isRead: false,
          },
        ],
        _count: { messages: 0 },
      },
    ],
  });
  const service = new DashboardService(prisma, buildJobRequestsFake());

  const result = (await service.getProviderDashboard(buildActor("user_1"))) as any;

  assert.deepEqual(result.todos.unreadMessages, []);
});
