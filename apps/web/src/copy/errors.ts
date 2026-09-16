import { ApiError } from "@kayu/api";
import type { ApiErrorCode } from "@kayu/schemas";

export const errorCopy: Record<ApiErrorCode, string> = {
  ACCOUNT_SUSPENDED: "Votre compte est suspendu.",
  FORBIDDEN: "Vous n'avez pas accès à cette ressource.",
  NOT_FOUND: "Introuvable. Cet élément n'existe plus ou n'est pas visible.",
  BLOCKED: "Cette action est impossible : l'un de vous a bloqué l'autre.",
  FEATURE_DISABLED: "Cette fonctionnalité est temporairement désactivée.",
  SELF_ACTION: "Vous ne pouvez pas effectuer cette action sur votre propre compte.",
  SLOT_TAKEN: "Ce créneau n'est plus disponible. Choisissez-en un autre.",
  PROVIDER_UNAVAILABLE: "Ce prestataire ne prend pas de réservations pour le moment.",
  INVALID_TRANSITION: "Cette action n'est plus possible dans l'état actuel.",
  REASON_REQUIRED: "Indiquez un motif pour continuer.",
  BOOKING_NOT_COMPLETED: "Vous pourrez laisser un avis une fois la prestation terminée.",
  ALREADY_EXISTS: "Cet élément existe déjà.",
  LAST_ADMIN: "Impossible : il s'agit du dernier administrateur actif.",
  ADMIN_ACCOUNT: "Un compte administrateur ne peut pas être supprimé depuis l'application.",
  ROLE_CHANGE_NOT_ALLOWED: "Ce changement de rôle n'est pas autorisé.",
  REFERENCED: "Cet élément est encore utilisé et ne peut pas être modifié ainsi.",
  INVALID_REFERENCE: "Une des valeurs choisies n'est pas valide.",
  INVALID_MEDIA: "Ce fichier ou ce lien n'est pas accepté.",
  DOCS_MISSING: "Des documents de vérification manquent.",
  RATE_LIMITED: "Trop de tentatives. Réessayez dans quelques minutes.",
  RECIPIENT_UNAVAILABLE: "Ce prestataire ne peut plus recevoir de messages.",
  LIMIT_REACHED: "Vous avez atteint la limite autorisée.",
};

export const genericErrorCopy = {
  network: "Connexion impossible. Vérifiez votre réseau et réessayez.",
  validation: "Certains champs sont invalides. Vérifiez le formulaire.",
  unauthorized: "Connectez-vous pour continuer.",
  unknown: "Une erreur est survenue. Réessayez.",
} as const;

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code && error.code in errorCopy) return errorCopy[error.code as ApiErrorCode];
    if (error.status === 400) return genericErrorCopy.validation;
    if (error.status === 401) return genericErrorCopy.unauthorized;
    return genericErrorCopy.unknown;
  }
  if (error instanceof TypeError) return genericErrorCopy.network;
  return genericErrorCopy.unknown;
}
