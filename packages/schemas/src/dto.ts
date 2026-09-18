import { z } from "zod";
import {
  BooleanQuerySchema,
  CountrySchema,
  DateOnlySchema,
  DateTimeSchema,
  HttpsUrlSchema,
  IdSchema,
  JsonObjectSchema,
  LatitudeSchema,
  LongitudeSchema,
  NullableDateTimeSchema,
  OkResponseSchema,
  PhoneE164Schema,
  StoragePathSchema,
  type Wire,
  createPaginatedResponseSchema,
  csvIds,
  optionalText,
  pagination,
} from "./common.js";
import {
  AddressLabel,
  BookingStatus,
  ContactStatus,
  PlaceKind,
  PremiumTier,
  ReferenceType,
  ReportStatus,
  ReportTargetKind,
  SuggestionStatus,
  UploadPurpose,
  UserRole,
  VerificationStatus,
} from "./enums.js";
import { MEDIA_LIMITS, MediaListInputSchema, MessageAttachmentInput } from "./media.js";
import {
  ActivityLogSchema,
  AddressSchema,
  BlockSchema,
  BookingCardSchema,
  BookingDetailSchema,
  CategoryChainItemSchema,
  CategoryTreeNodeSchema,
  ClientReviewSchema,
  ContactMessageSchema,
  ConversationSchema,
  LocalSlotSchema,
  MessageAttachmentSchema,
  MessageSchema,
  NotificationSchema,
  PersonRefSchema,
  PlaceSchema,
  PlaceSuggestionSchema,
  PlaceSummarySchema,
  ProviderCardSchema,
  ProviderContactsSchema,
  ProviderMediaSchema,
  ProviderPricingSchema,
  ProviderPublicSchema,
  PublicReviewSchema,
  RatingSummarySchema,
  ReferenceItemSchema,
  ReferenceItemSummarySchema,
  ReportSchema,
  ReviewSchema,
  ScheduleSchema,
  ScheduleSummarySchema,
  SiteSettingsSchema,
  SocialLinksSchema,
  TaxonomyLevelSchema,
  TransactionSchema,
  UserSchema,
} from "./models.js";
import { ScheduleInputSchema, TimeOfDaySchema } from "./schedule.js";

const Count = z.number().int().min(0);
const search = z.string().trim().min(1).max(120).optional();
const noEmptyPatch = { message: "Aucun champ à mettre à jour" };
const coordinatesTogether = (value: { latitude?: number | null; longitude?: number | null }) =>
  (value.latitude === undefined || value.latitude === null) ===
  (value.longitude === undefined || value.longitude === null);

// =====================================================================================
// Public discovery
// =====================================================================================

export const PublicSettingsResponseSchema = SiteSettingsSchema;

export const PublicStatsResponseSchema = z.object({
  categories: Count,
  countries: Count,
  providers: Count,
  verifiedProviders: Count,
});

export const CategoryTreeResponseSchema = z.object({ items: z.array(CategoryTreeNodeSchema) });

export const PlacesQueryParams = pagination(100).extend({
  kind: PlaceKind.optional(),
  parentId: IdSchema.optional(),
  q: z.string().trim().min(1).max(100).optional(),
  ids: csvIds.optional(),
});
export const PlacesResponseSchema = createPaginatedResponseSchema(PlaceSummarySchema);
export const PlaceAncestorsResponseSchema = z.object({ items: z.array(PlaceSummarySchema) });

export const ReferencesQueryParams = pagination(100).extend({
  type: ReferenceType,
  categoryId: IdSchema.optional(),
  q: z.string().trim().min(1).max(100).optional(),
});
export const ReferencesResponseSchema = createPaginatedResponseSchema(ReferenceItemSummarySchema);

export const ProviderSearchSort = z.enum(["recommended", "rating", "distance", "newest"]);

// `subcategoryId` and `placeId` match descendants; `sort=distance` requires `lat` and `lng`.
export const ProviderSearchParams = pagination(20)
  .extend({
    q: z.string().trim().min(1).max(120).optional(),
    categoryId: IdSchema.optional(),
    categorySlug: z.string().trim().min(1).max(120).optional(),
    subcategoryId: IdSchema.optional(),
    placeId: IdSchema.optional(),
    languageId: IdSchema.optional(),
    modeId: IdSchema.optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    verifiedOnly: BooleanQuerySchema.optional(),
    premiumOnly: BooleanQuerySchema.optional(),
    sort: ProviderSearchSort.default("recommended"),
    lat: LatitudeSchema.optional(),
    lng: LongitudeSchema.optional(),
  })
  .superRefine((params, ctx) => {
    if ((params.lat === undefined) !== (params.lng === undefined)) {
      ctx.addIssue({ code: "custom", path: ["lat"], message: "lat et lng vont ensemble" });
    }
    if (params.sort === "distance" && params.lat === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["sort"],
        message: "Le tri par distance exige lat et lng",
      });
    }
  });
export const ProviderSearchResponseSchema = createPaginatedResponseSchema(ProviderCardSchema);

export const ProviderPublicResponseSchema = ProviderPublicSchema;

export const AvailabilityQueryParams = z.object({ date: DateOnlySchema });
export const AvailabilityResponseSchema = z.object({
  date: z.string(),
  timezone: ScheduleSchema.shape.timezone,
  slotDurationMin: z.number().int(),
  slotBufferMin: z.number().int(),
  slots: z.array(z.string()),
});

export const ProviderReviewsQueryParams = pagination(10);
export const ProviderReviewsResponseSchema = createPaginatedResponseSchema(PublicReviewSchema);

export const CreateContactMessageDto = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().toLowerCase().max(254).email("Adresse e-mail invalide"),
  phone: z.string().trim().max(40).nullable().optional(),
  subject: z.string().trim().min(2).max(160),
  message: z.string().trim().min(10).max(5000),
});
export const CreateContactMessageResponseSchema = OkResponseSchema;

export const GeocodeParams = z
  .object({
    q: z.string().trim().min(2).max(200).optional(),
    placeId: IdSchema.optional(),
  })
  .refine((params) => Boolean(params.q) !== Boolean(params.placeId), {
    message: "Fournir q ou placeId",
  });
export const GeocodeResponseSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  label: z.string(),
  source: z.enum(["place", "nominatim"]),
});

export const DistanceParams = z.object({
  lat: LatitudeSchema,
  lng: LongitudeSchema,
  providerLat: LatitudeSchema.optional(),
  providerLng: LongitudeSchema.optional(),
});
export const DistanceResponseSchema = z.union([
  z.object({
    success: z.literal(true),
    distance: z.number(),
    formatted: z.string(),
    status: z.enum(["close", "medium", "far"]),
  }),
  z.object({ success: z.literal(true), message: z.string(), hint: z.string() }),
]);

// =====================================================================================
// Identity and account
// =====================================================================================

export const MeUserSchema = UserSchema.extend({
  profileComplete: z.boolean(),
  provider: z
    .object({ id: IdSchema, hidden: z.boolean(), verificationStatus: VerificationStatus })
    .nullable(),
});
export const MeResponseSchema = z.object({ success: z.literal(true), user: MeUserSchema });

export const UpdateProfileDto = z
  .object({
    firstName: z.string().trim().min(1).max(80).optional(),
    lastName: z.string().trim().min(1).max(80).optional(),
    avatar: HttpsUrlSchema.nullable().optional(),
    bio: optionalText(1000),
    gender: optionalText(30),
    birthdate: DateOnlySchema.nullable().optional(),
    placeId: IdSchema.nullable().optional(),
    country: CountrySchema.optional(),
  })
  .refine((body) => Object.keys(body).length > 0, noEmptyPatch);
export const UpdateProfileResponseSchema = MeResponseSchema;

export const AcceptTermsResponseSchema = MeResponseSchema;
export const DeleteAccountResponseSchema = OkResponseSchema;

export const ConfirmAvatarDto = z.object({ path: StoragePathSchema });
export const ConfirmAvatarResponseSchema = z.object({
  success: z.literal(true),
  avatarUrl: z.string(),
});

