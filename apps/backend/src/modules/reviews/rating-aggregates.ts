import type { Prisma } from "@prisma/client";
import { roundRating } from "../../common/util/db";

type AggregateClient = Pick<Prisma.TransactionClient, "review" | "booking" | "provider">;

export async function recomputeProviderAggregates(
  client: AggregateClient,
  providerId: string,
): Promise<{ ratingAvg: number; ratingCount: number; completedJobs: number }> {
  const [ratings, completedJobs] = await Promise.all([
    client.review.aggregate({
      where: { providerId, isPublic: true },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    client.booking.count({ where: { providerId, status: "COMPLETED" } }),
  ]);
  const values = {
    ratingAvg: roundRating(ratings._avg.rating),
    ratingCount: ratings._count._all,
    completedJobs,
  };
  await client.provider.update({ where: { id: providerId }, data: values });
  return values;
}

export async function clientRatingSummary(
  client: Pick<Prisma.TransactionClient, "clientReview">,
  clientId: string,
): Promise<{ avg: number; count: number }> {
  const result = await client.clientReview.aggregate({
    where: { clientId },
    _avg: { rating: true },
    _count: { _all: true },
  });
  return { avg: roundRating(result._avg.rating), count: result._count._all };
}
