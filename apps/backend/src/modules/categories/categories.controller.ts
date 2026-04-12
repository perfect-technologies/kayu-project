import { Controller, Get, Query } from "@nestjs/common";
import { LazyZodValidationPipe } from "../../common";
import { CategoriesService } from "./categories.service";

type CategorySearchQuery = {
  withSubcategories?: boolean;
  categoryId?: string;
  categorySlug?: string;
};

const categoriesQueryPipe = new LazyZodValidationPipe(async () => {
  const { CategorySearchParams } = await import("@kayu/schemas");
  return CategorySearchParams;
});

@Controller("categories")
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  findAll(@Query(categoriesQueryPipe) query: CategorySearchQuery) {
    return this.categories.findAll(query);
  }

  @Get("hierarchy")
  findHierarchy() {
    return this.categories.findHierarchy();
  }
}
