import { z } from "zod";
import { DateTimeSchema, IdSchema, NullableDateTimeSchema } from "./common.js";
import {
  AddressLabel,
  BookingStatus,
  ContactStatus,
  MediaKind,
  MessageAttachmentKind,
  NotificationType,
  PlaceKind,
  PremiumTier,
  ReferenceType,
  ReportStatus,
  ReportTargetKind,
  SuggestionStatus,
  TransactionStatus,
  TransactionType,
  UserRole,
  VerificationStatus,
} from "./enums.js";
import { TimezoneSchema } from "./schedule.js";

const Rating = z.number().min(0).max(5);
const Count = z.number().int().min(0);

export const LocalSlotSchema = z.object({ date: z.string(), time: z.string() });
export const RatingSummarySchema = z.object({ avg: Rating, count: Count });

// ---------- Users ----------

export const UserSchema = z.object({
  id: IdSchema,
  authUserId: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  avatar: z.string().nullable(),
  role: UserRole,
  roleSelectedAt: NullableDateTimeSchema,
  bio: z.string().nullable(),
  gender: z.string().nullable(),
  birthdate: NullableDateTimeSchema,
  placeId: IdSchema.nullable(),
  country: z.string(),
  isActive: z.boolean(),
  suspendedAt: NullableDateTimeSchema,
  suspendedReason: z.string().nullable(),
  emailVerifiedAt: NullableDateTimeSchema,
  phoneVerifiedAt: NullableDateTimeSchema,
  lastLoginAt: NullableDateTimeSchema,
  termsAcceptedAt: NullableDateTimeSchema,
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
});

export const UserSummarySchema = UserSchema.pick({
  id: true,
  firstName: true,
  lastName: true,
  avatar: true,
  role: true,
});

export const PersonRefSchema = z.object({ id: IdSchema, name: z.string() });

// ---------- Taxonomy ----------

export const CategorySchema = z.object({
  id: IdSchema,
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  icon: z.string().nullable(),
  image: z.string().nullable(),
  color: z.string().nullable(),
  order: z.number().int(),
  isActive: z.boolean(),
  createdAt: DateTimeSchema,
});

export const SubcategorySchema = z.object({
  id: IdSchema,
  categoryId: IdSchema,
  parentId: IdSchema.nullable(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  icon: z.string().nullable(),
  order: z.number().int(),
  isActive: z.boolean(),
  createdAt: DateTimeSchema,
});

export const TaxonomyLevelSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);

export const CategoryChainItemSchema = z.object({ id: IdSchema, slug: z.string(), name: z.string() });

export const CategoryTreeNodeSchema = z.object({
  id: IdSchema,
  slug: z.string(),
  name: z.string(),
  icon: z.string().nullable(),
  color: z.string().nullable(),
  image: z.string().nullable(),
  level: TaxonomyLevelSchema,
  providerCount: Count,
  get children(): z.ZodArray<typeof CategoryTreeNodeSchema> {
    return z.array(CategoryTreeNodeSchema);
  },
});

// ---------- Places and references ----------

export const PlaceSummarySchema = z.object({
  id: IdSchema,
  kind: PlaceKind,
  label: z.string(),
  parentId: IdSchema.nullable(),
  hasChildren: z.boolean(),
});

