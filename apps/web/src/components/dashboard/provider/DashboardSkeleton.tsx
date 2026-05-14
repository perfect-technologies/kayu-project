"use client";

export function DashboardSkeleton() {
  return (
    <div style={{ padding: "12px 16px 32px", maxWidth: 1080, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <Block h={22} w={180} />
          <Block h={12} w={220} style={{ marginTop: 6 }} />
        </div>
        <Block h={26} w={140} r={999} />
      </div>

      <Block h={210} style={{ marginBottom: 14 }} r={14} />

      <Block h={140} style={{ marginBottom: 14 }} r={14} />

      <div className="k-pd-skel-grid" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14, marginBottom: 14 }}>
        <Block h={150} r={14} />
        <Block h={150} r={14} />
      </div>

      <Block h={170} style={{ marginBottom: 14 }} r={14} />

      <Block h={110} r={14} />

      <style jsx>{`
        @media (max-width: 768px) {
          :global(.k-pd-skel-grid) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

function Block({
  w,
  h,
  r = 8,
  style,
}: {
  w?: number | string;
  h?: number | string;
  r?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: w ?? "100%",
        height: h ?? 16,
        borderRadius: r,
        background:
          "linear-gradient(90deg, rgba(148,163,184,0.12), rgba(148,163,184,0.22), rgba(148,163,184,0.12))",
        backgroundSize: "200% 100%",
        animation: "kayu-shimmer 1600ms linear infinite",
        ...style,
      }}
    />
  );
}
