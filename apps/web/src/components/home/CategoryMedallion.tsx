import Link from "next/link";
import type { CategoryTreeNode } from "@kayu/schemas";
import { lucideIcon } from "@/lib/dto/icons";
import { categoryColorClass } from "@/lib/dto/provider";

/** 64 px white ring, 40 px coloured disc with the category icon, 11 px label. Server-safe. */
export function CategoryMedallion({ category }: { category: CategoryTreeNode }) {
  const Icon = lucideIcon(category.icon);
  return (
    <Link
      href={`/rechercher?category=${encodeURIComponent(category.slug)}`}
      className="group flex flex-col items-center gap-2.5 rounded-2xl p-3 transition hover:bg-secondary/60"
    >
      <span className="flex size-16 items-center justify-center rounded-full bg-white shadow-soft ring-1 ring-border transition group-hover:shadow-soft-lg group-hover:ring-primary/30">
        <span className={`flex size-10 items-center justify-center rounded-full text-white ${categoryColorClass(category.slug)}`}>
          <Icon size={20} aria-hidden />
        </span>
      </span>
      <span className="max-w-[5.5rem] text-center text-[11px] leading-tight font-semibold text-foreground/70 group-hover:text-primary">
        {category.name}
      </span>
    </Link>
  );
}
