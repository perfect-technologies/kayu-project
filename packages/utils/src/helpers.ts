import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with proper conflict resolution.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Truncate a UUID or long ID for display.
 * truncateId("a1b2c3d4-e5f6-...", 8) → "a1b2c3d4"
 */
export function truncateId(id: string, length = 8): string {
  return id.slice(0, length);
}

/**
 * Get initials from a full name.
 * getInitials("Jean Dupont") → "JD"
 */
export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase())
    .slice(0, 2)
    .join("");
}
