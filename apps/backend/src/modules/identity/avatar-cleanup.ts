import type { StorageService } from "../storage/storage.service";

// The account avatar may also be reused as the provider profile photo; keep the object then.
export async function releasePreviousAvatar(params: {
  storage: StorageService;
  userId: string;
  previousUrl: string | null | undefined;
  nextUrl: string | null | undefined;
  providerPhoto: string | null | undefined;
}): Promise<void> {
  const { storage, previousUrl, nextUrl, providerPhoto, userId } = params;
  if (!previousUrl || previousUrl === nextUrl || previousUrl === providerPhoto) return;
  const object = storage.objectFromUrl(previousUrl);
  if (object?.purpose !== "avatar") return;
  await storage.removeObjects([object], userId).catch(() => undefined);
}
