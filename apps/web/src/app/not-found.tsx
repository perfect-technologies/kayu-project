import Link from "next/link";
import { Layout } from "@/components/layout/Layout";
import { shellCopy } from "@/copy/shell";

export default function NotFound() {
  const copy = shellCopy.notFound;
  return (
    <Layout>
      <div className="mobile-page max-w-3xl">
        <p className="text-[10px] font-extrabold tracking-[.19em] text-muted-foreground uppercase">{copy.eyebrow}</p>
        <h1 className="mt-2">{copy.title}</h1>
        <p className="mt-2 text-muted-foreground">{copy.description}</p>
        <div className="empty-state mt-6">
          <Link href="/" className="secondary-action">
            {copy.action}
          </Link>
        </div>
      </div>
    </Layout>
  );
}
