import { z } from "zod";
import {
  CountrySchema,
  DateOnlySchema,
  HttpsUrlSchema,
  IdSchema,
  StoragePathSchema,
  optionalText,
} from "./common";
import { UploadPurpose, VerificationDocKind } from "./enums";

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
  .refine((body) => Object.keys(body).length > 0, { message: "Aucun champ à mettre à jour" });

export const ConfirmAvatarDto = z.object({
  path: StoragePathSchema,
});

export const UploadSignRequestDto = z.object({
  purpose: UploadPurpose,
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(120),
  bytes: z.number().int().positive().optional(),
});

export const SignReadQueryParams = z.object({
  path: StoragePathSchema,
});

export const UploadVerificationDocDto = z.object({
  kind: VerificationDocKind,
  path: StoragePathSchema,
  fileName: z.string().trim().max(255).optional(),
  mime: z.string().trim().min(1).max(120),
  bytes: z.number().int().positive(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileDto>;
export type ConfirmAvatarInput = z.infer<typeof ConfirmAvatarDto>;
export type UploadSignRequestInput = z.infer<typeof UploadSignRequestDto>;
export type SignReadQuery = z.infer<typeof SignReadQueryParams>;
export type UploadVerificationDocInput = z.infer<typeof UploadVerificationDocDto>;
