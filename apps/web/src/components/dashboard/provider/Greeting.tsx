"use client";

import { TrustChip } from "@kayu/ui/web";
import { AvailabilityChip } from "./AvailabilityChip";

export type GreetingProps = {
  firstName: string;
  rating: number;
  totalJobs: number;
  trust: "NEWCOMER" | "ESTABLISHED" | "TRUSTED" | "EXPERT";
  isAvailable: boolean;
  zoneCity: string;
  zoneRadiusKm: number;
};

export function Greeting(props: GreetingProps) {
  return (
    <header
      className="k-pd-greet"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 10,
        textAlign: "left",
        marginBottom: 14,
      }}
    >
      <div>
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "-0.015em",
            color: "var(--k-text-primary)",
            lineHeight: 1.15,
            textAlign: "left",
          }}
        >
          Bonjour {props.firstName}
        </h1>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 4,
            fontSize: 12,
            color: "var(--k-text-muted)",
            flexWrap: "wrap",
            textAlign: "left",
          }}
        >
          <span style={{ color: "#F59E0B", fontWeight: 700 }}>★</span>
          <span style={{ color: "var(--k-text-primary)", fontWeight: 600 }}>
            {props.rating.toFixed(1)}
          </span>
          <span>· {props.totalJobs} missions</span>
          <span>·</span>
          <TrustChip trust={props.trust} />
        </div>
      </div>
      <AvailabilityChip
        isAvailable={props.isAvailable}
        zoneCity={props.zoneCity}
        zoneRadiusKm={props.zoneRadiusKm}
      />

      <style jsx>{`
        @media (min-width: 768px) {
          :global(.k-pd-greet) {
            flex-direction: row !important;
            align-items: center !important;
            gap: 14px !important;
          }
          :global(.k-pd-greet > div:first-child) {
            flex: 1 1 auto;
            min-width: 0;
          }
          :global(.k-pd-greet h1) {
            font-size: 26px;
          }
        }
      `}</style>
    </header>
  );
}
