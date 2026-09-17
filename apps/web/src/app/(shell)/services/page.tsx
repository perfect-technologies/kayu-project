import type { Metadata } from "next";
import { categoriesApi } from "@kayu/api";
import type { CategoryTreeNode } from "@kayu/schemas";
import { servicesCopy } from "@/copy/services";
import { createServerApiClient } from "@/lib/api";
import { ServicesClient } from "./ServicesClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: servicesCopy.meta.title,
  description: servicesCopy.meta.description,
};

export default async function Page() {
  const tree = await categoriesApi(createServerApiClient())
    .getTree()
    .catch(() => ({ items: [] as CategoryTreeNode[] }));
  return <ServicesClient categories={tree.items.filter((node) => node.level === 1)} />;
}
