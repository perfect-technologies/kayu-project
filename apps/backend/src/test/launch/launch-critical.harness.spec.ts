import assert from "node:assert/strict";
import test from "node:test";
import { Module } from "@nestjs/common";
import { NestFactory, Reflector } from "@nestjs/core";
import type { UserRole } from "@prisma/client";
import { ACTOR_RESOLVER } from "../../common/auth/actor-resolver.interface";
import { SupabaseJwtService } from "../../common/auth/supabase-jwt.service";
import type { Actor, AuthContextUser } from "../../common/auth/types";
import { ActorGuard } from "../../common/guards/actor.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { SupabaseGuard } from "../../common/guards/supabase.guard";
import { PrismaService } from "../../database/prisma.service";
import { BookingsController } from "../../modules/bookings/bookings.controller";
import { BookingsService } from "../../modules/bookings/bookings.service";
import { IdentityController } from "../../modules/identity/identity.controller";
import { IdentityRepository, type UserWithProvider } from "../../modules/identity/identity.repository";
import { IdentityService } from "../../modules/identity/identity.service";
import { MessagingController } from "../../modules/messaging/messaging.controller";
import { MessagingService } from "../../modules/messaging/messaging.service";
import { NotificationsService } from "../../modules/notifications/notifications.service";
import { QuotesController } from "../../modules/quotes/quotes.controller";
import { QuotesService } from "../../modules/quotes/quotes.service";
import { ReviewsController } from "../../modules/reviews/reviews.controller";
import { ReviewsService } from "../../modules/reviews/reviews.service";

const now = new Date("2026-04-22T10:00:00.000Z");

type IntegrationState = ReturnType<typeof createState>;

