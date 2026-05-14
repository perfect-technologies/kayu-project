"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useState } from "react";

export interface LightboxImage {
  imageUrl: string;
  thumbnailUrl?: string | null;
  caption?: string | null;
  imageType?: "BEFORE" | "DURING" | "AFTER" | "GENERAL" | "DETAIL" | "PLAN" | null;
}

interface ProviderRecentWorkLightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: LightboxImage[];
  startIndex?: number;
  title?: string;
}

export function ProviderRecentWorkLightbox({
  open,
  onOpenChange,
  images,
  startIndex = 0,
  title,
}: ProviderRecentWorkLightboxProps) {
  const [index, setIndex] = useState(startIndex);

  useEffect(() => {
    if (open) setIndex(Math.min(startIndex, Math.max(images.length - 1, 0)));
  }, [open, startIndex, images.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, images.length - 1));
      else if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, images.length]);

  if (images.length === 0) return null;
  const img = images[index];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[min(1100px,95vw)] p-0"
        style={{ background: "var(--k-text-primary)", border: "none" }}
      >
        <div style={{ position: "relative", aspectRatio: "16/10", background: "#000" }}>
          <img
            src={img.imageUrl}
            alt={img.caption ?? title ?? ""}
            style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
          />
          {img.imageType && img.imageType !== "GENERAL" && (
            <span
              style={{
                position: "absolute",
                top: 14,
                left: 14,
                background: "var(--k-surface)",
                padding: "4px 10px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                color: "var(--k-text-primary)",
              }}
            >
              {img.imageType === "BEFORE"
                ? "Avant"
                : img.imageType === "AFTER"
                ? "Après"
                : img.imageType === "DURING"
                ? "En cours"
                : img.imageType === "DETAIL"
                ? "Détail"
                : "Plan"}
            </span>
          )}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Fermer"
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.95)",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
          {index > 0 && (
            <button
              type="button"
              onClick={() => setIndex(index - 1)}
              aria-label="Précédent"
              style={navBtnStyle("left")}
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
          {index < images.length - 1 && (
            <button
              type="button"
              onClick={() => setIndex(index + 1)}
              aria-label="Suivant"
              style={navBtnStyle("right")}
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>
        {(img.caption || title) && (
          <div style={{ padding: "14px 18px", color: "#fff", fontSize: 13 }}>
            {title && <div style={{ fontWeight: 600 }}>{title}</div>}
            {img.caption && <div style={{ color: "rgba(255,255,255,0.7)", marginTop: 4 }}>{img.caption}</div>}
            <div style={{ marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
              {index + 1} / {images.length}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function navBtnStyle(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute",
    top: "50%",
    [side]: 14,
    transform: "translateY(-50%)",
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.95)",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  };
}
