import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import type { Actor } from "../../common/auth/types";
import {
  CurrentActor,
  LazyZodValidationPipe,
  Roles,
} from "../../common";
import { ActorGuard } from "../../common/guards/actor.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { SupabaseGuard } from "../../common/guards/supabase.guard";
import { AdminService } from "./admin.service";

type AdminUserQuery = {
  page: number;
  limit: number;
  role?: "CLIENT" | "PROVIDER" | "ADMIN";
  status?: "active" | "inactive" | "verified" | "unverified";
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

type AdminProviderQuery = {
  page: number;
  limit: number;
  status?: "premium" | "available" | "unavailable";
  verificationStatus?: "PENDING" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED";
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

type AdminCategoryQuery = {
  includeInactive?: boolean;
};

type AdminVerificationQueueQuery = {
  page: number;
  limit: number;
  status?: "PENDING" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED";
  search?: string;
};

type AdminReviewQuery = {
  page: number;
  limit: number;
  isPublic?: boolean;
  minRating?: number;
  maxRating?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

type UpdateUserBody = {
  userId: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  city?: string | null;
  avatar?: string | null;
  isActive?: boolean;
  isVerified?: boolean;
  role?: "CLIENT" | "PROVIDER" | "ADMIN";
};

type UpdateProviderBody = {
  providerId: string;
  verificationStatus?: "PENDING" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED";
  isPremium?: boolean;
  isAvailable?: boolean;
  rejectionReason?: string;
};

type CreateCategoryBody = {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  color?: string;
  order?: number;
  subcategories?: Array<{
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    order?: number;
  }>;
};

type UpdateCategoryBody = Partial<CreateCategoryBody> & {
  id?: string;
  categoryId?: string;
  isActive?: boolean;
};

type ReviewVerificationDocBody = {
  providerId: string;
  docId: string;
  decision: "APPROVED" | "REJECTED";
  rejectionReason?: string;
};

type ModerateReviewBody = {
  reviewId: string;
  isPublic?: boolean;
  isEdited?: boolean;
  reply?: string | null;
};

const usersQueryPipe = new LazyZodValidationPipe(async () => {
  const { AdminUserSearchParams } = await import("@kayu/schemas");
  return AdminUserSearchParams;
});

const updateUserBodyPipe = new LazyZodValidationPipe(async () => {
  const { AdminUpdateUserDto } = await import("@kayu/schemas");
  return AdminUpdateUserDto;
});

const providersQueryPipe = new LazyZodValidationPipe(async () => {
  const { AdminProviderSearchParams } = await import("@kayu/schemas");
  return AdminProviderSearchParams;
});

const updateProviderBodyPipe = new LazyZodValidationPipe(async () => {
  const { AdminUpdateProviderDto } = await import("@kayu/schemas");
  return AdminUpdateProviderDto;
});

const categoriesQueryPipe = new LazyZodValidationPipe(async () => {
  const { AdminCategorySearchParams } = await import("@kayu/schemas");
  return AdminCategorySearchParams;
});

const verificationQueueQueryPipe = new LazyZodValidationPipe(async () => {
  const { AdminVerificationQueueSearchParams } = await import("@kayu/schemas");
  return AdminVerificationQueueSearchParams;
});

const reviewVerificationDocBodyPipe = new LazyZodValidationPipe(async () => {
  const { AdminReviewVerificationDocDto } = await import("@kayu/schemas");
  return AdminReviewVerificationDocDto;
});

const createCategoryBodyPipe = new LazyZodValidationPipe(async () => {
  const { CreateCategoryDto } = await import("@kayu/schemas");
  return CreateCategoryDto;
});

const updateCategoryBodyPipe = new LazyZodValidationPipe(async () => {
  const { UpdateCategoryDto } = await import("@kayu/schemas");
  return UpdateCategoryDto;
});

const reviewsQueryPipe = new LazyZodValidationPipe(async () => {
  const { AdminReviewSearchParams } = await import("@kayu/schemas");
  return AdminReviewSearchParams;
});

const moderateReviewBodyPipe = new LazyZodValidationPipe(async () => {
  const { AdminModerateReviewDto } = await import("@kayu/schemas");
  return AdminModerateReviewDto;
});

@Controller("admin")
@Roles("ADMIN")
@UseGuards(SupabaseGuard, ActorGuard, RolesGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get("users")
  listUsers(@Query(usersQueryPipe) query: AdminUserQuery) {
    return this.admin.listUsers(query);
  }

  @Put("users")
  updateUser(
    @CurrentActor() actor: Actor,
    @Body(updateUserBodyPipe) body: UpdateUserBody,
    @Req() request: Request,
  ) {
    return this.admin.updateUser(actor, body, request.ip);
  }

  @Get("providers")
  listProviders(@Query(providersQueryPipe) query: AdminProviderQuery) {
    return this.admin.listProviders(query);
  }

  @Put("providers")
  updateProvider(
    @CurrentActor() actor: Actor,
    @Body(updateProviderBodyPipe) body: UpdateProviderBody,
    @Req() request: Request,
  ) {
    return this.admin.updateProvider(actor, body, request.ip);
  }

  @Get("verification/submissions")
  listVerificationSubmissions(
    @Query(verificationQueueQueryPipe) query: AdminVerificationQueueQuery,
  ) {
    return this.admin.listVerificationSubmissions(query);
  }

  @Put("verification/documents")
  reviewVerificationDoc(
    @CurrentActor() actor: Actor,
    @Body(reviewVerificationDocBodyPipe) body: ReviewVerificationDocBody,
    @Req() request: Request,
  ) {
    return this.admin.reviewVerificationDoc(actor, body, request.ip);
  }

  @Get("categories")
  listCategories(@Query(categoriesQueryPipe) query: AdminCategoryQuery) {
    return this.admin.listCategories(query);
  }

  @Post("categories")
  createCategory(
    @CurrentActor() actor: Actor,
    @Body(createCategoryBodyPipe) body: CreateCategoryBody,
    @Req() request: Request,
  ) {
    return this.admin.createCategory(actor, body, request.ip);
  }

  @Put("categories")
  updateCategory(
    @CurrentActor() actor: Actor,
    @Body(updateCategoryBodyPipe) body: UpdateCategoryBody,
    @Req() request: Request,
  ) {
    return this.admin.updateCategory(actor, body, request.ip);
  }

  @Delete("categories")
  deleteCategory(
    @CurrentActor() actor: Actor,
    @Query("id") id: string | undefined,
    @Query("categoryId") categoryId: string | undefined,
    @Req() request: Request,
  ) {
    return this.admin.deleteCategory(actor, categoryId ?? id ?? "", request.ip);
  }

  @Get("reviews")
  listReviews(@Query(reviewsQueryPipe) query: AdminReviewQuery) {
    return this.admin.listReviews(query);
  }

  @Put("reviews")
  moderateReview(
    @CurrentActor() actor: Actor,
    @Body(moderateReviewBodyPipe) body: ModerateReviewBody,
    @Req() request: Request,
  ) {
    return this.admin.moderateReview(actor, body, request.ip);
  }

  @Delete("reviews")
  deleteReview(
    @CurrentActor() actor: Actor,
    @Query("id") id: string | undefined,
    @Query("reviewId") reviewId: string | undefined,
    @Req() request: Request,
  ) {
    return this.admin.deleteReview(actor, reviewId ?? id ?? "", request.ip);
  }
}
