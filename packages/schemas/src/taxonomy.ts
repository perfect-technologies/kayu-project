import { z } from "zod";

export type TaxonomySeedNode = {
  slug: string;
  fr: string;
  en?: string;
  subs?: TaxonomySeedNode[];
};

// Mirrors K-YOU `shared/taxonomy.json` so the seed can validate the imported tree.
export const TaxonomySeedNodeSchema: z.ZodType<TaxonomySeedNode> = z.lazy(() =>
  z.object({
    slug: z.string().regex(/^[a-z0-9_]+$/),
    fr: z.string().min(1),
    en: z.string().min(1).optional(),
    subs: z.array(TaxonomySeedNodeSchema).optional(),
  }),
);

export const TaxonomySeedSchema = z.array(TaxonomySeedNodeSchema);
