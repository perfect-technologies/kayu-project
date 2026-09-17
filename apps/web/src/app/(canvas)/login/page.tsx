import type { Metadata } from "next";
import { authCopy } from "@/copy/auth";
import { usableReturnTo } from "@/lib/auth-return-to";
import { LoginClient } from "./LoginClient";

export const metadata: Metadata = { title: authCopy.login.meta.title, description: authCopy.login.meta.description };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Page({ searchParams }: Props) {
  const params = await searchParams;
  const raw = params.returnTo;
  const returnTo = usableReturnTo(typeof raw === "string" ? raw : null);
  return <LoginClient returnTo={returnTo} />;
}