function createState() {
  const usersById = new Map<string, UserWithProvider>();
  const usersByAuthUserId = new Map<string, UserWithProvider>();
  const providersById = new Map<
    string,
    {
      id: string;
      userId: string;
      profession: string;
      hourlyRate: number;
      isAvailable: boolean;
      isPremium: boolean;
      totalReviews: number;
      totalJobs: number;
      verificationStatus: "PENDING" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED";
      updatedAt: Date;
      user: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        avatar: string | null;
        city: string | null;
        isVerified: boolean;
      };
    }
  >();
  const providersByUserId = new Map<string, { id: string }>();
  const bookingsById = new Map<string, Record<string, unknown>>();
  const conversationsByKey = new Map<string, { id: string; user1Id: string; user2Id: string }>();
  const messagesByConversationId = new Map<string, Array<Record<string, unknown>>>();
  const quotesById = new Map<string, Record<string, unknown>>();
  const notifications: Array<Record<string, unknown>> = [];
  const earningTransactions: Array<Record<string, unknown>> = [];
  let nextBookingIndex = 2;
  let nextConversationIndex = 1;

  const clientUser = makeUser({
    id: "client_user_1",
    authUserId: "auth_client_1",
    email: "client@example.com",
    phone: "+243810000001",
    firstName: "Client",
    lastName: "User",
    role: "CLIENT",
    roleSelectedAt: new Date("2026-04-18T10:00:00.000Z"),
  });
  const providerUser = makeUser({
    id: "provider_user_1",
    authUserId: "auth_provider_1",
    email: "provider@example.com",
    phone: "+243897000001",
    firstName: "Pro",
    lastName: "User",
    role: "PROVIDER",
    roleSelectedAt: new Date("2026-04-18T10:00:00.000Z"),
  });
  const freshUser = makeUser({
    id: "fresh_user_1",
    authUserId: "auth_fresh_1",
    email: "fresh@example.com",
    phone: "+243810000099",
    firstName: null,
    lastName: null,
    role: "CLIENT",
    roleSelectedAt: null,
  });

  for (const user of [clientUser, providerUser, freshUser]) {
    usersById.set(user.id, user);
    usersByAuthUserId.set(user.authUserId, user);
  }

  const provider = {
    id: "provider_1",
    userId: providerUser.id,
    profession: "Plombier",
    hourlyRate: 30000,
    isAvailable: true,
    isPremium: false,
    totalReviews: 3,
    totalJobs: 8,
    verificationStatus: "VERIFIED" as const,
    updatedAt: now,
    user: {
      id: providerUser.id,
      firstName: providerUser.firstName,
      lastName: providerUser.lastName,
      avatar: null,
      city: "Kinshasa",
      isVerified: true,
    },
  };
  providersById.set(provider.id, provider);
  providersByUserId.set(provider.userId, { id: provider.id });

  const pendingBooking = makeBookingRecord({
    id: "booking_1",
    clientId: clientUser.id,
    providerId: provider.id,
    status: "PENDING",
    provider,
    client: clientUser,
  });
  const completedBooking = makeBookingRecord({
    id: "booking_completed_1",
    clientId: clientUser.id,
    providerId: provider.id,
    status: "COMPLETED",
    completedAt: now,
    provider,
    client: clientUser,
  });
  bookingsById.set(pendingBooking.id as string, pendingBooking);
  bookingsById.set(completedBooking.id as string, completedBooking);

  const quote = {
    id: "quote_1",
    jobRequestId: "request_1",
    providerId: provider.id,
    clientId: clientUser.id,
    message: "Je peux intervenir demain matin.",
    validityDays: 7,
    startDateKind: "23/04/2026",
    discountPct: 0,
    subtotal: 75000,
    discountAmt: 0,
    total: 75000,
    commissionPct: 10,
    commissionAmt: 7500,
    payoutAmt: 67500,
    status: "SENT",
    sentAt: now,
    acceptedAt: null,
    declinedAt: null,
    expiresAt: new Date("2999-04-27T10:00:00.000Z"),
    bookingId: null,
    createdAt: now,
    updatedAt: now,
    lines: [
      {
        id: "line_1",
        quoteId: "quote_1",
        label: "Intervention",
        qty: 2,
        unit: "Heure",
        unitPrice: 30000,
        order: 0,
      },
    ],
    jobRequest: {
      id: "request_1",
      service: "Réparer une fuite",
      address: "12 Avenue Kasa-Vubu",
      city: "Kinshasa",
      budget: 80000,
      status: "OPEN",
    },
    provider: {
      ...provider,
      user: {
        id: provider.user.id,
        firstName: provider.user.firstName,
        lastName: provider.user.lastName,
        avatar: provider.user.avatar,
        city: provider.user.city,
      },
    },
    client: {
      id: clientUser.id,
      firstName: clientUser.firstName,
      lastName: clientUser.lastName,
      avatar: clientUser.avatar,
      email: clientUser.email,
      phone: clientUser.phone,
    },
  };
  quotesById.set(quote.id, quote);

  return {
    usersById,
    usersByAuthUserId,
    providersById,
    providersByUserId,
    bookingsById,
    conversationsByKey,
    messagesByConversationId,
    quotesById,
    notifications,
    earningTransactions,
    nextBookingId() {
      nextBookingIndex += 1;
      return `booking_${nextBookingIndex}`;
    },
    nextConversationId() {
      nextConversationIndex += 1;
      return `conversation_${nextConversationIndex}`;
    },
  };
}

function makeUser(overrides: Partial<UserWithProvider>): UserWithProvider {
  return {
    id: "user_1",
    authUserId: "auth_1",
    email: null,
    phone: "+243897123456",
    firstName: null,
    lastName: null,
    avatar: null,
    role: "CLIENT" as UserRole,
    roleSelectedAt: null,
    city: "Kinshasa",
    country: "RDC",
    address: null,
    latitude: null,
    longitude: null,
    isVerified: false,
    emailVerifiedAt: null,
    phoneVerifiedAt: null,
    isActive: true,
    lastLoginAt: now,
    clientScore: 0,
    clientTrustLevel: "NEW_CLIENT",
    onboardingStep: null,
    onboardingDraft: null,
    createdAt: now,
    updatedAt: now,
    provider: null,
    ...overrides,
  };
}

