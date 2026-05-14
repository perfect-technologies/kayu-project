"use client";

import { CheckCircle2, FileText, Clock } from "lucide-react";
import { ProviderSection } from "./ProviderSection";

type Status = "PENDING" | "VERIFIED" | "REJECTED" | "UNDER_REVIEW";

interface Credential {
  id: string;
  title: string;
  issuingOrg: string;
  issueDate?: string | null;
  expiryDate?: string | null;
  isLifetime?: boolean;
  status: Status;
  documents: Array<{ id: string; fileUrl: string; fileName: string }>;
}

interface ProviderCredentialsProps {
  diplomas: Credential[];
  certifications: Credential[];
}

export function ProviderCredentials({ diplomas, certifications }: ProviderCredentialsProps) {
  if (diplomas.length === 0 && certifications.length === 0) return null;

  return (
    <ProviderSection title="Crédentiels">
      {diplomas.length > 0 && (
        <CredentialGroup title="Diplômes" items={diplomas} kind="diploma" />
      )}
      {certifications.length > 0 && (
        <div style={{ marginTop: diplomas.length > 0 ? 16 : 0 }}>
          <CredentialGroup title="Certifications" items={certifications} kind="certification" />
        </div>
      )}
    </ProviderSection>
  );
}

function CredentialGroup({
  title,
  items,
  kind,
}: {
  title: string;
  items: Credential[];
  kind: "diploma" | "certification";
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "var(--k-text-muted)",
          fontWeight: 600,
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      {items.map((item, idx) => (
        <CredentialRow key={item.id} item={item} kind={kind} isFirst={idx === 0} />
      ))}
    </div>
  );
}

function CredentialRow({
  item,
  kind,
  isFirst,
}: {
  item: Credential;
  kind: "diploma" | "certification";
  isFirst: boolean;
}) {
  const issueYear = item.issueDate ? new Date(item.issueDate).getFullYear() : null;
  const expiryYear = item.expiryDate ? new Date(item.expiryDate).getFullYear() : null;

  let dateLine: string;
  if (kind === "diploma") {
    dateLine = issueYear ? `${item.issuingOrg} · ${issueYear}` : item.issuingOrg;
  } else {
    if (item.isLifetime) dateLine = `${item.issuingOrg} · à vie`;
    else if (expiryYear) dateLine = `${item.issuingOrg} · expire en ${expiryYear}`;
    else if (issueYear) dateLine = `${item.issuingOrg} · ${issueYear}`;
    else dateLine = item.issuingOrg;
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 0",
        borderTop: isFirst ? "none" : "1px solid var(--k-border-subtle)",
        gap: 12,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: "var(--k-text-primary)" }}>{item.title}</div>
        <div style={{ fontSize: 12, color: "var(--k-text-muted)", marginTop: 2 }}>{dateLine}</div>
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
        <StatusBadge status={item.status} />
        {item.documents[0] && (
          <a
            href={item.documents[0].fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "var(--k-primary-hover)",
              fontSize: 11,
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <FileText className="h-3 w-3" aria-hidden="true" /> Voir
          </a>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  if (status === "VERIFIED") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 3,
          fontSize: 11,
          color: "var(--k-success)",
          background: "var(--k-success-subtle)",
          padding: "2px 7px",
          borderRadius: 99,
          fontWeight: 600,
        }}
      >
        <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Vérifié
      </span>
    );
  }
  if (status === "PENDING" || status === "UNDER_REVIEW") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 3,
          fontSize: 11,
          color: "var(--k-text-muted)",
          background: "var(--k-surface-muted)",
          padding: "2px 7px",
          borderRadius: 99,
          fontWeight: 500,
        }}
      >
        <Clock className="h-3 w-3" aria-hidden="true" /> En attente
      </span>
    );
  }
  return null;
}
