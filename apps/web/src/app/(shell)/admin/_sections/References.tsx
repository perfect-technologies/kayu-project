"use client";

import { MapPinned, Settings2 } from "lucide-react";
import { adminCopy } from "@/copy/admin";
import { cn } from "@/lib/utils";
import { useAdminParams } from "../_components/useAdminParams";
import { Lists } from "./Lists";
import { Places } from "./Places";

const copy = adminCopy.references;
const SUBS = [
  { key: "places", label: copy.tabs.places, icon: MapPinned },
  { key: "lists", label: copy.tabs.lists, icon: Settings2 },
] as const;

/** Primary-coloured panel header with the two sub-tabs persisted as `?sub=places|lists`. */
export function References() {
  const { sub, set } = useAdminParams();
  const active = sub === "lists" ? "lists" : "places";
  return (
    <section>
      <div className="rounded-3xl bg-primary p-5 text-primary-foreground sm:p-6">
        <h2 className="text-2xl font-extrabold">{copy.title}</h2>
        <p className="mt-1 text-sm text-white/70">{copy.subtitle}</p>
        <div role="tablist" aria-label={copy.title} className="mt-4 flex gap-2">
          {SUBS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active === key}
              onClick={() => set({ sub: key, q: null, page: null, id: null })}
              className={cn("inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-xs font-bold transition", active === key ? "bg-white text-primary" : "bg-white/10 text-white hover:bg-white/20")}
            >
              <Icon size={14} aria-hidden /> {label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-5">{active === "places" ? <Places /> : <Lists />}</div>
    </section>
  );
}
