import { z } from "zod";
import {
  BooleanQuerySchema,
  CountrySchema,
  IdSchema,
  LatitudeSchema,
  LongitudeSchema,
  optionalText,
  pagination,
} from "./common";
import { AddressLabel, PlaceKind } from "./enums";

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
  .refine(
    (body) => (body.latitude === undefined || body.latitude === null) === (body.longitude === undefined || body.longitude === null),
    { path: ["latitude"], message: "Latitude et longitude vont ensemble" },
  );

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
  .refine((body) => Object.keys(body).length > 0, { message: "Aucun champ à mettre à jour" });

export const AddressesQueryParams = pagination(50);

export const NotificationsQueryParams = pagination(20).extend({
  unreadOnly: BooleanQuerySchema.optional(),
});

export const CreatePlaceSuggestionDto = z.object({
  kind: PlaceKind.exclude(["COUNTRY"]),
  label: z.string().trim().min(2).max(100),
  parentId: IdSchema,
});

export type CreateAddressInput = z.infer<typeof CreateAddressDto>;
export type UpdateAddressInput = z.infer<typeof UpdateAddressDto>;
export type AddressesQuery = z.infer<typeof AddressesQueryParams>;
export type NotificationsQuery = z.infer<typeof NotificationsQueryParams>;
export type CreatePlaceSuggestionInput = z.infer<typeof CreatePlaceSuggestionDto>;
