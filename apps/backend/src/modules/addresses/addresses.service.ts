import { HttpStatus, Injectable } from "@nestjs/common";
import type { Address, Prisma } from "@prisma/client";
import type { Actor } from "../../common/auth/types";
import type {
  AddressesQuery,
  CreateAddressInput,
  UpdateAddressInput,
} from "../../common/contract";
import { apiError, notFound } from "../../common/http/errors";
import { pageArgs, toPage } from "../../common/http/pagination";
import { PrismaService } from "../../database/prisma.service";
import { PlaceTreeService, type PlaceSummary } from "../places/place-tree.service";

const MAX_ADDRESSES = 20;
const COUNTRY_LABELS = new Set(["RDC", "Congo"]);

@Injectable()
export class AddressesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly places: PlaceTreeService,
  ) {}

  async list(actor: Actor, query: AddressesQuery) {
    const where = { userId: actor.id };
    const [total, rows] = await Promise.all([
      this.prisma.address.count({ where }),
      this.prisma.address.findMany({
        where,
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }, { id: "asc" }],
        ...pageArgs(query),
      }),
    ]);
    const chains = await this.places.chains(rows.map((row) => row.placeId));
    return toPage(
      rows.map((row) => this.toItem(row, chains.get(row.placeId ?? "") ?? [])),
      total,
      query,
    );
  }

  async create(actor: Actor, input: CreateAddressInput) {
    const chain = input.placeId ? await this.places.assertSelectable(input.placeId) : [];
    const country = input.country ?? this.countryFromChain(chain) ?? "RDC";

    const address = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.address.count({ where: { userId: actor.id } });
      if (existing >= MAX_ADDRESSES) {
        throw apiError(
          HttpStatus.CONFLICT,
          "LIMIT_REACHED",
          `${MAX_ADDRESSES} adresses maximum`,
        );
      }
      const isDefault = existing === 0 || input.isDefault === true;
      if (isDefault) await this.demoteDefaults(tx, actor.id);
      return tx.address.create({
        data: {
          userId: actor.id,
          label: input.label,
          recipient: input.recipient ?? null,
          addressLine: input.addressLine,
          placeId: input.placeId ?? null,
          country,
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,
          isDefault,
        },
      });
    });
    return this.toItem(address, chain);
  }

  async update(actor: Actor, id: string, input: UpdateAddressInput) {
    await this.findOwned(actor.id, id);
    const chain = input.placeId ? await this.places.assertSelectable(input.placeId) : null;

    const data: Prisma.AddressUncheckedUpdateInput = {};
    if (input.label !== undefined) data.label = input.label;
    if (input.recipient !== undefined) data.recipient = input.recipient;
    if (input.addressLine !== undefined) data.addressLine = input.addressLine;
    if (input.placeId !== undefined) data.placeId = input.placeId;
    if (input.country !== undefined) data.country = input.country;
    if (input.latitude !== undefined) data.latitude = input.latitude;
    if (input.longitude !== undefined) data.longitude = input.longitude;
    if (input.isDefault !== undefined) data.isDefault = input.isDefault;

    const address = await this.prisma.$transaction(async (tx) => {
      if (input.isDefault === true) await this.demoteDefaults(tx, actor.id);
      return tx.address.update({ where: { id }, data });
    });
    return this.toItem(address, chain ?? (await this.places.chain(address.placeId)));
  }

  async remove(actor: Actor, id: string) {
    const address = await this.findOwned(actor.id, id);
    await this.prisma.$transaction(async (tx) => {
      await tx.address.delete({ where: { id } });
      if (!address.isDefault) return;
      const next = await tx.address.findFirst({
        where: { userId: actor.id },
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        select: { id: true },
      });
      if (next) await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
    });
    return { ok: true as const };
  }

  private async findOwned(userId: string, id: string): Promise<Address> {
    const address = await this.prisma.address.findFirst({ where: { id, userId } });
    if (!address) throw notFound("Adresse introuvable");
    return address;
  }

  private demoteDefaults(tx: Prisma.TransactionClient, userId: string) {
    return tx.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  private countryFromChain(chain: PlaceSummary[]): string | null {
    const root = chain[0];
    return root?.kind === "COUNTRY" && COUNTRY_LABELS.has(root.label) ? root.label : null;
  }

  private toItem(address: Address, placeChain: PlaceSummary[]) {
    return {
      id: address.id,
      label: address.label,
      recipient: address.recipient,
      addressLine: address.addressLine,
      placeId: address.placeId,
      placeChain,
      country: address.country,
      latitude: address.latitude,
      longitude: address.longitude,
      isDefault: address.isDefault,
      createdAt: address.createdAt,
      updatedAt: address.updatedAt,
    };
  }
}
