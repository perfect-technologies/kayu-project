import Link from "next/link";

import { Logo } from "@/components/layout/Logo";
import { cn } from "@/lib/utils";

export function CampaignHeader({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <header>
      <div
        className={cn(
          "mx-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 sm:px-6",
          className,
        )}
      >
        <Link
          href="/launch"
          aria-label={label}
          className="inline-flex min-h-11 items-center"
        >
          <Logo size={36} />
        </Link>
        {children}
      </div>
    </header>
  );
}
