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

// Types based on schema
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

const diplomaTypes: Record<string, string> = {
  "BTS": "Brevet de Technicien Supérieur",
  "DUT": "Diplôme Universitaire de Technologie",
  "Licence": "Licence (Bac+3)",
  "Master": "Master (Bac+5)",
  "Doctorat": "Doctorat (Bac+8)",
  "CAP": "Certificat d'Aptitude Professionnelle",
  "BEP": "Brevet d'Études Professionnelles",
  "Bac Pro": "Baccalauréat Professionnel",
  "Bac": "Baccalauréat",
};

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

  const getYear = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    return new Date(dateStr).getFullYear();
  };

  const getDiplomaType = (title: string) => {
    for (const [key, value] of Object.entries(diplomaTypes)) {
      if (title.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }
    return null;
  };

  const verifiedCount = diplomas.filter((d) => d.status === "VERIFIED").length;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Diplômes & Formations
            <Badge variant="outline" className="ml-auto">
              {diplomas.length} diplôme{diplomas.length > 1 ? "s" : ""}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {diplomas.map((diploma) => {
              const config = statusConfig[diploma.status];
              const StatusIcon = config.icon;
              const year = getYear(diploma.issueDate);
              const diplomaType = getDiplomaType(diploma.title);

              return (
                <div
                  key={diploma.id}
                  className={`p-4 rounded-lg border ${
                    diploma.status === "VERIFIED"
                      ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Diploma Icon */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <GraduationCap className="h-6 w-6 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Title and Status */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold">{diploma.title}</h4>
                        <Badge
                          variant="outline"
                          className={`${config.bgColor} ${config.color} border-0 text-xs`}
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                      </div>

                      {/* Diploma Type Badge */}
                      {diplomaType && (
                        <Badge variant="secondary" className="mt-1.5 text-xs">
                          {diplomaType}
                        </Badge>
                      )}

                      {/* Institution */}
                      <div className="flex items-center gap-1.5 mt-2 text-muted-foreground text-sm">
                        <Building2 className="h-3.5 w-3.5" />
                        <span>{diploma.issuingOrg}</span>
                      </div>

                      {/* Year Obtained */}
                      {year && (
                        <div className="flex items-center gap-1.5 mt-1 text-muted-foreground text-sm">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Obtenu en {year}</span>
                        </div>
                      )}

                      {/* Certificate Number */}
                      {diploma.certificateNum && (
                        <div className="flex items-center gap-1.5 mt-1 text-muted-foreground text-sm">
                          <Award className="h-3.5 w-3.5" />
                          <span>N° {diploma.certificateNum}</span>
                        </div>
                      )}

                      {/* Document Preview Button */}
                      {diploma.documents.length > 0 && (
                        <div className="mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => handlePreview(diploma.documents[0])}
                          >
                            <FileText className="h-3.5 w-3.5 mr-1.5" />
                            Voir le diplôme
                            <ExternalLink className="h-3 w-3 ml-1.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          {verifiedCount > 0 && (
            <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>
                  {verifiedCount} diplôme{verifiedCount > 1 ? "s" : ""} vérifié{verifiedCount > 1 ? "s" : ""}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Preview Dialog */}
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
export function ProviderDiplomasSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="h-6 w-40 bg-muted rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="p-4 rounded-lg border border-border flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-48 bg-muted rounded animate-pulse" />
                <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                <div className="h-3 w-24 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
