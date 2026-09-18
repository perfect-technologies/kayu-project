import { NotFoundContent } from "../NotFoundContent";

// notFound() inside a (shell) page renders here, within the shell's Layout; the root not-found.tsx
// brings its own Layout for unmatched URLs and doubled the navbar when used from these pages.
export default function ShellNotFound() {
  return <NotFoundContent />;
}
