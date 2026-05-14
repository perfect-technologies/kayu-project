import Link from "next/link";
import { I } from "@kayu/ui/web";

const STARTERS = [
  { slug: "coiffure", label: "Coiffure", Icon: I.scissors },
  { slug: "menage", label: "Ménage", Icon: I.sparkles },
  { slug: "plomberie", label: "Plomberie", Icon: I.wrench },
  { slug: "electricite", label: "Électricité", Icon: I.zap },
];

export function CategoryTilesRow() {
  return (
    <div
      className="k-cd-cat-row"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 8,
        marginTop: 16,
      }}
    >
      {STARTERS.map((c) => (
        <Link
          key={c.slug}
          href={`/services?category=${c.slug}`}
          style={{
            background: "#F8FAFC",
            border: "1px solid transparent",
            borderRadius: 10,
            padding: 10,
            textAlign: "center",
            textDecoration: "none",
            color: "var(--k-text-primary)",
          }}
        >
          <span
            style={{
              width: 32,
              height: 32,
              background: "#fff",
              border: "1px solid var(--k-border)",
              borderRadius: 999,
              margin: "0 auto 6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <c.Icon size={14} />
          </span>
          <span style={{ fontSize: 10.5, fontWeight: 600 }}>{c.label}</span>
        </Link>
      ))}
      <style jsx>{`
        @media (max-width: 480px) {
          .k-cd-cat-row {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
