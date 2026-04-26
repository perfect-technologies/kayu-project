"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  Clock,
  Banknote,
  Calendar,
  ArrowRight,
  Grid,
  LayoutGrid,
  ImageOff,
  Play,
} from "lucide-react";
import Image from "next/image";
import { ProviderSection } from "./ProviderSection";

type PortfolioImageType =
  | "BEFORE"
  | "DURING"
  | "AFTER"
  | "GENERAL"
  | "DETAIL"
  | "PLAN";

interface PortfolioImage {
  id: string;
  imageType: PortfolioImageType;
  imageUrl: string;
  thumbnailUrl?: string | null;
  caption?: string | null;
  displayOrder: number;
  uploadedAt: string;
}

interface PortfolioProject {
  id: string;
  title: string;
  description?: string | null;
  duration?: number | null;
  price?: number | null;
  viewCount: number;
  isFeatured: boolean;
  createdAt: string;
  category?: { id: string; name: string } | null;
  booking?: { id: string; scheduledDate: string | null } | null;
  images: PortfolioImage[];
}

interface PortfolioItem {
  id: string;
  title: string;
  description?: string | null;
  imageUrl: string;
  order: number;
}

interface ProviderPortfolioProps {
  portfolio?: PortfolioItem[];
  projects?: PortfolioProject[];
}

const IMAGE_TYPE_CHIP: Record<PortfolioImageType, { label: string; chipClass: string }> = {
  BEFORE: { label: "Avant", chipClass: "k-chip k-chip-sm k-chip-warning" },
  DURING: { label: "Pendant", chipClass: "k-chip k-chip-sm k-chip-primary" },
  AFTER: { label: "Après", chipClass: "k-chip k-chip-sm k-chip-success" },
  GENERAL: { label: "Général", chipClass: "k-chip k-chip-sm" },
  DETAIL: { label: "Détail", chipClass: "k-chip k-chip-sm k-chip-expert" },
  PLAN: { label: "Plan", chipClass: "k-chip k-chip-sm k-chip-accent" },
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("fr-CD", {
    style: "currency",
    currency: "CDF",
    maximumFractionDigits: 0,
  }).format(price);
}