function makeBookingRecord(input: {
  id: string;
  clientId: string;
  providerId: string;
  status: "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED";
  provider: IntegrationState["providersById"] extends Map<string, infer T> ? T : never;
  client: UserWithProvider;
  completedAt?: Date | null;
}) {
  return {
    id: input.id,
    clientId: input.clientId,
    providerId: input.providerId,
    serviceId: null,
    title: "Dépannage urgent",
    description: "Canalisation bouchée",
    status: input.status,
    address: "Gombe",
    city: "Kinshasa",
    clientLatitude: null,
    clientLongitude: null,
    scheduledDate: new Date("2026-04-23T08:00:00.000Z"),
    duration: 120,
    price: 50000,
    clientNotes: "Intervention rapide si possible",
    providerNotes: null,
    paymentMethod: null,
    isPaid: false,
    paidAt: null,
    confirmedAt: input.status === "CONFIRMED" ? now : null,
    startedAt: input.status === "IN_PROGRESS" ? now : null,
    completedAt: input.completedAt ?? null,
    cancelledAt: null,
    cancelReason: null,
    cancelledBy: null,
    createdAt: now,
    updatedAt: now,
    client: {
      id: input.client.id,
      firstName: input.client.firstName,
      lastName: input.client.lastName,
      avatar: input.client.avatar,
      isVerified: input.client.isVerified,
    },
    provider: {
      id: input.provider.id,
      userId: input.provider.userId,
      profession: input.provider.profession,
      user: {
        id: input.provider.user.id,
        firstName: input.provider.user.firstName,
        lastName: input.provider.user.lastName,
        avatar: input.provider.user.avatar,
        isVerified: input.provider.user.isVerified,
      },
    },
    service: null,
    review: null,
    clientReview: null,
  };
}

function createIdentityRepo(state: IntegrationState): IdentityRepository {
  return {
    findByAuthUserId: async (authUserId: string) =>
      state.usersByAuthUserId.get(authUserId) ?? null,
    createUser: async (input: {
      authUserId: string;
      email?: string;
      phone?: string;
    }) => {
      const created = makeUser({
        id: `user_${state.usersById.size + 1}`,
        authUserId: input.authUserId,
        email: input.email ?? null,
        phone: input.phone ?? null,
      });
      state.usersById.set(created.id, created);
      state.usersByAuthUserId.set(created.authUserId, created);
      return created;
    },
    updateAuthFields: async (
      userId: string,
      data: Partial<UserWithProvider>,
    ) => {
      const user = state.usersById.get(userId);
      if (!user) throw new Error("User not found");
      const updated = { ...user, ...data };
      state.usersById.set(updated.id, updated);
      state.usersByAuthUserId.set(updated.authUserId, updated);
      return updated;
    },
    updateProfile: async (
      userId: string,
      data: Partial<UserWithProvider>,
    ) => {
      const user = state.usersById.get(userId);
      if (!user) throw new Error("User not found");
      const updated = { ...user, ...data };
      state.usersById.set(updated.id, updated);
      state.usersByAuthUserId.set(updated.authUserId, updated);
      return updated;
    },
    findById: async (userId: string) => state.usersById.get(userId) ?? null,
    setRole: async (
      userId: string,
      role: Exclude<UserRole, "ADMIN">,
      roleSelectedAt: Date,
    ) => {
      const user = state.usersById.get(userId);
      if (!user) throw new Error("User not found");
      const updated = { ...user, role, roleSelectedAt };
      state.usersById.set(updated.id, updated);
      state.usersByAuthUserId.set(updated.authUserId, updated);
      return updated;
    },
    hasRoleBlockingActivity: async () => false,
    countCategories: async () => 0,
    countTrades: async () => 0,
    createProviderProfile: async () => {
      throw new Error("provider onboarding not used by launch harness");
    },
  } as unknown as IdentityRepository;
}

