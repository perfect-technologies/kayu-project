"use client";

import { useMemo, useState } from "react";
import { ProviderSection } from "./ProviderSection";
import {
  ProviderRecentWorkLightbox,
  type LightboxImage,
} from "./ProviderRecentWorkLightbox";

type ImageType = "BEFORE" | "DURING" | "AFTER" | "GENERAL" | "DETAIL" | "PLAN";

interface Project {
  id: string;
  title: string;
  description?: string | null;
  duration?: number | null;
  price?: number | null;
  isFeatured: boolean;
  createdAt: string;
  images: Array<{
    id: string;
    imageType: ImageType;
    imageUrl: string;
    thumbnailUrl?: string | null;
    caption?: string | null;
    displayOrder: number;
  }>;
}

interface PortfolioImage {
  id: string;
  imageUrl: string;
  title: string;
  description?: string | null;
  order: number;
}

interface ProviderRecentWorkProps {
  portfolio: PortfolioImage[];
  projects: Project[];
}

export function ProviderRecentWork({ portfolio, projects }: ProviderRecentWorkProps) {
  const [lightbox, setLightbox] = useState<{
    open: boolean;
    images: LightboxImage[];
    startIndex: number;
    title?: string;
  }>({ open: false, images: [], startIndex: 0 });

  const { featured, gallery, projectCount, photoCount } = useMemo(() => {
    const featuredSorted = [...projects]
      .filter((p) => p.images.length > 0)
      .sort((a, b) => {
        if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    const featured = featuredSorted.slice(0, 2);
    const featuredIds = new Set(featured.map((p) => p.id));
    const remainingProjectImages: LightboxImage[] = projects
      .filter((p) => !featuredIds.has(p.id))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .flatMap((p) =>
        [...p.images]
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((img) => ({
            imageUrl: img.imageUrl,
            thumbnailUrl: img.thumbnailUrl ?? null,
            caption: img.caption ?? p.title,
            imageType: img.imageType,
          }))
      );
    const portfolioImages: LightboxImage[] = [...portfolio]
      .sort((a, b) => a.order - b.order)
      .map((p) => ({
        imageUrl: p.imageUrl,
        thumbnailUrl: null,
        caption: p.title,
        imageType: null,
      }));
    const gallery: LightboxImage[] = [...portfolioImages, ...remainingProjectImages];
    const photoCount = projects.reduce((sum, p) => sum + p.images.length, 0) + portfolio.length;
    return { featured, gallery, projectCount: projects.length, photoCount };
  }, [portfolio, projects]);

  if (featured.length === 0 && gallery.length === 0) return null;

  const openProject = (project: Project) => {
    const images: LightboxImage[] = [...project.images]
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((img) => ({
        imageUrl: img.imageUrl,
        thumbnailUrl: img.thumbnailUrl ?? null,
        caption: img.caption,
        imageType: img.imageType,
      }));
    setLightbox({ open: true, images, startIndex: 0, title: project.title });
  };

  const openGalleryAt = (startIndex: number) => {
    setLightbox({ open: true, images: gallery, startIndex, title: undefined });
  };

  const heroCount = `${projectCount} projet${projectCount > 1 ? "s" : ""} · ${photoCount} photo${photoCount > 1 ? "s" : ""}`;
  const visibleGallery = gallery.slice(0, 6);
  const overflowCount = Math.max(0, gallery.length - 5);

  return (
    <>
      <ProviderSection
        title="Travaux récents"
        trailing={<span style={{ fontSize: 12, color: "var(--k-text-muted)" }}>{heroCount}</span>}
      >
        {featured.length > 0 && (
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            {featured.map((project) => (
              <FeaturedCard key={project.id} project={project} onOpen={() => openProject(project)} />
            ))}
          </div>
        )}

        {visibleGallery.length > 0 && (
          <div
            className="grid grid-cols-4 gap-1.5 md:grid-cols-6"
            style={{ marginTop: featured.length > 0 ? 14 : 0 }}
          >
            {visibleGallery.map((img, i) => {
              const isOverflow = gallery.length > 6 && i === 5;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => openGalleryAt(i)}
                  className="overflow-hidden"
                  style={{
                    aspectRatio: "1/1",
                    borderRadius: 8,
                    background: "#F5F2E9",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    position: "relative",
                  }}
                  aria-label={isOverflow ? `Voir ${overflowCount} photos de plus` : "Agrandir l'image"}
                >
                  <img
                    src={img.thumbnailUrl ?? img.imageUrl}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                      opacity: isOverflow ? 0.4 : 1,
                    }}
                  />
                  {isOverflow && (
                    <span
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: 16,
                        background: "rgba(15,23,42,0.55)",
                      }}
                    >
                      +{overflowCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </ProviderSection>

      <ProviderRecentWorkLightbox
        open={lightbox.open}
        onOpenChange={(open) => setLightbox((l) => ({ ...l, open }))}
        images={lightbox.images}
        startIndex={lightbox.startIndex}
        title={lightbox.title}
      />
    </>
  );
}

function FeaturedCard({ project, onOpen }: { project: Project; onOpen: () => void }) {
  const heroImg =
    project.images.find((i) => i.imageType === "AFTER") ??
    [...project.images].sort((a, b) => a.displayOrder - b.displayOrder)[0];
  if (!heroImg) return null;
  const hasBeforeAfter =
    project.images.some((i) => i.imageType === "BEFORE") &&
    project.images.some((i) => i.imageType === "AFTER");
  const durationLabel = formatDuration(project.duration);
  const priceLabel = project.price ? `${project.price.toLocaleString("fr-FR")} FC` : null;

  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: 12,
        overflow: "hidden",
        padding: 0,
        textAlign: "left",
        cursor: "pointer",
      }}
    >
      <div style={{ aspectRatio: "16/10", position: "relative" }}>
        <img
          src={heroImg.imageUrl}
          alt={project.title}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        {hasBeforeAfter && (
          <span
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              background: "var(--k-surface)",
              padding: "3px 8px",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              color: "var(--k-text-primary)",
            }}
          >
            Avant / après
          </span>
        )}
      </div>
      <div style={{ padding: "12px 14px 14px" }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "var(--k-text-primary)" }}>
          {project.title}
        </div>
        {(durationLabel || priceLabel) && (
          <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 12, color: "var(--k-text-muted)" }}>
            {durationLabel && (
              <span>
                Durée <b style={{ color: "var(--k-text-primary)", fontFamily: "var(--k-font-mono)" }}>{durationLabel}</b>
              </span>
            )}
            {priceLabel && (
              <span>
                À partir de <b style={{ color: "var(--k-text-primary)", fontFamily: "var(--k-font-mono)" }}>{priceLabel}</b>
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}

function formatDuration(minutes?: number | null): string | null {
  if (!minutes || minutes <= 0) return null;
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 1440) {
    const h = Math.round(minutes / 60);
    return `${h} h`;
  }
  const d = Math.round(minutes / 1440);
  return `${d} j`;
}
