import type { Request } from "express";
import type { User } from "@prisma/client";

export type SupabaseJwtClaims = {
  sub?: string;
  aud?: string | string[];
  role?: string;
  email?: string;
  phone?: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
};

export type AuthContextUser = {
  authUserId: string;
  email?: string;
  phone?: string;
  claims: SupabaseJwtClaims;
};

export type Actor = User;

export type AuthenticatedRequest = Request & {
  user?: AuthContextUser;
  actor?: Actor;
};
