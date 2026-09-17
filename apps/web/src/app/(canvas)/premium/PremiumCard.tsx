"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { premiumCopy } from "@/copy/premium";

/** Centred auth-card: the CTA points to the wizard, or to the space when the viewer is already a provider. */
export function PremiumCard() {
  const { user } = useAuth();
  const isProvider = user?.role === "PROVIDER" && user.provider !== null;
  return (
    <div className="text-center">
      <Sparkles className="mx-auto text-amber-500" size={40} aria-hidden />
      <h1 className="mt-5 text-2xl font-extrabold tracking-tight sm:text-3xl">{premiumCopy.title}</h1>
      <p className="mt-4 leading-relaxed text-muted-foreground">{premiumCopy.body}</p>
      <Link href={isProvider ? "/mon-espace" : "/prestataire/nouveau"} className="primary-action mt-7">
        {isProvider ? premiumCopy.ctaSpace : premiumCopy.ctaCreate}
        <ArrowRight size={18} aria-hidden />
      </Link>
    </div>
  );
}
