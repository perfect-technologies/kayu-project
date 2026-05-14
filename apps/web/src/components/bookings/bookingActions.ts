// apps/web/src/components/bookings/bookingActions.ts
import type { V2Status } from "@/lib/booking-v2";

export type Perspective = "client" | "pro";

export type BookingActionsInput = {
  v2Status: V2Status;
  backendStatus: string;
  isPaid: boolean;
  isClient: boolean;
  hasOffer: boolean;
  reviewed: boolean;
  counterpartyFirstName: string;
};

export type BookingActionId =
  | "message"
  | "messageNamed"
  | "cancel"
  | "rebook"
  | "review"
  | "confirmBooking"
  | "completeBooking"
  | "confirmPayment"
  | "createAccord"
  | "adjustAccord";

export type BookingAction = {
  id: BookingActionId;
  label: string;
  variant: "primary" | "secondary" | "ghost-danger";
  icon?: "messageCircle" | "check" | "coins" | "star" | "pencil";
};

export type BookingActions = {
  primary: BookingAction | null;
  secondary: BookingAction | null;
  destructive: BookingAction | null;
};

const messageNamed = (firstName: string): BookingAction => ({
  id: "messageNamed",
  label: firstName ? `Message à ${firstName}` : "Message",
  variant: "primary",
  icon: "messageCircle",
});

const messageSecondary: BookingAction = {
  id: "message",
  label: "Message",
  variant: "secondary",
  icon: "messageCircle",
};

const cancelGhost: BookingAction = {
  id: "cancel",
  label: "Annuler la réservation",
  variant: "ghost-danger",
};

const cancelGhostShort: BookingAction = {
  id: "cancel",
  label: "Annuler",
  variant: "ghost-danger",
};

export function deriveBookingActions(input: BookingActionsInput): BookingActions {
  const {
    v2Status,
    backendStatus,
    isPaid,
    isClient,
    hasOffer,
    reviewed,
    counterpartyFirstName: firstName,
  } = input;

  if (v2Status === "upcoming") {
    if (backendStatus === "PENDING") {
      if (isClient) {
        return {
          primary: messageNamed(firstName),
          secondary: null,
          destructive: cancelGhostShort,
        };
      }
      return {
        primary: {
          id: "confirmBooking",
          label: "Confirmer la réservation",
          variant: "primary",
          icon: "check",
        },
        secondary: hasOffer
          ? { id: "adjustAccord", label: "Ajuster l'accord", variant: "secondary", icon: "pencil" }
          : { id: "createAccord", label: "Enregistrer l'accord", variant: "secondary", icon: "coins" },
        destructive: null,
      };
    }
    if (backendStatus === "CONFIRMED") {
      if (isClient) {
        return {
          primary: messageNamed(firstName),
          secondary: null,
          destructive: cancelGhostShort,
        };
      }
      return {
        primary: {
          id: "completeBooking",
          label: "Marquer comme terminée",
          variant: "primary",
          icon: "check",
        },
        secondary: { id: "adjustAccord", label: "Ajuster l'accord", variant: "secondary", icon: "pencil" },
        destructive: null,
      };
    }
    // IN_PROGRESS or unknown upcoming
    if (isClient) {
      return { primary: messageNamed(firstName), secondary: null, destructive: null };
    }
    return {
      primary: {
        id: "completeBooking",
        label: "Marquer comme terminée",
        variant: "primary",
        icon: "check",
      },
      secondary: messageSecondary,
      destructive: null,
    };
  }

  if (v2Status === "completed") {
    if (!isPaid) {
      if (isClient) {
        return { primary: messageSecondary, secondary: null, destructive: null };
      }
      return {
        primary: {
          id: "confirmPayment",
          label: "Confirmer le paiement reçu",
          variant: "primary",
          icon: "coins",
        },
        secondary: messageSecondary,
        destructive: null,
      };
    }
    // paid
    if (isClient && !reviewed) {
      return {
        primary: { id: "review", label: "Laisser un avis", variant: "primary", icon: "star" },
        secondary: messageSecondary,
        destructive: null,
      };
    }
    if (isClient && reviewed) {
      return {
        primary: { id: "rebook", label: "Réserver à nouveau", variant: "primary" },
        secondary: messageSecondary,
        destructive: null,
      };
    }
    // provider, paid
    return { primary: messageSecondary, secondary: null, destructive: null };
  }

  // cancelled
  if (isClient) {
    return {
      primary: { id: "rebook", label: "Réserver à nouveau", variant: "primary" },
      secondary: messageSecondary,
      destructive: null,
    };
  }
  return { primary: messageSecondary, secondary: null, destructive: null };
}
