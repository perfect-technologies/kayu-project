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
  ShieldCheck,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  Building2,
  FileText,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import { ProviderSection } from "./ProviderSection";

type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED" | "UNDER_REVIEW";

type DocType =
  | "DIPLOMA"
  | "CERTIFICATE"
  | "LICENSE"
  | "INSURANCE"
  | "ID_DOCUMENT"
  | "WORK_PERMIT"
  | "OTHER";

interface CertificationDoc {
  id: string;
  type: DocType;
  fileUrl: string;
  fileName: string;
  uploadedAt: string;
}

interface Certification {
  id: string;
  title: string;
  issuingOrg: string;
  certificateNum?: string | null;
  status: VerificationStatus;
  issueDate?: string | null;
  expiryDate?: string | null;
  isLifetime: boolean;
  rejectionReason?: string | null;
  documents: CertificationDoc[];
  category?: { id: string; name: string } | null;
}

interface ProviderCertificationsProps {
  certifications: Certification[];
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

const DOC_TYPE_LABELS: Record<DocType, string> = {
  DIPLOMA: "Diplôme",
  CERTIFICATE: "Certificat",
  LICENSE: "Licence",
  INSURANCE: "Assurance",
  ID_DOCUMENT: "Pièce d'identité",
  WORK_PERMIT: "Permis de travail",
  OTHER: "Autre",
};

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function isExpired(expiryDate: string | null | undefined) {
  if (!expiryDate) return false;
  return new Date(expiryDate) < new Date();
}

export function ProviderCertifications({
  certifications,
}: ProviderCertificationsProps) {
  const [selectedDoc, setSelectedDoc] = useState<CertificationDoc | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  if (certifications.length === 0) {
    return null;
  }

  const handlePreview = (doc: CertificationDoc) => {
    setSelectedDoc(doc);
    setPreviewOpen(true);
  };

  const verifiedCount = certifications.filter((c) => c.status === "VERIFIED").length;

  return (
    <>
      <ProviderSection
        title="Certifications"
        subtitle={
          verifiedCount > 0
            ? `${verifiedCount} vérifiée${verifiedCount > 1 ? "s" : ""} par KAYOU`
            : undefined
        }
      >
        <div style={{ display: "grid", gap: 12 }}>
          {certifications.map((cert) => {
            const StatusIcon = STATUS_ICON[cert.status];
            const expired = !cert.isLifetime && isExpired(cert.expiryDate);
            const isVerified = cert.status === "VERIFIED" && !expired;

            return (
              <div
                key={cert.id}
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
                  <ShieldCheck className="h-[18px] w-[18px]" />
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
                      {cert.title}
                    </span>
                    <span className={STATUS_CHIP[cert.status]}>
                      <StatusIcon className="h-3 w-3" />
                      {STATUS_LABEL[cert.status]}
                    </span>
                    {expired && (
                      <span
                        className="k-chip k-chip-sm"
                        style={{
                          background: "var(--k-danger-subtle)",
                          color: "var(--k-danger)",
                        }}
                      >
                        <AlertCircle className="h-3 w-3" />
                        Expiré
                      </span>
                    )}
                  </div>

                  <div
                    className="k-caption"
                    style={{
                      marginTop: 4,
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
                      {cert.issuingOrg}
                    </span>
                    {cert.certificateNum && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <FileText className="h-3 w-3" />N° {cert.certificateNum}
                      </span>
                    )}
                    {cert.issueDate && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Calendar className="h-3 w-3" />
                        Délivré {formatDate(cert.issueDate)}
                      </span>
                    )}
                    {!cert.isLifetime && cert.expiryDate && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          color: expired ? "var(--k-danger)" : undefined,
                        }}
                      >
                        <Calendar className="h-3 w-3" />
                        Expire {formatDate(cert.expiryDate)}
                      </span>
                    )}
                    {cert.isLifetime && (
                      <span className="k-chip k-chip-sm">
                        Validité permanente
                      </span>
                    )}
                  </div>

                  {cert.category && (
                    <span
                      className="k-chip k-chip-sm"
                      style={{ marginTop: 8 }}
                    >
                      {cert.category.name}
                    </span>
                  )}

                  {cert.status === "REJECTED" && cert.rejectionReason && (
                    <div
                      className="k-caption"
                      style={{
                        marginTop: 8,
                        padding: "8px 10px",
                        borderRadius: "var(--k-r-sm)",
                        background: "var(--k-danger-subtle)",
                        color: "var(--k-danger)",
                      }}
                    >
                      <strong>Motif :</strong> {cert.rejectionReason}
                    </div>
                  )}

                  {cert.documents.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 6,
                        marginTop: 10,
                      }}
                    >
                      {cert.documents.map((doc) => (
                        <button
                          key={doc.id}
                          type="button"
                          className="k-btn k-btn-secondary k-btn-sm"
                          onClick={() => handlePreview(doc)}
                        >
                          <FileText className="h-3 w-3" />
                          {DOC_TYPE_LABELS[doc.type]}
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      ))}
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
              <FileText className="h-5 w-5 text-primary" />
              {selectedDoc ? DOC_TYPE_LABELS[selectedDoc.type] : "Document"}
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

export function ProviderCertificationsSkeleton() {
  return (
    <div
      className="animate-k-shimmer"
      style={{ height: 220, borderRadius: "var(--k-r-lg)" }}
    />
  );
}
