import type { Metadata } from "next";
import { authCopy } from "@/copy/auth";
import { usableReturnTo, type SignupIntent } from "@/lib/auth-return-to";
import { RegisterClient } from "./RegisterClient";

export const metadata: Metadata = { title: authCopy.register.meta.title, description: authCopy.register.meta.description };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Page({ searchParams }: Props) {
  const params = await searchParams;
  const raw = params.returnTo;
  const returnTo = usableReturnTo(typeof raw === "string" ? raw : null);
  // `/premium` and the "Devenir prestataire" links pre-select the provider intent with `?as=provider`.
  const initialIntent: SignupIntent | null = params.as === "provider" ? "provider" : params.as === "client" ? "client" : null;
  return <RegisterClient returnTo={returnTo} initialIntent={initialIntent} />;
}
