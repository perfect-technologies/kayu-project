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
import { FinalOffersController } from "../../modules/bookings/final-offers.controller";
import { IdentityController } from "../../modules/identity/identity.controller";
import { IdentityRepository, type UserWithProvider } from "../../modules/identity/identity.repository";
import { IdentityService } from "../../modules/identity/identity.service";
import { MessagingController } from "../../modules/messaging/messaging.controller";
import { MessagingService } from "../../modules/messaging/messaging.service";
import { NotificationsService } from "../../modules/notifications/notifications.service";
import { ProvidersController } from "../../modules/providers/providers.controller";
import { ProvidersService } from "../../modules/providers/providers.service";
import { QuotesController } from "../../modules/quotes/quotes.controller";
import { QuotesService } from "../../modules/quotes/quotes.service";
import { ReviewsController } from "../../modules/reviews/reviews.controller";
import { ReviewsService } from "../../modules/reviews/reviews.service";

const now = new Date("2026-04-22T10:00:00.000Z");

type IntegrationState = ReturnType<typeof createState>;

function createState() {
  const usersById = new Map<string, UserWithProvider>();
  const usersByAuthUserId = new Map<string, UserWithProvider>();
  const providersById = new Map<string, Record<string, any>>();
  const providersByUserId = new Map<string, { id: string }>();
  const bookingsById = new Map<string, Record<string, unknown>>();
  const conversationsByKey = new Map<string, Record<string, any>>();
  const messagesByConversationId = new Map<string, Array<Record<string, unknown>>>();
  const quotesById = new Map<string, Record<string, unknown>>();
  const finalOffersById = new Map<string, Record<string, unknown>>();
  const reviewsByBookingId = new Map<string, Record<string, unknown>>();
  const notifications: Array<Record<string, unknown>> = [];
  const earningTransactions: Array<Record<string, unknown>> = [];
  let nextBookingIndex = 2;
  let nextConversationIndex = 1;
  let nextFinalOfferIndex = 0;
  let nextMessageIndex = 0;

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
    description: "Interventions plomberie rapides a Kinshasa.",
    experience: 8,
    hourlyRate: 30000,
    videoUrl: null,
    isAvailable: true,
    isPremium: false,
    premiumExpiry: null,
    totalReviews: 3,
    totalJobs: 8,
    responseTime: 45,
    verificationStatus: "VERIFIED" as const,
    onboardingCompleteAt: new Date("2026-04-18T10:00:00.000Z"),
    createdAt: now,
    updatedAt: now,
    user: {
      id: providerUser.id,
      firstName: providerUser.firstName,
      lastName: providerUser.lastName,
      avatar: null,
      city: "Kinshasa",
      country: "RDC",
      isVerified: true,
      visibilitySettings: {
        profileVisible: "PUBLIC",
        showEmail: false,
        showPhone: true,
        showExactLocation: false,
        showHourlyRate: true,
        showPastWork: true,
        showReviews: true,
        showAvailability: true,
        showCertifications: true,
        showClientHistory: false,
        showClientReviews: false,
        allowDirectContact: true,
        allowMessages: true,
        appearInSearch: true,
        appearInCategory: true,
      },
    },
    categories: [
      {
        category: {
          id: "cat_plomberie",
          name: "Plomberie",
          slug: "plomberie",
          icon: "wrench",
          color: "#0f766e",
          isActive: true,
        },
      },
    ],
    trades: [
      {
        trade: {
          id: "trade_fuite",
          subcategoryId: "sub_depannage",
          name: "Reparation de fuite",
          slug: "reparation-fuite",
          description: "Fuites, joints et canalisations",
          icon: "droplets",
          basePrice: 50000,
          duration: 120,
          isActive: true,
          order: 1,
          createdAt: now,
          updatedAt: now,
          subcategory: {
            id: "sub_depannage",
            name: "Depannage",
            slug: "depannage",
            categoryId: "cat_plomberie",
          },
        },
      },
    ],
    skills: [{ id: "skill_1", providerId: "provider_1", name: "Fuites", level: 5 }],
    serviceZones: [
      {
        id: "zone_1",
        providerId: "provider_1",
        city: "Kinshasa",
        commune: "Gombe",
        createdAt: now,
        updatedAt: now,
      },
    ],
    trustScore: {
      id: "trust_1",
      providerId: "provider_1",
      badges: [],
    },
    certifications: [],
    portfolio: [],
    portfolioProjects: [],
    availabilitySchedules: [],
    subscription: null,
    reviews: [],
    _count: {
      bookings: 8,
      reviews: 3,
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
    finalOffersById,
    reviewsByBookingId,
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
    nextFinalOfferId() {
      nextFinalOfferIndex += 1;
      return `final_offer_${nextFinalOfferIndex}`;
    },
    nextMessage() {
      nextMessageIndex += 1;
      return {
        id: `message_${nextMessageIndex}`,
        createdAt: new Date(now.getTime() + nextMessageIndex * 1000),
      };
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
  const getPublicUser = (userId: string) => {
    const user = state.usersById.get(userId);
    if (!user) return null;
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      role: user.role,
      isVerified: user.isVerified,
    };
  };

  const bookingMatchesWhere = (
    booking: Record<string, unknown>,
    where?: Record<string, unknown>,
  ) => {
    if (!where) return true;
    if (where.clientId && booking.clientId !== where.clientId) return false;
    if (where.providerId && booking.providerId !== where.providerId) return false;
    if (where.status && booking.status !== where.status) return false;
    return true;
  };

  const finalOfferMatchesWhere = (
    finalOffer: Record<string, unknown>,
    where?: Record<string, unknown>,
  ) => {
    if (!where) return true;
    if (where.clientId && finalOffer.clientId !== where.clientId) return false;
    if (where.providerId && finalOffer.providerId !== where.providerId) return false;
    if (where.status && finalOffer.status !== where.status) return false;
    if (where.conversationId && finalOffer.conversationId !== where.conversationId) return false;
    if (where.bookingId && finalOffer.bookingId !== where.bookingId) return false;
    return true;
  };

  const getConversationById = (id: string) =>
    Array.from(state.conversationsByKey.values()).find(
      (conversation) => conversation.id === id,
    ) ?? null;

  const mapConversationForList = (conversation: Record<string, any>, actorId: string) => {
    const messages = state.messagesByConversationId.get(String(conversation.id)) ?? [];
    const lastMessage = messages[messages.length - 1];
    const unreadCount = messages.filter(
      (message) =>
        message.senderId !== actorId &&
        message.isRead === false &&
        message.isDeleted === false,
    ).length;

    return {
      ...conversation,
      user1: getPublicUser(String(conversation.user1Id)),
      user2: getPublicUser(String(conversation.user2Id)),
      messages: lastMessage
        ? [
            {
              content: lastMessage.content,
              createdAt: lastMessage.createdAt,
              senderId: lastMessage.senderId,
              sender: getPublicUser(String(lastMessage.senderId)),
            },
          ]
        : [],
      _count: {
        messages: unreadCount,
      },
    };
  };

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
      findUnique: async ({ where }: { where: { id: string } }) => {
        const booking = state.bookingsById.get(where.id);
        if (!booking) return null;
        return {
          clientId: booking.clientId,
          providerId: booking.providerId,
          status: booking.status,
        };
      },
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
    finalOffer: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const provider = state.providersById.get(String(data.providerId));
        const client = state.usersById.get(String(data.clientId));
        if (!provider || !client) throw new Error("Missing final offer participants");
        const finalOffer = {
          id: state.nextFinalOfferId(),
          providerId: data.providerId,
          clientId: data.clientId,
          conversationId: data.conversationId ?? null,
          bookingId: data.bookingId ?? null,
          title: data.title,
          description: data.description ?? null,
          price: data.price,
          duration: data.duration ?? null,
          scheduledDate: data.scheduledDate,
          address: data.address ?? null,
          city: data.city ?? null,
          notes: data.notes ?? null,
          paymentMethod: "cash",
          status: data.status ?? "PENDING",
          sentAt: now,
          acceptedAt: null,
          declinedAt: null,
          cancelledAt: null,
          expiresAt: data.expiresAt ?? null,
          createdAt: now,
          updatedAt: now,
          client: {
            id: client.id,
            firstName: client.firstName,
            lastName: client.lastName,
            avatar: client.avatar,
            isVerified: client.isVerified,
          },
          provider: {
            id: provider.id,
            userId: provider.userId,
            profession: provider.profession,
            user: {
              id: provider.user.id,
              firstName: provider.user.firstName,
              lastName: provider.user.lastName,
              avatar: provider.user.avatar,
              isVerified: provider.user.isVerified,
            },
          },
          booking: null,
        };
        state.finalOffersById.set(String(finalOffer.id), finalOffer);
        return finalOffer;
      },
      findUnique: async ({ where }: { where: { id: string } }) =>
        state.finalOffersById.get(where.id) ?? null,
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Record<string, unknown>;
      }) => {
        const finalOffer = state.finalOffersById.get(where.id);
        if (!finalOffer) throw new Error("Final offer not found");
        Object.assign(finalOffer, data, { updatedAt: now });
        if (finalOffer.bookingId) {
          const booking = state.bookingsById.get(String(finalOffer.bookingId));
          finalOffer.booking = booking
            ? {
                id: booking.id,
                title: booking.title,
                status: booking.status,
                scheduledDate: booking.scheduledDate,
                price: booking.price,
              }
            : null;
        }
        state.finalOffersById.set(where.id, finalOffer);
        return finalOffer;
      },
      updateMany: async () => ({ count: 0 }),
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
            createdAt: now,
            updatedAt: now,
            lastMessageAt: null,
          };
          state.conversationsByKey.set(key, conversation);
        }
        return conversation;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Record<string, unknown>;
      }) => {
        const conversation = Array.from(state.conversationsByKey.values()).find(
          (item) => item.id === where.id,
        );
        if (conversation) {
          Object.assign(conversation, data, { updatedAt: now });
        }
        return conversation;
      },
    },
    message: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const sender = state.usersById.get(String(data.senderId));
        const messageMeta = state.nextMessage();
        const created = {
          id: messageMeta.id,
          conversationId: data.conversationId,
          senderId: data.senderId,
          content: data.content,
          type: data.type,
          fileUrl: data.fileUrl ?? null,
          isRead: false,
          readAt: null,
          isDeleted: false,
          createdAt: messageMeta.createdAt,
          sender: {
            id: data.senderId,
            firstName: sender?.firstName ?? null,
            lastName: sender?.lastName ?? null,
            avatar: sender?.avatar ?? null,
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
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const booking = state.bookingsById.get(String(data.bookingId));
        const client = state.usersById.get(String(data.clientId));
        const review = {
          id: `review_${state.reviewsByBookingId.size + 1}`,
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
            id: client?.id ?? "client_user_1",
            firstName: client?.firstName ?? "Client",
            lastName: client?.lastName ?? "User",
            avatar: client?.avatar ?? null,
          },
          booking: {
            title: booking?.title ?? "Dépannage urgent",
            service: null,
          },
        };
        state.reviewsByBookingId.set(String(data.bookingId), review);
        if (booking) {
          booking.review = { id: review.id };
        }
        return review;
      },
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
          ...user,
          id: user.id,
          role: user.role,
          visibilitySettings: {
            allowMessages: true,
          },
        };
      },
    },
    conversation: {
      findFirst: async ({
        where,
      }: {
        where: { id: string; OR?: Array<{ user1Id?: string; user2Id?: string }> };
      }) => {
        const conversation = getConversationById(where.id);
        if (!conversation) return null;
        const participantIds = [conversation.user1Id, conversation.user2Id];
        const allowed = where.OR?.some(
          (condition) =>
            (condition.user1Id && participantIds.includes(condition.user1Id)) ||
            (condition.user2Id && participantIds.includes(condition.user2Id)),
        );
        return allowed === false ? null : { id: conversation.id };
      },
      findMany: async ({
        where,
      }: {
        where: { OR?: Array<{ user1Id?: string; user2Id?: string }> };
      }) => {
        const actorId =
          where.OR?.find((condition) => condition.user1Id)?.user1Id ??
          where.OR?.find((condition) => condition.user2Id)?.user2Id ??
          "";
        return Array.from(state.conversationsByKey.values())
          .filter((conversation) =>
            [conversation.user1Id, conversation.user2Id].includes(actorId),
          )
          .map((conversation) => mapConversationForList(conversation, actorId));
      },
      findUnique: async ({ where }: { where: { id: string } }) => {
        return getConversationById(where.id);
      },
    },
    message: {
      count: async ({ where }: { where: { conversationId: string } }) =>
        (state.messagesByConversationId.get(where.conversationId) ?? []).filter(
          (message) => message.isDeleted === false,
        ).length,
      findMany: async ({
        where,
      }: {
        where: { conversationId: string };
      }) =>
        [...(state.messagesByConversationId.get(where.conversationId) ?? [])]
          .filter((message) => message.isDeleted === false)
          .sort(
            (left, right) =>
              (right.createdAt as Date).getTime() - (left.createdAt as Date).getTime(),
          ),
      updateMany: async ({
        where,
        data,
      }: {
        where: { conversationId: string; senderId?: { not: string } };
        data: Record<string, unknown>;
      }) => {
        const messages = state.messagesByConversationId.get(where.conversationId) ?? [];
        let count = 0;
        for (const message of messages) {
          if (where.senderId?.not && message.senderId === where.senderId.not) continue;
          Object.assign(message, data);
          count += 1;
        }
        return { count };
      },
    },
    provider: {
      count: async () => state.providersById.size,
      findMany: async () => Array.from(state.providersById.values()),
      findUnique: async ({
        where,
      }: {
        where: { id?: string; userId?: string };
        select?: Record<string, boolean>;
        include?: Record<string, unknown>;
      }) => {
        if (where.id) {
          return state.providersById.get(where.id) ?? null;
        }
        if (where.userId) {
          const providerRef = state.providersByUserId.get(where.userId);
          return providerRef ? state.providersById.get(providerRef.id) ?? providerRef : null;
        }
        return null;
      },
    },
    booking: {
      count: async ({ where }: { where?: Record<string, unknown> } = {}) =>
        Array.from(state.bookingsById.values()).filter((booking) =>
          bookingMatchesWhere(booking, where),
        ).length,
      findMany: async ({ where }: { where?: Record<string, unknown> } = {}) =>
        Array.from(state.bookingsById.values()).filter((booking) =>
          bookingMatchesWhere(booking, where),
        ),
      findFirst: async ({ where }: { where?: Record<string, unknown> } = {}) =>
        Array.from(state.bookingsById.values()).find((booking) =>
          bookingMatchesWhere(booking, where),
        ) ?? null,
      findUnique: async ({ where }: { where: { id: string } }) =>
        state.bookingsById.get(where.id) ?? null,
    },
    finalOffer: {
      count: async ({ where }: { where?: Record<string, unknown> } = {}) =>
        Array.from(state.finalOffersById.values()).filter((finalOffer) =>
          finalOfferMatchesWhere(finalOffer, where),
        ).length,
      findMany: async ({ where }: { where?: Record<string, unknown> } = {}) =>
        Array.from(state.finalOffersById.values()).filter((finalOffer) =>
          finalOfferMatchesWhere(finalOffer, where),
        ),
      findUnique: async ({ where }: { where: { id: string } }) =>
        state.finalOffersById.get(where.id) ?? null,
    },
    review: {
      count: async () => state.reviewsByBookingId.size,
      findMany: async () => Array.from(state.reviewsByBookingId.values()),
      groupBy: async () => [
        {
          providerId: "provider_1",
          _avg: { overallScore: 4.6 },
          _count: { providerId: state.reviewsByBookingId.size || 3 },
        },
      ],
      aggregate: async () => ({
        _avg: {
          overallScore: 4.6,
          punctuality: 4.5,
          quality: 4.7,
          communication: 4.4,
          value: 4.5,
          professionalism: 4.8,
        },
      }),
    },
    certification: {
      groupBy: async () => [],
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
      "new-client-token",
      {
        authUserId: "auth_smoke_client_1",
        email: "smoke-client@example.com",
        phone: "+243810000123",
        claims: {
          sub: "auth_smoke_client_1",
          email: "smoke-client@example.com",
          phone: "+243810000123",
        },
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
      FinalOffersController,
      MessagingController,
      ProvidersController,
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
      ProvidersService,
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

test("final offer route lets provider send terms and client accept into booking", async () => {
  const { app, baseUrl, state } = await createHarness();

  try {
    const created = await requestJson(baseUrl, "/final-offers", {
      method: "POST",
      token: "provider-token",
      body: {
        providerId: "provider_1",
        clientId: "client_user_1",
        title: "Réparer une fuite",
        description: "Remplacement du joint et test.",
        price: 65000,
        duration: 90,
        scheduledDate: "2026-04-23T10:00:00.000Z",
        address: "12 Avenue Kasa-Vubu",
        city: "Kinshasa",
        notes: "Paiement en espèces à la fin.",
        paymentMethod: "cash",
      },
    });

    assert.equal(created.status, 201);
    assert.equal(created.body?.success, true);
    const finalOffer = created.body?.finalOffer as { id: string; status: string; paymentMethod: string };
    assert.equal(finalOffer.status, "PENDING");
    assert.equal(finalOffer.paymentMethod, "cash");

    const accepted = await requestJson(baseUrl, `/final-offers/${finalOffer.id}/accept`, {
      method: "POST",
      token: "client-token",
    });

    assert.equal(accepted.status, 201);
    assert.equal((accepted.body?.finalOffer as { status: string }).status, "ACCEPTED");
    assert.equal((accepted.body?.booking as { status: string }).status, "CONFIRMED");
    assert.equal((accepted.body?.booking as { paymentMethod: string }).paymentMethod, "cash");
    assert.equal(state.quotesById.get("quote_1")?.status, "SENT");
  } finally {
    await app.close();
  }
});

test("launch smoke covers signup, discovery, chat, direct booking, cash completion, review, and final offer", async () => {
  const { app, baseUrl, state } = await createHarness();

  try {
    const me = await requestJson(baseUrl, "/me", {
      token: "new-client-token",
    });
    assert.equal(me.status, 200);
    assert.equal(me.body?.success, true);
    const newClient = me.body?.user as { id: string; profileComplete: boolean; phone: string };
    assert.equal(newClient.profileComplete, false);
    assert.equal(newClient.phone, "+243810000123");

    const role = await requestJson(baseUrl, "/me/role", {
      method: "PATCH",
      token: "new-client-token",
      body: { role: "CLIENT" },
    });
    assert.equal(role.status, 200);
    assert.equal((role.body?.user as { role: string }).role, "CLIENT");

    const profile = await requestJson(baseUrl, "/me/profile", {
      method: "PATCH",
      token: "new-client-token",
      body: {
        firstName: "Smoke",
        lastName: "Client",
        city: "Kinshasa",
        country: "RDC",
        phone: "+243810000123",
      },
    });
    assert.equal(profile.status, 200);
    assert.equal((profile.body?.user as { profileComplete: boolean }).profileComplete, true);

    const discovery = await requestJson(
      baseUrl,
      "/providers?category=plomberie&city=Kinshasa&page=1&limit=10",
    );
    assert.equal(discovery.status, 200);
    const providers = discovery.body?.providers as Array<{ id: string; categories: Array<{ slug: string }> }>;
    assert.equal(providers.length, 1);
    assert.equal(providers[0]?.id, "provider_1");
    assert.equal(providers[0]?.categories[0]?.slug, "plomberie");

    const providerProfile = await requestJson(baseUrl, "/providers/provider_1", {
      token: "client-token",
    });
    assert.equal(providerProfile.status, 200);
    assert.equal(providerProfile.body?.success, true);
    assert.equal(providerProfile.body?.hasAccess, true);

    const firstMessage = await requestJson(baseUrl, "/messages", {
      method: "POST",
      token: "client-token",
      body: {
        recipientId: "provider_user_1",
        content: "Bonjour, etes-vous disponible demain ?",
        type: "TEXT",
      },
    });
    assert.equal(firstMessage.status, 201);
    const conversationId = (firstMessage.body as { conversationId: string }).conversationId;

    const providerInbox = await requestJson(baseUrl, "/messages?page=1&limit=10", {
      token: "provider-token",
    });
    assert.equal(providerInbox.status, 200);
    assert.equal(
      (providerInbox.body?.conversations as Array<{ id: string }>).some(
        (conversation) => conversation.id === conversationId,
      ),
      true,
    );

    const providerReply = await requestJson(baseUrl, "/messages", {
      method: "POST",
      token: "provider-token",
      body: {
        recipientId: "client_user_1",
        content: "Oui, je peux passer demain matin.",
        type: "TEXT",
      },
    });
    assert.equal(providerReply.status, 201);

    const chatThread = await requestJson(
      baseUrl,
      `/messages?conversationId=${conversationId}&page=1&limit=10`,
      { token: "client-token" },
    );
    assert.equal(chatThread.status, 200);
    const messages = chatThread.body?.messages as Array<{ content: string }>;
    assert.equal(messages.length, 2);
    assert.equal(messages[0]?.content, "Bonjour, etes-vous disponible demain ?");
    assert.equal(messages[1]?.content, "Oui, je peux passer demain matin.");

    const createdBooking = await requestJson(baseUrl, "/bookings", {
      method: "POST",
      token: "client-token",
      body: {
        providerId: "provider_1",
        title: "Reparer une fuite",
        description: "Salle de bain",
        address: "12 Avenue Kasa-Vubu",
        city: "Kinshasa",
        scheduledDate: "2026-04-24T08:00:00.000Z",
        duration: 120,
        price: 50000,
        clientNotes: "Intervention rapide si possible",
      },
    });
    assert.equal(createdBooking.status, 201);
    const directBooking = createdBooking.body?.booking as { id: string; status: string };
    assert.equal(directBooking.status, "PENDING");

    const providerBookings = await requestJson(
      baseUrl,
      "/bookings?role=provider&status=PENDING&page=1&limit=10",
      { token: "provider-token" },
    );
    assert.equal(providerBookings.status, 200);
    assert.equal(
      (providerBookings.body?.bookings as Array<{ id: string }>).some(
        (booking) => booking.id === directBooking.id,
      ),
      true,
    );

    const confirmed = await requestJson(baseUrl, `/bookings/${directBooking.id}`, {
      method: "PATCH",
      token: "provider-token",
      body: { status: "CONFIRMED" },
    });
    assert.equal(confirmed.status, 200);
    assert.equal((confirmed.body?.booking as { status: string }).status, "CONFIRMED");

    const clientBooking = await requestJson(baseUrl, `/bookings/${directBooking.id}`, {
      token: "client-token",
    });
    assert.equal(clientBooking.status, 200);
    assert.equal((clientBooking.body?.booking as { status: string }).status, "CONFIRMED");

    const started = await requestJson(baseUrl, `/bookings/${directBooking.id}`, {
      method: "PATCH",
      token: "provider-token",
      body: { status: "IN_PROGRESS" },
    });
    assert.equal(started.status, 200);

    const completed = await requestJson(baseUrl, `/bookings/${directBooking.id}`, {
      method: "PATCH",
      token: "provider-token",
      body: { status: "COMPLETED" },
    });
    assert.equal(completed.status, 200);
    assert.equal((completed.body?.booking as { status: string }).status, "COMPLETED");

    const paid = await requestJson(baseUrl, `/bookings/${directBooking.id}`, {
      method: "PATCH",
      token: "provider-token",
      body: { isPaid: true, paymentMethod: "cash" },
    });
    assert.equal(paid.status, 200);
    const paidBooking = paid.body?.booking as { isPaid: boolean; paymentMethod: string };
    assert.equal(paidBooking.isPaid, true);
    assert.equal(paidBooking.paymentMethod, "cash");

    const review = await requestJson(baseUrl, "/reviews", {
      method: "POST",
      token: "client-token",
      body: {
        bookingId: directBooking.id,
        providerId: "provider_1",
        rating: 5,
        punctuality: 5,
        quality: 5,
        communication: 5,
        value: 4,
        professionalism: 5,
        satisfactionTags: ["Ponctuel"],
        comment: "Tres bon travail, intervention rapide.",
        isPublic: true,
      },
    });
    assert.equal(review.status, 201);
    assert.equal(review.body?.success, true);
    assert.equal((review.body?.review as { bookingId: string }).bookingId, directBooking.id);

    const acceptedOfferResponse = await requestJson(baseUrl, "/final-offers", {
      method: "POST",
      token: "provider-token",
      body: {
        providerId: "provider_1",
        clientId: "client_user_1",
        conversationId,
        title: "Remplacer le joint",
        description: "Joint et test de fuite apres discussion.",
        price: 65000,
        duration: 90,
        scheduledDate: "2026-04-25T09:00:00.000Z",
        address: "12 Avenue Kasa-Vubu",
        city: "Kinshasa",
        notes: "Paiement en especes a la fin de la mission.",
        paymentMethod: "cash",
      },
    });
    assert.equal(acceptedOfferResponse.status, 201);
    const acceptedOffer = acceptedOfferResponse.body?.finalOffer as { id: string; status: string };
    assert.equal(acceptedOffer.status, "PENDING");

    const acceptedOfferResult = await requestJson(
      baseUrl,
      `/final-offers/${acceptedOffer.id}/accept`,
      {
        method: "POST",
        token: "client-token",
      },
    );
    assert.equal(acceptedOfferResult.status, 201);
    assert.equal((acceptedOfferResult.body?.finalOffer as { status: string }).status, "ACCEPTED");
    assert.equal((acceptedOfferResult.body?.booking as { status: string }).status, "CONFIRMED");
    assert.equal((acceptedOfferResult.body?.booking as { paymentMethod: string }).paymentMethod, "cash");

    const declinedOfferResponse = await requestJson(baseUrl, "/final-offers", {
      method: "POST",
      token: "provider-token",
      body: {
        providerId: "provider_1",
        clientId: "client_user_1",
        conversationId,
        title: "Intervention supplementaire",
        price: 25000,
        duration: 30,
        scheduledDate: "2026-04-25T11:00:00.000Z",
        address: "12 Avenue Kasa-Vubu",
        city: "Kinshasa",
        paymentMethod: "cash",
      },
    });
    assert.equal(declinedOfferResponse.status, 201);
    const declinedOffer = declinedOfferResponse.body?.finalOffer as { id: string };

    const declined = await requestJson(baseUrl, `/final-offers/${declinedOffer.id}/decline`, {
      method: "POST",
      token: "client-token",
    });
    assert.equal(declined.status, 201);
    assert.equal((declined.body?.finalOffer as { status: string }).status, "DECLINED");

    const continueDiscussion = await requestJson(baseUrl, "/messages", {
      method: "POST",
      token: "client-token",
      body: {
        recipientId: "provider_user_1",
        content: "Merci, discutons encore du prix.",
        type: "TEXT",
      },
    });
    assert.equal(continueDiscussion.status, 201);
    assert.equal(state.quotesById.get("quote_1")?.status, "SENT");
    assert.equal(state.earningTransactions.length > 0, true);
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
