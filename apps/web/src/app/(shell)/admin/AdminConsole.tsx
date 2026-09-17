"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { AdminRail } from "@/components/layout/AdminRail";
import { useAuth } from "@/contexts/AuthContext";
import { loginPath } from "@/lib/auth-redirects";
import { AdminHeader } from "./_components/AdminHeader";
import { SECTIONS, resolveSection } from "./sections";
import type { SystemProps } from "./_sections/System";

function Console({ system }: { system: SystemProps }) {
  const params = useSearchParams();
  const reduceMotion = useReducedMotion();
  const section = resolveSection(params.get("tab"));
  const Section = section.Component;

  return (
    <div className="admin-canvas">
      <div className="mx-auto max-w-[1500px] lg:flex">
        <AdminRail sections={SECTIONS} active={section.key} />
        <div className="min-w-0 flex-1 px-4 py-6 sm:px-7 lg:px-9 lg:py-7">
          <AdminHeader section={section.label} />
          <motion.div
            key={section.key}
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.2 }}
            className="min-w-0"
          >
            <Section {...system} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/** Maps `?tab=` to a section. The server layout already checked the role; this only waits for the client auth state so nothing flashes. */
export function AdminConsole({ system }: { system: SystemProps }) {
  const { status, user } = useAuth();
  const router = useRouter();
  const allowed = status === "ready" && user?.role === "ADMIN";

  useEffect(() => {
    if (status === "anonymous") router.replace(loginPath("/admin"));
    else if ((status === "ready" || status === "needs-terms") && user?.role !== "ADMIN") router.replace("/");
  }, [status, user, router]);

  if (!allowed) return <div className="admin-canvas min-h-[60dvh]" aria-busy="true" />;
  return (
    <Suspense fallback={<div className="admin-canvas min-h-[60dvh]" />}>
      <Console system={system} />
    </Suspense>
  );
}
