import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CategoryTreeNode } from "@kayu/schemas";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { homeCopy } from "@/copy/home";
import { CategoryFeatured } from "./CategoryFeatured";
import { CategoryMedallion } from "./CategoryMedallion";

const copy = homeCopy.categories;

const SPANS = [
  "col-span-2 h-48 sm:h-60 md:col-span-3 md:h-72",
  "col-span-2 h-48 sm:h-60 md:col-span-3 md:h-72",
  "col-span-1 h-40 sm:h-44 md:col-span-2",
  "col-span-1 h-40 sm:h-44 md:col-span-2",
  "col-span-1 h-40 sm:h-44 md:col-span-2",
  "col-span-2 h-40 md:col-span-6",
];

function ViewAll({ className }: { className?: string }) {
  return (
    <Link href="/services" className={`inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-primary ${className ?? ""}`}>
      {copy.viewAll} <ArrowRight size={15} aria-hidden />
    </Link>
  );
}

/** Bento of the first six level-1 categories, then medallions for the rest. Hidden when the tree failed. */
export function CategoryGrid({ categories }: { categories: CategoryTreeNode[] }) {
  if (categories.length === 0) return null;
  const featured = categories.slice(0, 6);
  const rest = categories.slice(6);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <SectionHeading eyebrow={copy.eyebrow} title={copy.title} subtitle={copy.subtitle} action={<ViewAll />} />

      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-6">
        {featured.map((category, index) => (
          <CategoryFeatured key={category.id} category={category} index={index + 1} className={SPANS[index]} />
        ))}
      </div>

      {rest.length > 0 && (
        <div className="mt-6 grid grid-cols-3 gap-1 sm:grid-cols-4 sm:gap-2 md:grid-cols-6">
          {rest.map((category) => (
            <CategoryMedallion key={category.id} category={category} />
          ))}
        </div>
      )}

      <ViewAll className="mt-6 sm:hidden" />
    </section>
  );
}
