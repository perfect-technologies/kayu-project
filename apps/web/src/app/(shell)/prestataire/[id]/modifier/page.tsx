import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ApiError, categoriesApi, identityApi, providersApi } from "@kayu/api";
import type { CategoryTreeNode, ProviderPublic } from "@kayu/schemas";
import { RequireOwnerOrAdmin } from "@/components/guards";
import { onboardingCopy } from "@/copy/onboarding";
import { createAuthenticatedServerApiClient } from "@/lib/api-server";
import { createServerApiClient } from "@/lib/api";
import { loginPath } from "@/lib/auth-redirects";
import { EditorClient } from "./EditorClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: onboardingCopy.editor.meta.title };

type Params = { params: Promise<{ id: string }> };

/** `/prestataire/me/modifier` resolves to the viewer's own provider id (or the wizard, or login). */
async function resolveMe(): Promise<string> {
  const client = await createAuthenticatedServerApiClient();
  let providerId: string | null | undefined;
  try {
    providerId = (await identityApi(client).me()).user.provider?.id ?? null;
  } catch {
    providerId = undefined;
  }
  if (providerId === undefined) return loginPath("/prestataire/me/modifier");
  return providerId ? `/prestataire/${encodeURIComponent(providerId)}/modifier` : "/prestataire/nouveau";
}

export default async function Page({ params }: Params) {
  const { id } = await params;
  if (id === "me") redirect(await resolveMe());

  const client = await createAuthenticatedServerApiClient();
  let provider: ProviderPublic;
  try {
    provider = await providersApi(client).getPublic(id);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 403)) notFound();
    throw error;
  }
  const tree = await categoriesApi(createServerApiClient())
    .getTree()
    .catch(() => ({ items: [] as CategoryTreeNode[] }));

  return (
    <RequireOwnerOrAdmin providerId={id}>
      <EditorClient initial={provider} tree={tree.items} />
    </RequireOwnerOrAdmin>
  );
}
