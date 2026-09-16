import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { privacyCopy } from "@/copy/legal";

/** Shared by /confidentialite and /delete-account (store listings need a stable deletion URL). */
export function PrivacyArticle() {
  const copy = privacyCopy;
  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-12">
      <ShieldCheck className="text-primary" size={36} aria-hidden />
      <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">{copy.title}</h1>
      <p className="mt-4 text-muted-foreground">{copy.editor}</p>
      {copy.sections.map((section) => (
        <section key={section.title} className="mt-8">
          <h2 className="text-xl font-bold">{section.title}</h2>
          <p className="mt-2 leading-relaxed text-muted-foreground">{section.body}</p>
        </section>
      ))}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/compte#supprimer" className="primary-action sm:w-auto">
          {copy.manage} <ArrowRight size={16} aria-hidden />
        </Link>
        <Link href="/contact" className="secondary-action">
          {copy.contact}
        </Link>
      </div>
    </article>
  );
}
