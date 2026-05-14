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
        alignItems: "center",
        gap: 14,
        flexWrap: "wrap",
        marginBottom: 14,
      }}
    >
      <div style={{ flex: "1 1 auto", minWidth: 200 }}>
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "-0.015em",
            color: "var(--k-text-primary)",
            lineHeight: 1.15,
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
      <div style={{ marginLeft: "auto" }}>
        <AvailabilityChip
          isAvailable={props.isAvailable}
          zoneCity={props.zoneCity}
          zoneRadiusKm={props.zoneRadiusKm}
        />
      </div>

      <style jsx>{`
        @media (min-width: 768px) {
          :global(.k-pd-greet h1) {
            font-size: 26px;
          }
        }
        @media (max-width: 480px) {
          :global(.k-pd-greet) {
            flex-direction: column;
            align-items: flex-start;
          }
          :global(.k-pd-greet > div:last-child) {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </header>
  );
}
