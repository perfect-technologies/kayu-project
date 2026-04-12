"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Award,
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

// Types based on schema
type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED" | "UNDER_REVIEW";

type DocType = "DIPLOMA" | "CERTIFICATE" | "LICENSE" | "INSURANCE" | "ID_DOCUMENT" | "WORK_PERMIT" | "OTHER";

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
  category?: {
    id: string;
    name: string;
  } | null;
}

interface ProviderCertificationsProps {
  certifications: Certification[];
}

const statusConfig: Record<VerificationStatus, { label: string; color: string; icon: React.ElementType; bgColor: string }> = {
  VERIFIED: {
    label: "Vérifié",
    color: "text-green-600",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    icon: CheckCircle2,
  },
  PENDING: {
    label: "En attente",
    color: "text-amber-600",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    icon: Clock,
  },
  UNDER_REVIEW: {
    label: "En cours",
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    icon: Clock,
  },
  REJECTED: {
    label: "Rejeté",
    color: "text-red-600",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    icon: XCircle,
  },
};

const docTypeLabels: Record<DocType, string> = {
  DIPLOMA: "Diplôme",
  CERTIFICATE: "Certificat",
  LICENSE: "Licence",
  INSURANCE: "Assurance",
  ID_DOCUMENT: "Pièce d'identité",
  WORK_PERMIT: "Permis de travail",
  OTHER: "Autre",
};

export function ProviderCertifications({ certifications }: ProviderCertificationsProps) {
  const [selectedDoc, setSelectedDoc] = useState<CertificationDoc | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  if (certifications.length === 0) {
    return null;
  }

  const handlePreview = (doc: CertificationDoc) => {
    setSelectedDoc(doc);
    setPreviewOpen(true);
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isExpired = (expiryDate: string | null | undefined) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  // Separate verified from others
  const verifiedCerts = certifications.filter((c) => c.status === "VERIFIED");

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Certifications
            <Badge variant="outline" className="ml-auto">
              {verifiedCerts.length} vérifié{verifiedCerts.length > 1 ? "s" : ""}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {certifications.map((cert) => {
              const config = statusConfig[cert.status];
              const StatusIcon = config.icon;
              const expired = !cert.isLifetime && isExpired(cert.expiryDate);

              return (
                <div
                  key={cert.id}
                  className={`p-4 rounded-lg border ${
                    cert.status === "VERIFIED" && !expired
                      ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Title and Status */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-sm truncate">{cert.title}</h4>
                        <Badge
                          variant="outline"
                          className={`${config.bgColor} ${config.color} border-0 text-xs`}
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                        {expired && (
                          <Badge
                            variant="outline"
                            className="bg-red-100 text-red-600 border-0 text-xs"
                          >
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Expiré
                          </Badge>
                        )}
                      </div>

                      {/* Issuing Organization */}
                      <div className="flex items-center gap-1.5 mt-2 text-muted-foreground text-sm">
                        <Building2 className="h-3.5 w-3.5" />
                        <span>{cert.issuingOrg}</span>
                      </div>

                      {/* Certificate Number */}
                      {cert.certificateNum && (
                        <div className="flex items-center gap-1.5 mt-1 text-muted-foreground text-sm">
                          <FileText className="h-3.5 w-3.5" />
                          <span>N° {cert.certificateNum}</span>
                        </div>
                      )}

                      {/* Dates */}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {cert.issueDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Délivré le {formatDate(cert.issueDate)}</span>
                          </div>
                        )}
                        {!cert.isLifetime && cert.expiryDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span className={expired ? "text-red-500" : ""}>
                              Expire le {formatDate(cert.expiryDate)}
                            </span>
                          </div>
                        )}
                        {cert.isLifetime && (
                          <Badge variant="outline" className="text-xs">
                            Validité permanente
                          </Badge>
                        )}
                      </div>

                      {/* Category */}
                      {cert.category && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                          {cert.category.name}
                        </Badge>
                      )}

                      {/* Rejection Reason */}
                      {cert.status === "REJECTED" && cert.rejectionReason && (
                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-600 dark:text-red-400">
                          <strong>Motif:</strong> {cert.rejectionReason}
                        </div>
                      )}

                      {/* Documents */}
                      {cert.documents.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {cert.documents.map((doc) => (
                            <Button
                              key={doc.id}
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handlePreview(doc)}
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              {docTypeLabels[doc.type]}
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Document Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl w-full p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {selectedDoc ? docTypeLabels[selectedDoc.type] : "Document"}
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
                  <p className="text-sm">Impossible de prévisualiser ce document</p>
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

// Skeleton version
export function ProviderCertificationsSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="h-6 w-32 bg-muted rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="p-4 rounded-lg border border-border">
              <div className="flex items-center gap-2">
                <div className="h-5 w-40 bg-muted rounded animate-pulse" />
                <div className="h-5 w-16 bg-muted rounded animate-pulse" />
              </div>
              <div className="h-4 w-32 bg-muted rounded animate-pulse mt-3" />
              <div className="h-3 w-48 bg-muted rounded animate-pulse mt-2" />
              <div className="flex gap-2 mt-3">
                <div className="h-7 w-20 bg-muted rounded animate-pulse" />
                <div className="h-7 w-20 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
