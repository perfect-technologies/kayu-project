"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

// Types based on schema
type PortfolioImageType = "BEFORE" | "DURING" | "AFTER" | "GENERAL" | "DETAIL" | "PLAN";

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
  duration?: number | null; // in hours
  price?: number | null;
  viewCount: number;
  isFeatured: boolean;
  createdAt: string;
  category?: {
    id: string;
    name: string;
  } | null;
  booking?: {
    id: string;
    scheduledDate: string | null;
  } | null;
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

const imageTypeConfig: Record<PortfolioImageType, { label: string; color: string; bgColor: string }> = {
  BEFORE: { label: "Avant", color: "text-amber-600", bgColor: "bg-amber-100" },
  DURING: { label: "Pendant", color: "text-blue-600", bgColor: "bg-blue-100" },
  AFTER: { label: "Après", color: "text-green-600", bgColor: "bg-green-100" },
  GENERAL: { label: "Général", color: "text-gray-600", bgColor: "bg-gray-100" },
  DETAIL: { label: "Détail", color: "text-purple-600", bgColor: "bg-purple-100" },
  PLAN: { label: "Plan", color: "text-indigo-600", bgColor: "bg-indigo-100" },
};

export function ProviderPortfolio({ portfolio = [], projects = [] }: ProviderPortfolioProps) {
  const [selectedImage, setSelectedImage] = useState<{ projectIndex: number; imageIndex: number } | null>(null);
  const [viewMode, setViewMode] = useState<"projects" | "gallery">("projects");
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);
  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(null);

  // Calculate total stats
  const totalImages = projects.reduce((acc, p) => acc + p.images.length, 0) + portfolio.length;
  const totalViews = projects.reduce((acc, p) => acc + p.viewCount, 0);

  // Get all images for gallery mode
  const allImages: Array<{ imageUrl: string; title: string; caption?: string; type?: PortfolioImageType }> = [
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
      }))
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
          imageIndex: selectedImage.imageIndex === 0 ? imageCount - 1 : selectedImage.imageIndex - 1,
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
          imageIndex: selectedImage.imageIndex === imageCount - 1 ? 0 : selectedImage.imageIndex + 1,
        });
      }
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-CD", {
      style: "currency",
      currency: "CDF",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDuration = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    if (hours === 1) return "1 heure";
    return `${hours} heures`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              Portfolio
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Eye className="h-3 w-3" />
                {totalViews} vues
              </Badge>
              <Badge variant="outline">
                {totalImages} photo{totalImages > 1 ? "s" : ""}
              </Badge>
            </div>
          </div>

          {/* View Mode Tabs */}
          {projects.length > 0 && (
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "projects" | "gallery")} className="mt-3">
              <TabsList className="grid w-full grid-cols-2 h-9">
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
          )}
        </CardHeader>
        <CardContent>
          {/* Projects View */}
          {viewMode === "projects" && projects.length > 0 && (
            <div className="space-y-6">
              {projects.map((project, projectIndex) => {
                const beforeImages = project.images.filter((img) => img.imageType === "BEFORE");
                const afterImages = project.images.filter((img) => img.imageType === "AFTER");
                const hasBeforeAfter = beforeImages.length > 0 && afterImages.length > 0;

                return (
                  <div
                    key={project.id}
                    className={`p-4 rounded-lg border ${
                      project.isFeatured
                        ? "border-primary/30 bg-primary/5"
                        : "border-border"
                    }`}
                  >
                    {/* Project Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{project.title}</h4>
                          {project.isFeatured && (
                            <Badge className="bg-primary text-xs">À la une</Badge>
                          )}
                        </div>
                        {project.category && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {project.category.name}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Eye className="h-3 w-3" />
                        {project.viewCount}
                      </div>
                    </div>

                    {/* Project Details */}
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                      {project.duration && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDuration(project.duration)}
                        </div>
                      )}
                      {project.price && (
                        <div className="flex items-center gap-1">
                          <Banknote className="h-3.5 w-3.5" />
                          {formatPrice(project.price)}
                        </div>
                      )}
                      {project.booking?.scheduledDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(project.booking.scheduledDate)}
                        </div>
                      )}
                    </div>

                    {/* Before/After Comparison */}
                    {hasBeforeAfter && (
                      <div className="mb-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setSelectedProject(project);
                            setShowBeforeAfter(true);
                          }}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Voir Avant / Après
                        </Button>
                      </div>
                    )}

                    {/* Images Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {project.images.slice(0, 8).map((image, imageIndex) => {
                        const typeConfig = imageTypeConfig[image.imageType];
                        return (
                          <button
                            key={image.id}
                            onClick={() =>
                              setSelectedImage({ projectIndex, imageIndex })
                            }
                            className="aspect-square relative rounded-lg overflow-hidden bg-muted group focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <Image
                              src={image.thumbnailUrl || image.imageUrl}
                              alt={image.caption || project.title}
                              fill
                              className="object-cover transition-transform group-hover:scale-105"
                              sizes="(max-width: 768px) 50vw, 25vw"
                            />
                            <Badge
                              className={`absolute top-1 left-1 text-[10px] ${typeConfig.bgColor} ${typeConfig.color}`}
                            >
                              {typeConfig.label}
                            </Badge>
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                          </button>
                        );
                      })}
                    </div>

                    {/* Show more button */}
                    {project.images.length > 8 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() =>
                          setSelectedImage({ projectIndex, imageIndex: 0 })
                        }
                      >
                        Voir les {project.images.length} photos
                      </Button>
                    )}

                    {/* Description */}
                    {project.description && (
                      <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                        {project.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Gallery View */}
          {(viewMode === "gallery" || projects.length === 0) && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {allImages.slice(0, 12).map((image, index) => (
                <button
                  key={index}
                  onClick={() => {
                    const projectIdx = Math.floor(index / Math.max(1, projects[0]?.images.length || 1));
                    setSelectedImage({ projectIndex: projectIdx, imageIndex: index % Math.max(1, projects[0]?.images.length || 1) });
                  }}
                  className="aspect-square relative rounded-lg overflow-hidden bg-muted group focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <Image
                    src={image.imageUrl}
                    alt={image.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                  {image.type && (
                    <Badge
                      className={`absolute top-1 left-1 text-[10px] ${imageTypeConfig[image.type].bgColor} ${imageTypeConfig[image.type].color}`}
                    >
                      {imageTypeConfig[image.type].label}
                    </Badge>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end">
                    <div className="p-2 text-white text-xs font-medium truncate w-full bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      {image.title}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Legacy Portfolio Items (if no projects) */}
          {projects.length === 0 && portfolio.length > 8 && (
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => setSelectedImage({ projectIndex: 0, imageIndex: 0 })}
            >
              Voir les {portfolio.length} photos
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Lightbox Dialog */}
      <Dialog
        open={selectedImage !== null}
        onOpenChange={() => setSelectedImage(null)}
      >
        <DialogContent className="max-w-4xl w-full p-0 bg-black/95 border-none">
          <DialogHeader className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/60 to-transparent p-4">
            <DialogTitle className="text-white">
              {selectedImage !== null && projects[selectedImage.projectIndex]?.title}
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
                  src={projects[selectedImage.projectIndex].images[selectedImage.imageIndex]?.imageUrl || ""}
                  alt={projects[selectedImage.projectIndex].title}
                  fill
                  className="object-contain"
                  sizes="100vw"
                />
              </div>

              {/* Navigation */}
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

              {/* Caption */}
              {projects[selectedImage.projectIndex].images[selectedImage.imageIndex]?.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <p className="text-white text-sm">
                    {projects[selectedImage.projectIndex].images[selectedImage.imageIndex].caption}
                  </p>
                </div>
              )}

              {/* Counter */}
              <div className="absolute bottom-4 right-4 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
                {selectedImage.imageIndex + 1} / {projects[selectedImage.projectIndex].images.length}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Before/After Comparison Dialog */}
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
                {/* Before Images */}
                <div>
                  <h4 className="font-medium text-amber-600 mb-3 flex items-center gap-2">
                    <ImageOff className="h-4 w-4" />
                    Avant
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedProject.images
                      .filter((img) => img.imageType === "BEFORE")
                      .map((img) => (
                        <div
                          key={img.id}
                          className="aspect-square relative rounded-lg overflow-hidden bg-muted"
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

                {/* After Images */}
                <div>
                  <h4 className="font-medium text-green-600 mb-3 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Après
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedProject.images
                      .filter((img) => img.imageType === "AFTER")
                      .map((img) => (
                        <div
                          key={img.id}
                          className="aspect-square relative rounded-lg overflow-hidden bg-muted"
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

              {/* Arrow indicator */}
              <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center w-12 h-12 rounded-full bg-primary text-white shadow-lg">
                <ArrowRight className="h-6 w-6" />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// Skeleton version
export function ProviderPortfolioSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="h-6 w-24 bg-muted rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