function formatDuration(hours: number) {
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours === 1) return "1 heure";
  return `${hours} heures`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function ProviderPortfolio({
  portfolio = [],
  projects = [],
}: ProviderPortfolioProps) {
  const [selectedImage, setSelectedImage] = useState<{
    projectIndex: number;
    imageIndex: number;
  } | null>(null);
  const [viewMode, setViewMode] = useState<"projects" | "gallery">("projects");
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);
  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(
    null,
  );

  const totalImages =
    projects.reduce((acc, p) => acc + p.images.length, 0) + portfolio.length;
  const totalViews = projects.reduce((acc, p) => acc + p.viewCount, 0);

  const allImages: Array<{
    imageUrl: string;
    title: string;
    caption?: string;
    type?: PortfolioImageType;
  }> = [
    ...portfolio.map((item) => ({
      imageUrl: item.imageUrl,
      title: item.title,
      caption: item.description || undefined,
    })),
    ...projects.flatMap((project) =>
      project.images.map((img) => ({
        imageUrl: img.imageUrl,
        title: project.title,
        caption: img.caption || undefined,
        type: img.imageType,
      })),
    ),
  ];

  if (projects.length === 0 && portfolio.length === 0) {
    return null;
  }

  const handlePrevious = () => {
    if (selectedImage) {
      const project = projects[selectedImage.projectIndex];
      if (project) {
        const imageCount = project.images.length;
        setSelectedImage({
          ...selectedImage,
          imageIndex:
            selectedImage.imageIndex === 0
              ? imageCount - 1
              : selectedImage.imageIndex - 1,
        });
      }
    }
  };

  const handleNext = () => {
    if (selectedImage) {
      const project = projects[selectedImage.projectIndex];
      if (project) {
        const imageCount = project.images.length;
        setSelectedImage({
          ...selectedImage,
          imageIndex:
            selectedImage.imageIndex === imageCount - 1
              ? 0
              : selectedImage.imageIndex + 1,
        });
      }
    }
  };

  return (
    <>
      <ProviderSection
        title="Portfolio"
        subtitle={`${totalImages} photo${totalImages > 1 ? "s" : ""} · ${totalViews} vue${totalViews > 1 ? "s" : ""}`}
        trailing={
          projects.length > 0 ? (
            <Tabs
              value={viewMode}
              onValueChange={(v) => setViewMode(v as "projects" | "gallery")}
            >
              <TabsList className="grid grid-cols-2 h-9">
                <TabsTrigger value="projects" className="text-xs gap-1">
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Projets
                </TabsTrigger>
                <TabsTrigger value="gallery" className="text-xs gap-1">
                  <Grid className="h-3.5 w-3.5" />
                  Galerie
                </TabsTrigger>
              </TabsList>
            </Tabs>
          ) : null
        }
      >
        {viewMode === "projects" && projects.length > 0 && (
          <div style={{ display: "grid", gap: 14 }}>
            {projects.map((project, projectIndex) => {
              const beforeImages = project.images.filter(
                (img) => img.imageType === "BEFORE",
              );
              const afterImages = project.images.filter(
                (img) => img.imageType === "AFTER",
              );
              const hasBeforeAfter =
                beforeImages.length > 0 && afterImages.length > 0;

              return (
                <div
                  key={project.id}
                  style={{
                    padding: 16,
                    borderRadius: "var(--k-r-md)",
                    background: project.isFeatured
                      ? "var(--k-primary-subtle)"
                      : "var(--k-surface-muted)",
                    border: project.isFeatured
                      ? "1px solid color-mix(in srgb, var(--k-primary) 18%, transparent)"
                      : "1px solid var(--k-border-subtle)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 12,
                      marginBottom: 10,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <span style={{ fontWeight: 600, fontSize: 15 }}>
                          {project.title}
                        </span>
                        {project.isFeatured && (
                          <span className="k-chip k-chip-sm k-chip-primary">
                            À la une
                          </span>
                        )}
                      </div>
                      {project.category && (
                        <span
                          className="k-chip k-chip-sm"
                          style={{ marginTop: 6 }}
                        >
                          {project.category.name}
                        </span>
                      )}
                    </div>
                    <div
                      className="k-caption"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        color: "var(--k-text-muted)",
                      }}
                    >
                      <Eye className="h-3 w-3" />
                      {project.viewCount}
                    </div>
                  </div>

                  <div
                    className="k-caption"
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 12,
                      marginBottom: 12,
                      color: "var(--k-text-body)",
                    }}
                  >
                    {project.duration && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Clock className="h-3 w-3" />
                        {formatDuration(project.duration)}
                      </span>
                    )}
                    {project.price && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Banknote className="h-3 w-3" />
                        {formatPrice(project.price)}
                      </span>
                    )}
                    {project.booking?.scheduledDate && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Calendar className="h-3 w-3" />
                        {formatDate(project.booking.scheduledDate)}
                      </span>
                    )}
                  </div>

                  {hasBeforeAfter && (
                    <div style={{ marginBottom: 12 }}>
                      <button
                        type="button"
                        className="k-btn k-btn-secondary k-btn-sm w-full"
                        onClick={() => {
                          setSelectedProject(project);
                          setShowBeforeAfter(true);
                        }}
                      >
                        <Play className="h-4 w-4" />
                        Voir Avant / Après
                      </button>
                    </div>
                  )}

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                      gap: 8,
                    }}
                  >
                    {project.images.slice(0, 8).map((image, imageIndex) => {
                      const typeChip = IMAGE_TYPE_CHIP[image.imageType];
                      return (
                        <button
                          key={image.id}
                          type="button"
                          onClick={() =>
                            setSelectedImage({ projectIndex, imageIndex })
                          }
                          style={{
                            position: "relative",
                            aspectRatio: "1 / 1",
                            borderRadius: "var(--k-r-sm)",
                            overflow: "hidden",
                            background: "var(--k-surface-muted)",
                            border: "1px solid var(--k-border-subtle)",
                            cursor: "pointer",
                          }}
                          className="group focus:outline-none focus:ring-2"
                        >
                          <Image
                            src={image.thumbnailUrl || image.imageUrl}
                            alt={image.caption || project.title}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                            sizes="(max-width: 768px) 50vw, 25vw"
                          />
                          <span
                            className={typeChip.chipClass}
                            style={{
                              position: "absolute",
                              top: 6,
                              left: 6,
                            }}
                          >
                            {typeChip.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {project.images.length > 8 && (
                    <button
                      type="button"
                      className="k-btn k-btn-ghost k-btn-sm w-full"
                      style={{ marginTop: 10 }}
                      onClick={() =>
                        setSelectedImage({ projectIndex, imageIndex: 0 })
                      }
                    >
                      Voir les {project.images.length} photos
                    </button>
                  )}

                  {project.description && (
                    <p
                      className="k-body"
                      style={{
                        marginTop: 12,
                        color: "var(--k-text-body)",
                        lineHeight: 1.5,
                      }}
                    >
                      {project.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {(viewMode === "gallery" || projects.length === 0) && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 10,
            }}
          >
            {allImages.slice(0, 12).map((image, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  const projectIdx = Math.floor(
                    index / Math.max(1, projects[0]?.images.length || 1),
                  );
                  setSelectedImage({
                    projectIndex: projectIdx,
                    imageIndex:
                      index % Math.max(1, projects[0]?.images.length || 1),
                  });
                }}
                style={{
                  position: "relative",
                  aspectRatio: "1 / 1",
                  borderRadius: "var(--k-r-sm)",
                  overflow: "hidden",
                  background: "var(--k-surface-muted)",
                  border: "1px solid var(--k-border-subtle)",
                  cursor: "pointer",
                }}
                className="group focus:outline-none focus:ring-2"
              >
                <Image
                  src={image.imageUrl}
                  alt={image.title}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                {image.type && (
                  <span
                    className={IMAGE_TYPE_CHIP[image.type].chipClass}
                    style={{ position: "absolute", top: 6, left: 6 }}
                  >
                    {IMAGE_TYPE_CHIP[image.type].label}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {projects.length === 0 && portfolio.length > 8 && (
          <button
            type="button"
            className="k-btn k-btn-secondary w-full"
            style={{ marginTop: 12 }}
            onClick={() => setSelectedImage({ projectIndex: 0, imageIndex: 0 })}
          >
            Voir les {portfolio.length} photos
          </button>
        )}
      </ProviderSection>

      <Dialog
        open={selectedImage !== null}
        onOpenChange={() => setSelectedImage(null)}
      >
        <DialogContent className="max-w-4xl w-full p-0 bg-black/95 border-none">
          <DialogHeader className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/60 to-transparent p-4">
            <DialogTitle className="text-white">
              {selectedImage !== null &&
                projects[selectedImage.projectIndex]?.title}
            </DialogTitle>
          </DialogHeader>

          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
            onClick={() => setSelectedImage(null)}
          >
            <X className="h-6 w-6" />
          </Button>

          {selectedImage !== null && projects[selectedImage.projectIndex] && (
            <div className="relative flex items-center justify-center min-h-[60vh] md:min-h-[80vh]">
              <div className="relative w-full h-[60vh] md:h-[80vh]">
                <Image
                  src={
                    projects[selectedImage.projectIndex].images[
                      selectedImage.imageIndex
                    ]?.imageUrl || ""
                  }
                  alt={projects[selectedImage.projectIndex].title}
                  fill
                  className="object-contain"
                  sizes="100vw"
                />
              </div>

              {projects[selectedImage.projectIndex].images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-12 w-12"
                    onClick={handlePrevious}
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-12 w-12"
                    onClick={handleNext}
                  >
                    <ChevronRight className="h-8 w-8" />
                  </Button>
                </>
              )}

              {projects[selectedImage.projectIndex].images[
                selectedImage.imageIndex
              ]?.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <p className="text-white text-sm">
                    {
                      projects[selectedImage.projectIndex].images[
                        selectedImage.imageIndex
                      ].caption
                    }
                  </p>
                </div>
              )}

              <div className="absolute bottom-4 right-4 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
                {selectedImage.imageIndex + 1} /{" "}
                {projects[selectedImage.projectIndex].images.length}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showBeforeAfter} onOpenChange={setShowBeforeAfter}>
        <DialogContent className="max-w-5xl w-full p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              Avant / Après - {selectedProject?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedProject && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4
                    className="font-medium mb-3 flex items-center gap-2"
                    style={{ color: "var(--k-warning)" }}
                  >
                    <ImageOff className="h-4 w-4" />
                    Avant
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedProject.images
                      .filter((img) => img.imageType === "BEFORE")
                      .map((img) => (
                        <div
                          key={img.id}
                          className="aspect-square relative rounded-lg overflow-hidden"
                          style={{ background: "var(--k-surface-muted)" }}
                        >
                          <Image
                            src={img.imageUrl}
                            alt={img.caption || "Avant"}
                            fill
                            className="object-cover"
                            sizes="50vw"
                          />
                          {img.caption && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2">
                              {img.caption}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>

                <div>
                  <h4
                    className="font-medium mb-3 flex items-center gap-2"
                    style={{ color: "var(--k-success)" }}
                  >
                    <ImageIcon className="h-4 w-4" />
                    Après
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedProject.images
                      .filter((img) => img.imageType === "AFTER")
                      .map((img) => (
                        <div
                          key={img.id}
                          className="aspect-square relative rounded-lg overflow-hidden"
                          style={{ background: "var(--k-surface-muted)" }}
                        >
                          <Image
                            src={img.imageUrl}
                            alt={img.caption || "Après"}
                            fill
                            className="object-cover"
                            sizes="50vw"
                          />
                          {img.caption && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2">
                              {img.caption}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div
                className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center w-12 h-12 rounded-full text-white shadow-lg"
                style={{ background: "var(--k-primary)" }}
              >
                <ArrowRight className="h-6 w-6" />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ProviderPortfolioSkeleton() {
  return (
    <div
      className="animate-k-shimmer"
      style={{ height: 320, borderRadius: "var(--k-r-lg)" }}
    />
  );
}
