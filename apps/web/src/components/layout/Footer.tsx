"use client";

import Link from "next/link";
import Image from "next/image";

const columns: Array<{ title: string; links: Array<{ name: string; href: string }> }> = [
  {
    title: "Clients",
    links: [
      { name: "Trouver un pro", href: "/services" },
      { name: "Catégories", href: "/services" },
      { name: "Comment ça marche", href: "/#how-it-works" },
      { name: "Avis", href: "#" },
    ],
  },
  {
    title: "Pros",
    links: [
      { name: "Devenir pro", href: "/services" },
      { name: "Tarifs", href: "#" },
      { name: "Ressources", href: "#" },
      { name: "Communauté", href: "#" },
    ],
  },
  {
    title: "KAYOU",
    links: [
      { name: "À propos", href: "#" },
      { name: "Blog", href: "#" },
      { name: "Carrières", href: "#" },
      { name: "Contact", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer
      style={{
        background: "var(--k-surface)",
        borderTop: "1px solid var(--k-border)",
      }}
    >
      <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-10 px-5 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-10">
        <div>
          <Link href="/" className="mb-3.5 inline-flex items-center gap-2.5">
            <Image
              src="/kayou-logo-transparent.png"
              alt="KAYOU"
              width={28}
              height={28}
              className="h-7 w-auto"
            />
            <span
              style={{
                fontFamily: "var(--k-font-display)",
                fontWeight: 800,
                fontSize: 20,
                color: "var(--k-text-primary)",
              }}
            >
              KAYOU
            </span>
          </Link>
          <p className="k-body" style={{ color: "var(--k-text-muted)", maxWidth: 320, margin: 0 }}>
            Trouvez la bonne personne. Kinshasa · Brazzaville · Lubumbashi · Matadi · Pointe-Noire.
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <div className="k-overline" style={{ marginBottom: 12 }}>
              {col.title}
            </div>
            <div className="flex flex-col gap-2.5">
              {col.links.map((l) => (
                <Link
                  key={l.name}
                  href={l.href}
                  className="text-[14px]"
                  style={{ color: "var(--k-text-body)" }}
                >
                  {l.name}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{ borderTop: "1px solid var(--k-border)" }}
      >
        <div
          className="mx-auto flex max-w-[1240px] flex-col items-center justify-between gap-2 px-5 py-5 md:flex-row md:px-10"
          style={{ color: "var(--k-text-muted)" }}
        >
          <span className="k-caption">© {new Date().getFullYear()} KAYOU · Tous droits réservés</span>
          <span className="k-caption">Fait à Kinshasa, avec soin.</span>
        </div>
      </div>
    </footer>
  );
}
