import {
  Body,
  Controller,
  Delete,
  Get,
  Ip,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import type {
  AdminCreateCategoryInput,
  AdminCreateSubcategoryInput,
  AdminUpdateCategoryInput,
  AdminUpdateSubcategoryInput,
} from "../../common/contract";
import { contractPipe } from "../../common/contract/pipe";
import { CurrentActor } from "../../common/decorators/current-actor.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ActorGuard } from "../../common/guards/actor.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { SupabaseGuard } from "../../common/guards/supabase.guard";
import { AdminCategoriesService } from "./admin-categories.service";

@Controller("admin")
@Roles("ADMIN")
@UseGuards(SupabaseGuard, ActorGuard, RolesGuard)
export class AdminCategoriesController {
  constructor(private readonly categories: AdminCategoriesService) {}

  @Get("categories")
  list() {
    return this.categories.list();
  }

  @Post("categories")
  createCategory(
    @CurrentActor() actor: Actor,
    @Body(contractPipe("AdminCreateCategoryDto")) body: AdminCreateCategoryInput,
    @Ip() ip: string,
  ) {
    return this.categories.createCategory(actor, body, ip);
  }

  @Get("categories/:id")
  get(@Param("id") id: string) {
    return this.categories.get(id);
  }

  @Patch("categories/:id")
  updateCategory(
    @CurrentActor() actor: Actor,
    @Param("id") id: string,
    @Body(contractPipe("AdminUpdateCategoryDto")) body: AdminUpdateCategoryInput,
    @Ip() ip: string,
  ) {
    return this.categories.updateCategory(actor, id, body, ip);
  }

  @Delete("categories/:id")
  deleteCategory(@CurrentActor() actor: Actor, @Param("id") id: string, @Ip() ip: string) {
    return this.categories.deleteCategory(actor, id, ip);
  }

  @Get("subcategories")
  listSubcategories(@Query("categoryId") categoryId?: string) {
    return this.categories.listSubcategories(categoryId || undefined);
  }

  @Get("subcategories/:id")
  getSubcategory(@Param("id") id: string) {
    return this.categories.getSubcategory(id);
  }

  @Post("subcategories")
  createSubcategory(
    @CurrentActor() actor: Actor,
    @Body(contractPipe("AdminCreateSubcategoryDto")) body: AdminCreateSubcategoryInput,
    @Ip() ip: string,
  ) {
    return this.categories.createSubcategory(actor, body, ip);
  }

  @Patch("subcategories/:id")
  updateSubcategory(
    @CurrentActor() actor: Actor,
    @Param("id") id: string,
    @Body(contractPipe("AdminUpdateSubcategoryDto")) body: AdminUpdateSubcategoryInput,
    @Ip() ip: string,
  ) {
    return this.categories.updateSubcategory(actor, id, body, ip);
  }

  @Delete("subcategories/:id")
  deleteSubcategory(@CurrentActor() actor: Actor, @Param("id") id: string, @Ip() ip: string) {
    return this.categories.deleteSubcategory(actor, id, ip);
  }
}
