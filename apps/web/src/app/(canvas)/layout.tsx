import { AuthCanvas } from "@/components/layout/AuthCanvas";

export default function CanvasLayout({ children }: { children: React.ReactNode }) {
  return <AuthCanvas>{children}</AuthCanvas>;
}