// Per purpose — avatar: jpeg/png/webp ≤ 8 MB; media: images ≤ 8 MB, mp4/quicktime/webm ≤ 25 MB;
// attachments: images and webm/mp4/mpeg/ogg audio ≤ 8 MB; verification: images or PDF ≤ 10 MB.
export const UploadSignRequestDto = z.object({
  purpose: UploadPurpose,
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(120),
  bytes: z.number().int().positive().optional(),
});
export const UploadSignResponseSchema = z.object({
  bucket: z.string(),
  path: z.string(),
  token: z.string(),
  signedUrl: z.string(),
});

export const SignReadQueryParams = z.object({ path: StoragePathSchema });
export const SignReadResponseSchema = z.object({ url: z.string(), expiresAt: DateTimeSchema });

// =====================================================================================
// Provider self-service
// =====================================================================================

const uniqueIds = (max: number) =>
  z
    .array(IdSchema)
    .max(max)
    .refine((ids) => new Set(ids).size === ids.length, "Choix en double");

export const PricingInputSchema = z.object({
  amount: z.number().int().min(0).max(1_000_000_000),
  currencyId: IdSchema,
  unitId: IdSchema,
});

export const SocialLinksInputSchema = z.object({
  youtubeUrl: HttpsUrlSchema.nullable().optional(),
  instagramUrl: HttpsUrlSchema.nullable().optional(),
  tiktokUrl: HttpsUrlSchema.nullable().optional(),
  facebookUrl: HttpsUrlSchema.nullable().optional(),
});

const providerFields = {
  displayName: z.string().trim().min(2).max(120),
  phone: PhoneE164Schema,
  whatsapp: PhoneE164Schema.nullable().optional(),
  email: z.string().trim().toLowerCase().max(254).email().nullable().optional(),
  profilePhoto: z.union([StoragePathSchema, HttpsUrlSchema]).nullable().optional(),
  subcategoryId: IdSchema,
  yearsExperience: z.number().int().min(0).max(80).nullable().optional(),
  skillIds: uniqueIds(30).default([]),
  freeSkills: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  description: optionalText(2000),
  placeId: IdSchema,
  addressLine: optionalText(200),
  latitude: LatitudeSchema.nullable().optional(),
  longitude: LongitudeSchema.nullable().optional(),
  languageIds: uniqueIds(20).default([]),
  modeIds: uniqueIds(10).default([]),
  pricing: PricingInputSchema.nullable().optional(),
  schedule: ScheduleInputSchema,
  media: MediaListInputSchema.default([]),
  social: SocialLinksInputSchema.optional(),
};

// The full wizard payload for `POST /me/provider`.
export const PublishProviderDto = z
  .object({
    ...providerFields,
    acceptTerms: z.literal(true, { message: "Les conditions doivent être acceptées" }),
  })
  .refine(coordinatesTogether, { path: ["latitude"], message: "Latitude et longitude vont ensemble" });
export const PublishProviderResponseSchema = ProviderPublicSchema;

export const UpdateProviderDto = z
  .object({
    displayName: providerFields.displayName.optional(),
    phone: providerFields.phone.optional(),
    whatsapp: providerFields.whatsapp,
    email: providerFields.email,
    profilePhoto: providerFields.profilePhoto,
    subcategoryId: providerFields.subcategoryId.optional(),
    yearsExperience: providerFields.yearsExperience,
    skillIds: uniqueIds(30).optional(),
    freeSkills: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
    description: providerFields.description,
    placeId: providerFields.placeId.optional(),
    addressLine: providerFields.addressLine,
    latitude: providerFields.latitude,
    longitude: providerFields.longitude,
    languageIds: uniqueIds(20).optional(),
    modeIds: uniqueIds(10).optional(),
    pricing: providerFields.pricing,
    schedule: ScheduleInputSchema.optional(),
    media: MediaListInputSchema.optional(),
    social: SocialLinksInputSchema.optional(),
  })
  .refine((body) => Object.keys(body).length > 0, noEmptyPatch)
  .refine(
    (body) =>
      (body.latitude === undefined && body.longitude === undefined) || coordinatesTogether(body),
    { path: ["latitude"], message: "Latitude et longitude vont ensemble" },
  );
export const UpdateProviderResponseSchema = ProviderPublicSchema;

export const PutScheduleDto = ScheduleInputSchema;
export const PutScheduleResponseSchema = ScheduleSchema;

export const PutMediaDto = z.object({ items: MediaListInputSchema });
export const PutMediaResponseSchema = z.object({ items: z.array(ProviderMediaSchema) });

export const UpdateAvailabilityDto = z.object({ isAvailable: z.boolean() });
export const UpdateAvailabilityResponseSchema = UpdateAvailabilityDto;

export const ProviderDashboardResponseSchema = z.object({
  provider: z.object({
    id: IdSchema,
    displayName: z.string(),
    profilePhoto: z.string().nullable(),
    isAvailable: z.boolean(),
    hidden: z.boolean(),
    verificationStatus: VerificationStatus,
    premiumTier: PremiumTier,
    ratingAvg: z.number(),
    ratingCount: Count,
    completedJobs: Count,
  }),
  metrics: z.object({
    pending: Count,
    completed: Count,
    ratingAvg: z.number(),
    ratingCount: Count,
    acceptanceRate: z.number().int().min(0).max(100).nullable(),
  }),
  pendingBookings: z.array(BookingCardSchema),
  history: z.array(BookingCardSchema),
  /** Seven entries, Monday first, in the provider timezone. */
  weekCompletedByDay: z.array(Count),
});

export const EarningsSummaryResponseSchema = z.object({
  total: z.number().int(),
  thisWeek: z.number().int(),
  /** Seven entries, Monday first, net CDF per day of the current week. */
  byDay: z.array(z.number().int()),
  completedThisWeek: Count,
  acceptanceRate: z.number().int().min(0).max(100).nullable(),
  ratingAvg: z.number(),
  ratingCount: Count,
  currency: z.literal("CDF"),
});

export const EarningsTransactionsQueryParams = pagination(20);
export const EarningsTransactionSchema = TransactionSchema.extend({
  booking: z
    .object({
      id: IdSchema,
      scheduledAt: DateTimeSchema,
      scheduledLocal: LocalSlotSchema,
      clientName: z.string(),
      categoryLabel: z.string().nullable(),
    })
    .nullable(),
});
export const EarningsTransactionsResponseSchema = createPaginatedResponseSchema(EarningsTransactionSchema);

// =====================================================================================
// Bookings
// =====================================================================================

// Address is optional: a saved `addressId` or inline place/address/coordinates, never both.
export const CreateBookingDto = z
  .object({
    providerId: IdSchema,
    date: DateOnlySchema,
    time: TimeOfDaySchema,
    clientPhone: PhoneE164Schema,
    clientNotes: optionalText(2000),
    addressId: IdSchema.optional(),
    placeId: IdSchema.optional(),
    addressLine: optionalText(200),
    latitude: LatitudeSchema.optional(),
    longitude: LongitudeSchema.optional(),
  })
  .refine(
    (body) =>
      !body.addressId ||
      (body.placeId === undefined &&
        (body.addressLine === undefined || body.addressLine === null) &&
        body.latitude === undefined &&
        body.longitude === undefined),
    { path: ["addressId"], message: "Choisir une adresse enregistrée ou en saisir une, pas les deux" },
  )
  .refine((body) => (body.latitude === undefined) === (body.longitude === undefined), {
    path: ["latitude"],
    message: "Latitude et longitude vont ensemble",
  });

export const BookingsQueryParams = pagination(20).extend({ status: BookingStatus.optional() });
export const BookingsResponseSchema = createPaginatedResponseSchema(BookingCardSchema);
export const BookingResponseSchema = BookingDetailSchema;

export const CompleteBookingDto = z
  .object({
    agreedPrice: z.number().int().min(0).max(1_000_000_000).optional(),
    isPaid: z.boolean().optional(),
  })
  .default({});

// `reason` is required when the provider cancels (400 REASON_REQUIRED).
export const CancelBookingDto = z
  .object({ reason: z.string().trim().max(500).optional() })
  .default({});

export const UpdateBookingNotesDto = z.object({
  providerNotes: z.string().trim().max(2000).nullable(),
});

// =====================================================================================
// Reviews
// =====================================================================================

export const CreateReviewDto = z.object({
  bookingId: IdSchema,
  rating: z.number().int().min(1).max(5),
  comment: optionalText(500),
});
export const ReviewResponseSchema = ReviewSchema;

