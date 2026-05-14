"use client";

interface Step { label: string; shortLabel?: string; }
interface Props {
  steps: Step[];
  current: number;
}

export function BookingStepper({ steps, current }: Props) {
  return (
    <div className="flex gap-1.5 px-4 pb-3 pt-1 md:gap-2.5 md:px-7">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex-1">
            <div
              style={{
                height: 3,
                borderRadius: 2,
                background: done || active ? "var(--k-primary)" : "var(--k-border)",
                transition: "background 200ms",
              }}
            />
            <div
              className="mt-1.5 text-[10px] font-semibold uppercase tracking-wide md:mt-2 md:text-[11px]"
              style={{ color: active ? "var(--k-text-primary)" : "var(--k-text-muted)" }}
            >
              <span className="md:hidden">{i + 1} · {s.shortLabel ?? s.label.split(" ")[0]}</span>
              <span className="hidden md:inline">{i + 1} · {s.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
