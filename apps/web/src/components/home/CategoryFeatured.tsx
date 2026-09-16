import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { CategoryTreeNode } from "@kayu/schemas";
import { homeCopy } from "@/copy/home";
import { lucideIcon } from "@/lib/dto/icons";
import { cn } from "@/lib/utils";

const LOCAL_PHOTOS: Record<string, string> = {
  batiment_construction: "/images/home/batiment_construction.jpg",
  beaute_bien_etre: "/images/home/beaute_bien_etre.jpg",
  cuisine_restauration: "/images/home/cuisine_restauration.jpg",
  maison_entretien: "/images/home/maison_entretien.jpg",
  garde_assistance: "/images/home/garde_assistance.jpg",
  transport_logistique: "/images/home/transport_logistique.jpg",
};

export function categoryPhoto(category: Pick<CategoryTreeNode, "slug" | "image">): string | null {
  return category.image || LOCAL_PHOTOS[category.slug] || null;
}

/** Photo tile of the bento: image, emerald bottom gradient, ghost index, glass icon, gold "Explorer" pill. */
export function CategoryFeatured({
  category,
  index,
  className,
}: {
  category: CategoryTreeNode;
  index: number;
  className?: string;
}) {
  const Icon = lucideIcon(category.icon);
  const photo = categoryPhoto(category);
  return (
    <Link
      href={`/rechercher?category=${encodeURIComponent(category.slug)}`}
      className={cn(
        "group provider-tile relative block overflow-hidden rounded-3xl border border-border bg-primary",
        className,
      )}
    >
      {photo && (
        <Image
          src={photo}
          alt=""
          fill
          sizes="(min-width: 768px) 33vw, 50vw"
          className="object-cover"
        />
      )}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-emerald-950/85 via-emerald-950/20 to-transparent" />
      <span
        aria-hidden
        className="pointer-events-none absolute top-2 left-4 text-4xl leading-none font-extrabold text-white/15 sm:text-5xl"
      >
        {String(index).padStart(2, "0")}
      </span>
      <div className="absolute inset-x-0 bottom-0 p-4">
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <span className="inline-flex size-9 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-sm">
              <Icon size={18} aria-hidden />
            </span>
            <h3 className="mt-2 truncate text-base font-bold text-white drop-shadow-sm sm:text-lg">{category.name}</h3>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-accent-foreground shadow-soft">
            {homeCopy.categories.explore} <ArrowUpRight size={13} aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  );
}
