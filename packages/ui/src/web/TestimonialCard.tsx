"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { tokens } from "../tokens.js";

export type Testimonial = {
  initials: string;
  name: string;
  role: string;
  rating: number;
  quote: string;
};

export type TestimonialCardProps = {
  data: Testimonial;
};

export const TestimonialCard: React.FC<TestimonialCardProps> = ({ data }) => (
  <div
    style={{
      background: tokens.color.surface,
      border: `1px solid ${tokens.color.border}`,
      borderRadius: 16,
      padding: 24,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, color: tokens.color.warning }}>
      {Array.from({ length: Math.round(data.rating) }).map((_, i) => (
        <Star key={i} size={14} fill="currentColor" stroke="none" />
      ))}
    </div>
    <p
      style={{
        fontSize: 14,
        color: tokens.color.textBody,
        lineHeight: 1.55,
        margin: "0 0 18px 0",
      }}
    >
      "{data.quote}"
    </p>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "#F5F2E9",
          color: tokens.color.textMuted,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: tokens.font.mono,
          fontWeight: 700,
          fontSize: 14,
          flexShrink: 0,
        }}
      >
        {data.initials}
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: 13, color: tokens.color.textPrimary }}>{data.name}</div>
        <div style={{ fontSize: 11, color: tokens.color.textMuted }}>{data.role}</div>
      </div>
    </div>
  </div>
);