export const PlaceSchema = z.object({
  id: IdSchema,
  kind: PlaceKind,
  label: z.string(),
  slug: z.string(),
  parentId: IdSchema.nullable(),
  aliases: z.array(z.string()),
  source: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  active: z.boolean(),
  mergedIntoId: IdSchema.nullable(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
});

export const PlaceSuggestionSchema = z.object({
  id: IdSchema,
  kind: PlaceKind,
  label: z.string(),
  parentId: IdSchema.nullable(),
  status: SuggestionStatus,
  resolvedPlaceId: IdSchema.nullable(),
  createdAt: DateTimeSchema,
  resolvedAt: NullableDateTimeSchema,
});

export const ReferenceItemSummarySchema = z.object({
  id: IdSchema,
  type: ReferenceType,
  label: z.string(),
  categoryId: IdSchema.nullable(),
});

export const ReferenceItemSchema = z.object({
  id: IdSchema,
  type: ReferenceType,
  label: z.string(),
  slug: z.string(),
  aliases: z.array(z.string()),
  categoryId: IdSchema.nullable(),
  order: z.number().int(),
  active: z.boolean(),
  suggested: z.boolean(),
  mergedIntoId: IdSchema.nullable(),
  source: z.string().nullable(),
  createdAt: DateTimeSchema,
});

// ---------- Providers ----------

export const ProviderSchema = z.object({
  id: IdSchema,
  userId: IdSchema,
  displayName: z.string(),
  description: z.string().nullable(),
  yearsExperience: z.number().int().nullable(),
  phone: z.string().nullable(),
  whatsapp: z.string().nullable(),
  email: z.string().nullable(),
  profilePhoto: z.string().nullable(),
  subcategoryId: IdSchema,
  placeId: IdSchema.nullable(),
  addressLine: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  freeSkills: z.array(z.string()),
  pricingAmount: z.number().int().nullable(),
  pricingCurrencyId: IdSchema.nullable(),
  pricingUnitId: IdSchema.nullable(),
  timezone: TimezoneSchema,
  slotDurationMin: z.number().int(),
  slotBufferMin: z.number().int(),
  youtubeUrl: z.string().nullable(),
  instagramUrl: z.string().nullable(),
  tiktokUrl: z.string().nullable(),
  facebookUrl: z.string().nullable(),
  isAvailable: z.boolean(),
  hidden: z.boolean(),
  verificationStatus: VerificationStatus,
  premiumTier: PremiumTier,
  premiumUntil: NullableDateTimeSchema,
  ratingAvg: Rating,
  ratingCount: Count,
  completedJobs: Count,
  publishedAt: DateTimeSchema,
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
});

export const ProviderPricingSchema = z.object({
  amount: z.number().int().min(0),
  currency: ReferenceItemSummarySchema.nullable(),
  unit: ReferenceItemSummarySchema.nullable(),
});

// `premiumTier` is the effective tier (an expired `premiumUntil` reads as FREE); coordinates are
// rounded to 2 decimals; `distanceKm` is set only when the search sent `lat`/`lng`.
export const ProviderCardSchema = z.object({
  id: IdSchema,
  displayName: z.string(),
  profilePhoto: z.string().nullable(),
  categoryChain: z.array(CategoryChainItemSchema),
  placeChain: z.array(PlaceSummarySchema),
  ratingAvg: Rating,
  ratingCount: Count,
  completedJobs: Count,
  premiumTier: PremiumTier,
  verified: z.boolean(),
  isAvailable: z.boolean(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  distanceKm: z.number().nullable(),
  pricing: ProviderPricingSchema.nullable(),
});

export const ProviderMediaSchema = z.object({
  id: IdSchema,
  kind: MediaKind,
  url: z.string(),
  storagePath: z.string().nullable(),
  youtubeId: z.string().nullable(),
  title: z.string().nullable(),
  order: z.number().int(),
});

export const AvailabilityRuleSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string(),
  endTime: z.string(),
});

export const AvailabilityExceptionSchema = z.object({
  date: z.string(),
  isOpen: z.boolean(),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  reason: z.string().nullable(),
});

export const ScheduleSchema = z.object({
  timezone: TimezoneSchema,
  slotDurationMin: z.number().int(),
  slotBufferMin: z.number().int(),
  rules: z.array(AvailabilityRuleSchema),
  exceptions: z.array(AvailabilityExceptionSchema),
});

export const ScheduleSummaryDaySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  ranges: z.array(z.object({ startTime: z.string(), endTime: z.string() })),
});

/** Seven entries, index 0 = Sunday. */
export const ScheduleSummarySchema = z.array(ScheduleSummaryDaySchema);

export const SocialLinksSchema = z.object({
  youtubeUrl: z.string().nullable(),
  instagramUrl: z.string().nullable(),
  tiktokUrl: z.string().nullable(),
  facebookUrl: z.string().nullable(),
});

export const ProviderContactsSchema = z.object({
  phone: z.string().nullable(),
  whatsapp: z.string().nullable(),
  email: z.string().nullable(),
  addressLine: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
});

export const PublicReviewSchema = z.object({
  id: IdSchema,
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable(),
  reply: z.string().nullable(),
  repliedAt: NullableDateTimeSchema,
  createdAt: DateTimeSchema,
  author: z.object({ id: IdSchema, name: z.string(), avatar: z.string().nullable() }),
});

