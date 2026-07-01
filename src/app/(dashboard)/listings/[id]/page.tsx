import type { Metadata } from "next";

import { ListingDetail } from "@/features/listings/components/listing-detail";

export const metadata: Metadata = {
  title: "Listing — SHE WAWA",
};

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ListingDetail id={id} />;
}
