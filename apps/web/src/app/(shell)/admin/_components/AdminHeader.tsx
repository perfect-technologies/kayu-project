import { adminCopy } from "@/copy/admin";
import { shellCopy } from "@/copy/shell";

/** Breadcrumb "Centre de contrôle / <section>", greeting and the "Accès sécurisé" pill on `sm+`. */
export function AdminHeader({ section }: { section: string }) {
  return (
    <header className="mb-6 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-muted-foreground">
          {shellCopy.admin.breadcrumb} / {section}
        </p>
        <h1 className="mt-1 text-xl font-extrabold text-foreground">{adminCopy.shell.greeting}</h1>
      </div>
      <span className="hidden shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 sm:block">
        {shellCopy.admin.secure}
      </span>
    </header>
  );
}
