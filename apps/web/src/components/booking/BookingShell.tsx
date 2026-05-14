"use client";

import { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Layout } from "@/components/layout";
import { BookingStepper } from "./BookingStepper";

interface Props {
  title: string;
  steps: Array<{ label: string; shortLabel?: string }>;
  currentStep: number;
  onBack: () => void;
  main: ReactNode;
  aside?: ReactNode;
  bottomBar?: ReactNode;
}

export function BookingShell({ title, steps, currentStep, onBack, main, aside, bottomBar }: Props) {
  return (
    <Layout>
      <div style={{ background: "var(--k-bg)", minHeight: "100%" }}>
        <div className="mx-auto max-w-[1100px] pt-3 md:pt-6">
          <div className="flex items-center gap-2.5 px-4 md:px-7">
            <button
              onClick={onBack}
              aria-label="Retour"
              className="flex h-9 w-9 items-center justify-center rounded-full md:h-10 md:w-10"
              style={{
                border: "1px solid var(--k-border)",
                background: "var(--k-surface)",
                color: "var(--k-text-primary)",
              }}
            >
              <ArrowLeft className="h-[18px] w-[18px]" />
            </button>
            <h1 className="k-display-m" style={{ margin: 0, fontSize: "clamp(17px, 2.2vw, 22px)" }}>
              {title}
            </h1>
          </div>
          <BookingStepper steps={steps} current={currentStep} />
          <div className="grid gap-6 px-4 pb-6 md:grid-cols-[1fr_320px] md:px-7">
            <main>{main}</main>
            {aside && <aside className="hidden self-start sticky top-5 md:block">{aside}</aside>}
          </div>
        </div>
        {bottomBar}
      </div>
    </Layout>
  );
}