// Contacts are null (and `contactsLocked` true) unless the viewer may see them. The provider
// editor reads this as the owner; there is no `GET /providers/me`.
export const ProviderPublicSchema = ProviderCardSchema.extend({
  ownerId: IdSchema,
  description: z.string().nullable(),
  yearsExperience: z.number().int().nullable(),
  freeSkills: z.array(z.string()),
  skills: z.array(ReferenceItemSummarySchema),
  languages: z.array(ReferenceItemSummarySchema),
  interventionModes: z.array(ReferenceItemSummarySchema),
  media: z.array(ProviderMediaSchema),
  schedule: ScheduleSchema,
  scheduleSummary: ScheduleSummarySchema,
  social: SocialLinksSchema,
  contacts: ProviderContactsSchema.nullable(),
  contactsLocked: z.boolean(),
  blocked: z.boolean(),
  reviewsPreview: z.array(PublicReviewSchema),
  publishedAt: DateTimeSchema,
  subcategoryId: IdSchema,
  placeId: IdSchema.nullable(),
  isOwner: z.boolean(),
  hidden: z.boolean(),
  verificationStatus: VerificationStatus,
});

// ---------- Bookings, reviews, ledger ----------

export const BookingSideSchema = z.enum(["client", "provider"]);

export const BookingSchema = z.object({
  id: IdSchema,
  clientId: IdSchema,
  providerId: IdSchema,
  status: BookingStatus,
  scheduledAt: DateTimeSchema,
  durationMin: z.number().int(),
  bufferMin: z.number().int(),
  timezone: TimezoneSchema,
  subcategoryId: IdSchema.nullable(),
  clientPhone: z.string(),
  clientNotes: z.string().nullable(),
  providerNotes: z.string().nullable(),
  placeId: IdSchema.nullable(),
  addressLine: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  agreedPrice: z.number().int().nullable(),
  commissionPct: z.number().int(),
  commissionAmt: z.number().int(),
  providerNetAmt: z.number().int(),
  isPaid: z.boolean(),
  paidAt: NullableDateTimeSchema,
  confirmedAt: NullableDateTimeSchema,
  completedAt: NullableDateTimeSchema,
  cancelledAt: NullableDateTimeSchema,
  cancelledById: IdSchema.nullable(),
  cancelReason: z.string().nullable(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
});

// `scheduledLocal` is the slot in the booking timezone; `clientRating` is set on the provider side.
export const BookingCardSchema = z.object({
  id: IdSchema,
  status: BookingStatus,
  scheduledAt: DateTimeSchema,
  scheduledLocal: LocalSlotSchema,
  durationMin: z.number().int(),
  timezone: TimezoneSchema,
  createdAt: DateTimeSchema,
  agreedPrice: z.number().int().nullable(),
  isPaid: z.boolean(),
  cancelReason: z.string().nullable(),
  cancelledAt: NullableDateTimeSchema,
  side: BookingSideSchema,
  counterpart: z.object({
    userId: IdSchema,
    providerId: IdSchema.nullable(),
    name: z.string(),
    photo: z.string().nullable(),
    categoryLabel: z.string().nullable(),
  }),
  clientRating: RatingSummarySchema.nullable(),
  hasReview: z.boolean(),
  hasClientReview: z.boolean(),
});

// `providerNotes` and the commission fields are null when the viewer is the client.
export const BookingDetailSchema = BookingCardSchema.extend({
  providerId: IdSchema,
  clientId: IdSchema,
  clientPhone: z.string(),
  clientNotes: z.string().nullable(),
  providerNotes: z.string().nullable(),
  placeId: IdSchema.nullable(),
  placeChain: z.array(PlaceSummarySchema),
  addressLine: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  commissionPct: z.number().int().nullable(),
  commissionAmt: z.number().int().nullable(),
  providerNetAmt: z.number().int().nullable(),
  paidAt: NullableDateTimeSchema,
  confirmedAt: NullableDateTimeSchema,
  completedAt: NullableDateTimeSchema,
  cancelledById: IdSchema.nullable(),
  review: z
    .object({
      id: IdSchema,
      rating: z.number().int(),
      comment: z.string().nullable(),
      reply: z.string().nullable(),
    })
    .nullable(),
  clientReview: z
    .object({ id: IdSchema, rating: z.number().int(), comment: z.string().nullable() })
    .nullable(),
});

export const ReviewSchema = z.object({
  id: IdSchema,
  bookingId: IdSchema,
  providerId: IdSchema,
  clientId: IdSchema,
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable(),
  reply: z.string().nullable(),
  repliedAt: NullableDateTimeSchema,
  isPublic: z.boolean(),
  createdAt: DateTimeSchema,
});

export const ClientReviewSchema = z.object({
  id: IdSchema,
  bookingId: IdSchema,
  providerId: IdSchema,
  clientId: IdSchema,
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable(),
  createdAt: DateTimeSchema,
});

export const TransactionSchema = z.object({
  id: IdSchema,
  type: TransactionType,
  amount: z.number().int(),
  feeAmt: z.number().int(),
  netAmt: z.number().int(),
  status: TransactionStatus,
  note: z.string().nullable(),
  occurredAt: DateTimeSchema,
});

// ---------- Messaging and safety ----------

export const MessageAttachmentSchema = z.object({
  kind: MessageAttachmentKind,
  path: z.string(),
  mime: z.string(),
  bytes: z.number().int(),
});

export const ConversationSchema = z.object({
  id: IdSchema,
  subject: z.string().nullable(),
  lastMessageAt: DateTimeSchema,
  lastPreview: z.string().nullable(),
  unread: Count,
  side: BookingSideSchema,
  counterpart: z.object({
    userId: IdSchema,
    providerId: IdSchema.nullable(),
    name: z.string(),
    photo: z.string().nullable(),
  }),
  blocked: z.boolean(),
  createdAt: DateTimeSchema,
});

// A deleted message keeps its row with `body: null` and no attachments.
export const MessageSchema = z.object({
  id: IdSchema,
  conversationId: IdSchema,
  senderId: IdSchema,
  mine: z.boolean(),
  body: z.string().nullable(),
  attachments: z.array(MessageAttachmentSchema),
  createdAt: DateTimeSchema,
  deletedAt: NullableDateTimeSchema,
});

export const ReportSchema = z.object({
  id: IdSchema,
  targetKind: ReportTargetKind,
  targetId: IdSchema,
  reason: z.string(),
  status: ReportStatus,
  createdAt: DateTimeSchema,
});

export const BlockSchema = z.object({
  userId: IdSchema,
  createdAt: DateTimeSchema,
});

export const ContactMessageSchema = z.object({
  id: IdSchema,
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  subject: z.string(),
  message: z.string(),
  status: ContactStatus,
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
});

// ---------- Client utilities ----------

export const AddressSchema = z.object({
  id: IdSchema,
  label: AddressLabel,
  recipient: z.string().nullable(),
  addressLine: z.string(),
  placeId: IdSchema.nullable(),
  placeChain: z.array(PlaceSummarySchema),
  country: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  isDefault: z.boolean(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
});

// Deep-link ids by type: bookings → bookingId; NEW_MESSAGE → conversationId + messageId;
// NEW_REVIEW → reviewId; NEW_CLIENT_REVIEW → clientReviewId; PLACE_SUGGESTION_RESOLVED →
// suggestionId + placeId + status.
export const NotificationDataSchema = z.looseObject({
  bookingId: IdSchema.optional(),
  conversationId: IdSchema.optional(),
  messageId: IdSchema.optional(),
  reviewId: IdSchema.optional(),
  clientReviewId: IdSchema.optional(),
  suggestionId: IdSchema.optional(),
  placeId: IdSchema.optional(),
  status: z.string().optional(),
});

export const NotificationSchema = z.object({
  id: IdSchema,
  type: NotificationType,
  title: z.string(),
  message: z.string(),
  data: NotificationDataSchema.nullable(),
  isRead: z.boolean(),
  readAt: NullableDateTimeSchema,
  createdAt: DateTimeSchema,
});

// ---------- System ----------

export const SITE_SETTING_STRING_KEYS = [
  "hero_title",
  "hero_subtitle",
  "hero_cta",
  "tagline",
  "how1_title",
  "how1_desc",
  "how2_title",
  "how2_desc",
  "how3_title",
  "how3_desc",
  "premium_title",
  "premium_subtitle",
  "maintenance_message",
  "contact_phone",
  "contact_email",
  "contact_website",
] as const;

export const SITE_SETTING_BOOLEAN_KEYS = [
  "feat_booking",
  "feat_reviews",
  "feat_whatsapp",
  "feat_jev_search",
  "contacts_require_premium",
  "maintenance_mode",
] as const;

export type SiteSettings = {
  [K in (typeof SITE_SETTING_STRING_KEYS)[number]]: string;
} & {
  [K in (typeof SITE_SETTING_BOOLEAN_KEYS)[number]]: boolean;
};
export type SiteSettingKey = keyof SiteSettings;

export const SITE_SETTING_DEFAULTS = {
  ...Object.fromEntries(SITE_SETTING_STRING_KEYS.map((key) => [key, ""])),
  feat_booking: true,
  feat_reviews: true,
  feat_whatsapp: true,
  feat_jev_search: false,
  contacts_require_premium: false,
  maintenance_mode: false,
} as SiteSettings;

// Empty strings mean "use the web copy module default".
export const SiteSettingsSchema = z.object({
  ...Object.fromEntries(SITE_SETTING_STRING_KEYS.map((key) => [key, z.string().max(2000)])),
  ...Object.fromEntries(SITE_SETTING_BOOLEAN_KEYS.map((key) => [key, z.boolean()])),
} as Record<(typeof SITE_SETTING_STRING_KEYS)[number], z.ZodString> &
  Record<(typeof SITE_SETTING_BOOLEAN_KEYS)[number], z.ZodBoolean>);

export const ActivityLogSchema = z.object({
  id: IdSchema,
  action: z.string(),
  entityType: z.string(),
  entityId: z.string().nullable(),
  metadata: z.unknown().nullable(),
  ipAddress: z.string().nullable(),
  createdAt: DateTimeSchema,
  actor: PersonRefSchema.nullable(),
});

export type LocalSlot = z.infer<typeof LocalSlotSchema>;
export type RatingSummary = z.infer<typeof RatingSummarySchema>;
export type User = z.infer<typeof UserSchema>;
export type UserSummary = z.infer<typeof UserSummarySchema>;
export type PersonRef = z.infer<typeof PersonRefSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Subcategory = z.infer<typeof SubcategorySchema>;
export type TaxonomyLevel = z.infer<typeof TaxonomyLevelSchema>;
export type CategoryChainItem = z.infer<typeof CategoryChainItemSchema>;
export type CategoryTreeNode = z.infer<typeof CategoryTreeNodeSchema>;
export type PlaceSummary = z.infer<typeof PlaceSummarySchema>;
export type Place = z.infer<typeof PlaceSchema>;
export type PlaceSuggestion = z.infer<typeof PlaceSuggestionSchema>;
export type ReferenceItemSummary = z.infer<typeof ReferenceItemSummarySchema>;
export type ReferenceItem = z.infer<typeof ReferenceItemSchema>;
export type Provider = z.infer<typeof ProviderSchema>;
export type ProviderPricing = z.infer<typeof ProviderPricingSchema>;
export type ProviderCard = z.infer<typeof ProviderCardSchema>;
export type ProviderMedia = z.infer<typeof ProviderMediaSchema>;
export type AvailabilityRule = z.infer<typeof AvailabilityRuleSchema>;
export type AvailabilityException = z.infer<typeof AvailabilityExceptionSchema>;
export type Schedule = z.infer<typeof ScheduleSchema>;
export type ScheduleSummaryDay = z.infer<typeof ScheduleSummaryDaySchema>;
export type ScheduleSummary = z.infer<typeof ScheduleSummarySchema>;
export type SocialLinks = z.infer<typeof SocialLinksSchema>;
export type ProviderContacts = z.infer<typeof ProviderContactsSchema>;
export type PublicReview = z.infer<typeof PublicReviewSchema>;
export type ProviderPublic = z.infer<typeof ProviderPublicSchema>;
export type BookingSide = z.infer<typeof BookingSideSchema>;
export type Booking = z.infer<typeof BookingSchema>;
export type BookingCard = z.infer<typeof BookingCardSchema>;
export type BookingDetail = z.infer<typeof BookingDetailSchema>;
export type Review = z.infer<typeof ReviewSchema>;
export type ClientReview = z.infer<typeof ClientReviewSchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
export type MessageAttachment = z.infer<typeof MessageAttachmentSchema>;
export type Conversation = z.infer<typeof ConversationSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type Report = z.infer<typeof ReportSchema>;
export type Block = z.infer<typeof BlockSchema>;
export type ContactMessage = z.infer<typeof ContactMessageSchema>;
export type Address = z.infer<typeof AddressSchema>;
export type NotificationData = z.infer<typeof NotificationDataSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
export type ActivityLog = z.infer<typeof ActivityLogSchema>;