function createPrisma(state: IntegrationState) {
  const buildTransactionClient = () => ({
    provider: {
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Record<string, unknown>;
      }) => {
        const provider = state.providersById.get(where.id);
        if (!provider) throw new Error("Provider not found");
        const updated = {
          ...provider,
          ...data,
          totalJobs:
            data.totalJobs &&
            typeof data.totalJobs === "object" &&
            "increment" in data.totalJobs
              ? provider.totalJobs + Number((data.totalJobs as { increment: number }).increment)
              : provider.totalJobs,
        };
        state.providersById.set(where.id, updated);
        return updated;
      },
      findUnique: async ({ where }: { where: { id: string } }) => {
        const provider = state.providersById.get(where.id);
        return provider ? { userId: provider.userId } : null;
      },
    },
    booking: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const provider = state.providersById.get(String(data.providerId));
        const client = state.usersById.get(String(data.clientId));
        if (!provider || !client) throw new Error("Missing booking participants");
        const booking = makeBookingRecord({
          id: state.nextBookingId(),
          clientId: String(data.clientId),
          providerId: String(data.providerId),
          status: "PENDING",
          provider,
          client,
        });
        Object.assign(booking, data);
        state.bookingsById.set(String(booking.id), booking);
        return booking;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Record<string, unknown>;
      }) => {
        const booking = state.bookingsById.get(where.id);
        if (!booking) throw new Error("Booking not found");
        Object.assign(booking, data, { updatedAt: now });
        state.bookingsById.set(where.id, booking);
        return booking;
      },
    },
    transaction: {
      create: async (input: Record<string, unknown>) => {
        state.earningTransactions.push(input);
      },
      findFirst: async () => null,
      update: async () => {},
    },
    conversation: {
      upsert: async ({
        where,
      }: {
        where: { user1Id_user2Id: { user1Id: string; user2Id: string } };
      }) => {
        const key = `${where.user1Id_user2Id.user1Id}:${where.user1Id_user2Id.user2Id}`;
        let conversation = state.conversationsByKey.get(key);
        if (!conversation) {
          conversation = {
            id: state.nextConversationId(),
            user1Id: where.user1Id_user2Id.user1Id,
            user2Id: where.user1Id_user2Id.user2Id,
          };
          state.conversationsByKey.set(key, conversation);
        }
        return conversation;
      },
      update: async () => {},
    },
    message: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const created = {
          id: `message_${Date.now()}`,
          conversationId: data.conversationId,
          senderId: data.senderId,
          content: data.content,
          type: data.type,
          fileUrl: data.fileUrl ?? null,
          isRead: false,
          readAt: null,
          isDeleted: false,
          createdAt: now,
          sender: {
            id: data.senderId,
            firstName: "Client",
            lastName: "User",
            avatar: null,
          },
        };
        const key = String(data.conversationId);
        const messages = state.messagesByConversationId.get(key) ?? [];
        messages.push(created);
        state.messagesByConversationId.set(key, messages);
        return created;
      },
    },
    quote: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        state.quotesById.get(where.id) ?? null,
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Record<string, unknown>;
      }) => {
        const quote = state.quotesById.get(where.id);
        if (!quote) throw new Error("Quote not found");
        Object.assign(quote, data, { updatedAt: now });
        state.quotesById.set(where.id, quote);
        return quote;
      },
      updateMany: async () => ({ count: 1 }),
    },
    jobRequest: {
      update: async () => {},
    },
    review: {
      create: async ({ data }: { data: Record<string, unknown> }) => ({
        id: "review_1",
        bookingId: data.bookingId,
        clientId: data.clientId,
        providerId: data.providerId,
        punctuality: data.punctuality ?? null,
        quality: data.quality ?? null,
        communication: data.communication ?? null,
        value: data.value ?? null,
        professionalism: data.professionalism ?? null,
        overallScore: 4.6,
        satisfactionTags: data.satisfactionTags ?? null,
        comment: data.comment ?? null,
        reply: null,
        repliedAt: null,
        isPublic: data.isPublic ?? true,
        isEdited: false,
        createdAt: now,
        updatedAt: now,
        client: {
          id: "client_user_1",
          firstName: "Client",
          lastName: "User",
          avatar: null,
        },
        booking: {
          title: "Dépannage urgent",
          service: null,
        },
      }),
    },
    clientReview: {
      create: async () => {
        throw new Error("client review creation not used by launch harness");
      },
    },
  });

  return {
    user: {
      findUnique: async ({
        where,
      }: {
        where: { id: string };
      }) => {
        const user = state.usersById.get(where.id);
        if (!user) return null;
        return {
          id: user.id,
          visibilitySettings: null,
        };
      },
    },
    provider: {
      findUnique: async ({
        where,
      }: {
        where: { id?: string; userId?: string };
        select?: Record<string, boolean>;
      }) => {
        if (where.id) {
          const provider = state.providersById.get(where.id);
          if (!provider) return null;
          return {
            id: provider.id,
            userId: provider.userId,
            isAvailable: provider.isAvailable,
          };
        }
        if (where.userId) {
          return state.providersByUserId.get(where.userId) ?? null;
        }
        return null;
      },
    },
    booking: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        state.bookingsById.get(where.id) ?? null,
    },
    $transaction: async <T>(
      callback: (tx: ReturnType<typeof buildTransactionClient>) => Promise<T>,
    ) => callback(buildTransactionClient()),
  };
}

function createNotifications(state: IntegrationState) {
  return {
    create: async (input: Record<string, unknown>) => {
      state.notifications.push(input);
      return input;
    },
  };
}