export const MyReviewSchema = ReviewSchema.extend({
  provider: z.object({ id: IdSchema, displayName: z.string(), profilePhoto: z.string().nullable() }),
  booking: z.object({ id: IdSchema, scheduledAt: DateTimeSchema, scheduledLocal: LocalSlotSchema }),
});
export const MyReviewsResponseSchema = z.object({
  reviews: z.array(MyReviewSchema),
  toReview: z.array(BookingCardSchema),
});

export const ReplyReviewDto = z.object({ reply: z.string().trim().min(1).max(500) });

export const CreateClientReviewDto = CreateReviewDto;
export const ClientReviewResponseSchema = ClientReviewSchema;

export const ClientRatingSummaryResponseSchema = RatingSummarySchema.extend({ clientId: IdSchema });

// =====================================================================================
// Messaging and safety
// =====================================================================================

const messageBody = z.string().trim().max(4000).optional();
const attachments = z.array(MessageAttachmentInput).max(MEDIA_LIMITS.maxAttachments).default([]);
const hasContent = (body: { body?: string; attachments: unknown[] }) =>
  Boolean(body.body && body.body.length > 0) || body.attachments.length > 0;

export const ConversationsQueryParams = pagination(20);
export const ConversationsResponseSchema = createPaginatedResponseSchema(ConversationSchema).extend({
  unreadTotal: Count,
});

export const StartConversationDto = z
  .object({
    providerId: IdSchema,
    subject: z.string().trim().max(160).optional(),
    body: messageBody,
    attachments,
  })
  .refine(hasContent, { path: ["body"], message: "Écrivez un message ou joignez un fichier" });
export const StartConversationResponseSchema = z.object({
  conversation: ConversationSchema,
  message: MessageSchema,
});

export const SendMessageDto = z
  .object({ body: messageBody, attachments })
  .refine(hasContent, { path: ["body"], message: "Écrivez un message ou joignez un fichier" });
export const SendMessageResponseSchema = MessageSchema;

// Page 1 is the newest page; items are oldest-first within a page.
export const MessagesQueryParams = pagination(30);
export const MessagesResponseSchema = createPaginatedResponseSchema(MessageSchema).extend({
  conversation: ConversationSchema,
});

export const CreateReportDto = z.object({
  targetKind: ReportTargetKind,
  targetId: IdSchema,
  reason: z.string().trim().min(3).max(1000),
});
export const ReportResponseSchema = ReportSchema;

export const CreateBlockDto = z.object({ userId: IdSchema });
export const BlockResponseSchema = BlockSchema;

export const BlocksQueryParams = pagination(50);
export const BlockListItemSchema = z.object({
  user: z.object({ id: IdSchema, name: z.string(), avatar: z.string().nullable() }),
  createdAt: DateTimeSchema,
});
export const BlocksResponseSchema = createPaginatedResponseSchema(BlockListItemSchema);

// =====================================================================================
// Client utilities
// =====================================================================================

export const ClientDashboardResponseSchema = z.object({
  bookingsByStatus: z.object({
    PENDING: Count,
    CONFIRMED: Count,
    COMPLETED: Count,
    CANCELLED: Count,
  }),
  clientRating: RatingSummarySchema,
  unreadMessages: Count,
});

export const CreateAddressDto = z
  .object({
    label: AddressLabel.default("HOME"),
    recipient: optionalText(120),
    addressLine: z.string().trim().min(1).max(200),
    placeId: IdSchema.nullable().optional(),
    country: CountrySchema.optional(),
    latitude: LatitudeSchema.nullable().optional(),
    longitude: LongitudeSchema.nullable().optional(),
    isDefault: z.boolean().optional(),
  })
  .refine(coordinatesTogether, { path: ["latitude"], message: "Latitude et longitude vont ensemble" });

