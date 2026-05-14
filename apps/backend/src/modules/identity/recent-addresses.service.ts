import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

export interface RecentAddressItem {
  commune: string | null;
  street: string | null;
  raw: string;
  lastUsedAt: string;
}

function parseStreet(raw: string, commune: string | null): string | null {
  if (!raw) return null;
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  const filtered = parts.filter(
    (p) => p.toLowerCase() !== "kinshasa" && p.toLowerCase() !== (commune ?? "").toLowerCase(),
  );
  return filtered.length > 0 ? filtered.join(", ") : null;
}

@Injectable()
export class RecentAddressesService {
  constructor(private readonly prisma: PrismaService) {}

  async findForClient(clientId: string, limit: number): Promise<RecentAddressItem[]> {
    const rows = await this.prisma.booking.findMany({
      where: { clientId, address: { not: null } },
      select: { address: true, commune: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    const seen = new Set<string>();
    const out: RecentAddressItem[] = [];
    for (const r of rows) {
      if (out.length >= limit) break;
      const raw = (r.address ?? "").trim();
      if (!raw) continue;
      const dedupKey = `${raw}|${r.commune ?? ""}`;
      if (seen.has(dedupKey)) continue;
      seen.add(dedupKey);
      out.push({
        commune: r.commune ?? null,
        street: parseStreet(raw, r.commune),
        raw,
        lastUsedAt: r.createdAt.toISOString(),
      });
    }
    return out;
  }
}
