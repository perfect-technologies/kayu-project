import Link from "next/link";
import { shellCopy } from "@/copy/shell";
import { cn } from "@/lib/utils";

/** Stand-in for screens owned by workstreams 05–08; deleted as each real screen lands. */
export function RoutePlaceholder({
  title,
  workstream,
  container = "max-w-3xl",
  children,
}: {
  title: string;
  workstream: "05" | "06" | "07" | "08";
  container?: string;
  children?: React.ReactNode;
}) {
  const copy = shellCopy.placeholder;
  return (
    <div className={cn("mobile-page", container)}>
      <p className="text-[10px] font-extrabold tracking-[.19em] text-muted-foreground uppercase">{copy.eyebrow}</p>
      <h1 className="mt-2">{title}</h1>
      <p className="mt-2 text-muted-foreground">{copy.description(workstream)}</p>
      {children}
      <div className="empty-state mt-6">
        <Link href="/" className="secondary-action">
          {copy.back}
        </Link>
      </div>
    </div>
  );
}