function createJwt() {
  const claimsByToken = new Map<string, AuthContextUser>([
    [
      "fresh-token",
      {
        authUserId: "auth_fresh_1",
        email: "fresh@example.com",
        phone: "+243810000099",
        claims: { sub: "auth_fresh_1", email: "fresh@example.com", phone: "+243810000099" },
      },
    ],
    [
      "client-token",
      {
        authUserId: "auth_client_1",
        email: "client@example.com",
        phone: "+243810000001",
        claims: { sub: "auth_client_1", email: "client@example.com", phone: "+243810000001" },
      },
    ],
    [
      "provider-token",
      {
        authUserId: "auth_provider_1",
        email: "provider@example.com",
        phone: "+243897000001",
        claims: {
          sub: "auth_provider_1",
          email: "provider@example.com",
          phone: "+243897000001",
        },
      },
    ],
  ]);

  return {
    verify: async (token: string) => claimsByToken.get(token)?.claims ?? null,
  };
}

async function createHarness() {
  const state = createState();
  const prisma = createPrisma(state);
  const notifications = createNotifications(state);
  const identityRepo = createIdentityRepo(state);
  const jwt = createJwt();

  @Module({
    controllers: [
      IdentityController,
      BookingsController,
      MessagingController,
      QuotesController,
      ReviewsController,
    ],
    providers: [
      Reflector,
      SupabaseGuard,
      ActorGuard,
      RolesGuard,
      IdentityService,
      BookingsService,
      MessagingService,
      QuotesService,
      ReviewsService,
      {
        provide: IdentityRepository,
        useValue: identityRepo,
      },
      {
        provide: ACTOR_RESOLVER,
        useExisting: IdentityService,
      },
      {
        provide: PrismaService,
        useValue: prisma,
      },
      {
        provide: NotificationsService,
        useValue: notifications,
      },
      {
        provide: SupabaseJwtService,
        useValue: jwt,
      },
    ],
  })
  class HarnessModule {}

  const app = await NestFactory.create(HarnessModule, { logger: false });
  app.setGlobalPrefix("api");
  await app.listen(0, "127.0.0.1");

  const reviews = app.get(ReviewsService);
  (reviews as unknown as { syncProviderMetrics: () => Promise<void> }).syncProviderMetrics =
    async () => {};
  (reviews as unknown as { syncClientMetrics: () => Promise<void> }).syncClientMetrics =
    async () => {};

  const address = app.getHttpServer().address();
  const port =
    address && typeof address === "object" && "port" in address ? address.port : null;
  if (!port) {
    await app.close();
    throw new Error("Failed to resolve harness port");
  }

  const baseUrl = `http://127.0.0.1:${port}/api`;
  return { app, baseUrl, state };
}

async function requestJson(
  baseUrl: string,
  path: string,
  options: {
    method?: string;
    token?: string;
    body?: unknown;
  } = {},
) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      ...(options.token
        ? { authorization: `Bearer ${options.token}` }
        : {}),
      ...(options.body !== undefined
        ? { "content-type": "application/json" }
        : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  return {
    status: response.status,
    body: text ? (JSON.parse(text) as Record<string, unknown>) : null,
  };
}

test("role selection route enforces auth and Zod validation through Nest", async () => {
  const { app, baseUrl, state } = await createHarness();

  try {
    const success = await requestJson(baseUrl, "/me/role", {
      method: "PATCH",
      token: "fresh-token",
      body: { role: "PROVIDER" },
    });

    assert.equal(success.status, 200);
    assert.equal(success.body?.success, true);
    assert.equal((success.body?.user as { role: string }).role, "PROVIDER");
    assert.equal(state.usersByAuthUserId.get("auth_fresh_1")?.role, "PROVIDER");

    const invalid = await requestJson(baseUrl, "/me/role", {
      method: "PATCH",
      token: "fresh-token",
      body: { role: "ADMIN" },
    });

    assert.equal(invalid.status, 400);
    assert.equal(invalid.body?.message, "Validation failed");
  } finally {
    await app.close();
  }
});

