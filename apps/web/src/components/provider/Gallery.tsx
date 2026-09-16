"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Images } from "lucide-react";
import type { ProviderMedia } from "@kayu/schemas";
import { providerCopy } from "@/copy/provider";
import { Lightbox } from "./Lightbox";

const copy = providerCopy.gallery;

export function Gallery({ items }: { items: ProviderMedia[] }) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState<number | null>(null);

  return (
    <section>
      <h2 className="mb-3 text-lg font-extrabold text-foreground">{copy.title}</h2>
      {items.length === 0 ? (
        <div className="empty-state flex flex-col items-center py-6">
          <Images size={22} aria-hidden className="mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">{copy.empty}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((item, position) => (
            <motion.button
              key={item.id}
              type="button"
              aria-label={copy.open(position + 1)}
              onClick={() => setIndex(position)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduce ? { duration: 0 } : { delay: position * 0.03 }}
              className="provider-tile group aspect-square overflow-hidden rounded-2xl bg-muted shadow-soft transition hover:shadow-soft-lg"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.url} alt={item.title ?? ""} loading="lazy" className="h-full w-full object-cover" />
            </motion.button>
          ))}
        </div>
      )}
      <Lightbox items={items} index={index} onClose={() => setIndex(null)} onIndex={setIndex} />
    </section>
  );
}
