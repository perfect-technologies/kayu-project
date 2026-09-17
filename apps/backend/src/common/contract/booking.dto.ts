import { z } from "zod";
import {
  DateOnlySchema,
  IdSchema,
  LatitudeSchema,
  LongitudeSchema,
  PhoneE164Schema,
  TimeOfDaySchema,
  optionalText,
  pagination,
} from "./common";
import { BookingStatus } from "./enums";

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

export const BookingsQueryParams = pagination(20).extend({
  status: BookingStatus.optional(),
});

export const CompleteBookingDto = z
  .object({
    agreedPrice: z.number().int().min(0).max(1_000_000_000).optional(),
    isPaid: z.boolean().optional(),
  })
  .default({});

export const CancelBookingDto = z
  .object({
    reason: z.string().trim().max(500).optional(),
  })
  .default({});

export const UpdateBookingNotesDto = z.object({
  providerNotes: z.string().trim().max(2000).nullable(),
});

export const CreateReviewDto = z.object({
  bookingId: IdSchema,
  rating: z.number().int().min(1).max(5),
  comment: optionalText(500),
});

export const ReplyReviewDto = z.object({
  reply: z.string().trim().min(1).max(500),
});

export const CreateClientReviewDto = CreateReviewDto;

export type CreateBookingInput = z.infer<typeof CreateBookingDto>;
export type BookingsQuery = z.infer<typeof BookingsQueryParams>;
export type CompleteBookingInput = z.infer<typeof CompleteBookingDto>;
export type CancelBookingInput = z.infer<typeof CancelBookingDto>;
export type UpdateBookingNotesInput = z.infer<typeof UpdateBookingNotesDto>;
export type CreateReviewInput = z.infer<typeof CreateReviewDto>;
export type ReplyReviewInput = z.infer<typeof ReplyReviewDto>;
export type CreateClientReviewInput = z.infer<typeof CreateClientReviewDto>;
