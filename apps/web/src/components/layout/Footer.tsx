import Link from "next/link";
import { shellCopy } from "@/copy/shell";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="compact-footer">
      <div className="compact-footer-inner">
        <span className="footer-brand">
          <Logo size={28} />
          <span>© {new Date().getFullYear()}</span>
        </span>
        <nav aria-label={shellCopy.footer.nav}>
          <Link href="/contact">{shellCopy.footer.contact}</Link>
          <Link href="/confidentialite">{shellCopy.footer.privacy}</Link>
          <Link href="/cgu">{shellCopy.footer.terms}</Link>
        </nav>
      </div>
    </footer>
  );
}
