import { CollectionDetail } from "@/features/listings/components/collection-detail";

export const metadata = { title: "Collection" };

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CollectionDetail id={id} />;
}