test("booking create route enforces role guards and returns the controller contract", async () => {
  const { app, baseUrl } = await createHarness();

  try {
    const created = await requestJson(baseUrl, "/bookings", {
      method: "POST",
      token: "client-token",
      body: {
        providerId: "provider_1",
        title: "Réparer une fuite",
        description: "Salle de bain",
        address: "Gombe",
        city: "Kinshasa",
        scheduledDate: "2026-04-23T08:00:00.000Z",
        duration: 120,
        price: 50000,
        clientNotes: "Intervention rapide si possible",
      },
    });

    assert.equal(created.status, 201);
    assert.equal(created.body?.success, true);
    assert.equal((created.body?.booking as { status: string }).status, "PENDING");
    assert.ok((created.body?.booking as { id: string }).id);

    const forbidden = await requestJson(baseUrl, "/bookings", {
      method: "POST",
      token: "provider-token",
      body: {
        providerId: "provider_1",
        title: "Réparer une fuite",
        scheduledDate: "2026-04-23T08:00:00.000Z",
      },
    });

    assert.equal(forbidden.status, 403);
  } finally {
    await app.close();
  }
});

test("booking status transitions run through controller validation and service state rules", async () => {
  const { app, baseUrl } = await createHarness();

  try {
    const invalidSkip = await requestJson(baseUrl, "/bookings/booking_1", {
      method: "PATCH",
      token: "provider-token",
      body: { status: "COMPLETED" },
    });

    assert.equal(invalidSkip.status, 400);

    const confirmed = await requestJson(baseUrl, "/bookings/booking_1", {
      method: "PATCH",
      token: "provider-token",
      body: { status: "CONFIRMED" },
    });
    assert.equal(confirmed.status, 200);
    assert.equal((confirmed.body?.booking as { status: string }).status, "CONFIRMED");

    const started = await requestJson(baseUrl, "/bookings/booking_1", {
      method: "PATCH",
      token: "provider-token",
      body: { status: "IN_PROGRESS" },
    });
    assert.equal(started.status, 200);
    assert.equal((started.body?.booking as { status: string }).status, "IN_PROGRESS");

    const completed = await requestJson(baseUrl, "/bookings/booking_1", {
      method: "PATCH",
      token: "provider-token",
      body: { status: "COMPLETED" },
    });
    assert.equal(completed.status, 200);
    assert.equal((completed.body?.booking as { status: string }).status, "COMPLETED");
  } finally {
    await app.close();
  }
});

test("messaging route bootstraps first contact through the real controller and guards", async () => {
  const { app, baseUrl } = await createHarness();

  try {
    const sent = await requestJson(baseUrl, "/messages", {
      method: "POST",
      token: "client-token",
      body: {
        recipientId: "provider_user_1",
        content: "Bonjour, êtes-vous disponible ?",
        type: "TEXT",
      },
    });

    assert.equal(sent.status, 201);
    assert.equal(sent.body?.success, true);
    assert.equal((sent.body as { conversationId: string }).conversationId.startsWith("conversation_"), true);
    assert.equal(((sent.body as { message: { conversationId: string } }).message.conversationId), (sent.body as { conversationId: string }).conversationId);
  } finally {
    await app.close();
  }
});

test("quote acceptance route returns a real confirmed-booking payload shape", async () => {
  const { app, baseUrl } = await createHarness();

  try {
    const accepted = await requestJson(baseUrl, "/quotes/quote_1/accept", {
      method: "POST",
      token: "client-token",
    });

    assert.equal(accepted.status, 201);
    assert.equal((accepted.body?.quote as { status: string }).status, "ACCEPTED");
    assert.equal((accepted.body?.booking as { status: string }).status, "CONFIRMED");
    assert.ok((accepted.body?.booking as { id: string }).id);
  } finally {
    await app.close();
  }
});

test("review creation route only accepts completed bookings and returns review payloads", async () => {
  const { app, baseUrl } = await createHarness();

  try {
    const pending = await requestJson(baseUrl, "/reviews", {
      method: "POST",
      token: "client-token",
      body: {
        bookingId: "booking_1",
        providerId: "provider_1",
        rating: 5,
        comment: "Très bon travail",
        isPublic: true,
      },
    });

    assert.equal(pending.status, 400);

    const completed = await requestJson(baseUrl, "/reviews", {
      method: "POST",
      token: "client-token",
      body: {
        bookingId: "booking_completed_1",
        providerId: "provider_1",
        rating: 5,
        punctuality: 5,
        quality: 5,
        communication: 4,
        value: 4,
        professionalism: 5,
        satisfactionTags: ["Ponctuel"],
        comment: "Très bon travail",
        isPublic: true,
      },
    });

    assert.equal(completed.status, 201);
    assert.equal(completed.body?.success, true);
    assert.equal((completed.body?.review as { id: string }).id, "review_1");
  } finally {
    await app.close();
  }
});
