import { CategoryDetailClient } from "./CategoryDetailClient";

export default async function AdminCategoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CategoryDetailClient categoryId={id} />;
}
