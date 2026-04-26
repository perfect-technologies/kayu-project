"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  GraduationCap,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  Building2,
  FileText,
  ExternalLink,
  Award,
} from "lucide-react";
import Image from "next/image";
import { ProviderSection } from "./ProviderSection";

type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED" | "UNDER_REVIEW";

interface DiplomaDocument {
  id: string;
  type: "DIPLOMA";
  fileUrl: string;
  fileName: string;
  uploadedAt: string;
}

interface Diploma {
  id: string;
  title: string;
  issuingOrg: string;
  certificateNum?: string | null;
  status: VerificationStatus;
  issueDate?: string | null;
  documents: DiplomaDocument[];
  verifiedAt?: string | null;
}

interface ProviderDiplomasProps {
  diplomas: Diploma[];
}

const STATUS_CHIP: Record<VerificationStatus, string> = {
  VERIFIED: "k-chip k-chip-sm k-chip-success",
  PENDING: "k-chip k-chip-sm k-chip-warning",
  UNDER_REVIEW: "k-chip k-chip-sm k-chip-primary",
  REJECTED: "k-chip k-chip-sm",
};

const STATUS_LABEL: Record<VerificationStatus, string> = {
  VERIFIED: "Vérifié",
  PENDING: "En attente",
  UNDER_REVIEW: "En cours",
  REJECTED: "Rejeté",
};

const STATUS_ICON: Record<VerificationStatus, React.ElementType> = {
  VERIFIED: CheckCircle2,
  PENDING: Clock,
  UNDER_REVIEW: Clock,
  REJECTED: XCircle,
};

const DIPLOMA_TYPES: Record<string, string> = {
  BTS: "Brevet de Technicien Supérieur",
  DUT: "Diplôme Universitaire de Technologie",
  Licence: "Licence (Bac+3)",
  Master: "Master (Bac+5)",
  Doctorat: "Doctorat (Bac+8)",
  CAP: "Certificat d'Aptitude Professionnelle",
  BEP: "Brevet d'Études Professionnelles",
  "Bac Pro": "Baccalauréat Professionnel",
  Bac: "Baccalauréat",
};

function getYear(dateStr: string | null | undefined) {
  if (!dateStr) return null;
  return new Date(dateStr).getFullYear();
}

function getDiplomaType(title: string) {
  for (const [key, value] of Object.entries(DIPLOMA_TYPES)) {
    if (title.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  return null;
}

export function ProviderDiplomas({ diplomas }: ProviderDiplomasProps) {
  const [selectedDoc, setSelectedDoc] = useState<DiplomaDocument | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  if (diplomas.length === 0) {
    return null;
  }

  const handlePreview = (doc: DiplomaDocument) => {
    setSelectedDoc(doc);
    setPreviewOpen(true);
  };

  const verifiedCount = diplomas.filter((d) => d.status === "VERIFIED").length;

  return (
    <>
      <ProviderSection
        title="Diplômes & formations"
        subtitle={
          verifiedCount > 0
            ? `${verifiedCount} vérifié${verifiedCount > 1 ? "s" : ""} par KAYOU`
            : undefined
        }
      >
        <div style={{ display: "grid", gap: 12 }}>
          {diplomas.map((diploma) => {
            const StatusIcon = STATUS_ICON[diploma.status];
            const year = getYear(diploma.issueDate);
            const diplomaType = getDiplomaType(diploma.title);
            const isVerified = diploma.status === "VERIFIED";

            return (
              <div
                key={diploma.id}
                style={{
                  display: "flex",
                  gap: 14,
                  alignItems: "flex-start",
                  padding: 14,
                  background: isVerified
                    ? "var(--k-success-subtle)"
                    : "var(--k-surface-muted)",
                  borderRadius: "var(--k-r-md)",
                  border: isVerified
                    ? "1px solid color-mix(in srgb, var(--k-success) 18%, transparent)"
                    : "1px solid var(--k-border-subtle)",
                }}
              >
                <span
                  style={{
                    color: isVerified
                      ? "var(--k-success)"
                      : "var(--k-text-muted)",
                    marginTop: 2,
                    flexShrink: 0,
                  }}
                >
                  <GraduationCap className="h-[18px] w-[18px]" />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: 14 }}>
                      {diploma.title}
                    </span>
                    <span className={STATUS_CHIP[diploma.status]}>
                      <StatusIcon className="h-3 w-3" />
                      {STATUS_LABEL[diploma.status]}
                    </span>
                  </div>

                  {diplomaType && (
                    <span
                      className="k-chip k-chip-sm"
                      style={{ marginTop: 6 }}
                    >
                      {diplomaType}
                    </span>
                  )}

                  <div
                    className="k-caption"
                    style={{
                      marginTop: 6,
                      color: "var(--k-text-body)",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 12,
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Building2 className="h-3 w-3" />
                      {diploma.issuingOrg}
                    </span>
                    {year && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Calendar className="h-3 w-3" />
                        Obtenu en {year}
                      </span>
                    )}
                    {diploma.certificateNum && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Award className="h-3 w-3" />N° {diploma.certificateNum}
                      </span>
                    )}
                  </div>

                  {diploma.documents.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <button
                        type="button"
                        className="k-btn k-btn-secondary k-btn-sm"
                        onClick={() => handlePreview(diploma.documents[0])}
                      >
                        <FileText className="h-3 w-3" />
                        Voir le diplôme
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ProviderSection>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl w-full p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              {selectedDoc?.fileName || "Diplôme"}
            </DialogTitle>
          </DialogHeader>
          {selectedDoc && (
            <div className="relative min-h-[60vh] max-h-[80vh] overflow-auto">
              {selectedDoc.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <div className="relative w-full h-[60vh]">
                  <Image
                    src={selectedDoc.fileUrl}
                    alt={selectedDoc.fileName}
                    fill
                    className="object-contain"
                    sizes="100vw"
                  />
                </div>
              ) : selectedDoc.fileUrl.match(/\.pdf$/i) ? (
                <iframe
                  src={selectedDoc.fileUrl}
                  className="w-full h-[60vh]"
                  title={selectedDoc.fileName}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
                  <FileText className="h-16 w-16 mb-4" />
                  <p className="text-sm">
                    Impossible de prévisualiser ce document
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => window.open(selectedDoc.fileUrl, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ouvrir dans un nouvel onglet
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ProviderDiplomasSkeleton() {
  return (
    <div
      className="animate-k-shimmer"
      style={{ height: 220, borderRadius: "var(--k-r-lg)" }}
    />
  );
}