export const UpdateAddressDto = z
  .object({
    label: AddressLabel.optional(),
    recipient: optionalText(120),
    addressLine: z.string().trim().min(1).max(200).optional(),
    placeId: IdSchema.nullable().optional(),
    country: CountrySchema.optional(),
    latitude: LatitudeSchema.nullable().optional(),
    longitude: LongitudeSchema.nullable().optional(),
    isDefault: z.boolean().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, noEmptyPatch);

export const AddressesQueryParams = pagination(50);
export const AddressesResponseSchema = createPaginatedResponseSchema(AddressSchema);
export const AddressResponseSchema = AddressSchema;

export const NotificationsQueryParams = pagination(20).extend({
  unreadOnly: BooleanQuerySchema.optional(),
});
export const NotificationsResponseSchema = createPaginatedResponseSchema(NotificationSchema).extend({
  unreadCount: Count,
});
export const NotificationResponseSchema = NotificationSchema;
export const MarkAllNotificationsReadResponseSchema = z.object({ updatedCount: Count });

export const CreatePlaceSuggestionDto = z.object({
  kind: PlaceKind.exclude(["COUNTRY"]),
  label: z.string().trim().min(2).max(100),
  parentId: IdSchema,
});
export const PlaceSuggestionResponseSchema = PlaceSuggestionSchema;

// =====================================================================================
// Assistant (agent concierge, docs/ai-agents/RFC-001-agent-concierge.md)
// =====================================================================================

export const AssistantConversationStatus = z.enum(["ACTIVE", "ARCHIVED"]);

export const AssistantConversationSummarySchema = z.object({
  id: IdSchema,
  title: z.string().nullable(),
  status: AssistantConversationStatus,
  lastMessageAt: DateTimeSchema,
  createdAt: DateTimeSchema,
});
export const AssistantConversationsResponseSchema = z.object({
  items: z.array(AssistantConversationSummarySchema),
});
export const AssistantConversationResponseSchema = AssistantConversationSummarySchema;

// Messages travel as the AI SDK UIMessage shape; the SDK owns the part shapes, the API checks the envelope.
export const AssistantUIMessagePartSchema = z.looseObject({ type: z.string().min(1).max(80) });
export const AssistantUIMessageSchema = z.object({
  id: z.string().trim().min(1).max(64),
  role: z.enum(["user", "assistant", "system"]),
  parts: z.array(AssistantUIMessagePartSchema),
  metadata: JsonObjectSchema.optional(),
});
export const AssistantClientLocationSchema = z.object({ placeId: IdSchema, label: z.string() });
export const AssistantConversationDetailResponseSchema = AssistantConversationSummarySchema.extend({
  clientLocation: AssistantClientLocationSchema.nullable(),
  // True once the conversation reached `agent.maxMessagesPerConversation`: the client should open a new one.
  full: z.boolean(),
  messages: z.array(AssistantUIMessageSchema),
});

// The turn body carries either the new user message (text parts only) or the answers to the pending approvals;
// history, tool parts and results always come from the database (RFC §10).
export const AssistantUserTextPartSchema = z.object({
  type: z.literal("text"),
  text: z.string().max(4000),
  state: z.enum(["streaming", "done"]).optional(),
});
export const AssistantMessageMetadataSchema = z.object({
  providerId: IdSchema.optional(),
  date: DateOnlySchema.optional(),
  time: TimeOfDaySchema.optional(),
  addressId: IdSchema.optional(),
  revisedFor: z.string().trim().min(1).max(64).optional(),
});
export const AssistantUserMessageDto = z.strictObject({
  message: z.strictObject({
    id: z.string().trim().min(1).max(64),
    role: z.literal("user"),
    parts: z.array(AssistantUserTextPartSchema).min(1).max(8),
    metadata: AssistantMessageMetadataSchema.optional(),
  }),
});
export const AssistantApprovalResponseSchema = z.strictObject({
  id: z.string().trim().min(1).max(64),
  approved: z.boolean(),
  reason: z.string().trim().max(500).optional(),
});
export const AssistantApprovalsDto = z.strictObject({
  approvals: z.array(AssistantApprovalResponseSchema).min(1).max(4),
});
export const AssistantTurnDto = z.union([AssistantUserMessageDto, AssistantApprovalsDto]);

export const AssistantSuggestionSchema = z.object({
  text: z.string(),
  providerId: IdSchema.nullable(),
});
export const AssistantSuggestionsResponseSchema = z.object({
  items: z.array(AssistantSuggestionSchema).max(3),
});

export const AssistantFindPlaceInput = z.object({
  q: z.string().trim().min(1).max(100),
  kind: PlaceKind.optional(),
});
export const AssistantSearchProvidersSort = z.enum(["recommended", "rating", "newest"]);
export const AssistantSearchProvidersInput = z.object({
  placeId: IdSchema,
  subcategoryId: IdSchema.optional(),
  categoryId: IdSchema.optional(),
  q: z.string().trim().min(1).max(120).optional(),
  minRating: z.number().min(0).max(5).optional(),
  verifiedOnly: z.boolean().optional(),
  sort: AssistantSearchProvidersSort.default("recommended"),
  limit: z.number().int().min(1).max(6).default(3),
});
export const AssistantGetProviderInput = z.object({ providerId: IdSchema });
export const AssistantProviderAvailabilityInput = z.object({
  providerId: IdSchema,
  dates: z.array(DateOnlySchema).min(1).max(7),
});
export const AssistantGetMyActivityInput = z.object({});
// Same fields as CreateBookingDto; the phone is optional for the model and defaults to the account's phone
// before the booking service validates the full DTO (RFC §7).
export const AssistantCreateBookingInput = z.object({
  providerId: IdSchema,
  date: DateOnlySchema,
  time: TimeOfDaySchema,
  clientPhone: PhoneE164Schema.optional(),
  clientNotes: optionalText(2000),
  addressId: IdSchema.optional(),
  placeId: IdSchema.optional(),
  addressLine: optionalText(200),
  latitude: LatitudeSchema.optional(),
  longitude: LongitudeSchema.optional(),
});
export const AssistantSendMessageInput = z.object({
  providerId: IdSchema,
  body: z.string().trim().min(1).max(4000),
  subject: z.string().trim().max(160).optional(),
});

// =====================================================================================
// Admin
// =====================================================================================

export const AdminAssistantOverviewSchema = z.object({
  conversationsToday: Count,
  messagesSent: Count,
  bookingsCreated: Count,
  fallbackRate: z.number().int().min(0).max(100).nullable(),
});
export const AdminOverviewResponseSchema = z.object({
  users: z.object({ total: Count, suspended: Count }),
  providers: Count,
  bookings: Count,
  openReports: Count,
  pendingSuggestions: Count,
  pendingVerifications: Count,
  assistant: AdminAssistantOverviewSchema,
});

// ---------- Users ----------

export const AdminUserSearchParams = pagination(50).extend({
  q: search,
  role: UserRole.optional(),
  suspended: BooleanQuerySchema.optional(),
});

export const AdminUserSchema = z.object({
  id: IdSchema,
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  avatar: z.string().nullable(),
  role: UserRole,
  isActive: z.boolean(),
  suspendedAt: NullableDateTimeSchema,
  suspendedReason: z.string().nullable(),
  placeId: IdSchema.nullable(),
  placeLabel: z.string().nullable(),
  createdAt: DateTimeSchema,
  lastLoginAt: NullableDateTimeSchema,
  provider: z
    .object({
      id: IdSchema,
      displayName: z.string(),
      hidden: z.boolean(),
      verificationStatus: VerificationStatus,
    })
    .nullable(),
});
export const AdminUsersResponseSchema = createPaginatedResponseSchema(AdminUserSchema);

// Role changes are limited to CLIENT ⇄ ADMIN on users without a provider row.
export const AdminUpdateUserDto = z
  .object({
    role: UserRole.optional(),
    suspended: z.boolean().optional(),
    suspendedReason: z.string().trim().min(1).max(500).nullable().optional(),
  })
  .refine((body) => body.role !== undefined || body.suspended !== undefined, noEmptyPatch)
  .refine((body) => body.suspended !== true || Boolean(body.suspendedReason), {
    path: ["suspendedReason"],
    message: "Le motif de suspension est obligatoire",
  });
export const AdminUserResponseSchema = AdminUserSchema;

const statusCounts = z.object({
  PENDING: Count,
  CONFIRMED: Count,
  COMPLETED: Count,
  CANCELLED: Count,
});

export const AdminUserCvResponseSchema = z.object({
  user: AdminUserSchema.extend({
    bio: z.string().nullable(),
    gender: z.string().nullable(),
    birthdate: NullableDateTimeSchema,
    country: z.string(),
    roleSelectedAt: NullableDateTimeSchema,
    termsAcceptedAt: NullableDateTimeSchema,
    placeChain: z.array(PlaceSummarySchema),
  }),
  provider: z
    .object({
      id: IdSchema,
      displayName: z.string(),
      description: z.string().nullable(),
      yearsExperience: z.number().int().nullable(),
      profilePhoto: z.string().nullable(),
      contacts: ProviderContactsSchema,
      categoryChain: z.array(CategoryChainItemSchema),
      placeChain: z.array(PlaceSummarySchema),
      skills: z.array(z.object({ id: IdSchema, label: z.string() })),
      freeSkills: z.array(z.string()),
      languages: z.array(z.object({ id: IdSchema, label: z.string() })),
      interventionModes: z.array(z.object({ id: IdSchema, label: z.string() })),
      pricing: ProviderPricingSchema.nullable(),
      media: z.array(ProviderMediaSchema),
      social: SocialLinksSchema,
      timezone: ScheduleSchema.shape.timezone,
      scheduleSummary: ScheduleSummarySchema,
      isAvailable: z.boolean(),
      verificationStatus: VerificationStatus,
      hidden: z.boolean(),
      premiumTier: PremiumTier,
      effectivePremiumTier: PremiumTier,
      premiumUntil: NullableDateTimeSchema,
      ratingAvg: z.number(),
      ratingCount: Count,
      completedJobs: Count,
      publishedAt: DateTimeSchema,
    })
    .nullable(),
  activity: z.object({
    bookingsAsClient: statusCounts,
    bookingsAsProvider: statusCounts,
    reviewsGiven: Count,
    reviewsReceived: RatingSummarySchema,
    clientRating: RatingSummarySchema,
    reportsFiled: Count,
    reportsAgainst: Count,
    lastLoginAt: NullableDateTimeSchema,
    earningsNet: z.number().int(),
  }),
  recentActivity: z.array(ActivityLogSchema),
});

// ---------- Providers ----------

export const AdminProviderSearchParams = pagination(50).extend({
  q: search,
  verificationStatus: VerificationStatus.optional(),
  premiumTier: PremiumTier.optional(),
  hidden: BooleanQuerySchema.optional(),
});

export const AdminProviderSchema = z.object({
  id: IdSchema,
  userId: IdSchema,
  displayName: z.string(),
  profilePhoto: z.string().nullable(),
  phone: z.string().nullable(),
  categoryLabel: z.string().nullable(),
  placeLabel: z.string().nullable(),
  verificationStatus: VerificationStatus,
  premiumTier: PremiumTier,
  premiumUntil: NullableDateTimeSchema,
  hidden: z.boolean(),
  isAvailable: z.boolean(),
  ratingAvg: z.number(),
  ratingCount: Count,
  completedJobs: Count,
  publishedAt: DateTimeSchema,
  owner: z.object({ id: IdSchema, name: z.string(), isActive: z.boolean() }),
});
export const AdminProvidersResponseSchema = createPaginatedResponseSchema(AdminProviderSchema);

// A manual VERIFIED override needs the four required KYC documents (409 DOCS_MISSING).
export const AdminUpdateProviderDto = z
  .object({
    hidden: z.boolean().optional(),
    premiumTier: PremiumTier.optional(),
    premiumUntil: z.coerce.date().nullable().optional(),
    verificationStatus: VerificationStatus.optional(),
    rejectionReason: z.string().trim().min(1).max(500).optional(),
  })
  .refine((body) => Object.keys(body).length > 0, noEmptyPatch)
  .refine((body) => body.verificationStatus !== "REJECTED" || Boolean(body.rejectionReason), {
    path: ["rejectionReason"],
    message: "Le motif de refus est obligatoire",
  });
export const AdminProviderResponseSchema = AdminProviderSchema;

// ---------- Bookings ----------

export const AdminBookingSearchParams = pagination(50).extend({
  q: search,
  status: BookingStatus.optional(),
});

export const AdminBookingSchema = z.object({
  id: IdSchema,
  status: BookingStatus,
  scheduledAt: DateTimeSchema,
  scheduledLocal: LocalSlotSchema,
  timezone: ScheduleSchema.shape.timezone,
  client: z.object({ id: IdSchema, name: z.string(), phone: z.string().nullable() }),
  provider: z.object({ id: IdSchema, displayName: z.string(), phone: z.string().nullable() }),
  clientPhone: z.string(),
  agreedPrice: z.number().int().nullable(),
  createdAt: DateTimeSchema,
  cancelReason: z.string().nullable(),
});
export const AdminBookingsResponseSchema = createPaginatedResponseSchema(AdminBookingSchema);

export const AdminCancelBookingDto = z.object({ reason: z.string().trim().min(3).max(500) });
export const AdminCancelBookingResponseSchema = BookingDetailSchema;

// ---------- Reviews ----------

export const AdminReviewSearchParams = pagination(50).extend({
  q: search,
  rating: z.coerce.number().int().min(1).max(5).optional(),
  isPublic: BooleanQuerySchema.optional(),
});

export const AdminReviewSchema = z.object({
  id: IdSchema,
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable(),
  reply: z.string().nullable(),
  isPublic: z.boolean(),
  createdAt: DateTimeSchema,
  bookingId: IdSchema,
  client: PersonRefSchema,
  provider: z.object({ id: IdSchema, displayName: z.string() }),
});
export const AdminReviewsResponseSchema = createPaginatedResponseSchema(AdminReviewSchema);

export const AdminUpdateReviewDto = z.object({ isPublic: z.boolean() });
export const AdminReviewResponseSchema = AdminReviewSchema;

// ---------- Conversations ----------

export const AdminConversationSearchParams = pagination(50).extend({ q: search });

export const AdminConversationSchema = z.object({
  id: IdSchema,
  subject: z.string().nullable(),
  lastMessageAt: DateTimeSchema,
  lastPreview: z.string().nullable(),
  client: PersonRefSchema,
  provider: z.object({ id: IdSchema, userId: IdSchema, displayName: z.string() }),
  messageCount: Count,
  createdAt: DateTimeSchema,
});
export const AdminConversationsResponseSchema = createPaginatedResponseSchema(AdminConversationSchema);

export const AdminMessagesQueryParams = pagination(100);
export const AdminMessageSchema = z.object({
  id: IdSchema,
  conversationId: IdSchema,
  senderId: IdSchema,
  sender: PersonRefSchema.extend({ side: z.enum(["client", "provider"]) }),
  body: z.string().nullable(),
  attachments: z.array(MessageAttachmentSchema),
  createdAt: DateTimeSchema,
  deletedAt: NullableDateTimeSchema,
});
export const AdminConversationMessagesResponseSchema = createPaginatedResponseSchema(
  AdminMessageSchema,
).extend({ conversation: AdminConversationSchema });

// ---------- Contact inbox ----------

export const AdminContactSearchParams = pagination(50).extend({
  q: search,
  status: ContactStatus.optional(),
});
export const AdminContactsResponseSchema = createPaginatedResponseSchema(ContactMessageSchema);

export const AdminUpdateContactDto = z.object({ status: ContactStatus });
export const AdminContactResponseSchema = ContactMessageSchema;

// ---------- Reports ----------

export const AdminReportSearchParams = pagination(50).extend({
  status: ReportStatus.optional(),
  targetKind: ReportTargetKind.optional(),
});

export const AdminReportSchema = ReportSchema.extend({
  resolution: z.string().nullable(),
  resolvedById: IdSchema.nullable(),
  resolvedAt: NullableDateTimeSchema,
  reporter: PersonRefSchema,
  target: z.object({
    kind: ReportTargetKind,
    id: IdSchema,
    label: z.string(),
    exists: z.boolean(),
  }),
});
export const AdminReportsResponseSchema = createPaginatedResponseSchema(AdminReportSchema);

export const AdminResolveReportDto = z.object({
  status: z.literal("RESOLVED").default("RESOLVED"),
  resolution: z.string().trim().min(1).max(1000),
});
export const AdminReportResponseSchema = AdminReportSchema;

// ---------- Settings, audit, health ----------

export const AdminSettingsResponseSchema = SiteSettingsSchema;

export const AdminUpdateSettingsDto = SiteSettingsSchema.partial()
  .strict()
  .refine((body) => Object.keys(body).length > 0, { message: "Aucun paramètre à mettre à jour" });

export const AdminAuditResponseSchema = z.object({ items: z.array(ActivityLogSchema) });

export const AdminHealthResponseSchema = z.object({
  database: z.enum(["ok", "error"]),
  storage: z.enum(["ok", "error"]),
  email: z.literal("not configured"),
  version: z.string(),
  commit: z.string().nullable(),
});

// ---------- Taxonomy ----------

export const ReferenceCountsSchema = z.object({ providers: Count, bookings: Count, leads: Count });

export const AdminCategoryNodeSchema = z.object({
  id: IdSchema,
  slug: z.string(),
  name: z.string(),
  level: TaxonomyLevelSchema,
  description: z.string().nullable(),
  icon: z.string().nullable(),
  color: z.string().nullable(),
  image: z.string().nullable(),
  order: z.number().int(),
  isActive: z.boolean(),
  categoryId: IdSchema.nullable(),
  parentId: IdSchema.nullable(),
  counts: ReferenceCountsSchema,
  get children(): z.ZodArray<typeof AdminCategoryNodeSchema> {
    return z.array(AdminCategoryNodeSchema);
  },
});
export const AdminCategoriesResponseSchema = z.object({ items: z.array(AdminCategoryNodeSchema) });
export const AdminCategoryResponseSchema = AdminCategoryNodeSchema;

export const AdminSubcategoriesQueryParams = z.object({ categoryId: IdSchema.optional() });
export const AdminSubcategoriesResponseSchema = z.object({ items: z.array(AdminCategoryNodeSchema) });
export const AdminSubcategoryResponseSchema = AdminCategoryNodeSchema;

const slug = z.string().trim().min(2).max(120).regex(/^[a-z0-9_-]+$/);

export const AdminCreateCategoryDto = z.object({
  name: z.string().trim().min(2).max(120),
  slug,
  description: optionalText(500),
  icon: optionalText(60),
  image: optionalText(500),
  color: optionalText(60),
  order: z.number().int().min(0).max(10_000).optional(),
  isActive: z.boolean().optional(),
});

export const AdminUpdateCategoryDto = AdminCreateCategoryDto.partial().refine(
  (body) => Object.keys(body).length > 0,
  noEmptyPatch,
);

// `parentId` set creates a level-3 node under that level-2 node.
export const AdminCreateSubcategoryDto = z.object({
  categoryId: IdSchema,
  parentId: IdSchema.nullable().optional(),
  name: z.string().trim().min(2).max(120),
  slug,
  description: optionalText(500),
  icon: optionalText(60),
  order: z.number().int().min(0).max(10_000).optional(),
  isActive: z.boolean().optional(),
});

// Nodes do not move: no `categoryId` or `parentId`.
export const AdminUpdateSubcategoryDto = AdminCreateSubcategoryDto.omit({
  categoryId: true,
  parentId: true,
})
  .partial()
  .refine((body) => Object.keys(body).length > 0, noEmptyPatch);

// ---------- Places ----------

const aliases = z.array(z.string().trim().min(1).max(100)).max(20);

export const AdminPlaceSearchParams = pagination(100).extend({
  q: search,
  kind: PlaceKind.optional(),
  parentId: IdSchema.optional(),
  active: BooleanQuerySchema.optional(),
});

export const AdminPlaceSchema = PlaceSchema.extend({ hasChildren: z.boolean(), childCount: Count });
export const AdminPlaceDetailSchema = AdminPlaceSchema.extend({ chain: z.array(PlaceSummarySchema) });
export const AdminPlacesResponseSchema = createPaginatedResponseSchema(AdminPlaceSchema);
export const AdminPlaceResponseSchema = AdminPlaceSchema;

export const AdminCreatePlaceDto = z.object({
  kind: PlaceKind,
  label: z.string().trim().min(2).max(100),
  parentId: IdSchema.nullable().optional(),
  aliases: aliases.default([]),
  source: optionalText(500),
  latitude: LatitudeSchema.nullable().optional(),
  longitude: LongitudeSchema.nullable().optional(),
  active: z.boolean().optional(),
});

export const AdminUpdatePlaceDto = z
  .object({
    label: z.string().trim().min(2).max(100).optional(),
    aliases: aliases.optional(),
    source: optionalText(500),
    latitude: LatitudeSchema.nullable().optional(),
    longitude: LongitudeSchema.nullable().optional(),
    active: z.boolean().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, noEmptyPatch);

export const AdminMergeDto = z
  .object({ fromId: IdSchema, intoId: IdSchema })
  .refine((body) => body.fromId !== body.intoId, {
    path: ["intoId"],
    message: "Choisissez deux éléments différents",
  });

export const AdminPlaceMergeResponseSchema = z.object({
  from: AdminPlaceSchema,
  into: AdminPlaceSchema,
  repointed: z.object({
    users: Count,
    providers: Count,
    addresses: Count,
    bookings: Count,
    suggestions: Count,
  }),
});

export const AdminSuggestionSearchParams = pagination(50).extend({
  status: SuggestionStatus.optional(),
});
export const AdminPlaceSuggestionSchema = PlaceSuggestionSchema.extend({
  parentChain: z.array(PlaceSummarySchema),
  user: PersonRefSchema,
});
export const AdminSuggestionsResponseSchema = createPaginatedResponseSchema(AdminPlaceSuggestionSchema);

// ---------- References ----------

export const AdminReferenceSearchParams = pagination(100).extend({
  q: search,
  type: ReferenceType.optional(),
  categoryId: IdSchema.optional(),
  active: BooleanQuerySchema.optional(),
});

export const AdminReferenceSchema = ReferenceItemSchema.extend({ usageCount: Count });
export const AdminReferencesResponseSchema = createPaginatedResponseSchema(AdminReferenceSchema);
export const AdminReferenceResponseSchema = AdminReferenceSchema;

export const AdminCreateReferenceDto = z.object({
  type: ReferenceType,
  label: z.string().trim().min(1).max(100),
  aliases: aliases.default([]),
  categoryId: IdSchema.nullable().optional(),
  order: z.number().int().min(0).max(10_000).optional(),
  active: z.boolean().optional(),
  suggested: z.boolean().optional(),
  source: optionalText(500),
});

export const AdminUpdateReferenceDto = z
  .object({
    label: z.string().trim().min(1).max(100).optional(),
    aliases: aliases.optional(),
    categoryId: IdSchema.nullable().optional(),
    order: z.number().int().min(0).max(10_000).optional(),
    active: z.boolean().optional(),
    suggested: z.boolean().optional(),
    source: optionalText(500),
  })
  .refine((body) => Object.keys(body).length > 0, noEmptyPatch);

export const AdminReferenceMergeResponseSchema = z.object({
  from: AdminReferenceSchema,
  into: AdminReferenceSchema,
  repointed: z.object({ providerSkills: Count, providerReferences: Count, pricing: Count }),
});

// =====================================================================================
// Types. A DTO or params name used as a type is what a client sends (see `Wire`);
// `…Input` / `…Query` is what the server holds after parsing.
// =====================================================================================

export type PlacesQueryParams = Wire<typeof PlacesQueryParams>;
export type ReferencesQueryParams = Wire<typeof ReferencesQueryParams>;
export type ProviderSearchParams = Wire<typeof ProviderSearchParams>;
export type AvailabilityQueryParams = Wire<typeof AvailabilityQueryParams>;
export type ProviderReviewsQueryParams = Wire<typeof ProviderReviewsQueryParams>;
export type CreateContactMessageDto = Wire<typeof CreateContactMessageDto>;
export type GeocodeParams = Wire<typeof GeocodeParams>;
export type DistanceParams = Wire<typeof DistanceParams>;
export type UpdateProfileDto = Wire<typeof UpdateProfileDto>;
export type ConfirmAvatarDto = Wire<typeof ConfirmAvatarDto>;
export type UploadSignRequestDto = Wire<typeof UploadSignRequestDto>;
export type SignReadQueryParams = Wire<typeof SignReadQueryParams>;
export type PublishProviderDto = Wire<typeof PublishProviderDto>;
export type UpdateProviderDto = Wire<typeof UpdateProviderDto>;
export type PutScheduleDto = Wire<typeof PutScheduleDto>;
export type PutMediaDto = Wire<typeof PutMediaDto>;
export type UpdateAvailabilityDto = Wire<typeof UpdateAvailabilityDto>;
export type EarningsTransactionsQueryParams = Wire<typeof EarningsTransactionsQueryParams>;
export type CreateBookingDto = Wire<typeof CreateBookingDto>;
export type BookingsQueryParams = Wire<typeof BookingsQueryParams>;
export type CompleteBookingDto = Wire<typeof CompleteBookingDto>;
export type CancelBookingDto = Wire<typeof CancelBookingDto>;
export type UpdateBookingNotesDto = Wire<typeof UpdateBookingNotesDto>;
export type CreateReviewDto = Wire<typeof CreateReviewDto>;
export type ReplyReviewDto = Wire<typeof ReplyReviewDto>;
export type CreateClientReviewDto = Wire<typeof CreateClientReviewDto>;
export type ConversationsQueryParams = Wire<typeof ConversationsQueryParams>;
export type StartConversationDto = Wire<typeof StartConversationDto>;
export type SendMessageDto = Wire<typeof SendMessageDto>;
export type MessagesQueryParams = Wire<typeof MessagesQueryParams>;
export type CreateReportDto = Wire<typeof CreateReportDto>;
export type CreateBlockDto = Wire<typeof CreateBlockDto>;
export type BlocksQueryParams = Wire<typeof BlocksQueryParams>;
export type CreateAddressDto = Wire<typeof CreateAddressDto>;
export type UpdateAddressDto = Wire<typeof UpdateAddressDto>;
export type AddressesQueryParams = Wire<typeof AddressesQueryParams>;
export type NotificationsQueryParams = Wire<typeof NotificationsQueryParams>;
export type CreatePlaceSuggestionDto = Wire<typeof CreatePlaceSuggestionDto>;
export type AdminUserSearchParams = Wire<typeof AdminUserSearchParams>;
export type AdminUpdateUserDto = Wire<typeof AdminUpdateUserDto>;
export type AdminProviderSearchParams = Wire<typeof AdminProviderSearchParams>;
export type AdminUpdateProviderDto = Wire<typeof AdminUpdateProviderDto>;
export type AdminBookingSearchParams = Wire<typeof AdminBookingSearchParams>;
export type AdminCancelBookingDto = Wire<typeof AdminCancelBookingDto>;
export type AdminReviewSearchParams = Wire<typeof AdminReviewSearchParams>;
export type AdminUpdateReviewDto = Wire<typeof AdminUpdateReviewDto>;
export type AdminConversationSearchParams = Wire<typeof AdminConversationSearchParams>;
export type AdminMessagesQueryParams = Wire<typeof AdminMessagesQueryParams>;
export type AdminContactSearchParams = Wire<typeof AdminContactSearchParams>;
export type AdminUpdateContactDto = Wire<typeof AdminUpdateContactDto>;
export type AdminReportSearchParams = Wire<typeof AdminReportSearchParams>;
export type AdminResolveReportDto = Wire<typeof AdminResolveReportDto>;
export type AdminUpdateSettingsDto = Wire<typeof AdminUpdateSettingsDto>;
export type AdminSubcategoriesQueryParams = Wire<typeof AdminSubcategoriesQueryParams>;
export type AdminCreateCategoryDto = Wire<typeof AdminCreateCategoryDto>;
export type AdminUpdateCategoryDto = Wire<typeof AdminUpdateCategoryDto>;
export type AdminCreateSubcategoryDto = Wire<typeof AdminCreateSubcategoryDto>;
export type AdminUpdateSubcategoryDto = Wire<typeof AdminUpdateSubcategoryDto>;
export type AdminPlaceSearchParams = Wire<typeof AdminPlaceSearchParams>;
export type AdminCreatePlaceDto = Wire<typeof AdminCreatePlaceDto>;
export type AdminUpdatePlaceDto = Wire<typeof AdminUpdatePlaceDto>;
export type AdminMergeDto = Wire<typeof AdminMergeDto>;
export type AdminSuggestionSearchParams = Wire<typeof AdminSuggestionSearchParams>;
export type AdminReferenceSearchParams = Wire<typeof AdminReferenceSearchParams>;
export type AdminCreateReferenceDto = Wire<typeof AdminCreateReferenceDto>;
export type AdminUpdateReferenceDto = Wire<typeof AdminUpdateReferenceDto>;

export type PlacesQuery = z.infer<typeof PlacesQueryParams>;
export type ReferencesQuery = z.infer<typeof ReferencesQueryParams>;
export type ProviderSearchQuery = z.infer<typeof ProviderSearchParams>;
export type AvailabilityQuery = z.infer<typeof AvailabilityQueryParams>;
export type ProviderReviewsQuery = z.infer<typeof ProviderReviewsQueryParams>;
export type CreateContactMessageInput = z.infer<typeof CreateContactMessageDto>;
export type GeocodeQuery = z.infer<typeof GeocodeParams>;
export type DistanceQuery = z.infer<typeof DistanceParams>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileDto>;
export type ConfirmAvatarInput = z.infer<typeof ConfirmAvatarDto>;
export type UploadSignRequestInput = z.infer<typeof UploadSignRequestDto>;
export type SignReadQuery = z.infer<typeof SignReadQueryParams>;
export type PublishProviderInput = z.infer<typeof PublishProviderDto>;
export type UpdateProviderInput = z.infer<typeof UpdateProviderDto>;
export type PutScheduleInput = z.infer<typeof PutScheduleDto>;
export type PutMediaInput = z.infer<typeof PutMediaDto>;
export type UpdateAvailabilityInput = z.infer<typeof UpdateAvailabilityDto>;
export type EarningsTransactionsQuery = z.infer<typeof EarningsTransactionsQueryParams>;
export type CreateBookingInput = z.infer<typeof CreateBookingDto>;
export type BookingsQuery = z.infer<typeof BookingsQueryParams>;
export type CompleteBookingInput = z.infer<typeof CompleteBookingDto>;
export type CancelBookingInput = z.infer<typeof CancelBookingDto>;
export type UpdateBookingNotesInput = z.infer<typeof UpdateBookingNotesDto>;
export type CreateReviewInput = z.infer<typeof CreateReviewDto>;
export type ReplyReviewInput = z.infer<typeof ReplyReviewDto>;
export type CreateClientReviewInput = z.infer<typeof CreateClientReviewDto>;
export type ConversationsQuery = z.infer<typeof ConversationsQueryParams>;
export type StartConversationInput = z.infer<typeof StartConversationDto>;
export type SendMessageInput = z.infer<typeof SendMessageDto>;
export type MessagesQuery = z.infer<typeof MessagesQueryParams>;
export type CreateReportInput = z.infer<typeof CreateReportDto>;
export type CreateBlockInput = z.infer<typeof CreateBlockDto>;
export type BlocksQuery = z.infer<typeof BlocksQueryParams>;
export type CreateAddressInput = z.infer<typeof CreateAddressDto>;
export type UpdateAddressInput = z.infer<typeof UpdateAddressDto>;
export type AddressesQuery = z.infer<typeof AddressesQueryParams>;
export type NotificationsQuery = z.infer<typeof NotificationsQueryParams>;
export type CreatePlaceSuggestionInput = z.infer<typeof CreatePlaceSuggestionDto>;
export type AdminUserSearchQuery = z.infer<typeof AdminUserSearchParams>;
export type AdminUpdateUserInput = z.infer<typeof AdminUpdateUserDto>;
export type AdminProviderSearchQuery = z.infer<typeof AdminProviderSearchParams>;
export type AdminUpdateProviderInput = z.infer<typeof AdminUpdateProviderDto>;
export type AdminBookingSearchQuery = z.infer<typeof AdminBookingSearchParams>;
export type AdminCancelBookingInput = z.infer<typeof AdminCancelBookingDto>;
export type AdminReviewSearchQuery = z.infer<typeof AdminReviewSearchParams>;
export type AdminUpdateReviewInput = z.infer<typeof AdminUpdateReviewDto>;
export type AdminConversationSearchQuery = z.infer<typeof AdminConversationSearchParams>;
export type AdminMessagesQuery = z.infer<typeof AdminMessagesQueryParams>;
export type AdminContactSearchQuery = z.infer<typeof AdminContactSearchParams>;
export type AdminUpdateContactInput = z.infer<typeof AdminUpdateContactDto>;
export type AdminReportSearchQuery = z.infer<typeof AdminReportSearchParams>;
export type AdminResolveReportInput = z.infer<typeof AdminResolveReportDto>;
export type AdminUpdateSettingsInput = z.infer<typeof AdminUpdateSettingsDto>;
export type AdminSubcategoriesQuery = z.infer<typeof AdminSubcategoriesQueryParams>;
export type AdminCreateCategoryInput = z.infer<typeof AdminCreateCategoryDto>;
export type AdminUpdateCategoryInput = z.infer<typeof AdminUpdateCategoryDto>;
export type AdminCreateSubcategoryInput = z.infer<typeof AdminCreateSubcategoryDto>;
export type AdminUpdateSubcategoryInput = z.infer<typeof AdminUpdateSubcategoryDto>;
export type AdminPlaceSearchQuery = z.infer<typeof AdminPlaceSearchParams>;
export type AdminCreatePlaceInput = z.infer<typeof AdminCreatePlaceDto>;
export type AdminUpdatePlaceInput = z.infer<typeof AdminUpdatePlaceDto>;
export type AdminMergeInput = z.infer<typeof AdminMergeDto>;
export type AdminSuggestionSearchQuery = z.infer<typeof AdminSuggestionSearchParams>;
export type AdminReferenceSearchQuery = z.infer<typeof AdminReferenceSearchParams>;
export type AdminCreateReferenceInput = z.infer<typeof AdminCreateReferenceDto>;
export type AdminUpdateReferenceInput = z.infer<typeof AdminUpdateReferenceDto>;

export type ProviderSearchSort = z.infer<typeof ProviderSearchSort>;
export type PublicSettingsResponse = z.infer<typeof PublicSettingsResponseSchema>;
export type PublicStatsResponse = z.infer<typeof PublicStatsResponseSchema>;
export type CategoryTreeResponse = z.infer<typeof CategoryTreeResponseSchema>;
export type PlacesResponse = z.infer<typeof PlacesResponseSchema>;
export type PlaceAncestorsResponse = z.infer<typeof PlaceAncestorsResponseSchema>;
export type ReferencesResponse = z.infer<typeof ReferencesResponseSchema>;
export type ProviderSearchResponse = z.infer<typeof ProviderSearchResponseSchema>;
export type ProviderPublicResponse = z.infer<typeof ProviderPublicResponseSchema>;
export type AvailabilityResponse = z.infer<typeof AvailabilityResponseSchema>;
export type ProviderReviewsResponse = z.infer<typeof ProviderReviewsResponseSchema>;
export type CreateContactMessageResponse = z.infer<typeof CreateContactMessageResponseSchema>;
export type GeocodeResponse = z.infer<typeof GeocodeResponseSchema>;
export type DistanceResponse = z.infer<typeof DistanceResponseSchema>;
export type MeResponse = z.infer<typeof MeResponseSchema>;
export type UpdateProfileResponse = z.infer<typeof UpdateProfileResponseSchema>;
export type AcceptTermsResponse = z.infer<typeof AcceptTermsResponseSchema>;
export type DeleteAccountResponse = z.infer<typeof DeleteAccountResponseSchema>;
export type ConfirmAvatarResponse = z.infer<typeof ConfirmAvatarResponseSchema>;
export type UploadSignResponse = z.infer<typeof UploadSignResponseSchema>;
export type SignReadResponse = z.infer<typeof SignReadResponseSchema>;
export type PublishProviderResponse = z.infer<typeof PublishProviderResponseSchema>;
export type UpdateProviderResponse = z.infer<typeof UpdateProviderResponseSchema>;
export type PutScheduleResponse = z.infer<typeof PutScheduleResponseSchema>;
export type PutMediaResponse = z.infer<typeof PutMediaResponseSchema>;
export type UpdateAvailabilityResponse = z.infer<typeof UpdateAvailabilityResponseSchema>;
export type ProviderDashboardResponse = z.infer<typeof ProviderDashboardResponseSchema>;
export type EarningsSummaryResponse = z.infer<typeof EarningsSummaryResponseSchema>;
export type EarningsTransactionsResponse = z.infer<typeof EarningsTransactionsResponseSchema>;
export type BookingsResponse = z.infer<typeof BookingsResponseSchema>;
export type BookingResponse = z.infer<typeof BookingResponseSchema>;
export type ReviewResponse = z.infer<typeof ReviewResponseSchema>;
export type MyReviewsResponse = z.infer<typeof MyReviewsResponseSchema>;
export type ClientReviewResponse = z.infer<typeof ClientReviewResponseSchema>;
export type ClientRatingSummaryResponse = z.infer<typeof ClientRatingSummaryResponseSchema>;
export type ConversationsResponse = z.infer<typeof ConversationsResponseSchema>;
export type StartConversationResponse = z.infer<typeof StartConversationResponseSchema>;
export type SendMessageResponse = z.infer<typeof SendMessageResponseSchema>;
export type MessagesResponse = z.infer<typeof MessagesResponseSchema>;
export type ReportResponse = z.infer<typeof ReportResponseSchema>;
export type BlockResponse = z.infer<typeof BlockResponseSchema>;
export type BlocksResponse = z.infer<typeof BlocksResponseSchema>;
export type ClientDashboardResponse = z.infer<typeof ClientDashboardResponseSchema>;
export type AddressesResponse = z.infer<typeof AddressesResponseSchema>;
export type AddressResponse = z.infer<typeof AddressResponseSchema>;
export type NotificationsResponse = z.infer<typeof NotificationsResponseSchema>;
export type NotificationResponse = z.infer<typeof NotificationResponseSchema>;
export type MarkAllNotificationsReadResponse = z.infer<typeof MarkAllNotificationsReadResponseSchema>;
export type PlaceSuggestionResponse = z.infer<typeof PlaceSuggestionResponseSchema>;
export type AdminOverviewResponse = z.infer<typeof AdminOverviewResponseSchema>;
export type AdminUsersResponse = z.infer<typeof AdminUsersResponseSchema>;
export type AdminUserResponse = z.infer<typeof AdminUserResponseSchema>;
export type AdminUserCvResponse = z.infer<typeof AdminUserCvResponseSchema>;
export type AdminProvidersResponse = z.infer<typeof AdminProvidersResponseSchema>;
export type AdminProviderResponse = z.infer<typeof AdminProviderResponseSchema>;
export type AdminBookingsResponse = z.infer<typeof AdminBookingsResponseSchema>;
export type AdminCancelBookingResponse = z.infer<typeof AdminCancelBookingResponseSchema>;
export type AdminReviewsResponse = z.infer<typeof AdminReviewsResponseSchema>;
export type AdminReviewResponse = z.infer<typeof AdminReviewResponseSchema>;
export type AdminConversationsResponse = z.infer<typeof AdminConversationsResponseSchema>;
export type AdminConversationMessagesResponse = z.infer<typeof AdminConversationMessagesResponseSchema>;
export type AdminContactsResponse = z.infer<typeof AdminContactsResponseSchema>;
export type AdminContactResponse = z.infer<typeof AdminContactResponseSchema>;
export type AdminReportsResponse = z.infer<typeof AdminReportsResponseSchema>;
export type AdminReportResponse = z.infer<typeof AdminReportResponseSchema>;
export type AdminSettingsResponse = z.infer<typeof AdminSettingsResponseSchema>;
export type AdminAuditResponse = z.infer<typeof AdminAuditResponseSchema>;
export type AdminHealthResponse = z.infer<typeof AdminHealthResponseSchema>;
export type AdminCategoriesResponse = z.infer<typeof AdminCategoriesResponseSchema>;
export type AdminCategoryResponse = z.infer<typeof AdminCategoryResponseSchema>;
export type AdminSubcategoriesResponse = z.infer<typeof AdminSubcategoriesResponseSchema>;
export type AdminSubcategoryResponse = z.infer<typeof AdminSubcategoryResponseSchema>;
export type AdminPlacesResponse = z.infer<typeof AdminPlacesResponseSchema>;
export type AdminPlaceResponse = z.infer<typeof AdminPlaceResponseSchema>;
export type AdminPlaceMergeResponse = z.infer<typeof AdminPlaceMergeResponseSchema>;
export type AdminSuggestionsResponse = z.infer<typeof AdminSuggestionsResponseSchema>;
export type AdminReferencesResponse = z.infer<typeof AdminReferencesResponseSchema>;
export type AdminReferenceResponse = z.infer<typeof AdminReferenceResponseSchema>;
export type AdminReferenceMergeResponse = z.infer<typeof AdminReferenceMergeResponseSchema>;

export type MeUser = z.infer<typeof MeUserSchema>;
export type PricingInput = z.infer<typeof PricingInputSchema>;
export type SocialLinksInput = z.infer<typeof SocialLinksInputSchema>;
export type EarningsTransaction = z.infer<typeof EarningsTransactionSchema>;
export type MyReview = z.infer<typeof MyReviewSchema>;
export type BlockListItem = z.infer<typeof BlockListItemSchema>;
export type AdminUser = z.infer<typeof AdminUserSchema>;
export type AdminProvider = z.infer<typeof AdminProviderSchema>;
export type AdminBooking = z.infer<typeof AdminBookingSchema>;
export type AdminReview = z.infer<typeof AdminReviewSchema>;
export type AdminConversation = z.infer<typeof AdminConversationSchema>;
export type AdminMessage = z.infer<typeof AdminMessageSchema>;
export type AdminReport = z.infer<typeof AdminReportSchema>;
export type ReferenceCounts = z.infer<typeof ReferenceCountsSchema>;
export type AdminCategoryNode = z.infer<typeof AdminCategoryNodeSchema>;
export type AdminPlace = z.infer<typeof AdminPlaceSchema>;
export type AdminPlaceDetail = z.infer<typeof AdminPlaceDetailSchema>;
export type AdminPlaceSuggestion = z.infer<typeof AdminPlaceSuggestionSchema>;
export type AdminReference = z.infer<typeof AdminReferenceSchema>;

export type AssistantConversationSummary = z.infer<typeof AssistantConversationSummarySchema>;
export type AssistantConversationsResponse = z.infer<typeof AssistantConversationsResponseSchema>;
export type AssistantConversationResponse = z.infer<typeof AssistantConversationResponseSchema>;
export type AssistantConversationDetailResponse = z.infer<typeof AssistantConversationDetailResponseSchema>;
export type AssistantClientLocation = z.infer<typeof AssistantClientLocationSchema>;
export type AssistantUIMessageWire = z.infer<typeof AssistantUIMessageSchema>;
export type AssistantMessageMetadata = z.infer<typeof AssistantMessageMetadataSchema>;
export type AssistantUserMessageDto = z.infer<typeof AssistantUserMessageDto>;
export type AssistantApprovalResponse = z.infer<typeof AssistantApprovalResponseSchema>;
export type AssistantApprovalsDto = z.infer<typeof AssistantApprovalsDto>;
export type AssistantTurnDto = z.infer<typeof AssistantTurnDto>;
export type AssistantSuggestion = z.infer<typeof AssistantSuggestionSchema>;
export type AssistantSuggestionsResponse = z.infer<typeof AssistantSuggestionsResponseSchema>;
export type AssistantGetMyActivityInput = z.infer<typeof AssistantGetMyActivityInput>;
export type AssistantCreateBookingInput = z.infer<typeof AssistantCreateBookingInput>;
export type AssistantSendMessageInput = z.infer<typeof AssistantSendMessageInput>;
export type AdminAssistantOverview = z.infer<typeof AdminAssistantOverviewSchema>;
export type AssistantFindPlaceInput = z.infer<typeof AssistantFindPlaceInput>;
export type AssistantSearchProvidersInput = z.infer<typeof AssistantSearchProvidersInput>;
export type AssistantGetProviderInput = z.infer<typeof AssistantGetProviderInput>;
export type AssistantProviderAvailabilityInput = z.infer<typeof AssistantProviderAvailabilityInput>;
