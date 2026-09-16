import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileText, ShieldCheck } from "lucide-react";
import { cguCopy } from "@/copy/legal";
import { PrintButton } from "./PrintButton";

export const metadata: Metadata = {
  title: cguCopy.meta.title,
  description: cguCopy.meta.description,
};

const PRINT_CSS = `@media print { .app-shell > header, .mobile-dock, .compact-footer, .legal-print-hide { display: none !important; } .app-shell { padding-bottom: 0 !important; } }`;

export default function Page() {
  const copy = cguCopy;
  return (
    <div className="mesh-bg min-h-full">
      <style>{PRINT_CSS}</style>
      <div className="mobile-page max-w-3xl sm:py-10">
        <Link href="/" className="legal-print-hide inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-muted-foreground transition hover:text-primary">
          <ArrowLeft size={16} aria-hidden /> {copy.back}
        </Link>

        <header className="mt-6 rounded-3xl border border-border bg-white p-5 shadow-soft sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-700 text-white shadow-brand sm:size-12">
              <ShieldCheck size={20} aria-hidden />
            </span>
            <div className="min-w-0">
              <h1 className="text-lg leading-tight font-extrabold tracking-tight text-foreground sm:text-2xl">{copy.title}</h1>
              <p className="text-xs text-muted-foreground sm:text-sm">{copy.editorLine}</p>
            </div>
          </div>
          <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
            <FileText size={13} aria-hidden /> {copy.editorLabel} {copy.editorLine}
          </p>
          <div className="legal-print-hide">
            <PrintButton />
          </div>
        </header>

        <div className="mt-6 space-y-5">
          {copy.sections.map((section) => (
            <section key={section.n} className="rounded-2xl border border-border bg-white p-4 shadow-soft sm:p-6">
              <h2 className="flex items-start gap-2.5 text-sm font-extrabold text-foreground sm:text-base">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary sm:size-7">
                  {section.n}
                </span>
                <span className="min-w-0 leading-tight">{section.title}</span>
              </h2>
              <div className="mt-3 space-y-2.5 text-sm leading-relaxed text-muted-foreground sm:space-y-3">
                {section.paragraphs.map((paragraph, index) => (
                  <p key={index} className="hyphens-auto">
                    {paragraph}
                  </p>
                ))}
                {"bullets" in section && section.bullets && (
                  <ul className="list-disc space-y-1.5 pl-5 marker:text-primary">
                    {section.bullets.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">{copy.copyright(new Date().getFullYear())}</p>
      </div>
    </div>
  );
}
