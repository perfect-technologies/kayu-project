import * as React from "react";
import { BadgeCheck, ShieldCheck } from "lucide-react-native";
import { Chip } from "./Chip.js";
import { tokens } from "../tokens.js";

export type TrustLevel =
  | "NEWCOMER"
  | "ESTABLISHED"
  | "TRUSTED"
  | "EXPERT"
  | "TOP_RATED";

export type TrustChipProps = {
  trust: TrustLevel;
  size?: "sm" | "md";
};

export const TrustChip: React.FC<TrustChipProps> = ({ trust, size = "sm" }) => {
  switch (trust) {
    case "TOP_RATED":
      return null;
    case "NEWCOMER":
      return (
        <Chip variant="neutral" size={size}>
          Nouveau
        </Chip>
      );
    case "ESTABLISHED":
      return (
        <Chip variant="neutral" size={size}>
          Établi
        </Chip>
      );
    case "TRUSTED":
      return (
        <Chip
          variant="success"
          size={size}
          leadingIcon={
            <BadgeCheck size={12} color="#047857" strokeWidth={2} />
          }
        >
          De confiance
        </Chip>
      );
    case "EXPERT":
      return (
        <Chip
          variant="expert"
          size={size}
          leadingIcon={
            <ShieldCheck size={12} color={tokens.color.expert} strokeWidth={2} />
          }
        >
          Expert
        </Chip>
      );
    default:
      return null;
  }
};
