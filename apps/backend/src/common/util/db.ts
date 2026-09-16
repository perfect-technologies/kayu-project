import { Prisma } from "@prisma/client";

type RawClient = {
  $queryRaw: (query: TemplateStringsArray | Prisma.Sql, ...values: unknown[]) => Promise<unknown>;
};

const LOCKABLE = ["Provider", "Booking", "Conversation", "User", "Review"] as const;

export async function lockRow(
  client: RawClient,
  table: (typeof LOCKABLE)[number],
  id: string,
): Promise<void> {
  await client.$queryRaw(
    Prisma.sql`SELECT id FROM ${Prisma.raw(`"${table}"`)} WHERE id = ${id} FOR UPDATE`,
  );
}

export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

export function roundRating(value: number | null | undefined): number {
  return Math.round((value ?? 0) * 10) / 10;
}
